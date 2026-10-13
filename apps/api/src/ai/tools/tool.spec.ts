import { describe, it, expect, beforeEach, afterAll, beforeAll } from 'vitest';
import * as http from 'node:http';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { ToolRegistry } from './tool.registry';
import { ToolExecutor } from './tool.executor';
import type { ToolExecutionContext } from './interfaces';

const STUB_PORT = 45_901;
const seen: { auth?: string; url?: string; body?: string; method?: string } = {};

const stubServer = http.createServer((req, res) => {
  let body = '';
  req.on('data', (chunk) => (body += chunk));
  req.on('end', () => {
    seen.auth = req.headers.authorization;
    seen.url = req.url;
    seen.method = req.method;
    seen.body = body;
    if (req.url?.startsWith('/api/todos/stats')) {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ total: 3, done: 1 }));
    } else if (req.url?.startsWith('/api/secure')) {
      res.statusCode = 401;
      res.end('unauthorized');
    } else if (req.url?.startsWith('/api/big')) {
      res.end('x'.repeat(60 * 1024));
    } else {
      res.statusCode = 404;
      res.end('not found');
    }
  });
});

const ctx: ToolExecutionContext = {
  authorization: 'Bearer token-abc',
  permissions: ['agent:read'],
  userId: 'u1',
  userType: 'admin',
};

const executor = new ToolExecutor();

// 文件级 beforeAll：所有测试（含 ToolExecutor 组）执行前完成 stub 监听与端口指向，
// 避免回环请求落到开发机上真实运行中的 API 服务
const originalPort = process.env.PORT;

beforeAll(async () => {
  await new Promise<void>((resolve) => stubServer.listen(STUB_PORT, resolve));
  process.env.PORT = String(STUB_PORT);
});

afterAll(() => {
  stubServer.close();
  process.env.PORT = originalPort;
});

function makeRegistry(dir?: string): ToolRegistry {
  const registry = new ToolRegistry(executor);
  if (dir) {
    Object.defineProperty(registry, 'definitionsDir', { get: () => dir });
  }
  return registry;
}

describe('ToolExecutor', () => {
  const baseTool = {
    name: 'todo_stats',
    description: '统计待办',
    parameters: {
      type: 'object' as const,
      properties: { status: { type: 'string' as const, enum: ['open', 'done'] } },
    },
    rest: { method: 'GET' as const, path: '/api/todos/stats' },
    source: 'yml' as const,
  };

  it('GET 参数落 query，转发 Authorization 头', async () => {
    const result = await executor.execute(baseTool, { status: 'open' }, ctx);
    expect(result.ok).toBe(true);
    expect(result.data).toEqual({ total: 3, done: 1 });
    expect(seen.auth).toBe('Bearer token-abc');
    expect(seen.url).toBe('/api/todos/stats?status=open');
  });

  it('POST 参数落 body', async () => {
    const tool = { ...baseTool, rest: { method: 'POST' as const, path: '/api/todos/stats' } };
    await executor.execute(tool, { status: 'done' }, ctx);
    expect(seen.method).toBe('POST');
    expect(JSON.parse(seen.body ?? '{}')).toEqual({ status: 'done' });
  });

  it('参数校验失败返回结构化错误（不发起请求）', async () => {
    const result = await executor.execute(baseTool, { status: 'invalid' }, ctx);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('参数校验失败');
  });

  it('权限不足抛 403 业务错误', async () => {
    const tool = { ...baseTool, permission: 'admin:secret' };
    await expect(executor.execute(tool, {}, ctx)).rejects.toMatchObject({
      errorCode: 'ERR_6006',
      status: 403,
    });
  });

  it('内部接口 401 透传为 tool error（不中断调用方）', async () => {
    const tool = { ...baseTool, rest: { method: 'GET' as const, path: '/api/secure' } };
    const result = await executor.execute(tool, {}, ctx);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('401');
  });

  it('超 50KB 结果截断', async () => {
    const tool = { ...baseTool, rest: { method: 'GET' as const, path: '/api/big' } };
    const result = await executor.execute(tool, {}, ctx);
    expect(result.ok).toBe(true);
    expect(JSON.stringify(result.data)).toContain('truncated');
  });
});

describe('ToolRegistry', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'loom-tools-'));
  });

  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('加载合法 YML 并列出工具', () => {
    fs.writeFileSync(
      path.join(tmpDir, 'todo-tools.yml'),
      `
tools:
  - name: todo_stats
    description: 统计待办数量
    parameters:
      type: object
      properties:
        status: { type: string, enum: [open, done] }
    permission: agent:read
    rest: { method: GET, path: /api/todos/stats }
`,
    );
    const registry = makeRegistry(tmpDir);
    registry.onModuleInit();
    const list = registry.list();
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe('todo_stats');
    expect(list[0].permission).toBe('agent:read');
  });

  it('YML 校验失败启动即抛（含文件名）', () => {
    fs.writeFileSync(
      path.join(tmpDir, 'bad.yml'),
      `
tools:
  - name: evil
    description: x
    parameters: { type: object }
    rest: { method: GET, path: https://evil.com/api }
`,
    );
    const registry = makeRegistry(tmpDir);
    expect(() => registry.onModuleInit()).toThrow(/bad\.yml/);
  });

  it('跨文件重名工具启动即抛', () => {
    const yaml = (name: string) => `
tools:
  - name: ${name}
    description: x
    parameters: { type: object }
    rest: { method: GET, path: /api/todos/stats }
`;
    fs.writeFileSync(path.join(tmpDir, 'a.yml'), yaml('dup'));
    fs.writeFileSync(path.join(tmpDir, 'b.yml'), yaml('dup'));
    const registry = makeRegistry(tmpDir);
    expect(() => registry.onModuleInit()).toThrow(/AI 工具重名/);
  });

  it('toPiTools 引用不存在工具抛 AI_TOOL_NOT_FOUND', () => {
    const registry = makeRegistry(tmpDir);
    registry.onModuleInit();
    expect(() => registry.toPiTools(['ghost'], ctx)).toThrow(/ERR_6005|不存在/);
  });

  it('toPiTools 的 execute 包装结果为 isError tool result', async () => {
    fs.writeFileSync(
      path.join(tmpDir, 't.yml'),
      `
tools:
  - name: todo_stats
    description: 统计待办
    parameters: { type: object, properties: { status: { type: string } } }
    rest: { method: GET, path: /api/todos/stats }
`,
    );
    const registry = makeRegistry(tmpDir);
    registry.onModuleInit();
    const [piTool] = registry.toPiTools(['todo_stats'], ctx);
    const result = await piTool.execute!('call-1', { status: 'open' });
    expect(result.isError).toBe(false);
    expect(result.content[0]).toMatchObject({ type: 'text' });
    expect(JSON.parse((result.content[0] as { text: string }).text)).toEqual({
      total: 3,
      done: 1,
    });
  });

  it('registerToolProvider 注册代码工具并可执行', async () => {
    const registry = makeRegistry(tmpDir);
    registry.onModuleInit();
    registry.registerToolProvider({
      name: 'code_tool',
      description: '代码工具',
      parameters: { type: 'object' },
      execute: async () => ({ ok: true, data: { hello: 1 }, durationMs: 1 }),
    });
    const [piTool] = registry.toPiTools(['code_tool'], ctx);
    const result = await piTool.execute!('call-1', {});
    expect(result.isError).toBe(false);
  });
});

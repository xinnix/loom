import * as fs from 'node:fs';
import * as path from 'node:path';
import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { parse as parseYaml } from 'yaml';
import { AgentYmlSchema, type AgentYml } from '@loom/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { ErrorCodes } from '../../core/exceptions';
import { BusinessException } from '../../core/exceptions/business.exception';
import { ToolRegistry } from '../tools/tool.registry';

/**
 * AI 第 3 层：Agent 编排文件加载器（YML 真理源，决策 D1）。
 *
 * 启动时扫描 definitions/agents/*.yml → shared Zod 校验 → 交叉检查
 * （node.tools 必须已注册：硬失败；node.llm configKey 存在性仅 warn：
 * LlmConfig 是运行期 DB 数据）→ 内存缓存 + 按 slug upsert Agent 行
 * （YML 权威字段覆盖 name/description/icon；DB 权威字段 isActive/sort/
 * llmConfigId/tools 不动）。
 *
 * dev（NODE_ENV !== 'production'）下 fs.watch 热加载：校验失败保留旧版本
 * 仅报错；生产随部署重启生效。
 */
@Injectable()
export class AgentYamlLoader implements OnModuleInit {
  private readonly logger = new Logger(AgentYamlLoader.name);
  private readonly definitions = new Map<string, AgentYml>();
  private watcher: fs.FSWatcher | undefined;

  constructor(
    private readonly prisma: PrismaService,
    private readonly toolRegistry: ToolRegistry,
  ) {}

  get definitionsDir(): string {
    return path.join(__dirname, '../definitions/agents');
  }

  async onModuleInit(): Promise<void> {
    await this.loadAll();
    this.watchInDev();
  }

  onModuleDestroy(): void {
    this.watcher?.close();
  }

  get(slug: string): AgentYml | undefined {
    return this.definitions.get(slug);
  }

  getOrThrow(slug: string): AgentYml {
    const def = this.definitions.get(slug);
    if (!def) {
      throw new BusinessException({
        message: `Agent 不存在: ${slug}`,
        errorCode: ErrorCodes.AGENT_NOT_FOUND,
        statusCode: 404,
      });
    }
    return def;
  }

  list(): AgentYml[] {
    return [...this.definitions.values()];
  }

  /** 返回某 slug 的 YML 原文（Admin 只读视图） */
  readRaw(slug: string): string | undefined {
    const file = path.join(this.definitionsDir, `${slug}.yml`);
    if (!fs.existsSync(file)) return undefined;
    return fs.readFileSync(file, 'utf8');
  }

  private async loadAll(): Promise<void> {
    const dir = this.definitionsDir;
    if (!fs.existsSync(dir)) {
      this.logger.warn(`Agent 编排目录不存在: ${dir}`);
      return;
    }
    const next = new Map<string, AgentYml>();
    for (const file of fs.readdirSync(dir).filter((f) => /\.ya?ml$/.test(f))) {
      const def = this.parseAndValidate(path.join(dir, file), file);
      next.set(def.name, def);
    }
    for (const def of next.values()) this.crossCheck(def);
    this.definitions.clear();
    for (const [slug, def] of next) this.definitions.set(slug, def);
    await this.syncAgentRows();
    this.logger.log(`已加载 ${this.definitions.size} 个 Agent 编排定义`);
  }

  private parseAndValidate(full: string, file: string): AgentYml {
    let parsed: unknown;
    try {
      parsed = parseYaml(fs.readFileSync(full, 'utf8'));
    } catch (err) {
      throw new BusinessException({
        message: `Agent YML 解析失败 ${file}: ${(err as Error).message}`,
        errorCode: ErrorCodes.AI_YAML_INVALID,
      });
    }
    const result = AgentYmlSchema.safeParse(parsed);
    if (!result.success) {
      const issues = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
      throw new BusinessException({
        message: `Agent YML 校验失败 ${file}: ${issues}`,
        errorCode: ErrorCodes.AI_YAML_INVALID,
      });
    }
    return result.data;
  }

  private crossCheck(def: AgentYml): void {
    for (const node of def.workflow) {
      if (node.type === 'loop') {
        for (const toolName of node.tools ?? []) {
          if (!this.toolRegistry.get(toolName)) {
            throw new BusinessException({
              message: `Agent ${def.name} 节点 ${node.id} 引用了未注册的工具: ${toolName}`,
              errorCode: ErrorCodes.AI_TOOL_NOT_FOUND,
            });
          }
        }
      }
      if (node.llm) {
        // LlmConfig 是运行期 DB 数据，不做启动硬检查，仅提示
        this.logger.log(`Agent ${def.name} 节点 ${node.id} 引用 LLM 配置: ${node.llm}`);
      }
    }
  }

  /** 按 slug upsert Agent 行：YML 权威字段覆盖，DB 权威字段（isActive/sort/llmConfigId/tools）不动 */
  private async syncAgentRows(): Promise<void> {
    for (const def of this.definitions.values()) {
      await this.prisma.agent.upsert({
        where: { slug: def.name },
        update: {
          name: def.name,
          description: def.description,
          icon: def.icon ?? null,
        },
        create: {
          slug: def.name,
          name: def.name,
          description: def.description,
          icon: def.icon ?? null,
          isActive: true,
        },
      });
    }
  }

  private watchInDev(): void {
    if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test') return;
    const dir = this.definitionsDir;
    if (!fs.existsSync(dir)) return;
    let timer: NodeJS.Timeout | undefined;
    try {
      this.watcher = fs.watch(dir, () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          this.loadAll().catch((err) => {
            // 热加载失败保留旧版本，不 crash
            this.logger.error(`Agent 编排热加载失败（保留旧版本）: ${(err as Error).message}`);
          });
        }, 500);
      });
      this.logger.log('Agent 编排目录热加载已启用（dev）');
    } catch (err) {
      this.logger.warn(`热加载启用失败: ${(err as Error).message}`);
    }
  }
}

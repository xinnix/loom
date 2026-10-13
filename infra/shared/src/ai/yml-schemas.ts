/**
 * AI 三层架构 YML 契约（Agent 编排文件 / 工具声明文件）
 *
 * R1：infra/shared 是唯一验证真理源——YML 在 api 端解析为普通对象后，
 * 由此处的 Zod schema 校验。yaml 依赖只存在于 @loom/api。
 *
 * 演进原则（ADR-005）：复杂逻辑进工具或代码，永远不进 YML。
 * 模板变量仅支持 {{input.*}} 与 {{nodes.<id>.output}} 两种点路径，无控制流。
 */
import { z } from 'zod';

// ============================================
// 工具参数 JSON Schema 子集
// （type/properties/required/enum/items/description，与 TypeBox/AJV 同构）
// ============================================

export interface ToolParameterSchema {
  type: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object';
  description?: string;
  enum?: string[];
  items?: ToolParameterSchema;
  properties?: Record<string, ToolParameterSchema>;
  required?: string[];
}

const toolParameterSchema: z.ZodType<ToolParameterSchema> = z.lazy(() =>
  z.object({
    type: z.enum(['string', 'number', 'integer', 'boolean', 'array', 'object']),
    description: z.string().optional(),
    enum: z.array(z.string()).optional(),
    items: z.lazy(() => toolParameterSchema).optional(),
    properties: z
      .record(
        z.string(),
        z.lazy(() => toolParameterSchema),
      )
      .optional(),
    required: z.array(z.string()).optional(),
  }),
);

// ============================================
// 工具声明文件（definitions/tools/*.yml）
// ============================================

export const ToolYmlSchema = z.object({
  /** 全局唯一（跨所有工具文件），LLM 调用名 */
  name: z.string().regex(/^[a-z0-9][a-z0-9_]*$/, '工具名仅限小写字母/数字/下划线'),
  /** 给 LLM 看的功能描述，需写清用途与返回结构 */
  description: z.string().min(1),
  /** 参数 JSON Schema 子集 */
  parameters: toolParameterSchema,
  /** 可选：触发者须持有的权限（第二道闸门，缺省=任何通过认证的触发者可调） */
  permission: z.string().optional(),
  /** 内部 REST 映射（本机回环，host 由执行器硬编码） */
  rest: z.object({
    method: z.enum(['GET', 'POST']),
    /** 内部 REST 路径，必须以 /api/ 开头 */
    path: z.string().regex(/^\/api\//, '工具只能映射 /api/ 下的内部端点'),
    /** 参数落位：GET→query、POST→body（默认） */
    paramPlacement: z.enum(['query', 'body']).optional(),
    timeoutMs: z.number().int().positive().optional(),
  }),
});

export const ToolFileYmlSchema = z
  .object({
    tools: z.array(ToolYmlSchema).min(1),
  })
  .superRefine((file, ctx) => {
    const seen = new Set<string>();
    for (const tool of file.tools) {
      if (seen.has(tool.name)) {
        ctx.addIssue({
          code: 'custom',
          path: ['tools'],
          message: `工具重名: ${tool.name}`,
        });
      }
      seen.add(tool.name);
    }
  });

export type ToolYml = z.infer<typeof ToolYmlSchema>;
export type ToolFileYml = z.infer<typeof ToolFileYmlSchema>;

// ============================================
// Agent 编排文件（definitions/agents/*.yml）
// ============================================

const ChatNodeSchema = z.object({
  /** 节点 id，文件内唯一，output 引用键 */
  id: z.string().regex(/^[a-z0-9][a-z0-9_]*$/, '节点 id 仅限小写字母/数字/下划线'),
  type: z.literal('chat'),
  /** 可选：LlmConfig.configKey（D3 优先级最高） */
  llm: z.string().optional(),
  system: z.string().optional(),
  /** user prompt 模板 */
  prompt: z.string().min(1),
  /** 可选：要求节点输出 JSON（prompt 注入指令 + 校验解析） */
  outputFormat: z.enum(['text', 'json']).optional(),
});

const LoopNodeSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9_]*$/, '节点 id 仅限小写字母/数字/下划线'),
  type: z.literal('loop'),
  llm: z.string().optional(),
  system: z.string().optional(),
  prompt: z.string().min(1),
  /** 可选工具白名单；省略则回退 DB Agent.tools */
  tools: z.array(z.string()).optional(),
  /** 必填：防失控的最大循环轮数 */
  maxIterations: z.number().int().positive(),
  outputFormat: z.enum(['text', 'json']).optional(),
});

export const WorkflowNodeSchema = z.discriminatedUnion('type', [ChatNodeSchema, LoopNodeSchema]);
export type WorkflowNode = z.infer<typeof WorkflowNodeSchema>;

const TriggersSchema = z.object({
  http: z.object({ enabled: z.boolean() }).optional(),
  /** 预留：校验通过，运行时忽略并 warn */
  cron: z
    .object({
      enabled: z.boolean().default(false),
      expression: z.string().optional(),
    })
    .optional(),
});

export const AgentYmlSchema = z
  .object({
    /** 全局唯一，= DB Agent.slug = REST 触发路径段 */
    name: z.string().regex(/^[a-z0-9][a-z0-9-]*$/, 'agent name 仅限小写字母/数字/横杠'),
    description: z.string().min(1),
    icon: z.string().optional(),
    /** run 级 token 预算（默认 100_000），OWASP token/cost limits */
    budgetTokens: z.number().int().positive().optional(),
    /** 用户端可见性（ADR-006 D1）：缺省 admin——新增 agent 默认不暴露给用户端 */
    audience: z.enum(['admin', 'user', 'all']).default('admin'),
    triggers: TriggersSchema.optional(),
    /** 有序数组 = 执行顺序（严格顺序执行，无 DAG/分支/并行） */
    workflow: z.array(WorkflowNodeSchema).min(1, 'workflow 至少需要一个节点'),
    output: z
      .object({
        template: z.string(),
      })
      .optional(),
  })
  .superRefine((agent, ctx) => {
    const nodeIds = agent.workflow.map((n) => n.id);
    const nodeIndex = new Map<string, number>();

    // 1. 节点 id 唯一
    nodeIds.forEach((id, i) => {
      if (nodeIndex.has(id)) {
        ctx.addIssue({
          code: 'custom',
          path: ['workflow', i, 'id'],
          message: `节点 id 重复: ${id}`,
        });
      }
      nodeIndex.set(id, i);
    });

    // 2. 模板中的 {{nodes.<id>.output}} 引用必须指向更早的节点（顺序执行无前向引用）
    const nodeRefRe = /\{\{\s*nodes\.([a-zA-Z0-9_]+)\./g;
    agent.workflow.forEach((node, i) => {
      for (const text of [node.prompt, 'system' in node ? node.system : undefined]) {
        if (!text) continue;
        let m: RegExpExecArray | null;
        nodeRefRe.lastIndex = 0;
        while ((m = nodeRefRe.exec(text)) !== null) {
          const refId = m[1];
          const refIndex = nodeIndex.get(refId);
          if (refIndex === undefined) {
            ctx.addIssue({
              code: 'custom',
              path: ['workflow', i, 'prompt'],
              message: `节点 ${node.id} 引用了不存在的节点: ${refId}`,
            });
          } else if (refIndex >= i) {
            ctx.addIssue({
              code: 'custom',
              path: ['workflow', i, 'prompt'],
              message: `节点 ${node.id} 引用了非前置节点: ${refId}（仅允许引用更早的节点）`,
            });
          }
        }
      }
    });

    // 3. output.template 引用的节点必须存在
    if (agent.output) {
      let m: RegExpExecArray | null;
      nodeRefRe.lastIndex = 0;
      while ((m = nodeRefRe.exec(agent.output.template)) !== null) {
        if (!nodeIndex.has(m[1])) {
          ctx.addIssue({
            code: 'custom',
            path: ['output', 'template'],
            message: `output 模板引用了不存在的节点: ${m[1]}`,
          });
        }
      }
    }

    // 4. cron 预留：启用时必须给 expression（虽然运行时忽略）
    if (agent.triggers?.cron?.enabled && !agent.triggers.cron.expression) {
      ctx.addIssue({
        code: 'custom',
        path: ['triggers', 'cron', 'expression'],
        message: 'cron 触发启用时必须提供 expression',
      });
    }
  });

export type AgentYml = z.infer<typeof AgentYmlSchema>;

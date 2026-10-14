import { Injectable, Logger } from '@nestjs/common';
import { AgentRuntimeService } from '../agents/agent-runtime.service';

/** 触发器行（dispatcher / runOnce 传入） */
export interface TriggerRow {
  id: string;
  name: string;
  agentSlug: string;
  input: unknown;
}

/**
 * 触发执行器（ADR-009 泛化形态）：动作 = run(agentSlug)。
 *
 * - AgentRun 审计由 runtime.run 自建自终态化（triggeredByType='trigger'），
 *   执行器不另造审计壳——与 weSale 的差异点：loom 的 runtime 单点持有 run 生命周期
 * - 权限边界：permissions=[] 且 userType='trigger'——YML 声明了 permission 的工具
 *   对定时触发一律阻断（写操作等 human-in-the-loop 能力留给 M4 第 4 步审批链）
 * - emit 置空（无 SSE 消费方；事件流只进 nodeTrace 审计）
 */
@Injectable()
export class AgentTriggerRunnerService {
  private readonly logger = new Logger(AgentTriggerRunnerService.name);

  constructor(private readonly runtime: AgentRuntimeService) {}

  async execute(trigger: TriggerRow): Promise<{ runId: string; status: string }> {
    const input = (trigger.input ?? {}) as Record<string, unknown>;
    this.logger.log(`触发器执行: ${trigger.name} → agent ${trigger.agentSlug}`);
    const result = await this.runtime.run(
      trigger.agentSlug,
      input,
      {
        permissions: [],
        userType: 'trigger',
        triggeredByType: 'trigger',
      },
      () => undefined, // 无 SSE 消费方：事件流只进 nodeTrace 审计
    );
    return { runId: result.runId, status: result.status };
  }
}

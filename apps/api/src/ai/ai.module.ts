import { Global, Module } from '@nestjs/common';
import { LlmModule } from './llm/llm.module';
import { ToolRegistry, ToolExecutor } from './tools';
import { AgentYamlLoader, AgentRunService, AgentRuntimeService } from './agents';

/**
 * AI 三层架构（框架级能力，R6：非业务模块）：
 * - 第 1 层 LlmModule：LLM 配置解析与调用（pi 底座）
 * - 第 2 层 tools：YML 声明的内部 REST 映射工具 + 代码工具扩展点
 * - 第 3 层 agents：YML 编排运行时（chat/loop 节点 + AgentRun 审计）
 *
 * 加载顺序关键约束：ToolRegistry 必须先于 AgentYamlLoader 初始化
 * （loader 交叉检查 node.tools 已注册）——providers 数组顺序保证。
 * Global：业务模块无需显式 import 即可注入 LlmService 等服务。
 */
@Global()
@Module({
  imports: [LlmModule],
  providers: [ToolExecutor, ToolRegistry, AgentYamlLoader, AgentRunService, AgentRuntimeService],
  exports: [LlmModule, ToolRegistry, AgentYamlLoader, AgentRuntimeService, AgentRunService],
})
export class AiModule {}

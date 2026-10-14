import { Module, type Provider } from '@nestjs/common';
import { AiModule } from '../../ai/ai.module';
import { AgentTriggerModule } from '../../ai/agent-trigger/agent-trigger.module';
import { LlmConfigsService } from './services/llm-configs.service';
import { AgentsCatalogService } from './services/agents-catalog.service';
import { AgentSessionService } from './services/agent-session.service';
import { AiAgentsController, AiSessionsController } from './rest/ai-agents.controller';
import { createLlmConfigsRouter } from './trpc/llm-configs.router';
import { createAiAgentsRouter } from './trpc/ai-agents.router';
import { createAiToolsRouter } from './trpc/ai-tools.router';
import { createLlmUsageRouter } from './trpc/llm-usage.router';
import { createAgentTriggersRouter } from './trpc/agent-triggers.router';
import { ToolRegistry } from '../../ai/tools/tool.registry';
import { AgentYamlLoader } from '../../ai/agents/agent-yaml.loader';
import { PrismaService } from '../../prisma/prisma.service';
import { AgentTriggerService } from '../../ai/agent-trigger/agent-trigger.service';
import { AgentTriggerDispatcherService } from '../../ai/agent-trigger/agent-trigger-dispatcher.service';

/**
 * AI 管理模块（R4 双协议的业务面落点）：
 * - tRPC（Admin）：llmConfigs CRUD / agents 只读+runs / aiTools 只读+test / llmUsage 用量看板 / agentTriggers 触发器
 * - REST（外部端）：POST /api/ai/agents/:slug/run（SSE）、GET /api/ai/agents
 *
 * tRPC router 的组装依赖运行时实例（services/ToolRegistry/AgentYamlLoader），
 * 经 AI_TRPC_ROUTERS provider 暴露，main.ts 在挂载 tRPC middleware 时取出合并——
 * 与 PrismaService 的 setPrismaService 注入同模式。
 */
export const AI_TRPC_ROUTERS = 'AI_TRPC_ROUTERS';

const routersProvider: Provider = {
  provide: AI_TRPC_ROUTERS,
  useFactory: (
    llmConfigs: LlmConfigsService,
    catalog: AgentsCatalogService,
    tools: ToolRegistry,
    loader: AgentYamlLoader,
    prisma: PrismaService,
    triggerService: AgentTriggerService,
    triggerDispatcher: AgentTriggerDispatcherService,
  ) => ({
    llmConfigs: createLlmConfigsRouter(llmConfigs),
    agents: createAiAgentsRouter(catalog, loader),
    aiTools: createAiToolsRouter(tools),
    llmUsage: createLlmUsageRouter(prisma),
    agentTriggers: createAgentTriggersRouter(triggerService, triggerDispatcher, loader),
  }),
  inject: [
    LlmConfigsService,
    AgentsCatalogService,
    ToolRegistry,
    AgentYamlLoader,
    PrismaService,
    AgentTriggerService,
    AgentTriggerDispatcherService,
  ],
};

@Module({
  imports: [AiModule, AgentTriggerModule],
  controllers: [AiAgentsController, AiSessionsController],
  providers: [LlmConfigsService, AgentsCatalogService, AgentSessionService, routersProvider],
  exports: [LlmConfigsService, AgentsCatalogService],
})
export class AiAdminModule {}

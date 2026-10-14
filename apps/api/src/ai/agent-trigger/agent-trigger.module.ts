import { Module } from '@nestjs/common';
import { AgentTriggerService } from './agent-trigger.service';
import { AgentTriggerRunnerService } from './agent-trigger-runner.service';
import { AgentTriggerDispatcherService } from './agent-trigger-dispatcher.service';

/**
 * Agent 定时触发模块（ADR-009）。
 * ⚠️ 铁律：AgentTriggerDispatcherService 带 @Cron，provider 只允许在本 Module 声明一次
 * （import 多次安全，Nest 按 module 类去重）。YML triggers.cron 的同步在
 * AgentYamlLoader（agent-yaml.loader.ts），管理面 router 在 modules/ai。
 */
@Module({
  providers: [AgentTriggerService, AgentTriggerRunnerService, AgentTriggerDispatcherService],
  exports: [AgentTriggerService, AgentTriggerDispatcherService],
})
export class AgentTriggerModule {}

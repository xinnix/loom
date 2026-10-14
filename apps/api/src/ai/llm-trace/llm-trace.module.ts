import { Module } from '@nestjs/common';
import { LlmTraceService } from './llm-trace.service';

/**
 * LLM 调用流水模块（ADR-007）。
 * ⚠️ 铁律：LlmTraceService 带 retention @Cron，provider 只允许在本 Module 声明一次
 * （import 多次是安全的——Nest 按 module 类去重，实例唯一）；聚合读走
 * modules/ai/trpc/llm-usage.router + llm-usage-agg 纯函数。
 */
@Module({
  providers: [LlmTraceService],
  exports: [LlmTraceService],
})
export class LlmTraceModule {}

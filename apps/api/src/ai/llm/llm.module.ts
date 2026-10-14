import { Module } from '@nestjs/common';
import { LlmConfigService } from './llm-config.service';
import { LlmCryptoService } from './llm-crypto.service';
import { LlmService } from './llm.service';
import { LlmTraceModule } from '../llm-trace/llm-trace.module';

/**
 * AI 第 1 层：LLM 调用抽象（pi 底座）。
 * 由 AiModule 聚合并以全局模块导出，业务模块无需显式 import。
 */
@Module({
  imports: [LlmTraceModule],
  providers: [LlmCryptoService, LlmConfigService, LlmService],
  exports: [LlmCryptoService, LlmConfigService, LlmService, LlmTraceModule],
})
export class LlmModule {}

import { DynamicModule, Module } from '@nestjs/common';
import { LlmService } from './llm.service';
import { OpenaiProvider } from './providers/openai.provider';
import { LLM_CONFIG, LLM_PROVIDER, loadLlmConfigFromEnv } from './llm.constants';
import type { LlmConfig } from './interfaces/llm.types';

@Module({})
export class LlmModule {
  /**
   * 全局注册 LLM 服务
   *
   * 在 AppModule 的 imports 中调用一次即可。
   * 可通过 config 参数覆盖环境变量中的默认配置。
   *
   * @example
   * ```ts
   * @Module({
   *   imports: [LlmModule.forRoot()],
   * })
   * export class AppModule {}
   * ```
   */
  static forRoot(config?: Partial<LlmConfig>): DynamicModule {
    const resolvedConfig = loadLlmConfigFromEnv(config);

    return {
      module: LlmModule,
      global: true,
      providers: [
        {
          provide: LLM_CONFIG,
          useValue: resolvedConfig,
        },
        {
          provide: LLM_PROVIDER,
          useFactory: () =>
            new OpenaiProvider({ apiUrl: resolvedConfig.apiUrl, apiKey: resolvedConfig.apiKey }),
        },
        LlmService,
      ],
      exports: [LlmService],
    };
  }
}

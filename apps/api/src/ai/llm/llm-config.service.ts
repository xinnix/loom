import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ErrorCodes } from '../../core/exceptions';
import { BusinessException } from '../../core/exceptions/business.exception';
import { LlmCryptoService } from './llm-crypto.service';
import type { LlmConfigResolved } from './interfaces';

/**
 * AI 第 1 层：LLM 配置解析（决策 D3）。
 *
 * 解析优先级：显式 configKey / id → Agent 级默认（llmConfigId，由调用方传入）
 * → LlmConfig.isDefault 全局兜底 → env 静态配置（LLM_API_URL/KEY/MODEL）。
 *
 * 不做缓存：单次索引查询 + AES-GCM 解密相对秒级 LLM 延迟可忽略，零失效逻辑。
 */
@Injectable()
export class LlmConfigService {
  private readonly logger = new Logger(LlmConfigService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: LlmCryptoService,
  ) {}

  /** 按显式引用解析（configKey 或 id） */
  async resolveByRef(ref: { configKey: string } | { id: string }): Promise<LlmConfigResolved> {
    const where = 'configKey' in ref ? { configKey: ref.configKey } : { id: ref.id };
    const row = await this.prisma.llmConfig.findFirst({ where: { ...where, isActive: true } });
    if (!row) {
      throw new BusinessException({
        message: `LLM 配置不存在或未启用: ${'configKey' in ref ? ref.configKey : ref.id}`,
        errorCode: ErrorCodes.AI_CONFIG_NOT_FOUND,
        statusCode: 404,
      });
    }
    return this.toResolved(row);
  }

  /** 按主键解析（内部使用，缺失返回 null 供上层走 D3 兜底） */
  async findById(id: string): Promise<LlmConfigResolved | null> {
    const row = await this.prisma.llmConfig.findFirst({ where: { id, isActive: true } });
    return row ? this.toResolved(row) : null;
  }

  /** 全局默认配置（isDefault=true 且启用）；无则回退 env 静态配置 */
  async resolveDefault(): Promise<LlmConfigResolved> {
    const row = await this.prisma.llmConfig.findFirst({
      where: { isDefault: true, isActive: true },
    });
    if (row) return this.toResolved(row);
    return this.resolveFromEnv();
  }

  private toResolved(row: {
    configKey: string;
    name: string;
    provider: string;
    apiUrl: string;
    apiKeyEnc: string;
    model: string;
    temperature: number | null;
    maxTokens: number | null;
    timeoutMs: number;
    maxRetries: number;
  }): LlmConfigResolved {
    return {
      configKey: row.configKey,
      name: row.name,
      provider: row.provider,
      apiUrl: row.apiUrl,
      apiKey: this.crypto.decrypt(row.apiKeyEnc),
      model: row.model,
      temperature: row.temperature ?? undefined,
      maxTokens: row.maxTokens ?? undefined,
      timeoutMs: row.timeoutMs,
      maxRetries: row.maxRetries,
    };
  }

  /** env 兜底配置（LLM_API_KEY 缺失时抛业务错误而非启动错误） */
  private resolveFromEnv(): LlmConfigResolved {
    const apiKey = process.env.LLM_API_KEY;
    if (!apiKey) {
      throw new BusinessException({
        message:
          '无可用 LLM 配置：数据库中不存在 isDefault 配置，且 LLM_API_KEY 环境变量未设置。请在管理后台创建模型配置，或配置 LLM_API_KEY。',
        errorCode: ErrorCodes.AI_CONFIG_NOT_FOUND,
        statusCode: 400,
      });
    }
    this.logger.warn('使用 env 静态 LLM 配置兜底（数据库无 isDefault 配置）');
    return {
      configKey: 'env-default',
      name: 'env default',
      provider: 'openai',
      apiUrl: process.env.LLM_API_URL || 'https://api.openai.com/v1',
      apiKey,
      model: process.env.LLM_MODEL || 'gpt-4o',
      timeoutMs: 60_000,
      maxRetries: 1,
    };
  }
}

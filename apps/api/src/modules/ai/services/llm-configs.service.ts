import { Injectable } from '@nestjs/common';
import { BaseService } from '../../../common/base.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { LlmCryptoService } from '../../../ai/llm/llm-crypto.service';

/**
 * LlmConfig 管理（AI 第 1 层的 Admin 管理面）。
 *
 * 安全规则（F6 验收）：
 * - apiKey 明文仅作为 create/update 入参，钩子内立即加密为 apiKeyEnc
 * - 响应永不返回 apiKeyEnc（router 层 select 排除）
 * - isDefault 唯一性：设为 true 时事务内清除其他默认
 */
@Injectable()
export class LlmConfigsService extends BaseService<'llmConfig'> {
  constructor(
    prisma: PrismaService,
    private readonly crypto: LlmCryptoService,
  ) {
    super(prisma, 'llmConfig');
  }

  async beforeCreate(data: Record<string, any>) {
    const next = { ...data };
    if (typeof next.apiKey === 'string' && next.apiKey.length > 0) {
      next.apiKeyEnc = this.crypto.encrypt(next.apiKey);
      next.apiKeyMask = LlmCryptoService.mask(next.apiKey);
    }
    delete next.apiKey;
    return next;
  }

  async beforeUpdate(_id: string, data: Record<string, any>) {
    const next = { ...data };
    // apiKey 留空/缺省 = 不修改
    if (typeof next.apiKey === 'string' && next.apiKey.length > 0) {
      next.apiKeyEnc = this.crypto.encrypt(next.apiKey);
      next.apiKeyMask = LlmCryptoService.mask(next.apiKey);
    }
    delete next.apiKey;
    return next;
  }

  async afterCreate(_result: any) {
    await this.enforceSingleDefault();
  }

  async afterUpdate(_result: any) {
    await this.enforceSingleDefault();
  }

  /** isDefault 应用层唯一保证（D3 兜底） */
  private async enforceSingleDefault(): Promise<void> {
    const defaults = await this.prisma.llmConfig.findMany({
      where: { isDefault: true },
      orderBy: { updatedAt: 'desc' },
    });
    if (defaults.length <= 1) return;
    const keep = defaults[0];
    await this.prisma.llmConfig.updateMany({
      where: { isDefault: true, id: { not: keep.id } },
      data: { isDefault: false },
    });
  }
}

import { Injectable } from '@nestjs/common';
import { BaseService } from '../../../common/base.service';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class AgentsService extends BaseService<'agent'> {
  constructor(prisma: PrismaService) {
    super(prisma, 'agent');
  }

  async findActive() {
    return this.model.findMany({
      where: { isActive: true },
      orderBy: { sort: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        icon: true,
        model: true,
        systemPrompt: true,
        temperature: true,
        maxTokens: true,
        provider: true,
        sort: true,
      },
    });
  }
}

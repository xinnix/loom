import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@loom/database';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { softDeleteExtension } from './extensions/soft-delete';
import { auditExtension } from './extensions/audit';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private _extendedClient: any;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);

    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
    this._extendedClient = this.$extends(softDeleteExtension()).$extends(auditExtension());
    console.log('✅ PrismaClient connected to database with extensions');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  get extended() {
    return this._extendedClient;
  }
}

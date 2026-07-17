// apps/api/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';

// 基础模块
import { AuthModule } from './modules/auth/module';
import { UserModule } from './modules/user/module';
import { RoleModule } from './modules/role/module';
import { PermissionModule } from './modules/permission/module';
import { UploadModule } from './modules/upload/module';
import { WechatModule } from './modules/wechat/wechat.module';
import { PaymentModule } from './modules/payment/module';
import { AgentsModule } from './modules/agents/module';
import { WecomModule } from './modules/wecom/module';
import { TodoModule } from './modules/todo/module';
// 全局拦截器
import { TransformInterceptor } from './core/interceptors/transform.interceptor';
import { FileStorageService } from './shared/services/file-storage.service';
import { LlmService } from './shared/services/llm.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: Number(process.env.RATE_LIMIT_TTL_MS) || 60000,
        limit: Number(process.env.RATE_LIMIT_GENERAL) || 100,
      },
    ]),
    // 数据库模块（全局，必须在最前）
    PrismaModule,
    // 基础模块
    AuthModule,
    UserModule,
    RoleModule,
    PermissionModule,
    UploadModule,
    WechatModule,
    PaymentModule,
    AgentsModule,
    WecomModule,
    TodoModule,
  ],
  providers: [
    Reflector,
    FileStorageService,
    LlmService,
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

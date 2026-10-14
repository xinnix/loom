// apps/api/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
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
import { AiAdminModule } from './modules/ai/module';
import { AiModule } from './ai/ai.module';
import { AgentTriggerModule } from './ai/agent-trigger/agent-trigger.module';
import { WecomModule } from './modules/wecom/module';
import { TodoModule } from './modules/todo/module';
import { SettingsModule } from './modules/settings/settings.module';
// 全局拦截器
import { TransformInterceptor } from './core/interceptors/transform.interceptor';
import { SharedModule } from './shared/shared.module';

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
    // 定时任务底座（llm-trace retention 等 @Cron 服务；@Cron 服务必须单一 Module 声明）
    ScheduleModule.forRoot(),
    // 数据库模块（全局，必须在最前）
    PrismaModule,
    // 共享服务（全局：FileStorageService 等）
    SharedModule,
    // 基础设施模块（AI 三层：LLM / 工具 / Agent 编排）
    AiModule,
    AgentTriggerModule,
    AuthModule,
    UserModule,
    RoleModule,
    PermissionModule,
    UploadModule,
    WechatModule,
    PaymentModule,
    AiAdminModule,
    WecomModule,
    TodoModule,
    SettingsModule,
  ],
  providers: [
    Reflector,
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

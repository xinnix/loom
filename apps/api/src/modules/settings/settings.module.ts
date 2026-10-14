import { Module } from '@nestjs/common';

/**
 * 平台参数配置模块（ADR-008）。
 * SettingsService 在 SharedModule（@Global）提供，本模块仅承载 tRPC router
 * （router 经模块级 getSettingsService() 引用实例，与 main.ts 注入时序对齐）。
 */
@Module({})
export class SettingsModule {}

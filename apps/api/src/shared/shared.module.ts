import { Global, Module } from '@nestjs/common';
import { FileStorageService } from './services/file-storage.service';
import { SettingsService } from './settings/settings.service';

/**
 * 全局共享模块
 *
 * 注册跨模块使用的共享服务（FileStorageService、SettingsService 等），
 * 业务模块无需重复 providers 或 imports 即可直接注入。
 * SettingsService 为平台参数中心（ADR-008）：AI 层与业务模块
 * 显式注入使用，禁止 re-declare ConfigService token（铁律见服务注释）。
 */
@Global()
@Module({
  providers: [FileStorageService, SettingsService],
  exports: [FileStorageService, SettingsService],
})
export class SharedModule {}

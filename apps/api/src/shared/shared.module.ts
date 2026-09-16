import { Global, Module } from '@nestjs/common';
import { FileStorageService } from './services/file-storage.service';

/**
 * 全局共享模块
 *
 * 注册跨模块使用的共享服务（FileStorageService 等），
 * 业务模块无需重复 providers 或 imports 即可直接注入。
 */
@Global()
@Module({
  providers: [FileStorageService],
  exports: [FileStorageService],
})
export class SharedModule {}

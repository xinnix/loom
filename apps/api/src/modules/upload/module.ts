import { Module } from '@nestjs/common';
import { UploadService } from './services/upload.service';
import { UploadController } from './rest/upload.controller';

/**
 * 文件上传模块
 *
 * FileStorageService 由全局 SharedModule 提供。
 */
@Module({
  providers: [UploadService],
  controllers: [UploadController],
  exports: [UploadService],
})
export class UploadModule {}

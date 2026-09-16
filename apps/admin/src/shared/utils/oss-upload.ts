/**
 * 文件上传工具
 *
 * 根据服务端存储配置（FILE_STORAGE_PROVIDER）自动选择上传方式：
 * - aliyun-oss: 前端直传 OSS（Post Policy 签名）
 *   文档：https://help.aliyun.com/document_detail/31989.html
 * - local: 走服务端中转（REST /api/upload/image）
 */

import { trpcClient } from '../dataProvider/dataProvider';

export interface UploadCredentials {
  accessKeyId: string;
  securityToken: string;
  expiration: string;
  bucket: string;
  region: string;
  endpoint: string;
  policy: string;
  signature: string;
}

export interface UploadResult {
  url: string;
  fileName: string;
  fileSize: number;
}

export type UploadType =
  'merchant_logo' | 'news_banner' | 'merchant_gallery' | 'news_content' | 'avatar';

/**
 * 上传类（自动适配存储模式）
 */
export class OSSUploader {
  /**
   * 上传文件
   *
   * @param file 要上传的文件
   * @param type 上传类型（用于确定存储路径）
   * @returns 上传结果
   */
  static async upload(file: File, type: UploadType): Promise<UploadResult> {
    // 0. 获取存储配置，按 provider 选择上传方式
    const config = await (trpcClient as any).upload.getUploadConfig.query();
    if (config.provider !== 'aliyun-oss') {
      return this.uploadViaServer(file, type);
    }

    // 1. 获取上传凭证
    const credentials = await (trpcClient as any).upload.getUploadCredentials.query({ type });

    // 2. 生成文件名
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const ext = file.name.substring(file.name.lastIndexOf('.'));
    const fileName = `${timestamp}-${randomStr}${ext}`;
    const key = `images/${type}/${fileName}`;

    // 3. 构建 FormData
    const formData = new FormData();
    formData.append('key', key);
    formData.append('policy', credentials.policy);
    formData.append('OSSAccessKeyId', credentials.accessKeyId);
    formData.append('signature', credentials.signature);
    formData.append('success_action_status', '200'); // 返回 200 状态码
    // 仅在 STS token 存在时添加
    if (credentials.securityToken) {
      formData.append('x-oss-security-token', credentials.securityToken);
    }
    formData.append('file', file);

    // 4. 发送 POST 请求到 OSS
    const response = await fetch(credentials.endpoint, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`上传失败: ${response.status} ${response.statusText}`);
    }

    // 5. 构建文件 URL
    const url = `${credentials.endpoint}/${key}`;

    return {
      url,
      fileName: file.name,
      fileSize: file.size,
    };
  }

  /**
   * 服务端中转上传（FILE_STORAGE_PROVIDER=local 时的回退路径）
   */
  private static async uploadViaServer(file: File, type: UploadType): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const token = localStorage.getItem('accessToken');
    const response = await fetch('/api/upload/image', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`上传失败: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    if (!result?.success || !result?.data?.url) {
      throw new Error(result?.message || '上传失败');
    }

    return {
      url: result.data.url,
      fileName: result.data.fileName,
      fileSize: result.data.fileSize,
    };
  }

  /**
   * 批量上传文件
   *
   * @param files 文件列表
   * @param type 上传类型
   * @returns 上传结果列表
   */
  static async uploadMultiple(files: File[], type: UploadType): Promise<UploadResult[]> {
    return Promise.all(files.map((file) => this.upload(file, type)));
  }

  /**
   * 验证文件类型
   *
   * @param file 文件
   * @param allowedTypes 允许的 MIME 类型
   * @returns 是否合法
   */
  static validateFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.includes(file.type);
  }

  /**
   * 验证文件大小
   *
   * @param file 文件
   * @param maxSize 最大大小（字节）
   * @returns 是否合法
   */
  static validateFileSize(file: File, maxSize: number): boolean {
    return file.size <= maxSize;
  }
}

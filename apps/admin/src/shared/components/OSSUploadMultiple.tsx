import React, { useState } from 'react';
import { Upload, Button, App, Image, Space } from 'antd';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { OSSUploader } from '../utils/oss-upload';
import type { UploadType } from '../utils/oss-upload';

interface OSSUploadMultipleProps {
  value?: string[]; // 图片 URL 数组
  onChange?: (urls: string[]) => void;
  type: UploadType;
  maxFileSize?: number; // 最大文件大小（字节）
  accept?: string; // 接受的文件类型
  maxCount?: number; // 最大上传数量
  disabled?: boolean;
}

/**
 * OSS 多图上传组件
 *
 * 特性：
 * - 支持前端直传 OSS，不经过后端服务器
 * - 支持多张图片上传和管理
 * - 支持拖拽排序（通过按钮移动）
 * - 自动获取上传凭证
 * - 支持文件类型和大小验证
 * - 支持预览和删除
 */
export const OSSUploadMultiple: React.FC<OSSUploadMultipleProps> = ({
  value = [],
  onChange,
  type,
  maxFileSize = 5 * 1024 * 1024, // 默认 5MB
  accept = 'image/jpeg,image/png,image/gif,image/webp',
  maxCount = 5, // 默认最多 5 张
  disabled = false,
}) => {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);

  // 将 URL 数组转换为 UploadFile 数组，确保 value 不为 null
  const safeValue = value || [];

  const [fileList, setFileList] = useState<UploadFile[]>(
    safeValue.map((url, index) => ({
      uid: `${index}`,
      name: `image-${index}`,
      status: 'done' as const,
      url: url,
    })),
  );

  /**
   * 自定义上传处理
   */
  const customUpload = async (options: any) => {
    const { file, onSuccess, onError } = options;

    try {
      setLoading(true);

      // 验证文件类型
      const allowedTypes = accept.split(',');
      if (!OSSUploader.validateFileType(file, allowedTypes)) {
        throw new Error('文件类型不支持');
      }

      // 验证文件大小
      if (!OSSUploader.validateFileSize(file, maxFileSize)) {
        throw new Error(`文件大小不能超过 ${Math.floor(maxFileSize / 1024 / 1024)}MB`);
      }

      // 检查数量限制
      if (fileList.length >= maxCount) {
        throw new Error(`最多只能上传 ${maxCount} 张图片`);
      }

      // 上传文件
      const result = await OSSUploader.upload(file, type);

      // 更新文件列表
      const newFileList = [
        ...fileList,
        {
          uid: file.uid,
          name: file.name,
          status: 'done' as const,
          url: result.url,
        },
      ];

      setFileList(newFileList);

      // 触发 onChange，传递 URL 数组
      onChange?.(newFileList.map((f) => f.url as string));

      onSuccess(result, file);
      message.success('上传成功');
    } catch (error: any) {
      onError(error);
      message.error(error.message || '上传失败');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 删除单张图片
   */
  const handleRemove = (uid: string) => {
    const newFileList = fileList.filter((f) => f.uid !== uid);
    setFileList(newFileList);
    onChange?.(newFileList.map((f) => f.url as string));
  };

  /**
   * 移动图片位置（向前）
   */
  const moveForward = (index: number) => {
    if (index === 0) return;
    const newFileList = [...fileList];
    [newFileList[index - 1], newFileList[index]] = [newFileList[index], newFileList[index - 1]];
    setFileList(newFileList);
    onChange?.(newFileList.map((f) => f.url as string));
  };

  /**
   * 移动图片位置（向后）
   */
  const moveBackward = (index: number) => {
    if (index === fileList.length - 1) return;
    const newFileList = [...fileList];
    [newFileList[index], newFileList[index + 1]] = [newFileList[index + 1], newFileList[index]];
    setFileList(newFileList);
    onChange?.(newFileList.map((f) => f.url as string));
  };

  return (
    <div>
      {/* 已上传的图片列表 */}
      {fileList.length > 0 && (
        <Space direction="vertical" style={{ width: '100%', marginBottom: '16px' }}>
          {fileList.map((file, index) => (
            <div key={file.uid} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Image
                src={file.url}
                alt={`图片 ${index + 1}`}
                width={100}
                height={100}
                style={{ objectFit: 'cover', borderRadius: '4px' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: '4px', fontWeight: '500' }}>
                  图片 {index + 1} {index === 0 && '(封面)'}
                </div>
                <Space size="small">
                  {!disabled && index > 0 && (
                    <Button size="small" onClick={() => moveForward(index)}>
                      向前
                    </Button>
                  )}
                  {!disabled && index < fileList.length - 1 && (
                    <Button size="small" onClick={() => moveBackward(index)}>
                      向后
                    </Button>
                  )}
                  {!disabled && (
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemove(file.uid)}
                    >
                      删除
                    </Button>
                  )}
                </Space>
              </div>
            </div>
          ))}
        </Space>
      )}

      {/* 上传按钮 */}
      {fileList.length < maxCount && !disabled && (
        <Upload
          fileList={fileList}
          customRequest={customUpload}
          accept={accept}
          disabled={loading}
          showUploadList={false}
        >
          <Button icon={<UploadOutlined />} loading={loading}>
            {loading ? '上传中...' : '上传图片'}
          </Button>
        </Upload>
      )}

      <div style={{ marginTop: '8px', color: '#999', fontSize: '12px' }}>
        支持 JPG、PNG、GIF、WEBP 格式，最大 {Math.floor(maxFileSize / 1024 / 1024)}MB，最多{' '}
        {maxCount} 张{fileList.length > 0 && '，第一张为封面图'}
      </div>
    </div>
  );
};

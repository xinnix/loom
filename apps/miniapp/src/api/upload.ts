/**
 * 文件上传 API
 */
import { API_CONFIG } from '@/config/api';

/**
 * 上传头像到服务器
 * @param filePath 微信返回的临时文件路径
 * @returns 永久存储的头像 URL
 */
export async function uploadAvatar(filePath: string): Promise<string> {
  const token = uni.getStorageSync('token');

  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: `${API_CONFIG.baseURL}/upload/avatar`,
      filePath,
      name: 'file',
      header: {
        Authorization: `Bearer ${token}`,
      },
      success: (res) => {
        // 接受 200 和 201 状态码
        if (res.statusCode === 200 || res.statusCode === 201) {
          const response = JSON.parse(res.data) as any;
          if (response.success && response.data?.url) {
            console.log('✅ 头像上传成功:', response.data.url);
            resolve(response.data.url);
          } else {
            console.error('❌ 上传响应格式错误:', response);
            reject(new Error(response.message || '上传失败'));
          }
        } else {
          console.error('❌ 上传状态码错误:', res.statusCode);
          reject(new Error('上传失败'));
        }
      },
      fail: (err) => {
        console.error('❌ 上传请求失败:', err);
        reject(new Error(err.errMsg || '网络请求失败'));
      },
    });
  });
}

/**
 * 通用图片上传
 * @param filePath 文件路径
 * @param type 上传类型（如 'general', 'merchant', 'coupon' 等）
 * @returns 图片 URL
 */
export async function uploadImage(filePath: string, type: string = 'general'): Promise<string> {
  const token = uni.getStorageSync('token');

  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: `${API_CONFIG.baseURL}/upload/image`,
      filePath,
      name: 'file',
      formData: {
        type,
      },
      header: {
        Authorization: `Bearer ${token}`,
      },
      success: (res) => {
        // 接受 200 和 201 状态码
        if (res.statusCode === 200 || res.statusCode === 201) {
          const response = JSON.parse(res.data) as any;
          if (response.success && response.data?.url) {
            console.log('✅ 图片上传成功:', response.data.url);
            resolve(response.data.url);
          } else {
            console.error('❌ 上传响应格式错误:', response);
            reject(new Error(response.message || '上传失败'));
          }
        } else {
          console.error('❌ 上传状态码错误:', res.statusCode);
          reject(new Error('上传失败'));
        }
      },
      fail: (err) => {
        console.error('❌ 上传请求失败:', err);
        reject(new Error(err.errMsg || '网络请求失败'));
      },
    });
  });
}

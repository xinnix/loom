<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { API_CONFIG } from '@/config/api';
import { uploadAvatar } from '@/api/upload';
import { authApi } from '@/api/auth';

definePage({
  style: {
    navigationStyle: 'custom',
    backgroundColor: '#F5FAFF',
  },
});

const statusBarHeight = ref(0);
const loading = ref(false);
const userInfo = ref<{
  username?: string;
  email?: string;
  nickname?: string;
  phone?: string;
  avatar?: string;
}>({
  username: '',
  email: '',
  nickname: '',
  phone: '',
  avatar: '',
});
const originalUserInfo = ref<any>(null);

onMounted(() => {
  const sysInfo = uni.getSystemInfoSync();
  statusBarHeight.value = sysInfo.statusBarHeight || 0;

  // 获取用户信息
  const storedUserInfo = uni.getStorageSync('userInfo');
  if (storedUserInfo) {
    userInfo.value = { ...storedUserInfo };
    originalUserInfo.value = { ...storedUserInfo };
  }
});

// 页面显示时刷新用户信息
onShow(async () => {
  const token = uni.getStorageSync('token');
  if (token) {
    try {
      const res = await authApi.getProfile();
      if (res.data) {
        userInfo.value = { ...res.data };
        originalUserInfo.value = { ...res.data };
        uni.setStorageSync('userInfo', res.data);
      }
    } catch (error) {
      console.error('刷新用户信息失败:', error);
    }
  }
});

async function onChooseAvatar(event: any) {
  const avatarUrl = event.detail.avatarUrl;
  if (avatarUrl) {
    // 先显示临时头像
    userInfo.value.avatar = avatarUrl;

    // 上传到服务器获取永久 URL
    uni.showLoading({ title: '上传头像...', mask: true });
    try {
      const permanentUrl = await uploadAvatar(avatarUrl);
      console.log('✅ 获取到永久 URL:', permanentUrl);

      // 更新本地状态
      userInfo.value.avatar = permanentUrl;

      // 立即保存到数据库
      const token = uni.getStorageSync('token');
      if (token) {
        await uni.request({
          url: `${API_CONFIG.baseURL}/auth/me`,
          method: 'POST',
          header: {
            Authorization: `Bearer ${token}`,
          },
          data: {
            avatar: permanentUrl,
          },
        });

        // 更新本地存储
        uni.setStorageSync('userInfo', userInfo.value);
        console.log('✅ 头像已保存到数据库');
      }

      uni.hideLoading();
      uni.showToast({ title: '头像上传成功', icon: 'success' });
    } catch (error: any) {
      uni.hideLoading();
      console.error('❌ 上传头像失败:', error);
      uni.showToast({ title: error.message || '上传失败', icon: 'none' });
      // 上传失败时，恢复原始头像
      if (originalUserInfo.value?.avatar) {
        userInfo.value.avatar = originalUserInfo.value.avatar;
      }
    }
  }
}

function onNicknameChange(event: any) {
  const nickname = event.detail.value;
  if (nickname) {
    userInfo.value.nickname = nickname;
  }
}

async function getPhoneNumber(event: any) {
  if (event.detail.errMsg !== 'getPhoneNumber:ok') {
    uni.showToast({ title: '授权取消', icon: 'none' });
    return;
  }

  loading.value = true;
  try {
    const token = uni.getStorageSync('token');
    if (!token) {
      throw new Error('请先登录');
    }

    // 调用后端接口获取手机号
    const res = await uni.request({
      url: `${API_CONFIG.baseURL}/auth/getPhoneNumber`,
      method: 'POST',
      header: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        code: event.detail.code,
      },
    });

    if (res.statusCode === 200 && res.data) {
      const response = res.data as any;
      console.log('📱 手机号授权响应:', response);

      // 后端返回的是 { success: true, data: { phoneNumber: "xxx" } }
      const phoneNumber = response.data?.phoneNumber;
      console.log('📱 phoneNumber 值:', phoneNumber);

      if (phoneNumber) {
        userInfo.value.phone = phoneNumber;

        // 立即保存到数据库
        await uni.request({
          url: `${API_CONFIG.baseURL}/auth/me`,
          method: 'POST',
          header: {
            Authorization: `Bearer ${token}`,
          },
          data: {
            phone: phoneNumber,
          },
        });

        // 更新本地存储
        uni.setStorageSync('userInfo', userInfo.value);
        console.log('✅ 手机号已保存到数据库:', userInfo.value.phone);
        uni.showToast({ title: '手机号授权成功', icon: 'success' });
      } else {
        console.error('❌ 后端未返回 phoneNumber');
        throw new Error('授权失败：未获取到手机号');
      }
    } else {
      throw new Error('授权失败');
    }
  } catch (error: any) {
    uni.showToast({ title: error.message || '授权失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
}

async function handleSave() {
  if (!userInfo.value.nickname || userInfo.value.nickname.trim() === '') {
    uni.showToast({ title: '请输入昵称', icon: 'none' });
    return;
  }

  loading.value = true;
  try {
    const token = uni.getStorageSync('token');
    if (!token) {
      throw new Error('请先登录');
    }

    // 调用后端接口更新用户信息
    await uni.request({
      url: `${API_CONFIG.baseURL}/auth/me`,
      method: 'POST',
      header: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        nickname: userInfo.value.nickname,
        avatar: userInfo.value.avatar,
        phone: userInfo.value.phone, // 同时保存手机号
      },
    });

    // 更新本地存储
    uni.setStorageSync('userInfo', userInfo.value);

    uni.showToast({ title: '保存成功', icon: 'success' });
    setTimeout(() => {
      uni.navigateBack();
    }, 1500);
  } catch (error: any) {
    uni.showToast({ title: error.message || '保存失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <view class="edit-page">
    <!-- 内容区域 -->
    <view class="content">
      <!-- 头像区域 -->
      <view class="avatar-section">
        <button class="avatar-btn" open-type="chooseAvatar" @chooseavatar="onChooseAvatar">
          <image
            v-if="userInfo.avatar"
            :src="userInfo.avatar"
            class="avatar-image"
            mode="aspectFill"
          />
          <view v-else class="avatar-placeholder">
            <text class="iconfont icon-yonghu avatar-placeholder-icon" />
          </view>
          <view class="avatar-overlay">
            <text class="iconfont icon-camera avatar-camera-icon" />
          </view>
        </button>
        <text class="avatar-tip"> 点击更换头像 </text>
      </view>

      <!-- 表单字段 -->
      <view class="form-section">
        <!-- 昵称字段 -->
        <view class="form-item">
          <text class="form-label"> 昵称 </text>
          <input
            type="nickname"
            :value="userInfo.nickname"
            class="form-input"
            placeholder="请输入昵称"
            placeholder-class="form-input-placeholder"
            maxlength="20"
            @blur="onNicknameChange"
          />
        </view>

        <!-- 手机号字段 -->
        <view class="form-item">
          <text class="form-label"> 手机号 </text>
          <view class="phone-field">
            <text v-if="userInfo.phone" class="phone-number">
              {{ userInfo.phone }}
            </text>
            <text v-else class="phone-placeholder"> 未绑定 </text>
            <button
              class="phone-btn"
              open-type="getPhoneNumber"
              :loading="loading"
              @getphonenumber="getPhoneNumber"
            >
              <text class="phone-btn-text">
                {{ userInfo.phone ? '更换' : '授权' }}
              </text>
            </button>
          </view>
        </view>
      </view>

      <!-- 提示信息 -->
      <view class="info-card">
        <view class="info-content">
          <text class="iconfont icon-shield info-icon" />
          <view class="info-text">
            <text class="info-title"> 账号安全说明 </text>
            <text class="info-desc">
              为了保障社区安全，真实身份信息已加密处理。修改昵称不会影响您的会员权益发放。
            </text>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部保存按钮 -->
    <view class="footer">
      <view class="save-btn" :class="{ 'save-btn-disabled': loading }" @tap="handleSave">
        <text class="save-btn-text"> 保存修改 </text>
        <text class="iconfont icon-check save-btn-icon" />
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.edit-page {
  min-height: 100vh;
  background: #f5faff;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

/* 导航栏 */
.nav-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  background: rgba(239, 244, 250, 0.95);
  backdrop-filter: blur(20px);
}

.nav-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 88rpx;
  padding: 0 32rpx;
}

.nav-back {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-back-icon {
  font-size: 32px;
  color: #00aeef;
}

.nav-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #171c20;
}

.nav-placeholder {
  width: 48rpx;
}

/* 内容区域 */
.content {
  flex: 1;
  padding: 20rpx 40rpx 160rpx;
}

/* 头像区域 */
.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 64rpx;
  padding-top: 40rpx;
}

.avatar-btn {
  position: relative;
  width: 150rpx;
  height: 150rpx;
  margin-bottom: 24rpx;
  padding: 8rpx;
  background: transparent;
  border: none;

  &::after {
    border: none;
  }
}

.avatar-image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: rgba(221, 244, 255, 0.3);
  border: 4rpx solid rgba(189, 200, 209, 0.2);
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: rgba(221, 244, 255, 0.3);
  border: 4rpx solid rgba(189, 200, 209, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-placeholder-icon {
  font-size: 64px;
  color: #bdc8d1;
}

.avatar-overlay {
  position: absolute;
  inset: 0;
  background: rgba(23, 28, 32, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.avatar-btn:active .avatar-overlay {
  opacity: 1;
}

.avatar-camera-icon {
  font-size: 48px;
  color: #ffffff;
}

.avatar-tip {
  font-size: 22rpx;
  font-weight: 600;
  color: #6e7881;
  letter-spacing: 1rpx;
  text-transform: uppercase;
}

/* 表单区域 */
.form-section {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 0 32rpx;
  margin-bottom: 32rpx;
  border: 2rpx solid rgba(189, 200, 209, 0.2);
}

.form-item {
  padding: 32rpx 0;
  border-bottom: 2rpx solid rgba(189, 200, 209, 0.1);
}

.form-item:last-child {
  border-bottom: none;
}

.form-label {
  display: block;
  font-size: 22rpx;
  font-weight: 700;
  color: #6e7881;
  letter-spacing: 1rpx;
  text-transform: uppercase;
  margin-bottom: 16rpx;
}

.form-input {
  width: 100%;
  height: 80rpx;
  font-size: 30rpx;
  color: #171c20;
  font-weight: 500;
}

.form-input-placeholder {
  color: rgba(110, 120, 129, 0.5);
}

.phone-field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24rpx;
}

.phone-number {
  flex: 1;
  font-size: 30rpx;
  color: #171c20;
  font-weight: 500;
}

.phone-placeholder {
  flex: 1;
  font-size: 30rpx;
  color: rgba(110, 120, 129, 0.5);
}

.phone-btn {
  padding: 6rpx 32rpx;
  background: rgba(221, 244, 255, 0.3);

  &::after {
    border: none;
  }
}

.phone-btn-text {
  font-size: 24rpx;
  line-height: 12rpx;
  font-weight: 700;
  color: #00aeef;
}

/* 提示信息卡片 */
.info-card {
  background: rgba(221, 244, 255, 0.2);
  border-radius: 24rpx;
  padding: 32rpx;
  border: 2rpx solid rgba(0, 174, 239, 0.1);
}

.info-content {
  display: flex;
  align-items: flex-start;
  gap: 20rpx;
}

.info-icon {
  font-size: 32px;
  color: #00aeef;
  flex-shrink: 0;
}

.info-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.info-title {
  font-size: 26rpx;
  font-weight: 700;
  color: #003e58;
}

.info-desc {
  font-size: 22rpx;
  color: #3d657e;
  line-height: 1.6;
}

/* 底部保存按钮 */
.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24rpx 40rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  background: rgba(245, 250, 255, 0.95);
  backdrop-filter: blur(20px);
}

.save-btn {
  width: 100%;
  height: 96rpx;
  background: #00aeef;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  // box-shadow: 0 16rpx 32rpx -8rpx rgba(0, 174, 239, 0.3);

  &:active {
    transform: scale(0.98);
  }
}

.save-btn-disabled {
  opacity: 0.5;
  pointer-events: none;
}

.save-btn-text {
  font-size: 28rpx;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 1rpx;
}

.save-btn-icon {
  font-size: 18px;
  color: #ffffff;
}

button {
  border: none;
  margin: 0;
  padding: 0;
}
</style>

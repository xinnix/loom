<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app';
import { onMounted, ref } from 'vue';
import { authApi } from '@/api/auth';

definePage({
  type: 'home',
  style: {
    enablePullDownRefresh: true,
    backgroundColor: '#F5FAFF',
  },
});

const statusBarHeight = ref(0);
const isLoggedIn = ref(false);
const userInfo = ref<any>(null);

onMounted(() => {
  const systemInfo = uni.getSystemInfoSync();
  statusBarHeight.value = systemInfo.statusBarHeight || 0;
});

onShow(async () => {
  const token = uni.getStorageSync('token');
  isLoggedIn.value = !!token;

  if (token) {
    try {
      const res = await authApi.getProfile();
      if (res.data) {
        userInfo.value = res.data;
        uni.setStorageSync('userInfo', res.data);
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
    }
  }
});

function goToLogin() {
  uni.navigateTo({ url: '/pages/login' });
}

function goToProfile() {
  uni.navigateTo({ url: '/pages/profile/index' });
}
</script>

<template>
  <view class="page-root">
    <!-- TopAppBar -->
    <view
      class="top-bar-bg sticky top-0 z-50 w-full flex items-center justify-between px-4 py-3"
      :style="{ paddingTop: `${statusBarHeight}px` }"
    >
      <image class="logo-image" src="/static/logo.png" mode="aspectFit" />
      <view v-if="isLoggedIn" class="flex items-center gap-2" @click="goToProfile">
        <text class="text-sm text-on-surface font-medium">{{ userInfo?.username || '用户' }}</text>
      </view>
      <view v-else @click="goToLogin">
        <text class="text-sm text-primary font-bold">登录</text>
      </view>
    </view>

    <!-- Welcome Section -->
    <view class="px-4 py-8">
      <view class="welcome-card rounded-xl p-6 shadow-sm">
        <text class="mb-2 block text-2xl text-on-surface font-bold">Loom</text>
        <text class="block text-sm text-on-surface-variant">全栈管理系统脚手架，开箱即用</text>
        <view class="mt-4 flex gap-2">
          <view v-if="!isLoggedIn" class="rounded-lg bg-primary px-4 py-2" @click="goToLogin">
            <text class="text-sm text-white font-bold">开始使用</text>
          </view>
          <view v-if="isLoggedIn" class="rounded-lg bg-primary px-4 py-2" @click="goToProfile">
            <text class="text-sm text-white font-bold">个人中心</text>
          </view>
        </view>
      </view>
    </view>

    <!-- Tech Stack -->
    <view class="px-4">
      <text class="mb-3 block text-lg text-on-surface font-bold">技术栈</text>
      <view class="grid grid-cols-2 gap-3">
        <view
          v-for="tech in [
            { name: 'NestJS', desc: '后端 API' },
            { name: 'tRPC', desc: '类型安全' },
            { name: 'Prisma', desc: 'ORM' },
            { name: 'React + Refine', desc: '管理后台' },
            { name: 'Ant Design', desc: 'UI 组件库' },
            { name: 'uni-app', desc: '小程序' },
          ]"
          :key="tech.name"
          class="tech-card rounded-lg p-3 shadow-sm"
        >
          <text class="block text-sm text-on-surface font-bold">{{ tech.name }}</text>
          <text class="text-xs text-on-surface-variant">{{ tech.desc }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page-root {
  min-height: 100vh;
  background-color: #f5faff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.top-bar-bg {
  background: rgba(245, 250, 255, 0.95);
}

.logo-image {
  width: 200rpx;
  height: 80rpx;
}

.welcome-card {
  background: rgba(255, 255, 255, 0.95);
  border: 1rpx solid rgba(189, 200, 209, 0.2);
}

.tech-card {
  background: rgba(255, 255, 255, 0.9);
  border: 1rpx solid rgba(189, 200, 209, 0.2);
}
</style>

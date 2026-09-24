<script setup lang="ts">
import { ref, watch } from 'vue';

interface Props {
  visible: boolean;
  text?: string;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  text: '加载中...',
});

const isVisible = ref(false);

// 淡入淡出动画
watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      isVisible.value = true;
    } else {
      // 延迟消失，实现淡出效果
      setTimeout(() => {
        isVisible.value = false;
      }, 200);
    }
  },
);
</script>

<template>
  <view v-if="isVisible" class="loading-container">
    <view class="loading-mask"></view>
    <view class="loading-content">
      <!-- 装饰背景 -->
      <view class="loading-bg"></view>

      <!-- Logo + 动画 -->
      <view class="loading-logo-wrapper">
        <image class="loading-logo" src="/static/logo.png" mode="aspectFit" />
        <view class="loading-pulse"></view>
      </view>

      <!-- 加载文案 -->
      <text class="loading-text">{{ text }}</text>

      <!-- 进度条动画 -->
      <view class="loading-progress">
        <view class="loading-progress-bar"></view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.loading-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.loading-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.4);
}

.loading-content {
  position: relative;
  width: 240px;
  height: 280px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.loading-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 24px;
  opacity: 0.95;

  // 添加阴影
  box-shadow: 0 20px 60px rgba(102, 126, 234, 0.3);
}

.loading-logo-wrapper {
  position: relative;
  width: 100px;
  height: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.loading-logo {
  width: 80px;
  height: 80px;
  animation: logoFloat 2s ease-in-out infinite;
}

@keyframes logoFloat {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.loading-pulse {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 120px;
  height: 120px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0% {
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 0.5;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.2);
    opacity: 0.3;
  }
  100% {
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 0.5;
  }
}

.loading-text {
  font-size: 16px;
  color: #ffffff;
  font-weight: 500;
  letter-spacing: 1px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.loading-progress {
  width: 160px;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  overflow: hidden;
}

.loading-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #ffffff, rgba(255, 255, 255, 0.8));
  border-radius: 2px;
  animation: progress 1.5s ease-in-out infinite;
}

@keyframes progress {
  0% {
    width: 0%;
    transform: translateX(0);
  }
  50% {
    width: 70%;
    transform: translateX(0);
  }
  100% {
    width: 70%;
    transform: translateX(160px);
  }
}
</style>

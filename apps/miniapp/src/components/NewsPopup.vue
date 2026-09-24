<script setup lang="ts">
import { computed, ref } from 'vue';

interface Props {
  news: {
    id: string;
    title: string;
    bannerUrl?: string;
    content?: string;
  };
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
  goToDetail: [id: string];
}>();

// 是否显示弹窗
const visible = ref(true);

// 关闭弹窗
function handleClose() {
  visible.value = false;
  // 记录用户关闭次数
  const closedPopups = uni.getStorageSync('closedPopups') || {};
  const record = closedPopups[props.news.id] || { count: 0, lastClosed: null };

  // 增加关闭次数
  closedPopups[props.news.id] = {
    count: record.count + 1,
    lastClosed: new Date().toISOString(),
  };

  uni.setStorageSync('closedPopups', closedPopups);
  emit('close');
}

// 查看详情
function handleViewDetail() {
  handleClose();
  emit('goToDetail', props.news.id);
}

// 格式化内容摘要
const contentSummary = computed(() => {
  if (!props.news.content) return '';
  // 移除 HTML 标签，提取纯文本
  const text = props.news.content.replace(/<[^>]*>/g, '');
  return text.length > 100 ? `${text.substring(0, 100)}...` : text;
});
</script>

<template>
  <!-- 自定义弹窗遮罩层 -->
  <view v-if="visible" class="popup-mask" @click="handleClose">
    <view class="popup-wrapper" @click.stop>
      <view class="popup-container">
        <!-- Banner 图片 -->
        <view v-if="news.bannerUrl" class="popup-banner">
          <image :src="news.bannerUrl" mode="aspectFill" class="banner-image" />
        </view>

        <!-- 标题 -->
        <view class="popup-title">
          <text class="title-text">{{ news.title }}</text>
        </view>

        <!-- 内容摘要 -->
        <view v-if="contentSummary" class="popup-content">
          <text class="content-text">{{ contentSummary }}</text>
        </view>

        <!-- 操作按钮 -->
        <view class="popup-actions">
          <button class="action-button primary" @click="handleViewDetail">查看详情</button>
        </view>

        <!-- 关闭按钮 -->
        <view class="close-button" @click="handleClose">
          <text class="close-icon">✕</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
/* 遮罩层 - 全屏覆盖，深色半透明 */
.popup-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 弹窗容器 - 水平垂直居中 */
.popup-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0 32rpx;
}

/* 弹窗主体 */
.popup-container {
  width: 600rpx;
  max-width: 85vw;
  background: rgba(255, 255, 255, 0.98);
  border-radius: 24rpx;
  overflow: hidden;
  position: relative;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.15);
}

.popup-banner {
  width: 100%;
  height: 300rpx;
}

.banner-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.popup-title {
  padding: 24rpx 32rpx 16rpx;
}

.title-text {
  font-size: 32rpx;
  font-weight: bold;
  color: #171c20;
  line-height: 1.4;
}

.popup-content {
  padding: 0 32rpx 24rpx;
}

.content-text {
  font-size: 24rpx;
  color: rgba(110, 120, 129, 0.8);
  line-height: 1.6;
}

.popup-actions {
  display: flex;
  gap: 16rpx;
  padding: 0 32rpx 32rpx;
}

.action-button {
  width: 100%;
  height: 80rpx;
  border-radius: 16rpx;
  font-size: 28rpx;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: #00aeef;
  color: #ffffff;
}

.close-button {
  position: absolute;
  top: 16rpx;
  right: 16rpx;
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.close-icon {
  color: #ffffff;
  font-size: 28rpx;
  font-weight: bold;
}
</style>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { agentsApi } from '@/api/agents';
import type { Agent } from '@/api/agents';

definePage({
  type: 'page',
  style: {
    navigationBarTitleText: 'AI 助手',
    backgroundColor: '#F5FAFF',
  },
});

const agents = ref<Agent[]>([]);
const loading = ref(true);

onMounted(async () => {
  try {
    const res = await agentsApi.getActiveAgents();
    agents.value = res.data || [];
  } catch (error) {
    console.error('Failed to load agents:', error);
  } finally {
    loading.value = false;
  }
});

function openChat(agent: Agent) {
  uni.navigateTo({
    url: `/pages/agents/chat?id=${agent.id}&name=${encodeURIComponent(agent.name)}`,
  });
}
</script>

<template>
  <view class="agents-page">
    <view v-if="loading" class="loading">
      <text>加载中...</text>
    </view>

    <view v-else-if="agents.length === 0" class="empty">
      <text>暂无可用的 AI 助手</text>
    </view>

    <view v-else class="agent-list">
      <view v-for="agent in agents" :key="agent.id" class="agent-card" @tap="openChat(agent)">
        <view class="agent-icon">🤖</view>
        <view class="agent-info">
          <text class="agent-name">{{ agent.name }}</text>
          <text v-if="agent.description" class="agent-desc">{{ agent.description }}</text>
        </view>
        <view class="agent-arrow">›</view>
      </view>
    </view>
  </view>
</template>

<style scoped>
.agents-page {
  padding: 24rpx;
}

.loading,
.empty {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400rpx;
  color: #999;
}

.agent-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.agent-card {
  display: flex;
  align-items: center;
  padding: 32rpx;
  background: #fff;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
}

.agent-icon {
  font-size: 48rpx;
  margin-right: 24rpx;
}

.agent-info {
  flex: 1;
}

.agent-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  display: block;
}

.agent-desc {
  font-size: 24rpx;
  color: #999;
  margin-top: 8rpx;
  display: block;
}

.agent-arrow {
  font-size: 40rpx;
  color: #ccc;
}
</style>

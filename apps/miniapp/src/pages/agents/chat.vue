<script setup lang="ts">
import { nextTick, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';

definePage({
  type: 'page',
  style: {
    navigationBarTitleText: 'AI 对话',
    backgroundColor: '#F5FAFF',
  },
});

const agentId = ref('');
const agentName = ref('');
const query = ref('');
const messages = ref<any[]>([]);
const isStreaming = ref(false);
const scrollIntoView = ref('');

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  thought?: string;
  tool?: string;
}

onLoad((options) => {
  agentId.value = options?.id || '';
  agentName.value = decodeURIComponent(options?.name || 'AI 助手');
  uni.setNavigationBarTitle({ title: agentName.value });
});

function getAuthHeaders() {
  const token = uni.getStorageSync('token');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

async function handleSend() {
  if (!query.value.trim() || !agentId.value || isStreaming.value) return;

  const userMsg: ChatMessage = {
    id: `user-${Date.now()}`,
    role: 'user',
    content: query.value.trim(),
  };

  const assistantMsg: ChatMessage = {
    id: `assistant-${Date.now()}`,
    role: 'assistant',
    content: '',
  };

  messages.value.push(userMsg, assistantMsg);
  const currentQuery = query.value.trim();
  query.value = '';
  isStreaming.value = true;

  await nextTick();
  scrollIntoView.value = assistantMsg.id;

  try {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
    const response = await fetch(`${baseUrl}/agents/${agentId.value}/user-chat`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ query: currentQuery }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;
          try {
            const event = JSON.parse(jsonStr);

            const lastIdx = messages.value.length - 1;
            if (lastIdx < 0) continue;

            switch (event.event) {
              case 'agent_message':
              case 'message':
                messages.value[lastIdx].content += event.answer || '';
                break;
              case 'agent_thought':
                messages.value[lastIdx].thought = event.thought;
                messages.value[lastIdx].tool = event.tool;
                break;
              case 'error':
                uni.showToast({ title: event.message || '对话出错', icon: 'none' });
                break;
            }
          } catch {}
        }
      }
    }
  } catch {
    uni.showToast({ title: '对话失败', icon: 'none' });
  } finally {
    isStreaming.value = false;
  }
}
</script>

<template>
  <view class="chat-page">
    <!-- Messages -->
    <scroll-view class="messages" scroll-y :scroll-into-view="scrollIntoView" scroll-with-animation>
      <view v-if="messages.length === 0" class="empty">
        <text class="empty-icon">🤖</text>
        <text class="empty-text">发送消息开始对话</text>
      </view>

      <view v-for="msg in messages" :id="msg.id" :key="msg.id" class="message-row">
        <!-- User message -->
        <view v-if="msg.role === 'user'" class="msg msg-user">
          <view class="msg-bubble msg-bubble-user">
            <text>{{ msg.content }}</text>
          </view>
        </view>

        <!-- Assistant message -->
        <view v-else class="msg msg-assistant">
          <view class="msg-avatar">🤖</view>
          <view class="msg-content">
            <view v-if="msg.thought" class="msg-thought">
              <text v-if="msg.tool" class="thought-tool">🔧 {{ msg.tool }}</text>
              <text>{{ msg.thought }}</text>
            </view>
            <view class="msg-bubble msg-bubble-assistant">
              <text>{{ msg.content || (isStreaming ? '...' : '') }}</text>
            </view>
          </view>
        </view>
      </view>

      <view id="scroll-bottom" style="height: 20rpx" />
    </scroll-view>

    <!-- Input -->
    <view class="input-bar">
      <input
        v-model="query"
        class="chat-input"
        placeholder="输入消息..."
        :disabled="isStreaming"
        confirm-type="send"
        @confirm="handleSend"
      />
      <button class="send-btn" :disabled="!query.trim() || isStreaming" @tap="handleSend">
        {{ isStreaming ? '...' : '发送' }}
      </button>
    </view>
  </view>
</template>

<style scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.messages {
  flex: 1;
  padding: 24rpx;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400rpx;
}

.empty-icon {
  font-size: 80rpx;
}

.empty-text {
  color: #999;
  margin-top: 16rpx;
}

.message-row {
  margin-bottom: 24rpx;
}

.msg {
  display: flex;
}

.msg-user {
  justify-content: flex-end;
}

.msg-assistant {
  justify-content: flex-start;
  align-items: flex-start;
}

.msg-avatar {
  font-size: 36rpx;
  margin-right: 16rpx;
}

.msg-content {
  max-width: 75%;
}

.msg-thought {
  background: #fff7e6;
  border: 1rpx solid #ffe58f;
  border-radius: 12rpx;
  padding: 12rpx 20rpx;
  margin-bottom: 8rpx;
  font-size: 22rpx;
  color: #ad6800;
}

.thought-tool {
  font-weight: 600;
  display: block;
  margin-bottom: 4rpx;
}

.msg-bubble {
  border-radius: 16rpx;
  padding: 20rpx 28rpx;
  word-break: break-word;
}

.msg-bubble-user {
  background: #1677ff;
  color: #fff;
}

.msg-bubble-assistant {
  background: #f0f0f0;
  color: #333;
}

.input-bar {
  display: flex;
  align-items: center;
  padding: 16rpx 24rpx;
  background: #fff;
  border-top: 1rpx solid #eee;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
}

.chat-input {
  flex: 1;
  height: 72rpx;
  padding: 0 24rpx;
  background: #f5f5f5;
  border-radius: 36rpx;
  font-size: 28rpx;
}

.send-btn {
  margin-left: 16rpx;
  height: 72rpx;
  line-height: 72rpx;
  padding: 0 32rpx;
  background: #1677ff;
  color: #fff;
  border-radius: 36rpx;
  font-size: 28rpx;
  border: none;
}

.send-btn[disabled] {
  background: #ccc;
}
</style>

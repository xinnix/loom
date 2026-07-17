<script setup lang="ts">
import { ref } from 'vue'
import { todoApi, type Todo } from '@/api/todos'
import { onLoad } from '@dcloudio/uni-app'

definePage({
  navigationBarTitleText: 'Todo 详情',
  backgroundColor: '#F5FAFF',
})

const todo = ref<Todo | null>(null)
const loading = ref(true)

// 状态映射
const statusMap: Record<string, string> = {
  pending: '待处理',
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消',
}

const statusColorMap: Record<string, string> = {
  pending: '#999',
  in_progress: '#1677ff',
  completed: '#52c41a',
  cancelled: '#ff4d4f',
}

onLoad(async (options) => {
  const id = options?.id
  if (!id) {
    uni.showToast({ title: '参数错误', icon: 'none' })
    uni.navigateBack()
    return
  }

  await fetchTodo(id as string)
})

async function fetchTodo(id: string) {
  loading.value = true
  try {
    const res = await todoApi.getById(id)
    if (res.success) {
      todo.value = res.data
    } else {
      uni.showToast({ title: res.message || '加载失败', icon: 'none' })
    }
  } catch (err) {
    uni.showToast({ title: '网络错误', icon: 'none' })
  } finally {
    loading.value = false
  }
}

async function handleToggleComplete() {
  if (!todo.value) return
  const res = await todoApi.toggleComplete(todo.value.id, !todo.value.isCompleted)
  if (res.success) {
    todo.value = res.data
  }
}

async function handleDelete() {
  if (!todo.value) return
  uni.showModal({
    title: '确认删除',
    content: '删除后无法恢复，确认删除？',
    success: async (res) => {
      if (res.confirm) {
        const result = await todoApi.delete(todo.value!.id)
        if (result.success) {
          uni.showToast({ title: '删除成功', icon: 'success' })
          uni.navigateBack()
        }
      }
    },
  })
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>

<template>
  <view class="page-root">
    <!-- 加载状态 -->
    <view v-if="loading" class="loading-state">
      <text class="loading-text">加载中...</text>
    </view>

    <!-- 详情内容 -->
    <view v-if="!loading && todo" class="detail-card">
      <!-- 标题行 -->
      <view class="title-row">
        <view :class="['checkbox', todo.isCompleted && 'checkbox-checked']" @click="handleToggleComplete">
          <text v-if="todo.isCompleted" class="checkbox-icon">✓</text>
        </view>
        <text :class="['title-text', todo.isCompleted && 'title-completed']">
          {{ todo.title }}
        </text>
      </view>

      <!-- 标签 -->
      <view class="tag-row">
        <text class="status-tag" :style="{ color: statusColorMap[todo.status], borderColor: statusColorMap[todo.status] }">
          {{ statusMap[todo.status] || todo.status }}
        </text>
        <text v-if="todo.priority > 0" class="priority-tag">
          优先级: {{ todo.priority === 2 ? '高' : todo.priority === 1 ? '中' : '低' }}
        </text>
        <text v-if="todo.isCompleted" class="completed-tag">已完成</text>
      </view>

      <!-- 描述 -->
      <view v-if="todo.description" class="section">
        <text class="section-title">描述</text>
        <text class="section-content">{{ todo.description }}</text>
      </view>

      <!-- 详细信息 -->
      <view class="section">
        <text class="section-title">详细信息</text>
        <view class="info-row">
          <text class="info-label">创建时间</text>
          <text class="info-value">{{ formatDate(todo.createdAt) }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">更新时间</text>
          <text class="info-value">{{ formatDate(todo.updatedAt) }}</text>
        </view>
        <view v-if="todo.dueDate" class="info-row">
          <text class="info-label">截止日期</text>
          <text class="info-value">{{ formatDate(todo.dueDate).split(' ')[0] }}</text>
        </view>
        <view v-if="todo.completedAt" class="info-row">
          <text class="info-label">完成时间</text>
          <text class="info-value">{{ formatDate(todo.completedAt) }}</text>
        </view>
      </view>

      <!-- 删除按钮 -->
      <view class="delete-section" @click="handleDelete">
        <text class="delete-text">删除此待办事项</text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.page-root {
  min-height: 100vh;
  background-color: #f5faff;
  padding: 24rpx;
}

.loading-state {
  text-align: center;
  padding: 200rpx 0;
}

.loading-text {
  color: #999;
  font-size: 28rpx;
}

.detail-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 32rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.title-row {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
}

.checkbox {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  border: 3rpx solid #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 4rpx;
}

.checkbox-checked {
  background: #52c41a;
  border-color: #52c41a;
}

.checkbox-icon {
  color: #fff;
  font-size: 24rpx;
}

.title-text {
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
  line-height: 1.4;
}

.title-completed {
  text-decoration: line-through;
  color: #bbb;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 20rpx;
}

.status-tag {
  font-size: 24rpx;
  padding: 6rpx 16rpx;
  border-radius: 8rpx;
  border: 2rpx solid;
  background: #fafafa;
}

.priority-tag {
  font-size: 24rpx;
  color: #fa8c16;
  background: #fff7e6;
  padding: 6rpx 16rpx;
  border-radius: 8rpx;
}

.completed-tag {
  font-size: 24rpx;
  color: #52c41a;
  background: #f6ffed;
  padding: 6rpx 16rpx;
  border-radius: 8rpx;
}

.section {
  margin-top: 32rpx;
  padding-top: 24rpx;
  border-top: 2rpx solid #f0f0f0;
}

.section-title {
  display: block;
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
  margin-bottom: 12rpx;
}

.section-content {
  font-size: 28rpx;
  color: #666;
  line-height: 1.6;
  white-space: pre-wrap;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 14rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 26rpx;
  color: #999;
}

.info-value {
  font-size: 26rpx;
  color: #333;
}

.delete-section {
  margin-top: 40rpx;
  text-align: center;
  padding: 24rpx;
  border-top: 2rpx solid #f0f0f0;
}

.delete-text {
  font-size: 28rpx;
  color: #ff4d4f;
}
</style>

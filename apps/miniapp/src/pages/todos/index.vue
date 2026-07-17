<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { todoApi, type Todo } from '@/api/todos'
import { onShow } from '@dcloudio/uni-app'

definePage({
  navigationBarTitleText: '待办事项',
  enablePullDownRefresh: true,
  backgroundColor: '#F5FAFF',
})

// 状态
const todoList = ref<Todo[]>([])
const loading = ref(false)
const statusFilter = ref('')

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

const priorityLabel: Record<number, string> = {
  0: '低',
  1: '中',
  2: '高',
}

// 加载数据
async function fetchTodos() {
  loading.value = true
  try {
    const params: Record<string, any> = {}
    if (statusFilter.value) params.status = statusFilter.value

    const res = await todoApi.getList(params)
    if (res.success) {
      todoList.value = res.data || []
    } else {
      uni.showToast({ title: res.message || '加载失败', icon: 'none' })
    }
  } catch (err) {
    uni.showToast({ title: '网络错误', icon: 'none' })
  } finally {
    loading.value = false
  }
}

// 切换完成状态
async function toggleComplete(todo: Todo) {
  const res = await todoApi.toggleComplete(todo.id, !todo.isCompleted)
  if (res.success) {
    fetchTodos()
  }
}

// 删除
async function handleDelete(id: string) {
  uni.showModal({
    title: '提示',
    content: '确认删除这条待办事项？',
    success: async (res) => {
      if (res.confirm) {
        const result = await todoApi.delete(id)
        if (result.success) {
          uni.showToast({ title: '删除成功', icon: 'success' })
          fetchTodos()
        }
      }
    },
  })
}

// 页面显示时刷新（支持从创建页返回）
onShow(() => {
  fetchTodos()
})

// 下拉刷新
onMounted(() => {
  // uni-app 下拉刷新回调
})
</script>

<template>
  <view class="page-root">
    <!-- 顶部操作栏 -->
    <view class="action-bar">
      <!-- 状态筛选 -->
      <view class="filter-row">
        <view
          :class="['filter-tag', !statusFilter && 'filter-tag-active']"
          @click="statusFilter = ''; fetchTodos()"
        >
          全部
        </view>
        <view
          v-for="(label, key) in statusMap"
          :key="key"
          :class="['filter-tag', statusFilter === key && 'filter-tag-active']"
          :style="statusFilter === key ? `border-color: ${statusColorMap[key]}; color: ${statusColorMap[key]}` : ''"
          @click="statusFilter = key; fetchTodos()"
        >
          {{ label }}
        </view>
      </view>

      <!-- 新建按钮 -->
      <view class="create-btn" @click="uni.navigateTo({ url: '/pages/todos/create' })">
        <text class="create-btn-text">+</text>
      </view>
    </view>

    <!-- 加载状态 -->
    <view v-if="loading" class="loading-state">
      <text class="loading-text">加载中...</text>
    </view>

    <!-- 空状态 -->
    <view v-if="!loading && todoList.length === 0" class="empty-state">
      <text class="empty-icon">📝</text>
      <text class="empty-text">暂无待办事项</text>
      <view class="empty-action" @click="uni.navigateTo({ url: '/pages/todos/create' })">
        创建一个
      </view>
    </view>

    <!-- Todo 列表 -->
    <view v-if="!loading" class="list">
      <view
        v-for="todo in todoList"
        :key="todo.id"
        class="todo-item"
        @click="uni.navigateTo({ url: `/pages/todos/detail?id=${todo.id}` })"
      >
        <!-- 勾选框 -->
        <view
          :class="['checkbox', todo.isCompleted && 'checkbox-checked']"
          @click.stop="toggleComplete(todo)"
        >
          <text v-if="todo.isCompleted" class="checkbox-icon">✓</text>
        </view>

        <!-- 内容 -->
        <view class="todo-content">
          <view class="todo-header">
            <text :class="['todo-title', todo.isCompleted && 'todo-title-completed']">
              {{ todo.title }}
            </text>
          </view>

          <view class="todo-meta">
            <text
              class="status-tag"
              :style="{ color: statusColorMap[todo.status] || '#999' }"
            >
              {{ statusMap[todo.status] || todo.status }}
            </text>
            <text v-if="todo.priority > 0" class="priority-tag">
              {{ priorityLabel[todo.priority] }}
            </text>
            <text v-if="todo.dueDate" class="due-date">
              {{ todo.dueDate.slice(0, 10) }}
            </text>
          </view>
        </view>

        <!-- 删除 -->
        <view class="delete-btn" @click.stop="handleDelete(todo.id)">
          <text class="delete-icon">🗑</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
.page-root {
  min-height: 100vh;
  background-color: #f5faff;
  padding: 16rpx;
}

.action-bar {
  position: relative;
  margin-bottom: 16rpx;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.filter-tag {
  padding: 8rpx 20rpx;
  border-radius: 30rpx;
  font-size: 26rpx;
  background: #fff;
  border: 2rpx solid #e8e8e8;
  color: #666;
}

.filter-tag-active {
  background: #e6f4ff;
  border-color: #1677ff;
  color: #1677ff;
}

.create-btn {
  position: fixed;
  right: 30rpx;
  bottom: 100rpx;
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  background: #1677ff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 16rpx rgba(22, 119, 255, 0.4);
  z-index: 100;
}

.create-btn-text {
  font-size: 50rpx;
  color: #fff;
  line-height: 1;
}

.loading-state {
  text-align: center;
  padding: 100rpx 0;
}

.loading-text {
  color: #999;
  font-size: 28rpx;
}

.empty-state {
  text-align: center;
  padding: 150rpx 0;
}

.empty-icon {
  font-size: 80rpx;
}

.empty-text {
  display: block;
  margin-top: 20rpx;
  color: #999;
  font-size: 28rpx;
}

.empty-action {
  display: inline-block;
  margin-top: 30rpx;
  padding: 16rpx 40rpx;
  border-radius: 40rpx;
  background: #1677ff;
  color: #fff;
  font-size: 28rpx;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.todo-item {
  display: flex;
  align-items: flex-start;
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.checkbox {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  border: 3rpx solid #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16rpx;
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

.todo-content {
  flex: 1;
  min-width: 0;
}

.todo-title {
  font-size: 30rpx;
  color: #333;
  font-weight: 500;
}

.todo-title-completed {
  text-decoration: line-through;
  color: #bbb;
}

.todo-meta {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-top: 10rpx;
}

.status-tag {
  font-size: 22rpx;
  background: #f5f5f5;
  padding: 4rpx 12rpx;
  border-radius: 6rpx;
}

.priority-tag {
  font-size: 22rpx;
  color: #fa8c16;
  background: #fff7e6;
  padding: 4rpx 12rpx;
  border-radius: 6rpx;
}

.due-date {
  font-size: 22rpx;
  color: #999;
}

.delete-btn {
  padding: 8rpx;
  flex-shrink: 0;
  margin-left: 8rpx;
}

.delete-icon {
  font-size: 32rpx;
}
</style>

<script setup lang="ts">
import { ref } from 'vue'
import { todoApi } from '@/api/todos'

definePage({
  navigationBarTitleText: '新建待办',
  backgroundColor: '#F5FAFF',
})

// 表单
const title = ref('')
const description = ref('')
const priority = ref(0)
const dueDate = ref('')
const saving = ref(false)

// 优先级选项
const priorityOptions = [
  { value: 0, label: '低', color: '#999' },
  { value: 1, label: '中', color: '#fa8c16' },
  { value: 2, label: '高', color: '#ff4d4f' },
]

async function handleCreate() {
  if (!title.value.trim()) {
    uni.showToast({ title: '请输入标题', icon: 'none' })
    return
  }

  saving.value = true

  try {
    const payload: any = { title: title.value.trim() }
    if (description.value.trim()) payload.description = description.value.trim()
    payload.priority = priority.value
    if (dueDate.value) payload.dueDate = dueDate.value

    const res = await todoApi.create(payload)

    if (res.success) {
      uni.showToast({ title: '创建成功', icon: 'success' })
      // 返回列表页
      uni.navigateBack()
    } else {
      uni.showToast({ title: res.message || '创建失败', icon: 'none' })
    }
  } catch (err) {
    uni.showToast({ title: '网络错误', icon: 'none' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <view class="page-root">
    <view class="form-card">
      <!-- 标题 -->
      <view class="form-item">
        <text class="form-label">标题 <text class="required">*</text></text>
        <input
          v-model="title"
          class="form-input"
          placeholder="输入待办事项标题"
          maxlength="200"
        />
      </view>

      <!-- 描述 -->
      <view class="form-item">
        <text class="form-label">描述</text>
        <textarea
          v-model="description"
          class="form-textarea"
          placeholder="添加详细描述（可选）"
          maxlength="1000"
        />
      </view>

      <!-- 优先级 -->
      <view class="form-item">
        <text class="form-label">优先级</text>
        <view class="priority-row">
          <view
            v-for="opt in priorityOptions"
            :key="opt.value"
            :class="['priority-tag', priority === opt.value && 'priority-tag-active']"
            :style="priority === opt.value ? `border-color: ${opt.color}; color: ${opt.color}; background: ${opt.color}15` : ''"
            @click="priority = opt.value"
          >
            {{ opt.label }}
          </view>
        </view>
      </view>

      <!-- 截止日期 -->
      <view class="form-item">
        <text class="form-label">截止日期</text>
        <picker mode="date" :value="dueDate" @change="(e: any) => dueDate = e.detail.value">
          <view :class="['date-picker', !dueDate && 'date-picker-empty']">
            {{ dueDate || '请选择日期' }}
          </view>
        </picker>
      </view>
    </view>

    <!-- 提交按钮 -->
    <view class="submit-btn" @click="handleCreate">
      <text class="submit-text">{{ saving ? '创建中...' : '创建' }}</text>
    </view>
  </view>
</template>

<style scoped>
.page-root {
  min-height: 100vh;
  background-color: #f5faff;
  padding: 24rpx;
}

.form-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 32rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.form-item {
  margin-bottom: 36rpx;
}

.form-label {
  display: block;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 12rpx;
  font-weight: 500;
}

.required {
  color: #ff4d4f;
}

.form-input {
  width: 100%;
  height: 80rpx;
  border: 2rpx solid #e8e8e8;
  border-radius: 12rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  color: #333;
  box-sizing: border-box;
}

.form-textarea {
  width: 100%;
  height: 160rpx;
  border: 2rpx solid #e8e8e8;
  border-radius: 12rpx;
  padding: 16rpx 20rpx;
  font-size: 28rpx;
  color: #333;
  box-sizing: border-box;
}

.priority-row {
  display: flex;
  gap: 16rpx;
}

.priority-tag {
  padding: 12rpx 32rpx;
  border-radius: 30rpx;
  border: 2rpx solid #e8e8e8;
  font-size: 26rpx;
  color: #666;
  background: #fafafa;
}

.priority-tag-active {
  border-width: 2rpx;
  font-weight: 500;
}

.date-picker {
  width: 100%;
  height: 80rpx;
  border: 2rpx solid #e8e8e8;
  border-radius: 12rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  color: #333;
  line-height: 80rpx;
  box-sizing: border-box;
}

.date-picker-empty {
  color: #bbb;
}

.submit-btn {
  margin-top: 48rpx;
  width: 100%;
  height: 88rpx;
  background: #1677ff;
  border-radius: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 16rpx rgba(22, 119, 255, 0.3);
}

.submit-text {
  font-size: 32rpx;
  color: #fff;
  font-weight: 500;
}
</style>

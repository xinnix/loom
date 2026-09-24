/**
 * 全局 Loading 状态管理
 * 使用 Vue 3 reactive 实现状态管理，支持最小显示时间
 */

import { reactive } from 'vue';

interface LoadingState {
  /** 当前活跃的请求数量 */
  count: number;
  /** loading 是否显示 */
  isVisible: boolean;
  /** loading 文案 */
  text: string;
  /** 最小显示时间计时器 */
  minTimer: NodeJS.Timeout | null;
}

const state = reactive<LoadingState>({
  count: 0,
  isVisible: false,
  text: '加载中...',
  minTimer: null,
});

/** 最小显示时间（毫秒） */
const MIN_DISPLAY_TIME = 500;

/**
 * 显示 loading
 * @param text loading 文案
 */
export function showLoading(text = '加载中...') {
  state.count++;
  state.text = text;

  // 清除之前的计时器
  if (state.minTimer) {
    clearTimeout(state.minTimer);
    state.minTimer = null;
  }

  // 立即显示
  state.isVisible = true;
}

/**
 * 隐藏 loading
 * 带有最小显示时间保护
 */
export function hideLoading() {
  state.count--;

  if (state.count <= 0) {
    state.count = 0;

    if (state.minTimer) {
      clearTimeout(state.minTimer);
    }

    state.minTimer = setTimeout(() => {
      state.isVisible = false;
      state.minTimer = null;
    }, MIN_DISPLAY_TIME);
  }
}

/**
 * 获取 loading 状态
 */
export function useLoading() {
  return {
    state,
    showLoading,
    hideLoading,
  };
}

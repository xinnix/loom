/**
 * Todo API 模块
 *
 * 通过 REST Controller（todo.controller.ts）与后端通信
 * 固定响应格式：{ success, data, message, meta? }
 */
import { http } from '@/utils/http';
import { API_ENDPOINTS } from '@/config/api';

export interface Todo {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: number;
  dueDate?: string | null;
  isCompleted: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
}

export interface TodoListResponse {
  success: boolean;
  data: Todo[];
  meta?: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface TodoDetailResponse {
  success: boolean;
  data: Todo;
  message?: string;
}

export const todoApi = {
  /** 获取当前用户的 Todo 列表 */
  getList: (params?: { page?: number; pageSize?: number; status?: string }) =>
    http.get<TodoListResponse>(API_ENDPOINTS.todos, params),

  /** 获取单条 Todo 详情 */
  getById: (id: string) => http.get<TodoDetailResponse>(API_ENDPOINTS.todoDetail(id)),

  /** 创建 Todo */
  create: (data: { title: string; description?: string; priority?: number; dueDate?: string }) =>
    http.post<TodoDetailResponse>(API_ENDPOINTS.todos, data),

  /** 更新 Todo */
  update: (
    id: string,
    data: {
      title?: string;
      description?: string;
      status?: string;
      priority?: number;
      dueDate?: string;
      isCompleted?: boolean;
    },
  ) => http.put<TodoDetailResponse>(API_ENDPOINTS.todoDetail(id), data),

  /** 删除 Todo */
  delete: (id: string) => http.delete<{ success: boolean; message: string }>(API_ENDPOINTS.todoDetail(id)),

  /** 切换完成状态 */
  toggleComplete: (id: string, isCompleted: boolean) =>
    http.put<TodoDetailResponse>(API_ENDPOINTS.todoDetail(id), { isCompleted }),
};

import { TRPCClientError } from '@trpc/client';
import { QueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { getTrpcClient } from '../trpc/trpcClient';

// Create QueryClient for React Query
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Message instance - will be set by the app
let messageInstance: ReturnType<typeof App.useApp>['message'] | null = null;

/**
 * Set the message instance from the app
 * This should be called once in the root component
 */
export const setMessageInstance = (message: any) => {
  messageInstance = message;
};

/**
 * Helper to show error message
 */
const showError = (msg: string) => {
  if (messageInstance) {
    messageInstance.error(msg);
  } else {
    console.error('[Message not initialized]', msg);
  }
};

/**
 * Extract business-friendly error message from database error
 * Transforms technical database errors into user-friendly messages
 */
function extractBusinessErrorMessage(errorMessage: string): string | null {
  // Foreign key constraint violations
  if (
    errorMessage.includes('violates foreign key constraint') ||
    errorMessage.includes('violates RESTRICT setting')
  ) {
    // Extract table names from error message
    const tableMatch = errorMessage.match(/table "(\w+)"/g);

    if (tableMatch && tableMatch.length >= 2) {
      const childTable = tableMatch[0].replace(/table "|"/g, '');

      // Map table names to Chinese
      const tableNames: Record<string, string> = {
        orders: '订单',
        coupon_templates: '券模板',
        merchants: '商户',
        users: '用户',
        news: '新闻',
        settlements: '结算单',
      };

      const childName = tableNames[childTable] || childTable;
      return `该${childName}已有其他数据关联，无法删除`;
    }

    return '该数据已有其他数据关联，无法删除';
  }

  // Unique constraint violations
  if (errorMessage.includes('duplicate key value violates unique constraint')) {
    const fieldMatch = errorMessage.match(/Key \((\w+)\)/);
    if (fieldMatch) {
      const field = fieldMatch[1];
      const fieldNames: Record<string, string> = {
        email: '邮箱',
        username: '用户名',
        order_no: '订单号',
      };
      const fieldName = fieldNames[field] || field;
      return `${fieldName}已存在，请使用其他值`;
    }
    return '该数据已存在';
  }

  // Check constraint violations
  if (errorMessage.includes('violates check constraint')) {
    return '数据验证失败，请检查输入内容';
  }

  // Not null violations
  if (errorMessage.includes('null value in column')) {
    const fieldMatch = errorMessage.match(/column "(\w+)"/);
    if (fieldMatch) {
      const field = fieldMatch[1];
      const fieldNames: Record<string, string> = {
        title: '标题',
        email: '邮箱',
        password: '密码',
        status: '状态',
      };
      const fieldName = fieldNames[field] || field;
      return `${fieldName}不能为空`;
    }
    return '必填字段不能为空';
  }

  return null;
}

/**
 * Handle tRPC errors with global message notification.
 * Note: 401 UNAUTHORIZED is handled at the tRPC client level (trpcClient.ts),
 * so this function typically won't see 401 errors. The safety net below is kept
 * in case of edge cases.
 * Returns true if the operation should be retried, false otherwise.
 */
async function handleTRPCError(error: unknown): Promise<boolean> {
  if (error instanceof TRPCClientError) {
    const errorMessage = error.data?.message || error.message || '操作失败，请稍后重试';

    // Try to extract business-friendly message from database error
    const businessMessage = extractBusinessErrorMessage(errorMessage);

    if (businessMessage) {
      showError(businessMessage);
      return false;
    }

    // Get error code from different possible locations in tRPC error structure
    const errorCode = (error.data as any)?.code || (error.data as any)?.httpStatus;
    const httpStatus = (error.shape as any)?.data?.httpStatus || (error.data as any)?.httpStatus;

    // Resolve effective status for error handling
    const effectiveStatus =
      errorCode === 'UNAUTHORIZED'
        ? 401
        : errorCode === 'FORBIDDEN'
          ? 403
          : errorCode === 'NOT_FOUND'
            ? 404
            : errorCode === 'CONFLICT'
              ? 409
              : errorCode === 'BAD_REQUEST'
                ? 400
                : errorCode === 'INTERNAL_SERVER_ERROR'
                  ? 500
                  : typeof errorCode === 'number'
                    ? errorCode
                    : httpStatus;

    switch (effectiveStatus) {
      case 401:
        // Safety net: 401 is handled by tRPC client, but clear auth if somehow reaching here
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        showError('登录已过期，请重新登录');
        window.location.href = '/unauthorized';
        return false;
      case 403:
        showError('没有权限执行此操作');
        return false;
      case 404:
        showError('请求的资源不存在');
        return false;
      case 409:
        showError(errorMessage);
        return false;
      case 400:
        showError(errorMessage);
        return false;
      case 500:
        // 显示实际错误消息（可能是业务异常，如"没有可结算的订单"）
        showError(errorMessage);
        return false;
      default:
        // Network error check
        if (error.message.includes('ECONNREFUSED')) {
          showError('无法连接到服务器，请检查网络连接');
        } else {
          showError(errorMessage);
        }
        return false;
    }
  } else if (error instanceof Error) {
    showError(error.message || '操作失败，请稍后重试');
    return false;
  } else {
    showError('操作失败，请稍后重试');
    return false;
  }
}

// Get shared tRPC client and export for other modules
export const trpcClient = getTrpcClient();

/**
 * Custom tRPC data provider for Refine
 *
 * This provider uses the unified CRUD router format from createCrudRouter.
 * All routers generated with createCrudRouter have consistent input/output formats:
 *
 * - getMany: { items, total, page, pageSize, totalPages }
 * - getOne: record (direct)
 * - create: input { data, include?, select? } -> record (direct)
 * - update: input { id, data, include?, select? } -> record (direct)
 * - delete: record (direct)
 * - deleteMany: { count }
 */
export const dataProvider = {
  /**
   * Get a paginated list of records
   */
  getList: async ({ resource, pagination, filters, sorters, meta }: any) => {
    try {
      // Refine 的 getList 接收的 pagination 格式：{ currentPage, pageSize }
      // 参考：https://refine.dev/docs/data/data-provider/#getlist
      const { currentPage = 1, pageSize = 10 } = pagination || {};

      // Handle custom methods (like getTree, getManyFiltered)
      if (meta?.method) {
        // Extract filter values for custom methods
        const filterValues: any = {};
        if (filters?.length) {
          for (const filter of filters) {
            if (filter.field && filter.value !== undefined) {
              filterValues[filter.field] = filter.value;
            }
          }
        }

        // Call custom method with filters
        const customResult = await (trpcClient as any)[resource][meta.method].query({
          page: currentPage,
          limit: pageSize,
          ...filterValues,
          ...(meta.params || {}),
        });

        // Handle different return formats:
        // - Array: directly return as data (e.g., getTree)
        // - Object with items/total: use that format (e.g., getManyFiltered)
        if (Array.isArray(customResult)) {
          return {
            data: customResult,
            total: customResult.length,
          };
        }

        return {
          data: customResult.items || [],
          total: customResult.total || 0,
        };
      }

      // Build where clause from filters
      const where: any = {};
      if (filters?.length) {
        for (const filter of filters) {
          if (filter.field && filter.value !== undefined) {
            // Handle different filter operators
            if (filter.operator === 'contains') {
              where[filter.field] = { contains: filter.value };
            } else if (filter.operator === 'eq') {
              where[filter.field] = filter.value;
            } else if (
              filter.operator === 'gte' ||
              filter.operator === 'lte' ||
              filter.operator === 'gt' ||
              filter.operator === 'lt'
            ) {
              // Support range operators (merge multiple operators on same field)
              if (!where[filter.field]) {
                where[filter.field] = {};
              }
              where[filter.field][filter.operator] = filter.value;
            } else {
              where[filter.field] = filter.value;
            }
          }
        }
      }

      // Build orderBy from sorters
      let orderBy: any = {};
      if (sorters?.length) {
        const sorter = sorters[0];
        orderBy = { [sorter.field]: sorter.order === 'asc' ? 'asc' : 'desc' };
      }

      // Call the getMany procedure with unified format
      const result = await (trpcClient as any)[resource].getMany.query({
        page: currentPage,
        limit: pageSize,
        where,
        orderBy: Object.keys(orderBy).length > 0 ? orderBy : undefined,
        include: meta?.include,
      });

      // Result format from createCrudRouter: { items, total, page, pageSize, totalPages }
      return {
        data: result.items || [],
        total: result.total || 0,
      };
    } catch (error) {
      handleTRPCError(error);
      throw error;
    }
  },

  /**
   * Get a single record by ID
   */
  getOne: async ({ resource, id, meta }: any) => {
    try {
      // 支持自定义方法（如 getOneForAdmin）
      if (meta?.method) {
        const result = await (trpcClient as any)[resource][meta.method].query({
          id,
          include: meta?.include,
          select: meta?.select,
        });
        return { data: result };
      }

      const result = await (trpcClient as any)[resource].getOne.query({
        id,
        include: meta?.include,
        select: meta?.select,
      });

      return { data: result };
    } catch (error) {
      handleTRPCError(error);
      throw error;
    }
  },

  /**
   * Create a new record
   *
   * Input format for createCrudRouter: { data, include?, select? }
   * Note: 401 token refresh is handled at the tRPC client level transparently.
   */
  create: async ({ resource, variables, meta }: any) => {
    try {
      // Handle special procedures (non-CRUD)
      if (meta?.method) {
        const result = await (trpcClient as any)[resource][meta.method].mutate(variables);
        return { data: result };
      }

      // Standard create with new format
      const result = await (trpcClient as any)[resource].create.mutate({
        data: variables,
        include: meta?.include,
        select: meta?.select,
      });

      return { data: result };
    } catch (error) {
      await handleTRPCError(error);
      throw error;
    }
  },

  /**
   * Update an existing record
   *
   * Input format for createCrudRouter: { id, data, include?, select? }
   * Note: 401 token refresh is handled at the tRPC client level transparently.
   */
  update: async ({ resource, id, variables, meta }: any) => {
    try {
      // Handle special procedures (non-CRUD)
      if (meta?.method) {
        const result = await (trpcClient as any)[resource][meta.method].mutate({
          id,
          ...variables,
        });
        return { data: result };
      }

      // Standard update with new format
      const result = await (trpcClient as any)[resource].update.mutate({
        id,
        data: variables,
        include: meta?.include,
        select: meta?.select,
      });

      return { data: result };
    } catch (error) {
      await handleTRPCError(error);
      throw error;
    }
  },

  /**
   * Delete a single record
   * Note: 401 token refresh is handled at the tRPC client level transparently.
   */
  deleteOne: async ({ resource, id }: any) => {
    try {
      const result = await (trpcClient as any)[resource].delete.mutate({ id });
      return { data: result };
    } catch (error) {
      await handleTRPCError(error);
      throw error;
    }
  },

  /**
   * Delete multiple records
   * Note: 401 token refresh is handled at the tRPC client level transparently.
   */
  deleteMany: async ({ resource, ids }: any) => {
    try {
      const result = await (trpcClient as any)[resource].deleteMany.mutate({ ids });
      return { data: result };
    } catch (error) {
      await handleTRPCError(error);
      throw error;
    }
  },

  /**
   * Get the API URL
   */
  getApiUrl: () => import.meta.env.VITE_API_URL || '/trpc',
};

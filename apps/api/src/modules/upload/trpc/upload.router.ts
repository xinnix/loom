import { z } from 'zod';
import { protectedProcedure, router } from '../../../trpc/trpc';
import { TRPCError } from '@trpc/server';

/**
 * Upload tRPC Router
 *
 * 文件上传路由，提供：
 * - getUploadConfig: 获取存储配置（前端据此选择直传或中转）
 * - getUploadCredentials: 获取上传凭证（客户端直传）
 */
export const uploadRouter = router({
  /**
   * 获取存储配置（当前 provider 与大小限制）
   */
  getUploadConfig: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.fileStorage) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: '文件存储服务未初始化',
      });
    }

    return {
      provider: ctx.fileStorage.provider,
      maxFileSize: ctx.fileStorage.maxFileSize,
    };
  }),

  /**
   * 获取上传凭证（客户端直传）
   */
  getUploadCredentials: protectedProcedure
    .input(z.object({ type: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        if (!ctx.fileStorage) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: '文件存储服务未初始化',
          });
        }

        const dirPath = `images/${input.type}`;
        const credentials = await ctx.fileStorage.getUploadCredentials(dirPath);
        return credentials;
      } catch (error) {
        console.error('获取上传凭证失败:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : '获取上传凭证失败',
        });
      }
    }),
});

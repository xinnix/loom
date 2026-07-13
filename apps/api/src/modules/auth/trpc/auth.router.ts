import { TRPCError } from '@trpc/server';
import {
  router,
  publicProcedure,
  protectedProcedure,
  rateLimitedPublicProcedure,
} from '../../../trpc/trpc';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { z } from 'zod';

// 🔥 使用 @roundtable/shared 的 Zod schema
import { LoginSchema, RegisterSchema, RefreshTokenSchema } from '@roundtable/shared';

// Helper functions
function generateAccessToken(
  userId: string,
  email: string,
  type: 'admin' | 'user' = 'user',
): string {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { sub: userId, email, type },
    process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' },
  );
}

function generateRefreshToken(): string {
  return randomBytes(32).toString('hex');
}

async function calculateRefreshTokenExpiry() {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 30); // 30 days
  return expiry;
}

export const authRouter = router({
  // Register new user (小程序用户)
  register: rateLimitedPublicProcedure.input(RegisterSchema).mutation(async ({ ctx, input }) => {
    // Check if user exists
    const existingUser = await ctx.prisma.user.findFirst({
      where: {
        OR: [{ email: input.email }, { username: input.username }],
      },
    });

    if (existingUser) {
      if (existingUser.email === input.email) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: '该邮箱已被注册，请直接登录',
        });
      }
      throw new TRPCError({
        code: 'CONFLICT',
        message: '用户名已被占用，请更换',
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(input.password, 10);

    // Create user
    const user = await ctx.prisma.user.create({
      data: {
        username: input.username,
        email: input.email,
        passwordHash,
        nickname: input.firstName ? `${input.firstName} ${input.lastName || ''}`.trim() : undefined,
      },
    });

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email, 'user');
    const refreshToken = generateRefreshToken();
    const expiresAt = await calculateRefreshTokenExpiry();

    // Save refresh token
    await ctx.prisma.userRefreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    // Sanitize user
    const { passwordHash: _, ...sanitizedUser } = user;

    return {
      user: sanitizedUser,
      accessToken,
      refreshToken,
    };
  }),

  // Login for miniapp users (小程序用户登录)
  login: rateLimitedPublicProcedure.input(LoginSchema).mutation(async ({ ctx, input }) => {
    // Find user by username or email
    const user = await ctx.prisma.user.findFirst({
      where: {
        OR: [{ username: input.username }, { email: input.username }],
      },
    });

    // 用户不存在
    if (!user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: '用户名不存在',
      });
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValidPassword) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: '密码错误',
      });
    }

    // 检查账户是否被禁用
    if (!user.isActive) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: '账户已被禁用，请联系客服',
      });
    }

    // Update last login
    await ctx.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email, 'user');
    const refreshToken = generateRefreshToken();
    const expiresAt = await calculateRefreshTokenExpiry();

    // Save refresh token
    await ctx.prisma.userRefreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    // Sanitize user
    const { passwordHash: _, ...sanitizedUser } = user;

    return {
      user: sanitizedUser,
      accessToken,
      refreshToken,
    };
  }),

  // WeChat login (微信登录)
  wechatLogin: rateLimitedPublicProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Get WeChat config from environment
      const appId = process.env.WX_APP_ID;
      const appSecret = process.env.WX_APP_SECRET;

      if (!appId || !appSecret) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: '微信登录未配置',
        });
      }

      // Call WeChat API to get openid and session_key
      const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${input.code}&grant_type=authorization_code`;

      let wechatData: any;
      try {
        const response = await fetch(url);
        wechatData = await response.json();

        if (wechatData.errcode) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `微信登录失败: ${wechatData.errmsg}`,
          });
        }
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: '微信登录服务异常',
        });
      }

      const { openid, session_key: sessionKey, unionid } = wechatData;

      // Find or create user
      let user = await ctx.prisma.user.findUnique({
        where: { openid },
      });

      if (!user) {
        // Create new user
        user = await ctx.prisma.user.create({
          data: {
            openid,
            sessionKey,
            unionid,
            username: `wx_${openid.slice(0, 8)}`,
            email: `wx_${openid.slice(0, 8)}@placeholder.com`,
            passwordHash: '',
          },
        });
      } else {
        // Update sessionKey
        user = await ctx.prisma.user.update({
          where: { id: user.id },
          data: { sessionKey, lastLoginAt: new Date() },
        });
      }

      // Generate tokens
      const accessToken = generateAccessToken(user.id, user.email, 'user');
      const refreshToken = generateRefreshToken();
      const expiresAt = await calculateRefreshTokenExpiry();

      // Save refresh token
      await ctx.prisma.userRefreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt,
        },
      });

      // Sanitize user
      const { passwordHash: _, sessionKey: __, ...sanitizedUser } = user;

      return {
        user: sanitizedUser,
        accessToken,
        refreshToken,
      };
    }),

  // Login for admin users (管理端用户登录)
  adminLogin: rateLimitedPublicProcedure.input(LoginSchema).mutation(async ({ ctx, input }) => {
    // Find admin by username or email
    const admin = await ctx.prisma.admin.findFirst({
      where: {
        OR: [{ username: input.username }, { email: input.username }],
      },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // 用户不存在
    if (!admin) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: '用户名不存在',
      });
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(input.password, admin.passwordHash);
    if (!isValidPassword) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: '密码错误',
      });
    }

    // 检查账户是否被禁用
    if (!admin.isActive) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: '账户已被禁用，请联系管理员',
      });
    }

    // Update last login
    await ctx.prisma.admin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const accessToken = generateAccessToken(admin.id, admin.email, 'admin');
    const refreshToken = generateRefreshToken();
    const expiresAt = await calculateRefreshTokenExpiry();

    // Save refresh token
    await ctx.prisma.adminRefreshToken.create({
      data: {
        token: refreshToken,
        adminId: admin.id,
        expiresAt,
      },
    });

    // Sanitize admin and flatten permissions
    const { passwordHash: _, ...sanitizedAdmin } = admin;

    // Flatten permissions from roles into a simple array
    const permissions =
      sanitizedAdmin.roles?.flatMap((ar: any) =>
        ar.role.permissions?.map((rp: any) => `${rp.permission.resource}:${rp.permission.action}`),
      ) || [];

    // Format roles for frontend
    const roles =
      sanitizedAdmin.roles?.map((ar: any) => ({
        id: ar.role.id,
        name: ar.role.name,
        slug: ar.role.slug,
        level: ar.role.level,
        isSystem: ar.role.isSystem,
        assignedAt: ar.assignedAt,
      })) || [];

    return {
      user: {
        ...sanitizedAdmin,
        permissions,
        roles,
      },
      accessToken,
      refreshToken,
    };
  }),

  // Refresh token
  refreshToken: rateLimitedPublicProcedure
    .input(RefreshTokenSchema)
    .mutation(async ({ ctx, input }) => {
      // Try to find admin refresh token first
      let token = await ctx.prisma.adminRefreshToken.findUnique({
        where: { token: input.refreshToken },
        include: { admin: true },
      });
      let userType = 'admin';

      // If not found, try user refresh token
      if (!token) {
        token = (await ctx.prisma.userRefreshToken.findUnique({
          where: { token: input.refreshToken },
          include: { user: true },
        })) as any;
        userType = 'user';
      }

      if (!token) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: '无效的刷新令牌',
        });
      }

      // Check if revoked or expired
      if (token.revokedAt || token.expiresAt < new Date()) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: '刷新令牌已过期',
        });
      }

      // Check if user/admin is active
      const entity = userType === 'admin' ? (token as any).admin : (token as any).user;
      if (!entity.isActive) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: '账户已被禁用',
        });
      }

      // Generate new tokens
      const accessToken = generateAccessToken(entity.id, entity.email, userType as any);
      const newRefreshToken = generateRefreshToken();
      const expiresAt = await calculateRefreshTokenExpiry();

      // Revoke old token
      if (userType === 'admin') {
        await ctx.prisma.adminRefreshToken.update({
          where: { id: token.id },
          data: { revokedAt: new Date() },
        });

        // Save new refresh token
        await ctx.prisma.adminRefreshToken.create({
          data: {
            token: newRefreshToken,
            adminId: entity.id,
            expiresAt,
          },
        });
      } else {
        await ctx.prisma.userRefreshToken.update({
          where: { id: token.id },
          data: { revokedAt: new Date() },
        });

        // Save new refresh token
        await ctx.prisma.userRefreshToken.create({
          data: {
            token: newRefreshToken,
            userId: entity.id,
            expiresAt,
          },
        });
      }

      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
    }),

  // Get current user
  me: protectedProcedure.query(async ({ ctx }) => {
    // User is already verified in protectedProcedure middleware
    // Return the user from context
    return {
      id: ctx.user.id,
      email: ctx.user.email,
      username: ctx.user.username,
      permissions: ctx.user.permissions,
      roles: ctx.user.roles,
    };
  }),

  // Change password for current admin user
  changePassword: protectedProcedure
    .input(
      z.object({
        oldPassword: z.string().min(1, '请输入旧密码'),
        newPassword: z.string().min(8, '新密码至少8个字符'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // 1. Get current admin with password hash
      const admin = await ctx.prisma.admin.findUnique({
        where: { id: ctx.user.id },
        select: { passwordHash: true },
      });

      if (!admin) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '用户不存在',
        });
      }

      // 2. Verify old password
      const isValidPassword = await bcrypt.compare(input.oldPassword, admin.passwordHash);
      if (!isValidPassword) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '旧密码错误',
        });
      }

      // 3. Hash new password
      const newPasswordHash = await bcrypt.hash(input.newPassword, 10);

      // 4. Update password
      await ctx.prisma.admin.update({
        where: { id: ctx.user.id },
        data: { passwordHash: newPasswordHash },
      });

      return { success: true };
    }),

  // Update avatar for current admin user
  updateAdminProfile: protectedProcedure
    .input(
      z.object({
        avatar: z.string().url('头像链接格式错误'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Update Admin table avatar field
      const updatedAdmin = await ctx.prisma.admin.update({
        where: { id: ctx.user.id },
        data: { avatar: input.avatar },
        select: {
          id: true,
          username: true,
          email: true,
          avatar: true,
          updatedAt: true,
        },
      });

      return updatedAdmin;
    }),

  // Logout
  logout: protectedProcedure.input(RefreshTokenSchema).mutation(async ({ ctx, input }) => {
    // Revoke admin refresh token
    await ctx.prisma.adminRefreshToken.updateMany({
      where: {
        token: input.refreshToken,
      },
      data: { revokedAt: new Date() },
    });

    // Revoke user refresh token
    await ctx.prisma.userRefreshToken.updateMany({
      where: {
        token: input.refreshToken,
      },
      data: { revokedAt: new Date() },
    });

    return { success: true };
  }),
});

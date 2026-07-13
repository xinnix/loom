import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { z } from 'zod';
import { PrismaService } from '../../../prisma/prisma.service';
import { WechatService } from '../../wechat/wechat.service';

// 🔥 使用 @loom/shared 的类型和 schema
import { LoginSchema, RegisterSchema, RefreshTokenSchema, User } from '@loom/shared';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly wechatService: WechatService,
  ) {}

  /**
   * 🔐 注册小程序用户
   */
  async registerUser(input: z.infer<typeof RegisterSchema>) {
    // 1️⃣ 验证输入
    const data = RegisterSchema.parse(input);

    // 2️⃣ 检查用户是否已存在
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { username: data.username }],
      },
    });

    if (existingUser) {
      if (existingUser.email === data.email) {
        throw new ConflictException('该邮箱已被注册，请直接登录');
      }
      throw new ConflictException('用户名已被占用，请更换');
    }

    // 3️⃣ 哈希密码
    const passwordHash = await bcrypt.hash(data.password, 10);

    // 4️⃣ 创建用户
    const user = await this.prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        passwordHash,
        nickname: data.firstName ? `${data.firstName} ${data.lastName || ''}`.trim() : undefined,
      },
    });

    // 5️⃣ 生成令牌
    const { accessToken, refreshToken } = await this.generateUserTokens(user);

    // 6️⃣ 返回用户信息（不包含密码哈希）
    const { passwordHash: _, ...sanitizedUser } = user;

    return {
      user: sanitizedUser,
      accessToken,
      refreshToken,
    };
  }

  /**
   * 🔑 小程序用户登录
   */
  async loginUser(input: z.infer<typeof LoginSchema>) {
    // 1️⃣ 验证输入
    const data = LoginSchema.parse(input);

    // 2️⃣ 查找用户（支持用户名或邮箱）
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: data.username }, { email: data.username }],
      },
    });

    // 用户不存在
    if (!user) {
      throw new UnauthorizedException('用户名不存在');
    }

    // 3️⃣ 验证密码
    const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);

    // 密码错误
    if (!isPasswordValid) {
      throw new UnauthorizedException('密码错误');
    }

    // 4️⃣ 检查账户是否被禁用
    if (!user.isActive) {
      throw new UnauthorizedException('账户已被禁用，请联系客服');
    }

    // 5️⃣ 更新最后登录时间
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // 6️⃣ 生成令牌
    const { accessToken, refreshToken } = await this.generateUserTokens(user);

    // 7️⃣ 返回用户信息
    const { passwordHash: _, ...sanitizedUser } = user;

    return {
      user: sanitizedUser,
      accessToken,
      refreshToken,
    };
  }

  /**
   * 🟢 微信登录
   * 1. 通过 code 获取 openid
   * 2. 查找用户，不存在则创建
   * 3. 更新 sessionKey
   * 4. 生成并返回 token
   */
  async loginWithWechat(code: string) {
    // 1. 获取 openid 和 sessionKey
    const { openid, sessionKey, unionid } = await this.wechatService.code2Session(code);

    // 2. 查找或创建用户
    let user = await this.prisma.user.findUnique({
      where: { openid },
    });

    if (!user) {
      // 创建新用户
      user = await this.prisma.user.create({
        data: {
          openid,
          sessionKey,
          unionid,
          username: `wx_${openid}`, // 使用完整 openid 确保唯一
          // email 字段不设置（微信用户不需要）
          passwordHash: '', // 微信用户不需要密码
        },
      });
    } else {
      // 更新 sessionKey
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { sessionKey, lastLoginAt: new Date() },
      });
    }

    // 3. 生成令牌
    const { accessToken, refreshToken } = await this.generateUserTokens(user);

    // 4. 返回用户信息
    const { passwordHash: _, sessionKey: __, ...sanitizedUser } = user;

    return {
      user: sanitizedUser,
      accessToken,
      refreshToken,
    };
  }

  /**
   * 🔑 管理端用户登录
   */
  async loginAdmin(input: z.infer<typeof LoginSchema>) {
    // 1️⃣ 验证输入
    const data = LoginSchema.parse(input);

    // 2️⃣ 查找管理员（支持用户名或邮箱）
    const admin = await this.prisma.admin.findFirst({
      where: {
        OR: [{ username: data.username }, { email: data.username }],
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
      throw new UnauthorizedException('用户名不存在');
    }

    // 3️⃣ 验证密码
    const isPasswordValid = await bcrypt.compare(data.password, admin.passwordHash);

    // 密码错误
    if (!isPasswordValid) {
      throw new UnauthorizedException('密码错误');
    }

    // 4️⃣ 检查账户是否被禁用
    if (!admin.isActive) {
      throw new UnauthorizedException('账户已被禁用，请联系管理员');
    }

    // 5️⃣ 更新最后登录时间
    await this.prisma.admin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    // 6️⃣ 生成令牌
    const { accessToken, refreshToken } = await this.generateAdminTokens(admin);

    // 7️⃣ 返回用户信息
    const { passwordHash: _, ...sanitizedAdmin } = admin;

    // 8️⃣ 扁平化权限
    const permissions =
      sanitizedAdmin.roles?.flatMap((ar: any) =>
        ar.role.permissions?.map((rp: any) => `${rp.permission.resource}:${rp.permission.action}`),
      ) || [];

    return {
      user: {
        ...sanitizedAdmin,
        permissions,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * 🔄 刷新访问令牌
   */
  async refreshToken(input: z.infer<typeof RefreshTokenSchema>) {
    // 1️⃣ 验证输入
    const data = RefreshTokenSchema.parse(input);

    // 2️⃣ 查找刷新令牌（先在 Admin 表查找）
    let refreshToken = await this.prisma.adminRefreshToken.findUnique({
      where: { token: data.refreshToken },
      include: { admin: true },
    });

    let userType = 'admin';

    // 3️⃣ 如果 Admin 表没找到，在 User 表查找
    if (!refreshToken) {
      refreshToken = (await this.prisma.userRefreshToken.findUnique({
        where: { token: data.refreshToken },
        include: { user: true },
      })) as any;
      userType = 'user';
    }

    if (!refreshToken) {
      throw new UnauthorizedException('无效的刷新令牌');
    }

    // 4️⃣ 检查令牌是否已过期或被撤销
    if (refreshToken.revokedAt || refreshToken.expiresAt < new Date()) {
      throw new UnauthorizedException('刷新令牌已过期或已撤销');
    }

    // 5️⃣ 生成新令牌
    let accessToken: string;
    let newRefreshToken: string;

    if (userType === 'admin') {
      const tokens = await this.generateAdminTokens((refreshToken as any).admin);
      accessToken = tokens.accessToken;
      newRefreshToken = tokens.refreshToken;
    } else {
      const tokens = await this.generateUserTokens((refreshToken as any).user);
      accessToken = tokens.accessToken;
      newRefreshToken = tokens.refreshToken;
    }

    // 6️⃣ 撤销旧的刷新令牌
    if (userType === 'admin') {
      await this.prisma.adminRefreshToken.update({
        where: { id: refreshToken.id },
        data: { revokedAt: new Date() },
      });
    } else {
      await this.prisma.userRefreshToken.update({
        where: { id: refreshToken.id },
        data: { revokedAt: new Date() },
      });
    }

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * 👤 获取当前用户信息
   */
  async getCurrentUser(userId: string) {
    // 先在 Admin 表查找
    let user = await this.prisma.admin.findUnique({
      where: { id: userId },
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

    let userType = 'admin';

    // 如果 Admin 表没找到，在 User 表查找
    if (!user) {
      user = (await this.prisma.user.findUnique({
        where: { id: userId },
      })) as any;
      userType = 'user';
    }

    if (!user) {
      throw new UnauthorizedException('用户未找到');
    }

    const { passwordHash: _, ...sanitizedUser } = user;

    if (userType === 'admin') {
      const permissions =
        (sanitizedUser as any).roles?.flatMap((ar: any) =>
          ar.role.permissions?.map(
            (rp: any) => `${rp.permission.resource}:${rp.permission.action}`,
          ),
        ) || [];

      return {
        ...sanitizedUser,
        permissions,
      };
    }

    return sanitizedUser;
  }

  /**
   * 📝 更新用户信息
   */
  async updateUserProfile(
    userId: string,
    data: { nickname?: string; avatar?: string; phone?: string },
  ) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.nickname && { nickname: data.nickname }),
        ...(data.avatar && { avatar: data.avatar }),
        ...(data.phone && { phone: data.phone }),
      },
    });

    const { passwordHash: _, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  /**
   * 🚪 用户登出
   */
  async logout(userId: string, refreshToken: string) {
    // 撤销 Admin 刷新令牌
    const adminResult = await this.prisma.adminRefreshToken.updateMany({
      where: {
        token: refreshToken,
        adminId: userId,
      },
      data: { revokedAt: new Date() },
    });

    // 撤销 User 刷新令牌
    const userResult = await this.prisma.userRefreshToken.updateMany({
      where: {
        token: refreshToken,
        userId,
      },
      data: { revokedAt: new Date() },
    });

    return { success: true };
  }

  /**
   * 🔐 生成小程序用户令牌
   */
  private async generateUserTokens(user: any) {
    // 生成访问令牌
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      type: 'user',
    });

    // 生成刷新令牌
    const refreshToken = randomBytes(32).toString('hex');

    // 计算过期时间
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30天

    // 保存刷新令牌
    await this.prisma.userRefreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  /**
   * 🔐 生成管理端用户令牌
   */
  private async generateAdminTokens(admin: any) {
    // 生成访问令牌
    const accessToken = this.jwtService.sign({
      sub: admin.id,
      email: admin.email,
      type: 'admin',
    });

    // 生成刷新令牌
    const refreshToken = randomBytes(32).toString('hex');

    // 计算过期时间
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30天

    // 保存刷新令牌
    await this.prisma.adminRefreshToken.create({
      data: {
        token: refreshToken,
        adminId: admin.id,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }
}

import { z } from 'zod';
import {
  CreateWecomConfigSchema,
  UpdateWecomConfigSchema,
  SendMessageSchema,
  SendKfMessageSchema,
  SyncKfMessageSchema,
} from '@roundtable/shared';
import { createCrudRouterWithCustom, createReadOnlyRouter } from '../../../trpc/trpc.helper';
import { permissionProcedure, protectedProcedure } from '../../../trpc/trpc';
import { WecomApiService } from '../services/wecom-api.service';
import { RedisService } from '../../../shared/services/redis.service';

let _wecomService: WecomApiService;

function getWecomApiService(): WecomApiService {
  if (!_wecomService) {
    try {
      _wecomService = new WecomApiService(new RedisService(null as any));
    } catch {
      _wecomService = null as any;
    }
  }
  return _wecomService;
}

const maskSecret = (value: string): string => {
  if (!value || value.length <= 4) return '****';
  return `${value.slice(0, 4)}****`;
};

const maskConfig = (record: any): any => {
  if (!record) return record;
  return {
    ...record,
    secret: maskSecret(record.secret),
    encodingAESKey: maskSecret(record.encodingAESKey),
  };
};

const maskConfigs = (records: any[]): any[] => records.map(maskConfig);

// WecomConfig CRUD Router
const configRouter = createCrudRouterWithCustom(
  'WecomConfig',
  {
    create: CreateWecomConfigSchema,
    update: UpdateWecomConfigSchema,
  },
  () => ({
    getMany: protectedProcedure
      .input(
        z
          .object({
            page: z.number().int().positive().optional(),
            limit: z.number().int().positive().optional(),
            pageSize: z.number().int().positive().optional(),
            search: z.string().optional(),
            where: z.any().optional(),
            orderBy: z.any().optional(),
          })
          .optional(),
      )
      .query(async ({ ctx, input }) => {
        const page = input?.page ?? 1;
        const pageSize = input?.limit ?? input?.pageSize ?? 10;
        const skip = (page - 1) * pageSize;

        const where: any =
          input?.where && typeof input.where === 'object' ? { ...input.where } : {};

        if (input?.search) {
          where.OR = [
            { name: { contains: input.search, mode: 'insensitive' } },
            { corpId: { contains: input.search, mode: 'insensitive' } },
          ];
        }

        const [items, total] = await Promise.all([
          ctx.prisma.wecomConfig.findMany({
            where,
            skip,
            take: pageSize,
            orderBy: input?.orderBy || { createdAt: 'desc' },
          }),
          ctx.prisma.wecomConfig.count({ where }),
        ]);

        return {
          items: maskConfigs(items),
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        };
      }),

    getOne: permissionProcedure('wecom_config', 'read')
      .input(z.object({ id: z.string() }))
      .query(async ({ ctx, input }) => {
        const config = await ctx.prisma.wecomConfig.findUnique({
          where: { id: input.id },
        });
        return maskConfig(config);
      }),

    create: permissionProcedure('wecom_config', 'create')
      .input(
        z.object({
          data: CreateWecomConfigSchema,
          include: z.any().optional(),
          select: z.any().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        return ctx.prisma.wecomConfig.create({
          data: {
            ...input.data,
            createdById: ctx.user?.id,
            updatedById: ctx.user?.id,
          },
          include: input.include,
          select: input.select,
        });
      }),

    update: permissionProcedure('wecom_config', 'update')
      .input(
        z.object({
          id: z.string(),
          data: UpdateWecomConfigSchema,
          include: z.any().optional(),
          select: z.any().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        return ctx.prisma.wecomConfig.update({
          where: { id: input.id },
          data: {
            ...input.data,
            updatedById: ctx.user?.id,
          },
          include: input.include,
          select: input.select,
        });
      }),

    delete: permissionProcedure('wecom_config', 'delete')
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await ctx.prisma.wecomConfig.delete({ where: { id: input.id } });
        return { success: true };
      }),
  }),
  {
    includeGetMany: false,
    includeGetOne: false,
    includeCreate: false,
    includeUpdate: false,
    includeDelete: false,
    includeDeleteMany: false,
  },
);

// WecomMessage 只读 Router
const messageRouter = createReadOnlyRouter('WecomMessage');

// WecomEvent 只读 Router
const eventRouter = createReadOnlyRouter('WecomEvent');

// 主 Router
export const wecomRouter = {
  config: configRouter,
  message: messageRouter,
  event: eventRouter,

  // 发送应用消息
  sendMessage: protectedProcedure.input(SendMessageSchema).mutation(async ({ ctx, input }) => {
    const config = await ctx.prisma.wecomConfig.findUnique({
      where: { id: input.configId },
    });
    if (!config) throw new Error('WecomConfig 不存在');

    const accessToken = await getWecomApiService().getAccessToken(config.corpId, config.secret);

    const msgBody: Record<string, any> = {
      touser: input.toUser,
      toparty: input.toParty,
      totag: input.toTag,
      msgtype: input.msgType,
      agentid: config.agentId,
      [input.msgType]: input.content,
    };

    const result = await getWecomApiService().sendMessage(accessToken, msgBody);

    await ctx.prisma.wecomMessage.create({
      data: {
        configId: input.configId,
        direction: 'sent',
        msgType: input.msgType,
        toUser: input.toUser,
        content: JSON.stringify(input.content),
      },
    });

    return result;
  }),

  // 发送客服消息
  sendKfMessage: protectedProcedure.input(SendKfMessageSchema).mutation(async ({ ctx, input }) => {
    const config = await ctx.prisma.wecomConfig.findUnique({
      where: { id: input.configId },
    });
    if (!config) throw new Error('WecomConfig 不存在');

    const accessToken = await getWecomApiService().getAccessToken(config.corpId, config.secret);

    const msgBody: Record<string, any> = {
      kf_account: input.kfAccount,
      external_userid: input.toUser,
      msgtype: input.msgType,
      [input.msgType]: input.content,
    };

    const result = await getWecomApiService().sendKfMessage(accessToken, msgBody);

    await ctx.prisma.wecomMessage.create({
      data: {
        configId: input.configId,
        direction: 'sent',
        msgType: input.msgType,
        toUser: input.toUser,
        content: JSON.stringify(input.content),
      },
    });

    return result;
  }),

  // 获取客服账号列表
  getKfAccounts: protectedProcedure
    .input(
      z.object({
        configId: z.string().min(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      const config = await ctx.prisma.wecomConfig.findUnique({
        where: { id: input.configId },
      });
      if (!config) throw new Error('WecomConfig 不存在');

      const accessToken = await getWecomApiService().getAccessToken(config.corpId, config.secret);
      return getWecomApiService().getKfAccountList(accessToken);
    }),

  // 同步客服消息
  syncKfMessages: protectedProcedure.input(SyncKfMessageSchema).query(async ({ ctx, input }) => {
    const config = await ctx.prisma.wecomConfig.findUnique({
      where: { id: input.configId },
    });
    if (!config) throw new Error('WecomConfig 不存在');

    const accessToken = await getWecomApiService().getAccessToken(config.corpId, config.secret);
    return getWecomApiService().syncKfMessage(
      accessToken,
      input.kfAccount,
      input.cursor,
      input.limit,
    );
  }),
};

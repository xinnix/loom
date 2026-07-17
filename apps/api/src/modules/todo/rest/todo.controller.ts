import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { JwtAuthGuard } from '../../../core/guards/jwt.guard';
import { CurrentUser } from '../../../modules/auth/decorators/decorators';

/**
 * Todo REST Controller
 *
 * Web 端（Next.js）和小程序端（uni-app）通过 REST API 调用。
 * Admin 端走 tRPC，不经过此 Controller。
 *
 * 响应格式：
 *   {
 *     success: true,
 *     data: { ... } | [...],
 *     meta: { total, page, pageSize, totalPages }  // 仅列表接口
 *   }
 *
 * @see 对应的 tRPC Router：trpc/todo.router.ts
 */
@Controller('todos')
export class TodoController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取当前用户的 Todo 列表（分页 + 搜索 + 筛选）
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  async list(
    @CurrentUser() currentUser: any,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('isCompleted') isCompleted?: string,
  ) {
    const userId = currentUser.id;
    const p = Number(page) || 1;
    const ps = Number(pageSize) || 10;
    const where: any = { userId };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    if (status) where.status = status;
    if (isCompleted !== undefined) where.isCompleted = isCompleted === 'true';

    const [items, total] = await Promise.all([
      this.prisma.todo.findMany({
        where,
        skip: (p - 1) * ps,
        take: ps,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.todo.count({ where }),
    ]);

    return {
      success: true,
      data: items,
      meta: { total, page: p, pageSize: ps, totalPages: Math.ceil(total / ps) },
    };
  }

  /**
   * 获取单条 Todo 详情
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getOne(@CurrentUser() currentUser: any, @Param('id') id: string) {
    const todo = await this.prisma.todo.findFirst({
      where: { id, userId: currentUser.id },
    });

    if (!todo) {
      return { success: false, message: 'Todo 不存在' };
    }

    return { success: true, data: todo };
  }

  /**
   * 创建 Todo
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @CurrentUser() currentUser: any,
    @Body() body: { title: string; description?: string; priority?: number; dueDate?: string },
  ) {
    const todo = await this.prisma.todo.create({
      data: {
        title: body.title,
        description: body.description,
        priority: body.priority ?? 0,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        userId: currentUser.id,
      },
    });

    return { success: true, data: todo };
  }

  /**
   * 更新 Todo
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @CurrentUser() currentUser: any,
    @Param('id') id: string,
    @Body()
    body: {
      title?: string;
      description?: string;
      status?: string;
      priority?: number;
      dueDate?: string;
      isCompleted?: boolean;
    },
  ) {
    const existing = await this.prisma.todo.findFirst({
      where: { id, userId: currentUser.id },
    });

    if (!existing) {
      return { success: false, message: 'Todo 不存在' };
    }

    const data: any = { ...body };
    if (body.dueDate !== undefined) {
      data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    }

    // 如果标记完成，记录时间
    if (body.isCompleted === true && !existing.isCompleted) {
      data.completedAt = new Date();
      data.status = 'completed';
    }

    // 如果取消完成，清除时间
    if (body.isCompleted === false && existing.isCompleted) {
      data.completedAt = null;
      data.status = 'pending';
    }

    const todo = await this.prisma.todo.update({
      where: { id },
      data,
    });

    return { success: true, data: todo };
  }

  /**
   * 删除 Todo
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@CurrentUser() currentUser: any, @Param('id') id: string) {
    const existing = await this.prisma.todo.findFirst({
      where: { id, userId: currentUser.id },
    });

    if (!existing) {
      return { success: false, message: 'Todo 不存在' };
    }

    await this.prisma.todo.delete({ where: { id } });

    return { success: true, message: '删除成功' };
  }
}

import { Injectable } from '@nestjs/common';
import { BaseService } from '../../../common/base.service';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * Todo Service
 *
 * 继承 BaseService，自动获得标准 CRUD 方法：
 *   - list()    → 分页列表
 *   - getOne()  → 按 ID 查询
 *   - create()  → 创建
 *   - update()  → 更新
 *   - remove()  → 删除
 *   - removeMany() → 批量删除
 *   - count()   → 计数
 *
 * 自定义业务逻辑通过重写 Hook 方法实现：
 *   - beforeCreate()  → 创建前处理
 *   - afterCreate()   → 创建后处理
 *   - beforeUpdate()  → 更新前处理
 *   - etc.
 *
 * @see BaseService 基类：apps/api/src/common/base.service.ts
 */
@Injectable()
export class TodoService extends BaseService<'Todo'> {
  constructor(prisma: PrismaService) {
    super(prisma, 'Todo');
  }

  /**
   * 标记 Todo 为完成
   * 这是自定义业务方法的示例
   */
  async complete(id: string) {
    return this.model.update({
      where: { id },
      data: {
        isCompleted: true,
        status: 'completed',
        completedAt: new Date(),
      },
    });
  }

  /**
   * 标记 Todo 为未完成
   */
  async uncomplete(id: string) {
    return this.model.update({
      where: { id },
      data: {
        isCompleted: false,
        status: 'pending',
        completedAt: null,
      },
    });
  }
}

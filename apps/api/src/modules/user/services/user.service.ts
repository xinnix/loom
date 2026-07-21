import { Injectable } from '@nestjs/common';
import { BaseService } from '../../../common/base.service';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * User Service
 *
 * Manages User (miniapp users) - read-only for admin dashboard.
 * Users are created automatically via WeChat login.
 */
@Injectable()
export class UserService extends BaseService<'User'> {
  constructor(prisma: PrismaService) {
    super(prisma, 'User');
  }
}

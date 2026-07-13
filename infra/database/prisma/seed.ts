import * as bcrypt from 'bcryptjs';
import { PrismaClient } from '@loom/database';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting seed...');

  // ============================================
  // 1. Permissions
  // ============================================
  console.log('Creating permissions...');

  const permissions = await Promise.all([
    // Admin CRUD
    ...['create', 'read', 'update', 'delete'].map((action) =>
      prisma.permission.upsert({
        where: { resource_action: { resource: 'admin', action } },
        update: {},
        create: {
          resource: 'admin',
          action,
          description: {
            create: '创建管理员',
            read: '查看管理员',
            update: '更新管理员',
            delete: '删除管理员',
          }[action],
        },
      }),
    ),

    // User CRUD
    ...['create', 'read', 'update', 'delete'].map((action) =>
      prisma.permission.upsert({
        where: { resource_action: { resource: 'user', action } },
        update: {},
        create: {
          resource: 'user',
          action,
          description: {
            create: '创建用户',
            read: '查看用户',
            update: '更新用户',
            delete: '删除用户',
          }[action],
        },
      }),
    ),

    // Role CRUD
    ...['create', 'read', 'update', 'delete'].map((action) =>
      prisma.permission.upsert({
        where: { resource_action: { resource: 'role', action } },
        update: {},
        create: {
          resource: 'role',
          action,
          description: {
            create: '创建角色',
            read: '查看角色',
            update: '更新角色',
            delete: '删除角色',
          }[action],
        },
      }),
    ),

    // Agent CRUD
    ...['create', 'read', 'update', 'delete'].map((action) =>
      prisma.permission.upsert({
        where: { resource_action: { resource: 'agent', action } },
        update: {},
        create: {
          resource: 'agent',
          action,
          description: {
            create: '创建 Agent',
            read: '查看 Agent',
            update: '更新 Agent',
            delete: '删除 Agent',
          }[action],
        },
      }),
    ),

    // WeCom permissions
    ...['create', 'read', 'update', 'delete'].map((action) =>
      prisma.permission.upsert({
        where: { resource_action: { resource: 'wecom', action } },
        update: {},
        create: {
          resource: 'wecom',
          action,
          description: {
            create: '创建企微配置',
            read: '查看企微配置',
            update: '更新企微配置',
            delete: '删除企微配置',
          }[action],
        },
      }),
    ),

    // Menu visibility permissions (match menuConfig in AdminLayout)
    prisma.permission.upsert({
      where: { resource_action: { resource: 'menu', action: 'agents' } },
      update: {},
      create: { resource: 'menu', action: 'agents', description: 'Agent 管理菜单' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'menu', action: 'admins' } },
      update: {},
      create: { resource: 'menu', action: 'admins', description: '管理员管理菜单' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'menu', action: 'roles' } },
      update: {},
      create: { resource: 'menu', action: 'roles', description: '角色管理菜单' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'menu', action: 'wecom' } },
      update: {},
      create: { resource: 'menu', action: 'wecom', description: '企业微信菜单' },
    }),
  ]);

  console.log(`✅ Created ${permissions.length} permissions`);

  // ============================================
  // 2. Roles
  // ============================================
  console.log('Creating roles...');

  const superAdminRole = await prisma.role.upsert({
    where: { slug: 'super_admin' },
    update: {},
    create: {
      name: '超级管理员',
      slug: 'super_admin',
      description: '系统超级管理员，拥有所有权限',
      level: 0,
      isSystem: true,
    },
  });

  const adminRole = await prisma.role.upsert({
    where: { slug: 'admin' },
    update: {},
    create: {
      name: '管理员',
      slug: 'admin',
      description: '系统管理员',
      level: 100,
      isSystem: true,
    },
  });

  const viewerRole = await prisma.role.upsert({
    where: { slug: 'viewer' },
    update: {},
    create: {
      name: '访客',
      slug: 'viewer',
      description: '只读权限管理员',
      level: 200,
      isSystem: true,
    },
  });

  console.log('✅ Created 3 roles');

  // ============================================
  // 3. Assign Permissions to Roles
  // ============================================
  console.log('Assigning permissions to roles...');

  // Super admin gets all permissions
  for (const permission of permissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: superAdminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: superAdminRole.id,
        permissionId: permission.id,
      },
    });
  }

  // Admin gets all except delete
  const adminPermissions = permissions.filter((p) => !p.action.includes('delete'));
  for (const permission of adminPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
  }

  // Viewer gets only read + menu permissions
  const viewerPermissions = permissions.filter((p) => p.action === 'read' || p.resource === 'menu');
  for (const permission of viewerPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: viewerRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: viewerRole.id,
        permissionId: permission.id,
      },
    });
  }

  console.log('✅ Assigned permissions to roles');

  // ============================================
  // 4. Demo Admin Users
  // ============================================
  console.log('Creating demo admin users...');

  const passwordHash = await bcrypt.hash('password123', 10);

  await prisma.admin.upsert({
    where: { email: 'superadmin@example.com' },
    update: {},
    create: {
      username: 'superadmin',
      email: 'superadmin@example.com',
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      roles: {
        create: { roleId: superAdminRole.id },
      },
    },
  });

  await prisma.admin.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@example.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      roles: {
        create: { roleId: adminRole.id },
      },
    },
  });

  await prisma.admin.upsert({
    where: { email: 'viewer@example.com' },
    update: {},
    create: {
      username: 'viewer',
      email: 'viewer@example.com',
      passwordHash,
      firstName: 'Viewer',
      lastName: 'Admin',
      roles: {
        create: { roleId: viewerRole.id },
      },
    },
  });

  console.log('✅ Created 3 demo admin users');

  // ============================================
  // 5. Demo Miniapp Users
  // ============================================
  console.log('Creating demo miniapp users...');

  await prisma.user.upsert({
    where: { username: 'user' },
    update: {},
    create: {
      username: 'user',
      email: 'user@example.com',
      passwordHash,
      nickname: '测试用户',
      phone: '13800138000',
    },
  });

  await prisma.user.upsert({
    where: { username: 'user2' },
    update: {},
    create: {
      username: 'user2',
      email: 'user2@example.com',
      passwordHash,
      nickname: '测试用户2',
    },
  });

  console.log('✅ Created 2 demo miniapp users');

  console.log('');
  console.log('🎉 Seed completed!');
  console.log('');
  console.log('管理端测试账号 (password: password123):');
  console.log('  - superadmin@example.com (超级管理员)');
  console.log('  - admin@example.com (管理员)');
  console.log('  - viewer@example.com (访客)');
  console.log('');
  console.log('小程序测试账号 (password: password123):');
  console.log('  - user@example.com');
  console.log('  - user2@example.com');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

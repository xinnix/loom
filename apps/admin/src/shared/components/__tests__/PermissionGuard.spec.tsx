import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithAntd } from '../../../test/render';
import { PermissionGuard } from '../PermissionGuard';
import type { PermissionKey } from '@loom/shared';

const { mockUseAuth } = vi.hoisted(() => ({ mockUseAuth: vi.fn() }));

vi.mock('../../auth/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

const PERMISSION = 'todo:create' as PermissionKey;

describe('PermissionGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('super_admin 直通渲染 children（无需具体权限）', () => {
    mockUseAuth.mockReturnValue({
      user: { permissions: [], roles: [{ role: { slug: 'super_admin' } }] },
    });
    const screen = renderWithAntd(
      <PermissionGuard permission={PERMISSION}>
        <button>受保护按钮</button>
      </PermissionGuard>,
    );
    expect(screen.getByText('受保护按钮')).toBeTruthy();
  });

  it('普通用户拥有权限时渲染 children', () => {
    mockUseAuth.mockReturnValue({
      user: { permissions: ['todo:create'], roles: [{ role: { slug: 'admin' } }] },
    });
    const screen = renderWithAntd(
      <PermissionGuard permission={PERMISSION}>
        <button>受保护按钮</button>
      </PermissionGuard>,
    );
    expect(screen.getByText('受保护按钮')).toBeTruthy();
  });

  it('普通用户无权限时渲染 fallback', () => {
    mockUseAuth.mockReturnValue({
      user: { permissions: [], roles: [{ role: { slug: 'admin' } }] },
    });
    const screen = renderWithAntd(
      <PermissionGuard permission={PERMISSION} fallback={<span>无权限</span>}>
        <button>受保护按钮</button>
      </PermissionGuard>,
    );
    expect(screen.queryByText('受保护按钮')).toBeNull();
    expect(screen.getByText('无权限')).toBeTruthy();
  });
});

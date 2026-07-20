import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders } from '../../../../test/render';
import { StandardListPage } from '../index';
import type { StandardListPageProps } from '../types';

vi.mock('../../../utils/mutationCallbacks', () => ({
  createMutationCallbacks: () => ({ onSuccess: vi.fn(), onError: vi.fn() }),
  createBatchMutationCallbacks: () => ({ onSuccess: vi.fn(), onError: vi.fn() }),
}));

vi.mock('../../PermissionGuard', () => ({
  PermissionGuard: ({ children }: any) => <>{children}</>,
}));

const mockRefetch = vi.fn();
const mockSetFilters = vi.fn();
const mockSetCurrent = vi.fn();
const mockSetPageSize = vi.fn();

// Mock Refine hooks to match what StandardListPage actually uses
vi.mock('@refinedev/core', async () => {
  const actual = await vi.importActual('@refinedev/core');
  return {
    ...actual,
    useTable: () => ({
      tableQuery: { data: { data: [], total: 0 }, isLoading: false, refetch: mockRefetch },
      currentPage: 1,
      setCurrentPage: mockSetCurrent,
      pageSize: 10,
      setPageSize: mockSetPageSize,
      setFilters: mockSetFilters,
    }),
    useCreate: () => ({ mutate: vi.fn() }),
    useUpdate: () => ({ mutate: vi.fn() }),
    useDelete: () => ({ mutate: vi.fn() }),
    useDeleteMany: () => ({ mutate: vi.fn() }),
  };
});

// Mock antd List component from refine
vi.mock('@refinedev/antd', async () => {
  const actual = await vi.importActual('@refinedev/antd');
  return {
    ...actual,
    List: ({ children }: any) => <div data-testid="refine-list">{children}</div>,
  };
});

describe('StandardListPage', () => {
  const baseProps: StandardListPageProps = {
    resource: 'todo',
    title: 'Todo 管理',
    columns: [
      { title: '标题', dataIndex: 'title', key: 'title' },
      { title: '状态', dataIndex: 'status', key: 'status' },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders title', () => {
    const screen = renderWithProviders(<StandardListPage {...baseProps} />);
    expect(screen.getByText('Todo 管理')).toBeTruthy();
  });

  it('renders table column headers', () => {
    const screen = renderWithProviders(<StandardListPage {...baseProps} />);
    // Column title may appear multiple times (visible header + hidden measurement)
    const headers = screen.getAllByText('标题');
    expect(headers.length).toBeGreaterThanOrEqual(1);
    const statusHeaders = screen.getAllByText('状态');
    expect(statusHeaders.length).toBeGreaterThanOrEqual(1);
  });

  it('shows create button by default', () => {
    const screen = renderWithProviders(<StandardListPage {...baseProps} />);
    // The "新建" button should be present
    expect(screen.getByRole('button', { name: /新建/i })).toBeTruthy();
  });

  it('hides create button when hideCreateButton is true', () => {
    const screen = renderWithProviders(<StandardListPage {...baseProps} hideCreateButton />);
    expect(screen.queryByRole('button', { name: /新建/i })).toBeNull();
  });

  it('renders with search bar when searchFields provided', () => {
    const screen = renderWithProviders(
      <StandardListPage
        {...baseProps}
        searchFields={[{ field: 'search', placeholder: '搜索标题' }]}
      />,
    );
    // SearchBar renders as an Input
    const searchInput = screen.getByPlaceholderText('搜索标题');
    expect(searchInput).toBeTruthy();
  });
});

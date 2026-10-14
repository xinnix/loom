import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Form, Input } from 'antd';
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

// 深链兜底直查用的 tRPC mock（hoisted 以便 vi.mock 工厂引用）
const { mockDirectQuery } = vi.hoisted(() => ({ mockDirectQuery: vi.fn() }));
vi.mock('../../../trpc/trpcClient', () => ({
  getTrpcClient: () => ({
    todo: { getMany: { query: mockDirectQuery }, getOne: { query: vi.fn() } },
  }),
}));

// useTable 数据可注入（autoOpenEditParam 用例需要非空/命中/未命中三种形态）
let mockTableData: any[] = [];

// Mock Refine hooks to match what StandardListPage actually uses
vi.mock('@refinedev/core', async () => {
  const actual = await vi.importActual('@refinedev/core');
  return {
    ...actual,
    useTable: () => ({
      tableQuery: {
        data: { data: mockTableData, total: mockTableData.length },
        isLoading: false,
        refetch: mockRefetch,
      },
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

const baseProps: StandardListPageProps = {
  resource: 'todo',
  title: 'Todo 管理',
  columns: [
    { title: '标题', dataIndex: 'title', key: 'title' },
    { title: '状态', dataIndex: 'status', key: 'status' },
  ],
};

describe('StandardListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTableData = [];
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

describe('StandardListPage autoOpenEditParam（深链直达编辑）', () => {
  const StubForm = () => (
    <Form layout="vertical">
      <Form.Item name="title" label="标题">
        <Input />
      </Form.Item>
    </Form>
  );

  const deepLinkProps: StandardListPageProps = {
    ...baseProps,
    formComponent: StubForm,
    autoOpenEditParam: 'configKey',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockTableData = [];
  });

  it('URL 参数命中当前页行时自动打开编辑 Modal', () => {
    mockTableData = [
      { id: '1', title: 'A', configKey: 'deepseek' },
      { id: '2', title: 'B', configKey: 'qwen' },
    ];
    const screen = renderWithProviders(<StandardListPage {...deepLinkProps} />, {
      route: '/?configKey=deepseek',
    });
    expect(screen.getByText('编辑Todo 管理')).toBeTruthy();
    expect(mockDirectQuery).not.toHaveBeenCalled();
  });

  it('当前页未命中时按字段直查兜底并打开 Modal', async () => {
    mockTableData = [{ id: '1', title: 'A', configKey: 'other' }];
    mockDirectQuery.mockResolvedValue({ items: [{ id: '2', title: 'B', configKey: 'deepseek' }] });
    const screen = renderWithProviders(<StandardListPage {...deepLinkProps} />, {
      route: '/?configKey=deepseek',
    });
    expect(mockDirectQuery).toHaveBeenCalledWith({
      where: { configKey: 'deepseek' },
      pageSize: 1,
    });
    expect(await screen.findByText('编辑Todo 管理')).toBeTruthy();
  });

  it('直查也无命中时不打开 Modal', async () => {
    mockTableData = [{ id: '1', title: 'A', configKey: 'other' }];
    mockDirectQuery.mockResolvedValue({ items: [] });
    const screen = renderWithProviders(<StandardListPage {...deepLinkProps} />, {
      route: '/?configKey=deepseek',
    });
    await vi.waitFor(() => expect(mockDirectQuery).toHaveBeenCalled());
    expect(screen.queryByText('编辑Todo 管理')).toBeNull();
  });

  it('无 URL 参数时不触发深链逻辑', () => {
    mockTableData = [{ id: '1', title: 'A', configKey: 'deepseek' }];
    const screen = renderWithProviders(<StandardListPage {...deepLinkProps} />);
    expect(screen.queryByText('编辑Todo 管理')).toBeNull();
    expect(mockDirectQuery).not.toHaveBeenCalled();
  });
});

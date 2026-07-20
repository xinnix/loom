import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders } from '../../../../test/render';
import { StandardDetailPage } from '../index';
import type { DetailFieldConfig } from '../types';

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'test-id-1' }),
  };
});

const mockEntity = {
  id: 'test-id-1',
  title: 'Test Todo',
  status: 'active',
  isCompleted: false,
  priority: 1,
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T12:00:00Z',
  dueDate: null,
  completedAt: null,
};

// Mock @refinedev/core with successful response
vi.mock('@refinedev/core', async () => {
  const actual = await vi.importActual('@refinedev/core');
  return {
    ...actual,
    useOne: () => ({
      result: mockEntity,
      query: { isLoading: false, isError: false },
    }),
  };
});

describe('StandardDetailPage', () => {
  it('renders title from entity titleField', () => {
    const screen = renderWithProviders(
      <StandardDetailPage resource="todo" titleField="title" maxWidth={800} />,
    );
    expect(screen.getByText('Test Todo')).toBeTruthy();
  });

  it('renders tag field with tagLabels', () => {
    const fields: DetailFieldConfig[] = [
      {
        key: 'status',
        label: '状态',
        type: 'tag',
        tagColors: { active: 'green' },
        tagLabels: { active: '启用' },
      },
    ];
    const screen = renderWithProviders(
      <StandardDetailPage resource="todo" fields={fields} titleField="title" maxWidth={800} />,
    );
    expect(screen.getByText('启用')).toBeTruthy();
  });

  it('renders boolean field', () => {
    const fields: DetailFieldConfig[] = [
      {
        key: 'isCompleted',
        label: '完成状态',
        type: 'boolean',
        booleanLabels: ['否', '是'],
        booleanColors: ['default', 'success'],
      },
    ];
    const screen = renderWithProviders(
      <StandardDetailPage resource="todo" fields={fields} maxWidth={800} />,
    );
    expect(screen.getByText('否')).toBeTruthy();
  });

  it('renders datetime field label', () => {
    const fields: DetailFieldConfig[] = [{ key: 'createdAt', label: '创建时间', type: 'datetime' }];
    const screen = renderWithProviders(
      <StandardDetailPage resource="todo" fields={fields} maxWidth={800} />,
    );
    expect(screen.getByText('创建时间')).toBeTruthy();
  });

  it('renders custom render callback', () => {
    const fields: DetailFieldConfig[] = [
      {
        key: 'priority',
        label: '优先级',
        type: 'custom',
        render: (_val: any, entity: any) => (
          <span data-testid="custom-priority">优先级: {entity.priority}</span>
        ),
      },
    ];
    const screen = renderWithProviders(
      <StandardDetailPage resource="todo" fields={fields} titleField="title" maxWidth={800} />,
    );
    expect(screen.getByTestId('custom-priority')).toBeTruthy();
    expect(screen.getByText('优先级: 1')).toBeTruthy();
  });

  it('renders back button with custom label', () => {
    const screen = renderWithProviders(
      <StandardDetailPage resource="todo" backPath="/todos" backLabel="返回列表" maxWidth={800} />,
    );
    expect(screen.getByText('返回列表')).toBeTruthy();
  });

  it('hides back button when hideBackButton=true', () => {
    const screen = renderWithProviders(
      <StandardDetailPage resource="todo" hideBackButton maxWidth={800} />,
    );
    expect(screen.queryByText('返回')).toBeNull();
  });

  it('renders custom title from title prop', () => {
    const screen = renderWithProviders(
      <StandardDetailPage resource="todo" title="自定义标题" maxWidth={800} />,
    );
    expect(screen.getByText('自定义标题')).toBeTruthy();
  });
});

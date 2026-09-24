# Frontend Templates

Complete templates for Refine + Ant Design frontend pages.

## List Page Template

**Location:** `apps/admin/src/modules/[module]/pages/[Module]ListPage.tsx`

```typescript
import { List, Table, useList, DeleteButton } from "@refinedev/core";
import { Space, Button, Tag, Image } from "antd";
import type { [Module] } from "@/types";

export const [Module]ListPage = () => {
  const { tableProps, refetch } = useList<[module]>({
    resource: "[module]",
    pagination: { current: 1, pageSize: 10 },
    sorters: { initial: [{ field: "createdAt", order: "desc" }] },
  });

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 100,
      render: (id: string) => id.slice(0, 8) + "...",
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: true,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const colors: Record<string, string> = {
          active: "green",
          inactive: "red",
          pending: "orange",
        };
        return <Tag color={colors[status]}>{status}</Tag>;
      },
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            href="#/[module_plural]s/${record.id}"
          >
            Edit
          </Button>
          <DeleteButton
            size="small"
            recordItemId={record.id}
            onSuccess={() => refetch()}
          >
            Delete
          </DeleteButton>
        </Space>
      ),
    },
  ];

  return (
    <List>
      <Table
        {...tableProps}
        columns={columns}
        rowKey="id"
        scroll={{ x: 800 }}
      />
    </List>
  );
};
```

## Create Page Template

**Location:** `apps/admin/src/modules/[module]/pages/[Module]CreatePage.tsx`

```typescript
import { Create, useForm } from "@refinedev/core";
import { Form, Input, Select, DatePicker, message } from "antd";
import { useNavigate } from "react-router-dom";

export const [Module]CreatePage = () => {
  const navigate = useNavigate();
  const { formProps, saveButtonProps } = useForm<[module]>({
    resource: "[module]",
    action: "create",
    onMutationSuccess: () => {
      message.success("Created successfully");
      navigate("/[module_plural]s");
    },
  });

  return (
    <Create
      title="Create [Module]"
      saveButtonProps={saveButtonProps}
      goBack={<Button onClick={() => navigate(-1)}>Back</Button>}
    >
      <Form {...formProps} layout="vertical">
        <Form.Item
          name="name"
          label="Name"
          rules={[{ required: true, message: "Name is required" }]}
        >
          <Input placeholder="Enter name" />
        </Form.Item>

        <Form.Item name="description" label="Description">
          <Input.TextArea rows={4} placeholder="Enter description" />
        </Form.Item>

        <Form.Item
          name="status"
          label="Status"
          rules={[{ required: true }]}
          initialValue="active"
        >
          <Select
            options={[
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
            ]}
          />
        </Form.Item>

        <Form.Item name="dueDate" label="Due Date">
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>
      </Form>
    </Create>
  );
};
```

## Edit Page Template

**Location:** `apps/admin/src/modules/[module]/pages/[Module]EditPage.tsx`

```typescript
import { Edit, useForm } from "@refinedev/core";
import { Form, Input, Select, message } from "antd";
import { useParams, useNavigate } from "react-router-dom";

export const [Module]EditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { formProps, saveButtonProps, queryResult } = useForm<[module]>({
    resource: "[module]",
    action: "edit",
    id: id,
    onMutationSuccess: () => {
      message.success("Updated successfully");
      navigate("/[module_plural]s");
    },
  });

  return (
    <Edit
      title={`Edit [Module] #${id?.slice(0, 8)}`}
      saveButtonProps={saveButtonProps}
      goBack={<Button onClick={() => navigate(-1)}>Back</Button>}
    >
      <Form {...formProps} layout="vertical">
        <Form.Item
          name="name"
          label="Name"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>

        <Form.Item name="description" label="Description">
          <Input.TextArea rows={4} />
        </Form.Item>

        <Form.Item
          name="status"
          label="Status"
          rules={[{ required: true }]}
        >
          <Select
            options={[
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
            ]}
          />
        </Form.Item>
      </Form>
    </Edit>
  );
};
```

## Show/Detail Page Template

**Location:** `apps/admin/src/modules/[module]/pages/[Module]ShowPage.tsx`

```typescript
import { Show, useForm, useShow } from "@refinedev/core";
import { ShowButton, EditButton, DeleteButton } from "@refinedev/antd";
import {
  Typography,
  Descriptions,
  Space,
  Tag,
  Image,
} from "antd";
import { useParams, useNavigate } from "react-router-dom";

const { Title, Paragraph } = Typography;

export const [Module]ShowPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { queryResult } = useShow<[module]>({
    resource: "[module]",
    id: id,
  });
  const { data, isLoading } = queryResult;
  const record = data?.data;

  if (isLoading) return <div>Loading...</div>;

  return (
    <Show
      title={`[Module] #${id?.slice(0, 8)}`}
      goBack={<Button onClick={() => navigate(-1)}>Back</Button>}
      headerButtons={
        <Space>
          <EditButton recordItemId={id} />
          <DeleteButton recordItemId={id} />
        </Space>
      }
    >
      <Descriptions bordered column={2}>
        <Descriptions.Item label="ID" span={2}>
          {record?.id}
        </Descriptions.Item>

        <Descriptions.Item label="Name">
          {record?.name}
        </Descriptions.Item>

        <Descriptions.Item label="Status">
          <Tag color={record?.status === "active" ? "green" : "red"}>
            {record?.status}
          </Tag>
        </Descriptions.Item>

        <Descriptions.Item label="Description" span={2}>
          <Paragraph>{record?.description || "-"}</Paragraph>
        </Descriptions.Item>

        <Descriptions.Item label="Created At">
          {new Date(record?.createdAt).toLocaleString()}
        </Descriptions.Item>

        <Descriptions.Item label="Updated At">
          {new Date(record?.updatedAt).toLocaleString()}
        </Descriptions.Item>
      </Descriptions>

      {record?.cover && (
        <div style={{ marginTop: 24 }}>
          <Title level={5}>Cover Image</Title>
          <Image src={record.cover} width={200} />
        </div>
      )}
    </Show>
  );
};
```

## Index Barrel Export

**Location:** `apps/admin/src/modules/[module]/pages/index.ts`

```typescript
export { [Module]ListPage } from './[Module]ListPage';
export { [Module]CreatePage } from './[Module]CreatePage';
export { [Module]EditPage } from './[Module]EditPage';
export { [Module]ShowPage } from './[Module]ShowPage';
```

## Routing Configuration

**Update App.tsx:**

```typescript
import {
  [Module]ListPage,
  [Module]CreatePage,
  [Module]EditPage,
  [Module]ShowPage,
} from "./modules/[module]";

// In resources array
resources={[
  {
    name: "[module]",
    list: "/[module_plural]s",
    create: "/[module_plural]s/create",
    edit: "/[module_plural]s/edit/:id",
    show: "/[module_plural]s/show/:id",
    meta: { label: "[Module]s" },
  },
]}

// In routes
<Route path="[module_plural]s" element={<[Module]ListPage />} />
<Route path="[module_plural]s/create" element={<[Module]CreatePage />} />
<Route path="[module_plural]s/edit/:id" element={<[Module]EditPage />} />
<Route path="[module_plural]s/show/:id" element={<[Module]ShowPage />} />
```

## Field Type Components

### Boolean Field

```typescript
{
  title: "Active",
  dataIndex: "isActive",
  render: (value) => (
    <Tag color={value ? "green" : "red"}>
      {value ? "Yes" : "No"}
    </Tag>
  ),
}
```

### Date Field

```typescript
{
  title: "Due Date",
  dataIndex: "dueDate",
  render: (value) => value ? new Date(value).toLocaleDateString() : "-",
}
```

### Relation Field

```typescript
{
  title: "Category",
  dataIndex: ["category", "name"],
  render: (value) => value || "-",
}
```

### Array Field

```typescript
{
  title: "Tags",
  dataIndex: "tags",
  render: (tags: string[]) => (
    <Space wrap>
      {tags?.map((tag) => <Tag key={tag}>{tag}</Tag>)}
    </Space>
  ),
}
```

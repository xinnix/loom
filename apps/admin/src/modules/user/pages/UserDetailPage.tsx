import { useState } from 'react';
import { StandardDetailPage } from '../../../shared/components/StandardDetailPage';
import { userDetailFields } from '../components/UserDetail';

/**
 * User 详情页
 *
 * 使用 StandardDetailPage 配置驱动模式。
 * 用户通过微信登录自动创建，Admin 端只读查看。
 */
export function UserDetailPage() {
  return (
    <StandardDetailPage
      resource="user"
      title="用户详情"
      headerType="simple"
      backPath="/users"
      backLabel="返回列表"
      titleField="username"
      statusField="isActive"
      statusConfig={{
        true: { color: 'green', text: '激活' },
        false: { color: 'red', text: '停用' },
      }}
      fields={userDetailFields}
      column={2}
      maxWidth={800}
    />
  );
}

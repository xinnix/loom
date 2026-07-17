import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Refine } from '@refinedev/core';
import { ConfigProvider, App as AntApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { useState } from 'react';
import { dataProvider } from './shared/dataProvider';
import { authProvider, AuthProvider } from './shared/auth';
import { LoginPage, SessionExpiredPage, NotFoundPage } from './modules/auth';
import { AdminLayout } from './shared/layouts';
import { AdminListPage, AdminDetailPage } from './modules/admin';
import { UserListPage, UserDetailPage } from './modules/user';
import { RoleListPage, RoleDetailPage } from './modules/role';
import { AgentListPage, AgentChatPage } from './modules/agents';
import { WecomConfigListPage, WecomMessageListPage, WecomEventListPage } from './modules/wecom';
import { TodoListPage, TodoDetailPage } from './modules/todo';
import { useMessageInitializer } from './shared/hooks/useMessageInitializer';
// Create QueryClient outside component to prevent re-creation
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  const [isReady] = useState(true);

  if (!isReady) {
    return null;
  }

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider locale={zhCN}>
          <AntApp>
            <AppContent />
          </AntApp>
        </ConfigProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

function AppContent() {
  const { message: messageApi } = AntApp.useApp();

  useMessageInitializer();

  return (
    <AuthProvider>
      <Refine
        dataProvider={dataProvider}
        authProvider={authProvider}
        options={{
          reactQuery: {
            clientConfig: queryClient,
          },
          notification: {
            success: (msg: unknown) => {
              if (typeof msg === 'string') {
                messageApi.success(msg);
              }
            },
            error: (msg: unknown) => {
              const errorMsg = typeof msg === 'string' ? msg : '操作失败';
              messageApi.error(errorMsg);
            },
          },
        }}
        resources={[
          { name: 'user', list: '/users' },
          { name: 'admin', list: '/admins' },
          { name: 'role', list: '/roles' },
          { name: 'agents', list: '/agents' },
          { name: 'wecom.config', list: '/wecom' },
          { name: 'wecom.message', list: '/wecom/messages' },
          { name: 'wecom.event', list: '/wecom/events' },
          { name: 'todo', list: '/todos' },
        ]}
      >
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<SessionExpiredPage />} />
          <Route path="/" element={<AdminLayout />}>
            <Route index element={<Navigate to="/users" replace />} />
            <Route path="users" element={<UserListPage />} />
            <Route path="users/:id" element={<UserDetailPage />} />
            <Route path="roles" element={<RoleListPage />} />
            <Route path="roles/:id" element={<RoleDetailPage />} />
            <Route path="admins" element={<AdminListPage />} />
            <Route path="admins/:id" element={<AdminDetailPage />} />
            <Route path="agents" element={<AgentListPage />} />
            <Route path="agents/chat/:id" element={<AgentChatPage />} />
            <Route path="wecom" element={<WecomConfigListPage />} />
            <Route path="wecom/messages" element={<WecomMessageListPage />} />
            <Route path="wecom/events" element={<WecomEventListPage />} />
            <Route path="todos" element={<TodoListPage />} />
            <Route path="todos/:id" element={<TodoDetailPage />} />
          </Route>
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Refine>
    </AuthProvider>
  );
}

export default App;

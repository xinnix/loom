import { Layout, Menu, Dropdown, Avatar, Button } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  EditOutlined,
  LockOutlined,
  RobotOutlined,
  WechatOutlined,
  MessageOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useState, useMemo } from 'react';
import { useAuth } from '../auth';
import { ProfileModal } from '../components/ProfileModal';
import { ChangePasswordModal } from '../components/ChangePasswordModal';

const { Header, Sider, Content } = Layout;

const iconMap: Record<string, React.ReactNode> = {
  AppstoreOutlined: <SettingOutlined />,
  EditOutlined: <EditOutlined />,
  RobotOutlined: <RobotOutlined />,
  SafetyCertificateOutlined: <SafetyCertificateOutlined />,
  SettingOutlined: <SettingOutlined />,
  UserOutlined: <UserOutlined />,
  WechatOutlined: <WechatOutlined />,
  MessageOutlined: <MessageOutlined />,
  ThunderboltOutlined: <ThunderboltOutlined />,
};

// prettier-ignore
const menuConfig = [
  {
    key: "ai",
    label: "AI 助手",
    icon: "RobotOutlined",
    permission: null,
    children: [
      { key: "/agents", label: "Agent 管理", icon: "RobotOutlined", permission: "menu:agents" },
    ],
  },
  {
    key: "system",
    label: "系统管理",
    icon: "SettingOutlined",
    permission: null,
    children: [
      { key: "/admins", label: "管理员管理", icon: "SafetyCertificateOutlined", permission: "menu:admins" },
      { key: "/roles", label: "角色管理", icon: "SafetyCertificateOutlined", permission: "menu:roles" },
    ],
  },
  {
    key: "wecom",
    label: "企业微信",
    icon: "WechatOutlined",
    permission: null,
    children: [
      { key: "/wecom", label: "应用配置", icon: "SettingOutlined", permission: "menu:wecom" },
      { key: "/wecom/messages", label: "消息记录", icon: "MessageOutlined", permission: "menu:wecom" },
      { key: "/wecom/events", label: "事件记录", icon: "ThunderboltOutlined", permission: "menu:wecom" },
    ],
  },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);

  const allMenuItems = menuConfig.map((group) => ({
    key: group.key,
    icon: iconMap[group.icon] || <SettingOutlined />,
    label: group.label,
    children: group.children.map((item) => ({
      key: item.key,
      permission: item.permission,
      icon: iconMap[item.icon] || <SettingOutlined />,
      label: item.label,
      onClick: () => navigate(item.key),
    })),
  }));

  const filterMenuByPermission = (items: any[]): any[] => {
    const hasSuperAdminRole =
      user?.roles?.some((r: any) => r?.role?.slug === 'super_admin') || false;
    if (hasSuperAdminRole) return items;

    return items
      .filter((item) => {
        if (item.children) {
          return filterMenuByPermission(item.children).length > 0;
        }
        if (!item.permission) return true;
        return user?.permissions?.includes(item.permission) || false;
      })
      .map((item) => ({
        ...item,
        ...(item.children ? { children: filterMenuByPermission(item.children) } : {}),
      }));
  };

  const menuItems = useMemo(
    () => filterMenuByPermission(allMenuItems),
    [allMenuItems, filterMenuByPermission],
  );

  const userMenuItems = [
    {
      key: 'profile',
      icon: <EditOutlined />,
      label: '个人信息',
      onClick: () => setProfileModalVisible(true),
    },
    {
      key: 'password',
      icon: <LockOutlined />,
      label: '修改密码',
      onClick: () => setPasswordModalVisible(true),
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: async () => {
        try {
          await logout();
          navigate('/login');
        } catch (error) {
          console.error('Logout failed:', error);
        }
      },
    },
  ];

  const getDefaultOpenKeys = () => {
    for (const group of menuConfig) {
      if (group.children.some((item) => location.pathname.startsWith(item.key))) {
        return [group.key];
      }
    }
    return [];
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: collapsed ? '8px' : '16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {collapsed ? (
            <img src="../logo.png" alt="" width={36} height={36} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <img src="../logo.png" alt="" width={36} height={36} />
              <div style={{ color: '#fff', fontWeight: 600, fontSize: 16, whiteSpace: 'nowrap' }}>
                Roundtable
              </div>
            </div>
          )}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={getDefaultOpenKeys()}
          items={menuItems}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'all 0.2s' }}>
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,21,41,.08)',
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: 16, width: 64, height: 64 }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar size="small" icon={<UserOutlined />} src={user?.avatar} />
                <span style={{ fontSize: 14 }}>{user?.username || '用户'}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: '#fff',
            borderRadius: 8,
          }}
        >
          <Outlet />
        </Content>
      </Layout>

      <ProfileModal
        visible={profileModalVisible}
        onCancel={() => setProfileModalVisible(false)}
        onSuccess={() => setProfileModalVisible(false)}
      />
      <ChangePasswordModal
        visible={passwordModalVisible}
        onCancel={() => setPasswordModalVisible(false)}
        onSuccess={() => setPasswordModalVisible(false)}
      />
    </Layout>
  );
}

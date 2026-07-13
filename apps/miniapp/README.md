<p align="center">
  <img src="https://github.com/uni-helper/vitesse-uni-app/raw/main/.github/images/preview.png" width="300"/>
</p>

<h2 align="center">
Vitesse for uni-app
</h2>
<p align="center">
  <a href="https://vitesse-uni-app.netlify.app/">📱 在线预览</a>
  <a href="https://uni-helper.js.org/vitesse-uni-app">📖 阅读文档</a>
</p>

## 特性

- ⚡️ [Vue 3](https://github.com/vuejs/core), [Vite](https://github.com/vitejs/vite), [pnpm](https://pnpm.io/), [esbuild](https://github.com/evanw/esbuild) - 就是快！

- 🔧 [ESM 优先](https://github.com/uni-helper/plugin-uni)

- 🗂 [基于文件的路由](./src/pages)

- 📦 [组件自动化加载](./src/components)

- 📑 [布局系统](./src/layouts)

- 🎨 [UnoCSS](https://github.com/unocss/unocss) - 高性能且极具灵活性的即时原子化 CSS 引擎

- 😃 [各种图标集为你所用](https://github.com/antfu/unocss/tree/main/packages/preset-icons)

- 🔥 使用 [新的 `<script setup>` 语法](https://github.com/vuejs/rfcs/pull/227)

- 📥 [API 自动加载](https://github.com/antfu/unplugin-auto-import) - 直接使用 Composition API 无需引入

- 🦾 [TypeScript](https://www.typescriptlang.org/) & [ESLint](https://eslint.org/) - 保证代码质量

---

# @roundtable/miniapp

基于 uni-app 的微信小程序，使用 Vue 3 + TypeScript + Vite 开发。

## 项目集成

本小程序已集成到 agenticRepo monorepo 中，可以与后端 API 共享类型和工具。

## 开发

### 安装依赖

在项目根目录执行：

```bash
pnpm install
```

### 启动开发服务器

```bash
# 仅启动小程序
pnpm dev:miniapp

# 或使用 pnpm filter
pnpm --filter @roundtable/miniapp dev
```

### 构建生产版本

```bash
pnpm build:miniapp
```

## 项目结构

```
src/
├── api/           # API 接口
├── components/    # 组件
├── composables/   # 组合式函数
├── config/        # 配置文件
│   └── api.ts     # API 配置
├── layouts/       # 布局
├── pages/         # 页面
├── static/        # 静态资源
├── stores/        # 状态管理
├── utils/         # 工具函数
│   └── http.ts    # HTTP 请求封装
├── App.vue        # 应用入口
└── main.ts        # 主文件
```

## API 配置

API 地址通过环境变量配置：

- 开发环境：`.env.development`
- 生产环境：`.env.production`

```bash
# .env.development
VITE_API_BASE_URL=http://localhost:3000/api
```

## 使用共享包

小程序可以使用 `@roundtable/shared` 包中的类型和工具：

```typescript
import { someUtil } from '@roundtable/shared';
import type { User } from '@roundtable/shared';
```

## 注意事项

1. 小程序使用 uni-app 框架，需要安装 HBuilderX 或使用 CLI 开发
2. 微信小程序需要在微信公众平台注册并配置 AppID
3. 开发前请在 `manifest.config.ts` 中配置小程序 AppID

---

## API 开发指南

### API 规范

小程序采用统一的 API 规范与后端交互：

**响应格式**:

```typescript
{
  success: boolean
  data: T
  message?: string
}
```

### 创建新的 API 模块

#### 1. 定义 API 端点

在 `src/config/api.ts` 中添加端点：

```typescript
export const API_ENDPOINTS = {
  // ... 其他端点
  articles: '/article',
  articleDetail: (id: string) => `/article/${id}`,
};
```

#### 2. 创建 API 文件

在 `src/api/` 创建新文件：

```typescript
// src/api/article.ts
import { http } from '@/utils/http';
import { API_ENDPOINTS } from '@/config/api';

export interface Article {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export const articleApi = {
  getList: () => {
    return http.get<Article[]>(API_ENDPOINTS.articles);
  },

  getDetail: (id: string) => {
    return http.get<Article>(API_ENDPOINTS.articleDetail(id));
  },

  create: (data: { title: string; content: string }) => {
    return http.post<Article>(API_ENDPOINTS.articles, data);
  },
};
```

#### 3. 在页面中使用

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { articleApi, type Article } from '@/api/article';

const articles = ref<Article[]>([]);

const loadArticles = async () => {
  try {
    const res = await articleApi.getList();
    articles.value = res.data || [];
  } catch (error) {
    console.error('加载失败:', error);
    uni.showToast({ title: '加载失败', icon: 'none' });
  }
};

onMounted(() => {
  loadArticles();
});
</script>
```

### HTTP 请求方法

```typescript
// GET 请求
http.get<T>(url, params);

// POST 请求
http.post<T>(url, data);

// PUT 请求
http.put<T>(url, data);

// DELETE 请求
http.delete<T>(url, data);
```

### 认证机制

登录后保存 token:

```typescript
uni.setStorageSync('token', response.data.accessToken);
```

HTTP 工具会自动添加到请求头:

```typescript
Authorization: `Bearer ${token}`;
```

## 示例功能

### Todo List

项目已内置 Todo List 示例功能，展示完整的 CRUD 操作：

- **页面**: `src/pages/todo.vue`
- **API**: `src/api/todo.ts`

功能包括：

- ✅ 获取 Todo 列表
- ✅ 创建新 Todo
- ✅ 编辑 Todo
- ✅ 删除 Todo
- ✅ 切换完成状态

访问方式：首页点击 "Todo List" 卡片

## 最佳实践

1. **类型安全**: 始终定义 TypeScript 接口
2. **错误处理**: 使用 try-catch 并友好提示
3. **加载状态**: 显示加载状态提升体验
4. **数据缓存**: 合理使用本地存储
5. **代码组织**: 按功能模块组织文件

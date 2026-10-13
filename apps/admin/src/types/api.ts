// AppRouter 类型桥
// 经 workspace 包引用 API 构建产物的声明文件（type-only，无运行时代码）。
// 注意：API 源码变更后需 `pnpm build:api` 刷新类型（type-check/CI 流程已含）。
export type { AppRouter } from '@loom/api';

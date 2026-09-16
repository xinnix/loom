# 任务：修复上传模块 local 模式缺陷与 OSS 配置问题

## 元信息

- **状态**：`completed`
- **分支**：`main`
- **创建**：2026-09-16
- **标签**：`bugfix`

## 目标

让 `FILE_STORAGE_PROVIDER` 配置对 Admin 前端上传组件生效（local 模式回退服务端中转），并修复 OSS 凭证/URL 的几处小问题。

## 检查清单

- [x] FileStorageService 暴露 `provider` / `maxFileSize` getter
- [x] UploadCredentials 接口清理（删无用的 `accessKeySecret`/`xOssSignatureVersion`/`xOssCredential`）
- [x] AliyunOssStrategy：直传 policy 读取 `MAX_FILE_SIZE`（原硬编码 10MB）
- [x] AliyunOssStrategy：`upload()` URL 用 `put()` 返回值（修复自定义 endpoint 场景）
- [x] upload.router.ts 新增 `getUploadConfig` query
- [x] 新建 `shared/shared.module.ts`（@Global），消除 FileStorageService 双重注册
- [x] admin `oss-upload.ts`：provider 感知，local 模式走 REST `/api/upload/image` 中转
- [x] 类型检查通过（api + admin + web）
- [x] 测试通过（api 62/62，admin 33/33）
- [x] 提交并推送

## 当前状态

> **做到哪了：** 全部完成，已提交推送
> **卡在哪：** 无
> **下一步：** 无
> **决策上下文：** JwtStrategy 同时接受 admin/user token，admin 走 REST 中转可行；vite proxy 已有 `/api` 转发；OSS URL 直接采用 `put()` 返回值而非手工拼接

## 变更文件清单

| 文件                                                   | 变更                | 原因                              |
| ------------------------------------------------------ | ------------------- | --------------------------------- |
| `apps/api/src/shared/services/file-storage.service.ts` | 修改                | getter、接口清理、policy/URL 修复 |
| `apps/api/src/modules/upload/trpc/upload.router.ts`    | 修改                | 新增 getUploadConfig              |
| `apps/api/src/shared/shared.module.ts`                 | 新增                | FileStorageService 全局注册       |
| `apps/api/src/app.module.ts`                           | 修改                | 去重 FileStorageService           |
| `apps/api/src/modules/upload/module.ts`                | 修改                | 去重 FileStorageService           |
| `apps/admin/src/shared/utils/oss-upload.ts`            | 修改                | provider 感知 + local 回退        |
| `docs/task/active/fix-upload-module.md`                | 新增→移至 completed | 任务追踪                          |

## 备注

- `getUploadCredentials` 在 local 模式保留抛错（前端已通过 getUploadConfig 预判，不再触发）
- UploadController 的 `userId` 死参数（未使用）不在本次范围，仅记录
- Web 端暂无上传能力；如需直传，需补 REST 凭证端点（现有凭证端点为 tRPC，仅 Admin 可用）

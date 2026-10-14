# 配置注入铁律：禁止 re-declare 全局 ConfigService token

> 回哺自 weSale 生产事故根治记录（`weSale/docs/dev/settings-config-injection-refactor.md`），随 ADR-008 机制一起回传。本文是红线，不是建议。

## 事故形态

weSale 早期为实现「DB 配置优先于 env」，用 Nest 的同 token 全局覆写：

```typescript
// ❌ 事故方案（已废弃，勿复刻）
{ provide: ConfigService, useClass: SettingsAwareConfigService }
```

Nest 对同 token 的双全局注册存在**两种解析语义**：

| 消费方式                              | 解析行为                                 |
| ------------------------------------- | ---------------------------------------- |
| 业务模块构造函数注入                  | 按模块依赖图的**注册顺序**先命中先注册者 |
| `app.get(ConfigService)` / 运行时解析 | **后注册者覆盖**先注册者                 |

两种语义不可能同时满足。结果是：一部分服务拿到原始 ConfigService（env-only），另一部分拿到 DB 优先的覆写实例——同一配置键在同一进程内读出两个值。weSale 的侧边栏 OAuth 因此在生产环境静默指向了错误的回调配置。

## 正确做法

1. **DB 配置读取一律显式注入 `SettingsService`**（ADR-008，@Global SharedModule 提供）：

   ```typescript
   constructor(private readonly settings: SettingsService) {}
   // settings.get(KEY) 内部已含 env 回落，语义 = config.get(KEY, DEFAULT) 的 DB 增强版
   ```

2. **基础设施键不走参数中心**：DATABASE_URL / JWT_SECRET / PORT / 日志级别等启动期必需项继续走原始 `ConfigService` / `process.env`——参数中心缓存加载晚于这些键的消费时点。

3. **参数中心内部读 env 时直接读 `process.env`**，不经过 ConfigService（防回环）。

## 检查方式

- 评审任何 `provide: ConfigService` 的自定义 provider → 直接拒绝
- `grep -rn "provide: ConfigService" apps/api/src` 应恒为零结果

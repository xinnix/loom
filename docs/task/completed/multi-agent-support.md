# 任务：多 Agent 工具支持

## 元信息

- **状态**：`completed`
- **分支**：`main`
- **创建**：2026-09-24
- **标签**：`infra`
- **关联**：[docs-system-redesign](docs-system-redesign.md)

## 目标

补齐 Codex / OpenCode / ZCode 三个主流 agent 的项目级支持：`.claude/skills/` 为唯一源，脚本分发到 `.agents/skills/`（Codex）、`.opencode/skills/`、`.zcode/skills/`，分发产物入库，hook 防漂移。

## 检查清单

- [x] 新建 scripts/sync-agents.sh（镜像分发 + --check + frontmatter 校验）
- [x] 补 deleteModule / seed-data 的 SKILL.md frontmatter
- [x] 执行首次分发（.agents 覆盖 + .opencode/.zcode 新建，18 技能 × 3 目录）
- [x] 新建 .claude/hooks/sync-agents.sh + settings.json 挂载
- [x] 文档联动：AGENTS.md 多工具章节 / CLAUDE.md 维护规则 / README.md / init-project SKILL.md
- [x] 修复 nestjs-refine-trpc-expert.md 技能脚本路径
- [x] backlog 增 E8（后续增强项）
- [x] 验证：幂等 / --check 漂移检测 / 逐文件 diff / JSON 有效性 / 入库确认

## 当前状态

> **做到哪了：** 全部完成（待用户 review 后提交）
> **卡在哪：** 无
> **下一步：** 用户在 Codex（`/skills`）、OpenCode、ZCode 中实测技能发现
> **决策上下文：** Codex 官方确认仓库级路径为 `.agents/skills/`（支持 symlink）；选复制分发而非 symlink（Windows 检出退化）；commands/agents/hooks 为 Claude 专属不迁移，降级矩阵写入 AGENTS.md；rsync --delete 清理了 .agents 中旧版 templates/（源已改名 legacy-templates/，git 历史可溯）

## 变更文件清单

| 文件                                                           | 变更     | 原因                              |
| -------------------------------------------------------------- | -------- | --------------------------------- |
| `scripts/sync-agents.sh`                                       | 新增     | 分发机制（镜像 + --check + 校验） |
| `.agents/skills/**`、`.opencode/skills/**`、`.zcode/skills/**` | 分发产物 | 三工具发现路径                    |
| `.claude/hooks/sync-agents.sh` + `settings.json`               | 新增     | PostToolUse 自动分发              |
| `.claude/skills/{deleteModule,seed-data}/SKILL.md`             | 修改     | 补 frontmatter                    |
| `AGENTS.md` / `CLAUDE.md` / `README.md`                        | 修改     | 多工具章节/维护规则/卖点          |
| `.claude/skills/init-project/SKILL.md`                         | 修改     | 分发目录维护说明                  |
| `.claude/agents/nestjs-refine-trpc-expert.md`                  | 一行     | 修复不存在的脚本路径              |
| `docs/product/backlog.md`                                      | 一行     | E8 后续增强                       |

## 备注

- ZCode 安全提示：社区报道其曾静默上传完整 Git 历史到云端（OSCHINA 2026），敏感仓库使用者自行评估
- 调研来源：developers.openai.com/codex/skills、opencode.ai/docs/skills、cnblogs ZCode 上手实录

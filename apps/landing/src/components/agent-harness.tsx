const skillGroups = [
  {
    title: '模块生成',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 4.5v15m7.5-7.5h-15"
        />
      </svg>
    ),
    skills: [
      { name: 'genModule', desc: '全栈 CRUD 模块一键生成，智能字段类型推断与关系检测' },
      { name: 'analyze', desc: '分析现有模块，识别标准化与重构机会' },
      { name: 'refactor', desc: '自动重构为 BaseService / StandardListPage 标准模式' },
      { name: 'deleteModule', desc: '安全删除完整模块及其所有端引用' },
    ],
  },
  {
    title: '开发运维',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3"
        />
      </svg>
    ),
    skills: [
      { name: 'db-migrate', desc: '运行迁移、生成 Prisma Client、Seed 一键完成' },
      { name: 'sync', desc: 'Schema 变更后同步类型定义与客户端' },
      { name: 'seed-data', desc: '快速填充开发和测试用的假数据' },
      { name: 'init-project', desc: '一键重命名脚手架身份，初始化新项目' },
      { name: 'toggle-app', desc: '启用/禁用模块（不影响源代码）' },
      { name: 'scaffold-clean', desc: '移除示例代码，生成空白项目起点' },
    ],
  },
  {
    title: '质量保障',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z"
        />
      </svg>
    ),
    skills: [
      { name: 'type-check', desc: '全仓库 TypeScript 类型检查' },
      { name: 'lint', desc: 'ESLint 代码质量与风格检查' },
      { name: 'validate', desc: '全栈验证：类型 + Lint + 构建 + 测试' },
      { name: 'build-all', desc: '构建 Monorepo 所有包' },
    ],
  },
  {
    title: '项目管理',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
        />
      </svg>
    ),
    skills: [
      { name: 'task', desc: '持久化任务追踪，跨会话上下文恢复' },
      { name: 'ship', desc: '分类型分批提交，自动化 Git 工作流' },
      { name: 'prd-exec', desc: 'PRD 拆解为可执行任务，按依赖顺序执行' },
    ],
  },
];

const commands = [
  { name: '/start-all', desc: '同时启动全部 5 个服务' },
  { name: '/start-api', desc: '启动 NestJS + tRPC 后端（:3000）' },
  { name: '/start-admin', desc: '启动 React + Refine 管理后台（:5173）' },
  { name: '/start-web', desc: '启动 Web 用户端 SSR（:3002）' },
  { name: '/start-landing', desc: '启动营销落地页 SSG（:3001）' },
  { name: '/start-mini', desc: '启动 uni-app 小程序 H5' },
  { name: '/db-migrate', desc: '数据库迁移 + Client 生成 + Seed' },
  { name: '/validate', desc: '全栈验证汇总报告' },
  { name: '/task', desc: '任务追踪看板' },
  { name: '/prisma-studio', desc: 'Prisma 可视化数据库浏览器' },
];

const hooks = [
  { name: 'protect-migration', desc: '防止手动编辑 or 删除迁移文件' },
  { name: 'protect-env', desc: '防止敏感环境变量被误提交' },
  { name: 'schema-change', desc: 'Schema 变更后自动提示迁移流程' },
  { name: 'shared-change', desc: 'Shared 包变更后自动 rebuild' },
  { name: 'type-check', desc: '编辑后自动运行类型检查' },
  { name: 'after-edit', desc: '编辑后自动格式化与 lint' },
  { name: 'stop', desc: '会话结束时清理临时资源' },
];

const agents = [
  {
    name: 'nestjs-refine-trpc-expert',
    desc: '全栈开发 — NestJS 模块、tRPC 路由、Refine 页面、Prisma Schema',
  },
  {
    name: 'antdesign-crud-designer',
    desc: '管理端 CRUD 页面 — Ant Design 列表/表单/详情页生成',
  },
  {
    name: 'frontend-design',
    desc: '前端界面设计 — 落地页、营销站、海报、React 组件',
  },
];

export function AgentHarness() {
  return (
    <section id="harness" className="bg-gradient-to-b from-white via-brand-50/30 to-white py-24">
      <div className="mx-auto max-w-6xl px-6">
        {/* Section header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            Agent <span className="text-brand-600">Harness</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-500">
            为 Claude Code
            量身定制的全栈开发基础设施。不是零散的提示词，而是可复用、可组合的工程化能力。
          </p>
        </div>

        {/* Skills grid */}
        <div className="mt-16">
          <div className="mb-8 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-100 text-brand-700">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11.42 15.17l5.88-7.92-7.46 6.3L4 7.5l4.33 7.75L7.5 18l5.67-4.5L15 18l2.17-5.25L22 8.25"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-neutral-800">
              19 个 Skill
              <span className="ml-2 text-sm font-normal text-neutral-400">覆盖开发全生命周期</span>
            </h3>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {skillGroups.map((group) => (
              <div
                key={group.title}
                className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    {group.icon}
                  </div>
                  <h4 className="font-semibold text-neutral-800">{group.title}</h4>
                </div>
                <ul className="mt-4 space-y-3">
                  {group.skills.map((s) => (
                    <li key={s.name} className="flex items-start gap-2">
                      <code className="mt-0.5 shrink-0 rounded bg-neutral-100 px-1.5 py-0.5 text-xs font-mono text-brand-700">
                        {s.name}
                      </code>
                      <span className="text-sm text-neutral-500">{s.desc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Commands + Hooks row */}
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {/* Commands */}
          <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-neutral-800">
                10 个 Command
                <span className="ml-2 text-sm font-normal text-neutral-400">斜杠即用</span>
              </h3>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {commands.map((cmd) => (
                <div
                  key={cmd.name}
                  className="flex items-center gap-1.5 rounded-lg bg-neutral-50 px-3 py-2"
                >
                  <span className="text-xs font-mono font-medium text-brand-600">{cmd.name}</span>
                  <span className="text-xs text-neutral-400">{cmd.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Hooks */}
          <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-neutral-800">
                7 个自动化 Hook
                <span className="ml-2 text-sm font-normal text-neutral-400">编辑即触发</span>
              </h3>
            </div>
            <ul className="mt-4 space-y-2">
              {hooks.map((h) => (
                <li key={h.name} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500" />
                  <span className="text-sm font-mono text-neutral-700">{h.name}</span>
                  <span className="text-sm text-neutral-500">{h.desc}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Agents */}
        <div className="mt-10 rounded-xl border border-brand-100 bg-gradient-to-r from-brand-50 to-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-neutral-800">
              3 个专业 Agent
              <span className="ml-2 text-sm font-normal text-neutral-400">场景化自动编排</span>
            </h3>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {agents.map((a) => (
              <div key={a.name} className="rounded-lg border border-brand-100 bg-white p-4">
                <div className="text-sm font-mono font-semibold text-brand-700">{a.name}</div>
                <p className="mt-1 text-xs text-neutral-500">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className="mt-12 rounded-2xl bg-neutral-900 p-8 text-white">
          <h3 className="text-lg font-semibold">Agent-Centric 工作流</h3>
          <p className="mt-2 text-sm text-neutral-400">
            传统脚手架给你代码， Loom 给你代码 + 全程 AI 搭档。开发不再是磕磕碰碰的 solo 之旅：
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-neutral-800 p-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
                1
              </div>
              <h4 className="mt-3 text-sm font-semibold text-white">斜杠即发</h4>
              <p className="mt-1 text-xs text-neutral-400">
                输入 <code className="rounded bg-neutral-700 px-1 text-brand-300">/genModule</code>{' '}
                生成完整 CRUD 模块，前后端同步创建
              </p>
            </div>
            <div className="rounded-xl bg-neutral-800 p-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
                2
              </div>
              <h4 className="mt-3 text-sm font-semibold text-white">Agent 精修</h4>
              <p className="mt-1 text-xs text-neutral-400">
                专业 Agent 自动处理复杂业务逻辑、定制 UI、类型调试
              </p>
            </div>
            <div className="rounded-xl bg-neutral-800 p-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
                3
              </div>
              <h4 className="mt-3 text-sm font-semibold text-white">Hook 护航</h4>
              <p className="mt-1 text-xs text-neutral-400">
                编辑后自动类型检查、迁移保护、Schema 变更同步，零人工干预
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

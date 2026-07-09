#!/usr/bin/env bash
#
# init-project.sh — 把 OpenCode Scaffold 脚手架的身份标识机械替换为新项目的标识。
#
# 用法:
#   bash scripts/init-project.sh <项目名> [包名前缀] [数据库名] [品牌名] [生产API域名]
#
# 参数（缺省均从 <项目名> 派生）:
#   $1 项目名      (必填) 顶层 package.json name，并作为容器/镜像默认 PROJECT_NAME
#   $2 包名前缀    (默认=$1) workspace scope，@opencode → @<前缀>
#   $3 数据库名    (默认=$1) PostgreSQL 数据库名
#   $4 品牌名      (默认=$1) 管理/Web/Landing 端可见的 UI 品牌文案
#   $5 生产API域名 (可选) miniapp 生产环境 API 地址；不提供则保留 example.com 占位
#
# 设计原则:
#   - 只替换"身份标识"的精确模式，不做模糊 opencode 全局替换，避免误伤。
#   - 保护 init-project 技能自身（scripts/init-project.sh 与 .claude/skills/init-project/），
#     避免脚本/文档自毁，保证可重复运行。
#   - 幂等：重复运行不会叠加破坏（找不到源 token 时为 no-op）。
#   - 不触碰 schema.prisma、不跑 prisma，避免副作用；数据库迁移交给 db-migrate 技能。
#
# 前置: 建议先 git commit / 备份；此操作不可逆。

set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "用法: bash scripts/init-project.sh <项目名> [包名前缀] [数据库名] [品牌名] [生产API域名]" >&2
  exit 1
fi

PROJECT_NAME="$1"
PKG_PREFIX="${2:-$PROJECT_NAME}"
DB_NAME="${3:-$PROJECT_NAME}"
BRAND_NAME="${4:-$PROJECT_NAME}"
API_DOMAIN="${5:-}"

# 脚本所在仓库根目录
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# 排除的目录与文件：构建产物 / VCS / 脚本自身 / init-project 技能文档
EXCLUDE_DIRS=(node_modules .git dist .next .turbo unpackage out)
SELF_EXCLUDE=(scripts/init-project.sh .claude/skills/init-project)

# 统计本次替换影响的文件数（在主 shell 维护，replace_all 通过 here-string 调用以累加）
AFFECTED=0

# 收集待扫描的文件列表（排除目录与 SELF_EXCLUDE），按给定后缀过滤。
# 用法: collect_files <suffix1> [suffix2 ...]  —— stdout 输出文件路径，每行一个。
collect_files() {
  local suffix_args=()
  for s in "$@"; do suffix_args+=(-name "*.$s" -o); done
  unset 'suffix_args[${#suffix_args[@]}-1]' # 去掉末尾 -o

  local exclude_v=()
  for d in "${EXCLUDE_DIRS[@]}"; do
    exclude_v+=(-e "/$d/")
  done
  for f in "${SELF_EXCLUDE[@]}"; do
    exclude_v+=(-e "/$f")
  done

  find . \( "${suffix_args[@]}" \) -type f -print 2>/dev/null \
    | grep -v "${exclude_v[@]}" || true
}

# 对所有文件做 sed 替换（BSD sed, -i ''）。
# 用法: replace_all <pattern> <replacement> <<< "$files"
#   文件列表通过 here-string 传入（保证在主 shell 执行，AFFECTED 累加生效）。
replace_all() {
  local pattern="$1"
  local replacement="$2"
  local files
  files=$(cat)
  if [ -z "$files" ]; then
    echo "  (无匹配文件) pattern: $pattern"
    return
  fi
  # 统计实际含 pattern 的文件数
  local count
  count=$(echo "$files" | xargs grep -l "$pattern" 2>/dev/null | wc -l | tr -d ' ')
  echo "$files" | xargs sed -i '' "s|${pattern}|${replacement}|g" 2>/dev/null || true
  AFFECTED=$((AFFECTED + count))
  echo "  ✓ 替换 ${count} 个文件: ${pattern} → ${replacement}"
}

echo "================================================"
echo " OpenCode Scaffold → 项目初始化"
echo "   项目名:      ${PROJECT_NAME}"
echo "   包名前缀:    @${PKG_PREFIX}"
echo "   数据库名:    ${DB_NAME}"
echo "   品牌名:      ${BRAND_NAME}"
[ -n "$API_DOMAIN" ] && echo "   生产API域名: ${API_DOMAIN}"
echo " 仓库根: ${ROOT_DIR}"
echo "================================================"

# ---- Step 1: 包 scope @opencode/* → @<prefix>/* （全局，保护技能自身）----
echo ""
echo "[1/7] 替换包 scope @opencode/* → @${PKG_PREFIX}/*"
FILES=$(collect_files json ts tsx js mjs cjs yml yaml md)
replace_all '@opencode/' "@${PKG_PREFIX}/" <<< "$FILES"

# ---- Step 2: 顶层 package.json name ----
echo ""
echo "[2/7] 顶层 package.json name: opencode-scaffold → ${PROJECT_NAME}"
if grep -q '"name": "opencode-scaffold"' package.json 2>/dev/null; then
  sed -i '' "s|\"name\": \"opencode-scaffold\"|\"name\": \"${PROJECT_NAME}\"|" package.json
  echo "  ✓ package.json 已更新"
  AFFECTED=$((AFFECTED + 1))
else
  echo "  (package.json 未匹配 opencode-scaffold，可能已初始化过，跳过)"
fi

# ---- Step 3: docker-compose 容器/镜像默认 PROJECT_NAME / IMAGE_NAME ----
echo ""
echo "[3/7] docker-compose 默认值: \${PROJECT_NAME:-opencode} / \${IMAGE_NAME:-opencode}"
FILES=$(collect_files yml yaml)
replace_all 'PROJECT_NAME:-opencode' "PROJECT_NAME:-${PROJECT_NAME}" <<< "$FILES"
replace_all 'IMAGE_NAME:-opencode' "IMAGE_NAME:-${PROJECT_NAME}" <<< "$FILES"

# ---- Step 4: 数据库名（生产 env 示例）----
echo ""
echo "[4/7] 数据库名: opencode → ${DB_NAME}"
# 仅 .env.prod.example 的 DATABASE_URL 行，精确到 5432/<db>
if [ -f .env.prod.example ] && grep -q '5432/opencode' .env.prod.example; then
  sed -i '' "s|5432/opencode|5432/${DB_NAME}|" .env.prod.example
  echo "  ✓ .env.prod.example DATABASE_URL 数据库名已更新"
  AFFECTED=$((AFFECTED + 1))
fi
# 注意: seed-data 等技能文档里的示例库名 (opencode) 保持脚手架默认，不在脚本中替换，
# 避免模糊匹配 opencode 误伤包名/容器名；实际库名以 .env 的 DATABASE_URL 为准。

# ---- Step 5: UI 品牌文案 OpenCode → 品牌名（仅用户可见的前端源码）----
echo ""
echo "[5/7] UI 品牌文案: OpenCode → ${BRAND_NAME}（admin / web / landing）"
UI_FILES=""
for app in admin web landing; do
  if [ -d "apps/${app}/src" ]; then
    UI_FILES="${UI_FILES}
$(find "apps/${app}/src" -type f -name '*.tsx' -print 2>/dev/null)
$(find "apps/${app}/src" -type f -name '*.ts' -print 2>/dev/null)"
  fi
done
[ -f apps/admin/index.html ] && UI_FILES="${UI_FILES}
apps/admin/index.html"
replace_all 'OpenCode' "${BRAND_NAME}" <<< "$UI_FILES"

# ---- Step 6: miniapp 生产 API 域名（可选）----
echo ""
echo "[6/7] miniapp 生产 API 域名"
if [ -n "$API_DOMAIN" ]; then
  if [ -f apps/miniapp/.env.production ] && grep -q 'api.example.com' apps/miniapp/.env.production; then
    sed -i '' "s|https://api.example.com/api|${API_DOMAIN}|" apps/miniapp/.env.production
    echo "  ✓ apps/miniapp/.env.production 域名已更新为 ${API_DOMAIN}"
    AFFECTED=$((AFFECTED + 1))
  fi
else
  echo "  (未提供生产API域名，保留 https://api.example.com/api 占位)"
fi

# ---- Step 7: 部署配置检查清单 ----
echo ""
echo "[7/7] 部署配置检查清单"
echo "================================================"
echo " 📋 部署配置检查清单"
echo "================================================"
echo ""
echo "将本项目推送到 GitHub 后，CI/CD 会自动构建 Docker 镜像。"
echo "如需自动部署到服务器，请在 GitHub 仓库 Settings → Secrets and variables → Actions 中设置以下密钥："
echo ""
echo "  ┌────────────────────┬──────────────────────────────────────┐"
echo "  │ Secret             │ 说明                                 │"
echo "  ├────────────────────┼──────────────────────────────────────┤"
echo "  │ DEPLOY_HOST        │ 服务器 IP 或域名                      │"
echo "  │ DEPLOY_USER        │ SSH 登录用户名（如 root）              │"
echo "  │ DEPLOY_SSH_KEY     │ SSH 私钥全文                          │"
echo "  │ DEPLOY_PATH        │ 服务器上 docker-compose 目录           │"
echo "  │ DEPLOY_PORT        │ SSH 端口（可选，默认 22）              │"
echo "  └────────────────────┴──────────────────────────────────────┘"
echo ""
echo "生成 SSH 密钥对（如果还没有）："
echo ""
echo "  ssh-keygen -t ed25519 -C \"github-actions-deploy\" -f ~/.ssh/github-actions"
echo '  ssh-copy-id -i ~/.ssh/github-actions.pub <DEPLOY_USER>@<DEPLOY_HOST>'
echo "  cat ~/.ssh/github-actions   # 复制输出到 GitHub DEPLOY_SSH_KEY"
echo ""
echo "首次部署需在服务器上准备："
echo ""
echo "  cd $DEPLOY_PATH"
echo "  # 从仓库复制 docker-compose.prod.yml"
echo "  # 创建 .env.prod（基于 .env.prod.example）"
echo "  # 确保 certs/ 目录和微信支付证书存在"
echo "  # 登录 GHCR：docker login ghcr.io -u <GitHub用户名>"
echo "  docker compose -f docker-compose.prod.yml pull"
echo "  docker compose -f docker-compose.prod.yml up -d"
echo ""
echo "之后每次 git push main 都会自动："
echo "  1. 类型检查 → Lint → 测试 → 迁移"
echo "  2. 构建并推送 Docker 镜像到 GHCR"
echo "  3. SSH 到服务器 → pull 新镜像 → 渐进式重启"
echo ""
echo "================================================"
echo ""
echo "================================================"
echo " 替换完成。影响文件总数: ${AFFECTED}"
echo ""
echo " 残留身份标识检查:"
echo "------------------------------------------------"
# 排除 init-project 技能自身、本地个人配置(settings.local.json)、备份文件
RESIDUE=$(collect_files json ts tsx js mjs cjs yml yaml md html env production 2>/dev/null \
  | grep -vE 'skills/init-project|settings\.local\.json|\.backup-' \
  | xargs grep -ln '@opencode\|opencode-scaffold' 2>/dev/null || true)
if [ -n "$RESIDUE" ]; then
  echo "$RESIDUE" | sed 's/^/  • /'
  echo ""
  echo "  以上残留通常属正常保留："
  echo "    - README 里的 opencode-scaffold 是脚手架 clone 示例（脚手架身份溯源）"
  echo "    - 技能脚本里的 Claude 内存路径含本机绝对路径，不在通用替换范围"
else
  echo "  ✅ 无身份标识残留"
fi
echo "================================================"
echo ""
echo "下一步建议:"
echo "  1. pnpm install"
echo "  2. /sync          # Prisma Generate + Build Shared"
echo "  3. /db-migrate    # 建库 + 迁移 + Seed"
echo "  4. /start-backend && /start-frontend   # 验证登录与 CRUD"
echo "  5. 抽查 apps/admin/index.html 标题、AdminLayout 品牌、docker-compose 容器名"
echo "  6. 推送到 GitHub → 检查 CI 是否通过"
echo "  7. 参照上方部署检查清单配置自动部署到服务器"

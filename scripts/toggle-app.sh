#!/usr/bin/env bash
#
# toggle-app.sh — 启用或禁用指定的 app（只影响构建和部署，不删除源码）
#
# 用法:
#   bash scripts/toggle-app.sh <app名> on|off
#
# 示例:
#   bash scripts/toggle-app.sh web on    # 启用 web
#   bash scripts/toggle-app.sh landing off  # 禁用 landing
#
# 可选 app: api admin web landing miniapp

set -euo pipefail

APP_NAME="${1:-}"
ACTION="${2:-}"

VALID_APPS=("api" "admin" "web" "landing" "miniapp")

if [ -z "$APP_NAME" ] || [ -z "$ACTION" ]; then
  echo "用法: bash scripts/toggle-app.sh <app名> on|off" >&2
  echo "可选 app: ${VALID_APPS[*]}" >&2
  exit 1
fi

# 验证 app 名
VALID=false
for v in "${VALID_APPS[@]}"; do
  [ "$v" = "$APP_NAME" ] && VALID=true && break
done
if [ "$VALID" = false ]; then
  echo "❌ 无效的 app 名: $APP_NAME (可选: ${VALID_APPS[*]})" >&2
  exit 1
fi

# 验证 action
if [ "$ACTION" != "on" ] && [ "$ACTION" != "off" ]; then
  echo "❌ action 必须为 on 或 off" >&2
  exit 1
fi

CONFIG_FILE=".scaffold-config.json"

# 检查 config 文件是否存在，不存在则创建
if [ ! -f "$CONFIG_FILE" ]; then
  echo "⚠️  .scaffold-config.json 不存在，创建默认配置..."
  echo '{"apps":["api","admin","web","landing"]}' > "$CONFIG_FILE"
fi

# 读取当前列表
CURRENT=$(python3 -c "
import json
with open('$CONFIG_FILE') as f:
    config = json.load(f)
apps = config.get('apps', [])
print(' '.join(apps))
")

# 根据 action 修改列表
SHOULD_COMMIT=false
case "$ACTION" in
  on)
    if echo "$CURRENT" | grep -qw "$APP_NAME"; then
      echo "ℹ️  ${APP_NAME} 已经启用，无需操作"
    else
      python3 -c "
import json
with open('$CONFIG_FILE') as f:
    config = json.load(f)
apps = config.get('apps', [])
apps.append('$APP_NAME')
config['apps'] = apps
with open('$CONFIG_FILE', 'w') as f:
    json.dump(config, f, indent=2)
    f.write('\n')
"
      echo "✅ ${APP_NAME} 已启用"
      SHOULD_COMMIT=true
    fi
    ;;
  off)
    if echo "$CURRENT" | grep -qw "$APP_NAME"; then
      python3 -c "
import json
with open('$CONFIG_FILE') as f:
    config = json.load(f)
config['apps'] = [a for a in config.get('apps', []) if a != '$APP_NAME']
with open('$CONFIG_FILE', 'w') as f:
    json.dump(config, f, indent=2)
    f.write('\n')
"
      echo "✅ ${APP_NAME} 已禁用（源码保留）"
      SHOULD_COMMIT=true
    else
      echo "ℹ️  ${APP_NAME} 已经禁用，无需操作"
    fi
    ;;
esac

echo ""
echo "当前启用列表:"
python3 -c "
import json
with open('$CONFIG_FILE') as f:
    config = json.load(f)
print(', '.join(config.get('apps', [])))
"

if [ "$SHOULD_COMMIT" = true ]; then
  echo ""
  echo "⚠️  配置已变更，建议提交："
  echo "  git add $CONFIG_FILE && git commit -m \"chore(config): $ACTION $APP_NAME app\""
  echo "  git push"
  echo ""
  echo "推送后 CI 将自动调整构建和部署流程。"
fi

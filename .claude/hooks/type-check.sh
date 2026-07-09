#!/bin/bash
# Hook: Type Check Guard (lightweight)
# Runs after editing TS/TSX files — reports only error count to avoid noise
# Environment: FILE_PATH is available

# Only check TS/TSX files in apps/ or infra/
if [[ "$FILE_PATH" != *.ts && "$FILE_PATH" != *.tsx ]]; then
  exit 0
fi

if [[ "$FILE_PATH" != apps/* && "$FILE_PATH" != infra/* ]]; then
  exit 0
fi

# Skip type declaration files and generated files
if [[ "$FILE_PATH" == *.d.ts || "$FILE_PATH" == *node_modules/* || "$FILE_PATH" == *generated/* ]]; then
  exit 0
fi

# Determine which project to check
if [[ "$FILE_PATH" == apps/api/* ]]; then
  PROJECT="apps/api"
elif [[ "$FILE_PATH" == apps/admin/* ]]; then
  PROJECT="apps/admin"
elif [[ "$FILE_PATH" == apps/web/* ]]; then
  PROJECT="apps/web"
elif [[ "$FILE_PATH" == apps/landing/* ]]; then
  PROJECT="apps/landing"
elif [[ "$FILE_PATH" == apps/miniapp/* ]]; then
  PROJECT="apps/miniapp"
elif [[ "$FILE_PATH" == infra/shared/* ]]; then
  PROJECT="infra/shared"
elif [[ "$FILE_PATH" == infra/database/* ]]; then
  PROJECT="infra/database"
else
  exit 0
fi

OUTPUT=$(cd "$PROJECT" 2>/dev/null && npx tsc --noEmit --pretty 2>&1) || true
ERROR_COUNT=$(echo "$OUTPUT" | grep -c "error TS" || true)

if [ "$ERROR_COUNT" -gt 0 ]; then
  # Print first error location + count only
  FIRST_FILE=$(echo "$OUTPUT" | grep -oE "apps/[^([:space:]]+\.tsx?" | head -1)
  echo "⚠️  TypeScript: $ERROR_COUNT error(s) in $PROJECT"
  [ -n "$FIRST_FILE" ] && echo "    (first in $FIRST_FILE)"
fi

exit 0

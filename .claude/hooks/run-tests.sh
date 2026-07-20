#!/bin/bash
# Hook: Run Tests
# Description: Automatically runs tests when spec/test files are edited
# Environment: FILE_PATH is available — the path that was just edited

# Only run for spec/test files
if [[ "$FILE_PATH" != *.spec.* && "$FILE_PATH" != *.test.* ]]; then
  exit 0
fi

# Skip node_modules
if [[ "$FILE_PATH" == *node_modules/* ]]; then
  exit 0
fi

# Determine which project to test based on file path
if [[ "$FILE_PATH" == apps/api/* ]]; then
  PROJECT="apps/api"
elif [[ "$FILE_PATH" == apps/admin/* ]]; then
  PROJECT="apps/admin"
elif [[ "$FILE_PATH" == infra/shared/* ]]; then
  PROJECT="infra/shared"
elif [[ "$FILE_PATH" == apps/miniapp/* ]]; then
  PROJECT="apps/miniapp"
else
  exit 0
fi

echo ""
echo "🧪 Running tests for $PROJECT..."

OUTPUT=$(cd "$PROJECT" 2>/dev/null && npx vitest run --reporter=verbose 2>&1)
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
  PASSED=$(echo "$OUTPUT" | grep -oP '\d+(?= passed)' | tail -1)
  echo "✅ Tests passed${PASSED:+ ($PASSED passed)}"
else
  FAILED=$(echo "$OUTPUT" | grep -oP '\d+(?= failed)' | tail -1)
  echo "❌ Tests failed${FAILED:+ ($FAILED failed)}"
  echo "$OUTPUT" | grep -E "FAIL|✗|×" | head -5
fi

exit 0

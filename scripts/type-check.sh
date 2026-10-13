#!/bin/bash
set -e

echo "Type checking API..."
pnpm --filter @loom/api exec tsc --noEmit 2>&1 | head -20

echo "Type checking Admin..."
# admin 是 project references（app/node），须用 -b 才会真查各子配置
pnpm --filter admin exec tsc -b 2>&1 | head -20

echo "Type checking Web..."
pnpm --filter @loom/web exec tsc --noEmit 2>&1 | head -20

echo "Type check complete."

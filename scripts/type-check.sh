#!/bin/bash
set -e

echo "Type checking API..."
pnpm --filter @loom/api exec tsc --noEmit 2>&1 | head -20

echo "Type checking Admin..."
pnpm --filter admin exec tsc --noEmit 2>&1 | head -20

echo "Type checking Web..."
pnpm --filter @loom/web exec tsc --noEmit 2>&1 | head -20

echo "Type check complete."

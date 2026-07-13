#!/bin/bash
set -e

echo "Generating Prisma Client..."
pnpm --filter @loom/database exec prisma generate

echo "Building shared package..."
pnpm --filter @loom/shared build

echo "Sync complete."

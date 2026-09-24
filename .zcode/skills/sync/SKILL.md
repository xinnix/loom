---
name: sync
description: Sync workspace by generating Prisma client and building shared package. Use after schema changes, git pull, or when types are out of sync.
allowed-tools:
  - Bash(npx prisma generate:*)
  - Bash(pnpm -C :*)
  - Bash(cd :*)
---

# Sync Workspace

## Overview

Synchronizes the entire monorepo by regenerating the Prisma client and rebuilding the shared package. This ensures all types are up to date across the project.

## When to Use

Run this command after:

- Pulling changes from git
- Modifying the Prisma schema
- Running database migrations
- When TypeScript types seem out of sync
- Before starting development

## Instructions

1. Generate Prisma client: `cd infra/database && npx prisma generate`
2. Build shared package: `pnpm -C infra/shared build`

## Example

```bash
cd infra/database
npx prisma generate
pnpm -C infra/shared build
```

## What it does

- **Prisma generate**: Updates the Prisma client with latest schema types
- **Build shared**: Rebuilds `@loom/shared` package with updated types

## Notes

- This is a common first step after cloning the repository
- Takes 5-10 seconds typically
- If types still seem wrong, try restarting your TypeScript server in your IDE
- The shared package exports the `AppRouter` type used by tRPC

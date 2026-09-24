---
name: build-all
description: Build all packages in the monorepo. Use when user wants to build the entire project for production or testing.
allowed-tools:
  - Bash(pnpm -C :*)
---

# Build All Packages

## Overview

Builds all packages and apps in the monorepo in the correct dependency order.

## Instructions

Run from project root:

```bash
pnpm -C packages/shared build
pnpm -C apps/api build
pnpm -C apps/admin build
```

## Build Order

Packages are built in dependency order:

1. **shared** - Shared types and utilities
2. **api** - NestJS backend
3. **admin** - React frontend

## Output Locations

- `packages/shared/dist/` - Compiled shared package
- `apps/api/dist/` - Compiled NestJS server
- `apps/admin/dist/` - Production-ready React app

## Example

```bash
# Build shared package first
pnpm -C packages/shared build

# Then build API
pnpm -C apps/api build

# Finally build admin
pnpm -C apps/admin build
```

## Notes

- Make sure to run `/sync` before building to ensure Prisma client is generated
- Building TypeScript catches type errors that might be missed in dev mode
- Production builds are optimized and minified
- Use `pnpm dev` in each app for development with hot reload

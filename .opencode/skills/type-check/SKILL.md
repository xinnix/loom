---
name: type-check
description: Run TypeScript type checking across the monorepo. Use when user wants to verify types without building or when investigating type errors.
allowed-tools:
  - Bash(pnpm -C :*)
---

# Type Check

## Overview

Runs TypeScript type checking across all packages in the monorepo without emitting build artifacts.

## Instructions

Run from project root:

```bash
pnpm -C packages/shared type-check
pnpm -C apps/api type-check
pnpm -C apps/admin type-check
```

## What it does

- Checks TypeScript types across all packages
- Reports type errors without generating output files
- Faster than full build for type checking

## Example

```bash
# Check shared package
pnpm -C packages/shared type-check

# Check API
pnpm -C apps/api type-check

# Check admin
pnpm -C apps/admin type-check
```

## Common Use Cases

- Verify types before committing
- Investigate type errors without waiting for full build
- Check types across the entire monorepo quickly
- CI/CD validation step

## Notes

- This is faster than `/build-all` when you only need type checking
- Fix any reported errors before building for production
- Some type errors may only appear during build due to different tsconfig settings
- If type checking passes but you still see errors in IDE, try restarting TypeScript server

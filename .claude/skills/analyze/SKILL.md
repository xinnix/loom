---
name: analyze
description: Analyze existing modules to extract reusable patterns, identify refactoring opportunities, and provide standardization recommendations. Use when you want to understand module structure, find code duplication, or plan a refactor to use scaffold abstractions (BaseService, createCrudRouter, StandardListPage).
allowed-tools:
  - Bash(node:*)
  - Bash(tsx:*)
  - Bash(cat:*)
  - Bash(find:*)
  - Bash(grep:*)
  - Bash(wc:*)
  - Bash(head:*)
---

# /analyze Skill - Module Analysis

Analyze an existing module to identify refactoring opportunities and reusable patterns.

## Quick Analysis (Script)

For fast standardized analysis, use the script:

```bash
# Analyze single module
node .claude/skills/analyze/scripts/analyze-module.ts <module-name>

# Analyze all modules
node .claude/skills/analyze/scripts/analyze-module.ts --all

# JSON output (for /refactor consumption)
node .claude/skills/analyze/scripts/analyze-module.ts <module-name> --json
```

The script provides standardized detection of BaseService/createCrudRouter/StandardListPage usage patterns.

## Usage

```
/analyze <module-name>
```

Example: `/analyze merchant`

After running the script, Claude can continue with deeper analysis (architecture issues, business logic review, custom pattern recommendations).

---

## Analysis Steps

When the user runs `/analyze <module-name>`, follow these steps in order:

### Step 1: Read Module Files

Read all files in the module directory to understand the current implementation:

**Backend files to read:**

- `apps/api/src/modules/<name>/services/<name>.service.ts`
- `apps/api/src/modules/<name>/trpc/<name>.router.ts`
- `apps/api/src/modules/<name>/rest/<name>.controller.ts` (if exists)
- `apps/api/src/modules/<name>/module.ts`

**Frontend files to read:**

- `apps/admin/src/modules/<name>/pages/*.tsx`
- `apps/admin/src/modules/<name>/components/*.tsx`
- `apps/admin/src/modules/<name>/index.ts`

### Step 2: Analyze Backend Service

Check the service file for these patterns:

**Pattern 1: Manual CRUD (Refactor Target)**

```
Signs the service manually implements:
- findMany / findUnique / findFirst
- create / update / delete
Without extending BaseService
```

If found → Recommend extending `BaseService` from scaffold.

**Pattern 2: BaseService Compatible**

```
Service extends a base class or uses a common pattern
```

If found → Mark as "Already partially standardized".

**Pattern 3: Custom Business Logic**

```
Service has methods beyond basic CRUD:
- State transitions
- Complex queries with joins
- External API calls
- File processing
```

If found → Keep custom logic, only refactor CRUD parts.

### Step 3: Analyze tRPC Router

Check the router file:

**Pattern 1: Manual Router (Refactor Target)**

```
Router defines individual procedures:
- getMany: publicProcedure.query(...)
- getOne: publicProcedure.query(...)
- create: publicProcedure.mutation(...)
- update: publicProcedure.mutation(...)
- delete: publicProcedure.mutation(...)
```

If found → Recommend using `createCrudRouter()`.

**Pattern 2: createCrudRouter**

```
Router uses createCrudRouter('Model', { create, update, ... })
```

If found → Mark as "Already standardized".

**Pattern 3: Mixed Router**

```
Router uses createCrudRouter for basic CRUD but adds custom procedures
```

If found → Mark as "Good pattern, custom logic preserved".

### Step 4: Analyze Frontend Pages

Check the frontend pages:

**Pattern 1: Manual List Page (Refactor Target)**

```
Page manually implements:
- Table with hardcoded columns
- Modal for create/edit
- Form with individual fields
- No search/filter
- No batch operations
```

If found → Recommend using `StandardListPage` component.

**Pattern 2: StandardListPage**

```
Page uses StandardListPage component with config
```

If found → Mark as "Already standardized".

**Pattern 3: Custom UI**

```
Page has complex custom UI:
- Charts/dashboards
- Drag-and-drop
- Custom components
```

If found → Keep custom UI, suggest partial standardization.

### Step 5: Check Zod Schema

Check `infra/shared/src/index.ts` for the module's schemas:

- Are schemas defined?
- Do they have proper validation (email, phone, min, max)?
- Do updateInput schemas properly handle nullable/optional?

### Step 6: Check Prisma Schema

Check `infra/database/prisma/schema.prisma`:

- Does the model have proper indexes?
- Are relations defined correctly?
- Are there missing fields (priority, status, etc.)?

---

## Analysis Report Format

Generate a report in this format:

```markdown
# Module Analysis Report: <ModuleName>

## Summary

- Backend: [Manual CRUD / Partially Standardized / Standardized]
- Frontend: [Manual UI / Partially Standardized / Standardized]
- Refactoring Priority: [High / Medium / Low]

## Backend Analysis

### Service (`<name>.service.ts`)

- Lines of code: XXX
- Extends BaseService: [Yes / No]
- CRUD methods: [list them]
- Custom methods: [list them]
- Refactor opportunity: [description]

### Router (`<name>.router.ts`)

- Lines of code: XXX
- Uses createCrudRouter: [Yes / No]
- Custom procedures: [list them]
- Refactor opportunity: [description]

## Frontend Analysis

### Pages

- Files: [list]
- Total lines: XXX
- Uses StandardListPage: [Yes / No]
- Uses StandardForm: [Yes / No]
- Refactor opportunity: [description]

## Schema Analysis

### Prisma Model

- Fields: X fields
- Relations: [list]
- Indexes: [list or "none"]
- Issues: [list]

### Zod Schemas

- Defined: [Yes / No]
- Validation quality: [Basic / Good / Comprehensive]
- Missing validations: [list]

## Refactoring Recommendations

### Priority 1 (High Impact, Low Risk)

1. [Recommendation]
   - Estimated code reduction: XX%
   - Files to change: [list]

### Priority 2 (Medium Impact)

1. [Recommendation]

### Priority 3 (Nice to Have)

1. [Recommendation]

## Estimated Impact

| Metric          | Before            | After | Improvement |
| --------------- | ----------------- | ----- | ----------- |
| Backend LOC     | XXX               | XXX   | -XX%        |
| Frontend LOC    | XXX               | XXX   | -XX%        |
| Type Safety     | [Partial/Full]    | Full  | +XX%        |
| Maintainability | [Low/Medium/High] | High  | +XX%        |
```

---

## Quick Check Commands

Use these bash commands for quick analysis:

```bash
# Count backend service lines
wc -l apps/api/src/modules/<name>/services/*.ts

# Check if uses BaseService
grep -l "BaseService" apps/api/src/modules/<name>/services/*.ts || echo "NOT using BaseService"

# Check if uses createCrudRouter
grep -l "createCrudRouter" apps/api/src/modules/<name>/trpc/*.ts || echo "NOT using createCrudRouter"

# Count frontend lines
find apps/admin/src/modules/<name> -name "*.tsx" | xargs wc -l

# Check if uses StandardListPage
grep -l "StandardListPage" apps/admin/src/modules/<name>/**/*.tsx || echo "NOT using StandardListPage"

# Check if uses StandardForm
grep -l "StandardForm" apps/admin/src/modules/<name>/**/*.tsx || echo "NOT using StandardForm"
```

---

## Scaffold Abstraction Layers Reference

When recommending refactoring, reference these abstractions:

| Abbreviation       | File                                                   | Used For                        |
| ------------------ | ------------------------------------------------------ | ------------------------------- |
| BaseService        | `apps/api/src/common/base.service.ts`                  | Generic CRUD service with hooks |
| createCrudRouter   | `apps/api/src/trpc/trpc.helper.ts`                     | One-line CRUD router generation |
| PermissionGuard    | `apps/admin/src/shared/components/PermissionGuard.tsx` | RBAC permission middleware      |
| StandardListPage   | `apps/admin/src/shared/components/StandardListPage/`   | Config-driven list page         |
| StandardForm       | `apps/admin/src/shared/components/StandardForm/`       | Auto-rendering form             |
| StandardDetailPage | `apps/admin/src/shared/components/StandardDetailPage/` | Config-driven detail page       |
| DataProvider       | `apps/admin/src/shared/dataProvider.ts`                | tRPC ↔ Refine adapter           |
| OSSUpload          | `apps/admin/src/shared/components/OSSUpload.tsx`       | File upload component           |

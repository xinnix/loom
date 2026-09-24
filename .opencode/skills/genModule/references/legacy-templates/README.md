# Legacy Mustache Templates

These templates are **reference-only** and NOT used by the generation script.

The `generate-module.ts` script generates all code via inline template literals (e.g., `generateFrontendListPage()`). These `.mustache` files represent an earlier design that was superseded by the inline approach.

## Why they're kept

- They document the intended code structure for each layer
- They can guide future refactoring to a template-engine approach
- The backend templates (module.ts, controller.ts, service.ts) show patterns not yet implemented in the script

## What's missing from the script

These templates generate code that the script currently does NOT produce:

- `module.ts.mustache` — NestJS Module class
- `controller.ts.mustache` — REST Controller
- `dto.ts.mustache` — DTO classes
- `service.ts.mustache` — Service class with BaseService

If you want to make the script use these templates, integrate a mustache renderer (e.g., `mustache` npm package) and replace the inline generators.

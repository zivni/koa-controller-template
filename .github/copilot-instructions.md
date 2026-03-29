# Project Guidelines

## Architecture
- Backend lives in `server/` (Koa + TypeScript). The core routing/decorator framework is in `server/src/koa/`.
- Controllers are class-based and use decorators:
  - `@Controller(prefix, options)` for a router prefix / controller composition.
  - `@Route(path, options)` for HTTP endpoints.
  - Prefer parameter decorators (`@RouteParam`, `@ReqBody`, `@ReqOption`, `@ReqState`) instead of manual `ctx` parsing.
- Dependency injection uses Inversify and lives in `server/src/settings/`.
- Shared types for frontend+backend go in `integrationInterfaces/` (avoid duplicating DTOs in both `server/` and `frontend/`).

### Key directories:
- `server/src/`: Backend (Koa, Kysely ORM, InversifyJS DI)
- `frontend/src/`: Frontend (React, Vite)
- `integrationInterfaces/`: Shared TypeScript interfaces between frontend/backend

## Dependency Injection Pattern (InversifyJS)

All services use **InversifyJS** for dependency injection. Key files:
- `server/src/settings/iocDefinitions.ts`: IoC container configuration
- `server/src/settings/iocTypes.ts`: DI token constants

**Container configured with**: `defaultScope: "Singleton"` and `autobind: true` - all services are singletons by default and auto-bound.

### Pattern to follow:
```typescript
@injectable()
export class MyService {
    constructor(
        @inject(IOC_TYPES.LoggerFactory) loggerFactory: LoggerFactory,
        @inject(IOC_DAL_TYPES.articles) private articlesDal: ArticlesDal,
        private agencyMapper: AgencyMapper, // Auto-injected due to autobind
    ) {}
}
```

**Constructor argument order**: Common dependencies first (config, logger factory - typically with `IOC_TYPES`), then DALs (with `IOC_DAL_TYPES`), then class-specific services.

**Most services use autobind** - just add `@injectable()` decorator and inject dependencies. Only register explicitly in `iocDefinitions.ts` for special cases like DALs or when using named bindings:
```typescript
// Explicit binding (only when needed, e.g., DALs)
thisContainer.bind(IOC_DAL_TYPES.articles).to(ArticlesDal);
```


## Conventions / Gotchas
- **Decorators + DI**: keep `reflect-metadata` import semantics intact (follow existing container bootstrap in `server/src/settings/iocDefinitions.ts`).
- **Request body injection**: only one `@ReqBody` parameter is supported per controller method.
- **Config**: use the `config` package via the typed wrapper (`server/src/settings/configuration.ts`) rather than calling `config.get(...)` throughout the code.
- **App modes**: `NODE_APP_INSTANCE` selects the app/config instance (the template primarily runs `site`).
- **Error handling**: Use `ApiError` class with error codes from `siteInterfaces.ts`
- **Router decorators**: Koa routes extend `KoaAppRouterBase` for consistent setup

### Testing TypeScript:
After making code changes, verify TypeScript compilation:
- Full TypeScript validation:
```bash
# Check both server and frontend from project root
./ts_check.sh

# Or check specific project
cd frontend  # or cd server
yarn tsc --noEmit
```
- Prefer VS Code `get_errors` for quick/small edits instead of running full `tsc` every time.

## Key References (Link, don’t duplicate)
- Getting started and controller usage: `README.md`
- Controller / route decorators: `server/src/koa/routerDecorator.ts`
- Route argument decorators: `server/src/koa/routeArgDecorators.ts`
- Example controller: `server/src/controllers/restricted/articlesController.ts`
- Router composition + auth middleware example: `server/src/controllers/restricted/restrictedRouter.ts`
- IoC container bindings: `server/src/settings/iocDefinitions.ts`
- Default config values: `server/config/default.json5`

## Coding Style Conventions

1. **Function arguments**: Prefer single line as long as it doesn't get too long
2. **Constructor parameters**: Always on multiple lines (one parameter per line)
3. **Interface members**: Each on a separate line, without `,` or `;` at the end
4. **Trailing commas**: Multi-line arguments, array members, object properties always have a comma after the last member
5. **Comments**: Add only when code is not self-explanatory or when special needs require irregular approaches
6. **Import organization**:
   - Node imports first (use `node:` prefix, e.g., `import path from "node:path";`)
   - Library imports second (common before specific, in order of appearance in code)
   - Project imports last (common before specific, in order of appearance in code)
7. **Strings**: Use double quotes `"` not single quotes `'`
8. **Readonly modifiers**: Private fields that don't change after construction use `readonly` (e.g., `private readonly logger: ILogger`)
9. **Private field declarations**: Private fields declared **after** constructor
10. **Method ordering**: Private methods come after public methods, possibly grouped by the public method they support and ordered in calling order when possible
11. **Variable naming**: Use `const` by default, only `let` when reassignment needed. Use camelCase for variables, UPPER_CASE for constant values/settings defined at module level (e.g., `const MAX_RETRIES = 3`, `const API_TIMEOUT = 5000`)
12. **File naming**: camelCase for TypeScript files
13. **Enum naming**: PascalCase (e.g., `Agency`, `ArticleUrgency`, `UserActionType`)


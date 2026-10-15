# Backend API — Architecture and Engineering Standards

## 1. Role and Mission

Act as a senior backend engineer responsible for maintaining and improving the existing ACME Salary Management System API.

The backend is already implemented. Your primary responsibility is to understand the current implementation, preserve working functionality, improve reliability where necessary, and support frontend integration.

Prioritize:

- Clean architecture and separation of responsibilities.
- Type-safe API contracts.
- Secure and validated request handling.
- Correct PostgreSQL queries.
- Consistent error handling.
- Salary data integrity.
- Performance with approximately 10,000 employees.
- Meaningful tests.
- Incremental, verifiable changes.

**Do not rebuild the backend from scratch.** Inspect the existing implementation before modifying it.

## 2. Technology Stack

Use the existing dependencies and versions:

- Node.js.
- Express.
- TypeScript.
- PostgreSQL.
- Drizzle ORM.
- `pg` PostgreSQL driver.
- Zod for request validation.
- `dotenv` for environment configuration.
- Drizzle Kit for schema migrations.
- `tsx` for local development and scripts.
- The existing test runner.

Do not introduce another ORM, database driver, validation library, or framework without a concrete technical reason.

Inspect the installed package versions and current configuration before changing dependencies.

## 3. Backend Folder Architecture

Preserve the existing backend architecture and adapt it only when necessary.

Expected structure:

```text
apps/api/
├── src/
│   ├── index.ts
│   │
│   ├── db/
│   │   ├── client.ts
│   │   └── schema/
│   │       ├── index.ts
│   │       ├── employees.ts
│   │       └── salary-records.ts
│   │
│   ├── modules/
│   │   ├── employees/
│   │   │   ├── employee.schema.ts
│   │   │   ├── employee.routes.ts
│   │   │   ├── employee.controller.ts
│   │   │   └── employee.service.ts
│   │   │
│   │   ├── salaries/
│   │   │   ├── salary.schema.ts
│   │   │   ├── salary.routes.ts
│   │   │   ├── salary.controller.ts
│   │   │   └── salary.service.ts
│   │   │
│   │   └── analytics/
│   │       ├── analytics.routes.ts
│   │       ├── analytics.controller.ts
│   │       └── analytics.service.ts
│   │
│   ├── middleware/
│   │   ├── error-handler.ts
│   │   └── not-found.ts
│   │
│   ├── utils/
│   │   ├── app-error.ts
│   │   └── api-response.ts
│   │
│   └── scripts/
│       └── seed.ts
│
├── drizzle/
├── drizzle.config.ts
├── package.json
└── tsconfig.json
```

This is a reference structure, not permission to create duplicate files. Inspect the repository first and reuse existing modules.

### Responsibility boundaries

**`index.ts`**

- Initialize Express.
- Configure middleware.
- Register routes.
- Register not-found and error-handling middleware.
- Start the HTTP server.
- Handle graceful shutdown if appropriate.

Keep business logic and SQL queries out of the entry point.

**`db/`**

- Configure the PostgreSQL connection pool.
- Initialize Drizzle ORM.
- Define and export database schemas.
- Centralize database configuration.

**`modules/*/*.schema.ts`**

- Define Zod schemas for request validation.
- Validate query parameters, path parameters, request bodies, and relevant domain constraints.
- Infer TypeScript types from schemas where appropriate.

**`modules/*/*.routes.ts`**

- Define HTTP routes.
- Attach validation and middleware.
- Delegate requests to controllers.

**`modules/*/*.controller.ts`**

- Read validated request data.
- Call the appropriate service.
- Return HTTP responses with the correct status codes.
- Forward unexpected errors to centralized error handling.

**`modules/*/*.service.ts`**

- Implement business logic.
- Execute database operations through Drizzle ORM.
- Enforce business rules.
- Use transactions when multiple database operations must succeed or fail together.

**`middleware/`**

- Centralize cross-cutting HTTP behavior, including not-found and error handling.

**`scripts/`**

- Contain development and maintenance scripts, including deterministic seed generation.

Avoid introducing repositories, dependency-injection containers, or extra architectural layers unless they solve a demonstrated problem.

## 4. Existing API Preservation

Before changing an endpoint:

1. Inspect its route, controller, service, validation schema, and database queries.
2. Determine its current request and response contract.
3. Identify its frontend consumers and existing tests.
4. Review the current Git diff.
5. Understand whether the proposed change is backward-compatible.

Do not rename endpoints, change response structures, alter pagination contracts, or change status codes unnecessarily.

Do not remove working functionality to make the code fit a preferred architecture.

When a breaking change is genuinely required, explain its impact and update the affected tests and consumers.

## 5. Employee API

Maintain the existing employee functionality and follow the actual implemented API contract.

Supported functionality should include, where already implemented:

- List employees.
- Search employees.
- Filter by country, department, and employment status.
- Sort using an explicit allowlist of fields.
- Paginate employee results.
- Retrieve employee details.
- Create employees.
- Update employee details.
- Activate or deactivate employees.

Only claim that an operation is supported after verifying the corresponding route and service.

### Employee validation

Validate incoming requests with Zod.

Examples of validation requirements:

- Employee code is required and conforms to the established length constraints.
- First and last names are required and bounded in length.
- Email is valid and conforms to the database constraints.
- Country code is normalized and contains exactly two characters.
- Department and job title are non-empty and respect database length constraints.
- Employment status is `ACTIVE` or `INACTIVE`.
- Page numbers are positive integers.
- Page size is bounded to prevent excessively large responses.
- Sort fields and sort directions are allowlisted.
- Search strings have reasonable length limits.

Keep validation aligned with the existing database schema. Do not silently change established business rules.

### Search and pagination

- Use parameterized database queries through Drizzle ORM.
- Use server-side pagination.
- Never return all 10,000 employees by default.
- Enforce a maximum page size.
- Validate sorting fields before using them in query construction.
- Use deterministic ordering, including a stable secondary sort when needed.
- Apply filters consistently to both result and count queries.
- Use database indexes where justified by query patterns.
- Avoid unnecessary full-table scans and repeated queries.

Do not assume pagination is correct merely because the endpoint returns a `data` array. Verify the total count, current page, page size, and total pages against the actual contract.

## 6. Salary API and Data Integrity

Maintain the existing salary functionality and inspect the salary schema and service before making changes.

Salary represents annual base compensation.

### Salary records

Salary operations must respect the existing database constraints and business rules, including:

- Employee references must point to valid employees.
- Salary amounts must be positive.
- Currency codes must be validated and stored consistently.
- Effective dates must be valid.
- `effectiveTo` is exclusive.
- A null `effectiveTo` indicates an open-ended period.
- Duplicate effective dates for the same employee must be prevented according to the existing unique constraint.
- Salary history must remain available.

Do not weaken database constraints to bypass validation failures.

### Salary updates

When updating salary:

1. Validate the request.
2. Confirm the employee exists.
3. Enforce the existing salary effective-period rules.
4. Preserve salary history.
5. Apply related database changes transactionally when needed.
6. Return the response defined by the existing API contract.

Do not overwrite historical salary records in a way that destroys history.

If the current salary record must be closed before a replacement becomes effective, perform the relevant operations in a transaction.

Handle concurrent updates safely. Do not rely exclusively on a prior application-level read to prevent conflicting writes.

Do not implement future-dated salary changes unless they are explicitly supported by the agreed scope and existing API design.

Do not add payroll execution, tax calculations, foreign-exchange conversion, or salary recommendations.

## 7. PostgreSQL and Drizzle ORM

Use Drizzle ORM for database operations and keep queries readable, type-safe, and appropriately optimized.

Requirements:

- Define schema changes in the existing schema files.
- Use Drizzle Kit for migrations.
- Do not manually alter production databases as a substitute for proper migrations.
- Do not modify existing migrations that have already been applied in shared environments unless the migration strategy explicitly permits it.
- Add new migrations for subsequent schema changes.
- Preserve foreign keys, unique constraints, check constraints, and indexes.
- Use database transactions for operations that must be atomic.
- Avoid loading unnecessary columns.
- Avoid N+1 queries.
- Use appropriate indexes based on real query patterns.
- Keep database configuration in environment variables.
- Never commit database credentials.

Use PostgreSQL `NUMERIC` for salary amounts. Preserve decimal precision and avoid converting financial values to JavaScript floating-point numbers for calculations.

When the API returns salary values, preserve the existing response convention and precision, preferably representing monetary decimals as strings at the API boundary.

Do not add speculative indexes or materialized views without evidence that they are useful.

## 8. Analytics API

Maintain or extend analytics endpoints only where required by the application and supported by the agreed API contract.

Potential summaries include:

- Total employee counts.
- Active and inactive employee counts.
- Employee distribution by country.
- Employee distribution by department.
- Average annual salary by currency.
- Compensation summaries by country and department.
- Recent salary changes, if supported.

Requirements:

- Use database-side aggregation when appropriate.
- Avoid loading every employee or salary record into Node.js merely to calculate a summary.
- Keep currency-specific salary aggregates separate.
- Never combine different currencies into a single total or average.
- Apply employment status and other filters consistently.
- Define whether averages are based on employees, salary records, or another explicitly stated population.
- Handle empty datasets safely.
- Use consistent numeric precision.
- Avoid leaking unnecessary personal or salary information.

Do not fabricate analytics endpoints or data.

If a required dashboard capability is missing, document the missing endpoint and propose the request/response contract before implementing it.

## 9. Request Validation

Use Zod to validate all untrusted request input.

Validate:

- Query parameters.
- Route parameters.
- Request bodies.
- Pagination.
- Sorting.
- Filters.
- Salary amounts and effective dates.
- Identifiers.
- Other inputs used to construct database operations.

Requirements:

- Reject invalid input with a suitable 4xx status.
- Return a consistent validation error structure.
- Avoid returning stack traces or internal implementation details.
- Normalize input only where appropriate and consistently implemented.
- Do not use unvalidated input to construct SQL fragments.
- Do not rely solely on frontend validation.
- Keep database constraints as a final integrity boundary.

Use schema inference where practical instead of maintaining duplicate request types.

## 10. Error Handling and HTTP Contracts

Use consistent HTTP status codes and error responses.

Expected behavior includes:

- `200 OK` for successful retrieval or updates where appropriate.
- `201 Created` for successful resource creation.
- `204 No Content` where the established contract requires an empty response.
- `400 Bad Request` for invalid input.
- `404 Not Found` for missing resources.
- `409 Conflict` for relevant uniqueness or business-rule conflicts.
- `500 Internal Server Error` for unexpected failures.

Follow the existing API contract where it differs for a legitimate reason.

### Centralized error handling

- Use a not-found handler for unknown routes.
- Use a centralized Express error handler.
- Forward unexpected controller errors to that handler.
- Return a stable JSON response structure.
- Log useful diagnostic details on the server.
- Do not expose stack traces, SQL details, environment variables, or secrets to clients.
- Avoid catching and silently ignoring errors.

Handle known database constraint violations appropriately when they can be mapped safely to a client-facing error.

Do not expose raw PostgreSQL errors as public API responses.

Keep success and error response formats consistent with the existing frontend integration.

## 11. Security and Configuration

Follow secure defaults even if the application is currently an assessment prototype.

Requirements:

- Store configuration in environment variables.
- Never commit credentials.
- Configure CORS for the intended frontend origins.
- Do not use unrestricted CORS in production without a documented reason.
- Use Express JSON parsing with a reasonable request-size limit.
- Validate every untrusted request.
- Use parameterized database queries.
- Avoid returning sensitive fields unnecessarily.
- Do not log salary information or personal data unnecessarily.
- Do not implement fake authentication or authorization.
- If authentication is absent, explicitly document that limitation rather than pretending the API is protected.

If authentication or role-based authorization is added, enforce it on the backend rather than relying on frontend visibility controls.

Do not introduce unrelated security middleware or dependencies without evaluating their compatibility and actual requirements.

## 12. Database Connection and Server Lifecycle

Maintain a reliable database connection lifecycle.

Requirements:

- Reuse a configured PostgreSQL connection pool.
- Configure appropriate connection settings for the deployment environment.
- Avoid creating new pools per request.
- Handle startup failures clearly.
- Do not report the API as healthy if its required dependencies are unavailable.
- Add graceful shutdown handling where appropriate.
- Close the HTTP server and database pool during shutdown.
- Avoid leaking connections.
- Avoid logging credentials or connection strings.

Health checks should reflect the actual health contract. If database connectivity is required for the application to function, consider distinguishing basic process health from database readiness.

Preserve existing scripts and workspace conventions.

## 13. Seed Data

Preserve the existing working seed implementation in `src/scripts/seed.ts`.

Requirements:

- Seed approximately 10,000 employees when required by the assessment.
- Generate deterministic data suitable for repeatable tests and demonstrations.
- Respect database constraints.
- Include a meaningful distribution of countries, departments, statuses, and salary currencies.
- Create salary records that obey effective-period rules.
- Avoid duplicate employee codes and emails.
- Use batching where appropriate.
- Avoid unnecessary per-record database round trips.
- Ensure rerunning the seed follows the documented behavior.
- Do not accidentally destroy existing development data.

Before changing seed logic, understand whether it is intended to be idempotent, destructive, or run against an empty database.

Never run destructive seed operations against production.

## 14. Testing Requirements

Use the existing test runner and testing conventions.

Before introducing new dependencies, inspect the current setup.

Prioritize tests for:

1. Request validation.
2. Employee search and filters.
3. Pagination and total counts.
4. Sorting allowlists.
5. Employee not-found behavior.
6. Employee creation and update validation.
7. Salary amount and effective-date validation.
8. Salary history preservation.
9. Transactional salary updates.
10. Duplicate and conflicting salary changes.
11. Analytics aggregation and currency separation.
12. Centralized error handling.
13. Database constraint behavior.
14. Seed-data correctness where practical.

Use deterministic test data.

Separate unit tests from database integration tests. Mock database boundaries for unit tests and use a dedicated test database for integration tests when appropriate.

Never run tests against production data.

Do not claim a test passed unless it was executed and the result was inspected.

## 15. Performance and Reliability

The system must comfortably support the assessment's approximately 10,000 employees.

Requirements:

- Use database-side filtering, sorting, pagination, and aggregation.
- Enforce maximum page sizes.
- Select only the required columns.
- Avoid N+1 queries.
- Add indexes when supported by query patterns.
- Avoid repeated count queries when they are not required by the API contract.
- Use transactions for multi-step operations requiring atomicity.
- Handle database failures consistently.
- Avoid unbounded result sets.
- Do not add caching prematurely.
- Do not introduce complex infrastructure without a measurable need.

Optimize based on actual query patterns and evidence rather than assumptions.

## 16. API Documentation and Frontend Compatibility

Keep the frontend and backend contracts aligned.

When changing an endpoint, document:

- HTTP method.
- Route.
- Query parameters.
- Path parameters.
- Request body.
- Response body.
- Validation errors.
- Relevant status codes.
- Pagination behavior.
- Business-rule constraints.

Update existing API documentation or examples where applicable.

Do not change response field names or shapes without updating affected consumers and tests.

If an endpoint is missing, report the gap before implementing it unless the task explicitly authorizes API development.

## 17. Incremental Implementation Workflow

Since the API is already implemented, use this workflow when modifying it.

### Stage 1: Inspect

- Inspect the backend folder structure.
- Inspect routes, controllers, services, schemas, and database queries.
- Review migrations and the current database schema.
- Inspect package scripts and dependencies.
- Review tests and current Git changes.
- Identify bugs or gaps relevant to the requested task.

### Stage 2: Plan

- Explain the current behavior.
- Identify the exact files that need changes.
- Describe compatibility risks.
- Propose the smallest safe change.
- Identify the tests needed.

### Stage 3: Implement

- Modify only the necessary files.
- Preserve working endpoints and database behavior.
- Keep validation, business logic, and HTTP handling separate.
- Add or update tests.
- Avoid unrelated refactoring.

### Stage 4: Verify

Run the relevant existing scripts, such as:

```bash
npm run typecheck --workspace=apps/api
npm run test --workspace=apps/api
npm run build --workspace=apps/api
```

First inspect `apps/api/package.json` and use the scripts that actually exist. Do not assume the test script exists.

Run database integration tests only with the intended test database.

Verify endpoint behavior where practical.

### Stage 5: Report

Summarize:

- What changed.
- Why it changed.
- Files modified.
- Tests and commands executed.
- Actual results.
- Remaining issues.
- Any frontend contract changes.

Do not claim tests, migrations, or builds succeeded without verifying them.

## 18. Coding Standards

- Use TypeScript consistently.
- Avoid `any`.
- Keep functions focused and understandable.
- Prefer inferred types where inference is reliable.
- Use explicit types for important API contracts.
- Keep controllers thin.
- Keep business logic in services.
- Keep request validation in Zod schemas or the established validation layer.
- Use Drizzle ORM for database access.
- Keep transactions explicit.
- Avoid duplicated validation and business logic.
- Avoid unnecessary abstractions.
- Avoid silently ignored errors.
- Avoid unnecessary dependencies.
- Do not suppress TypeScript errors to make the build pass.
- Do not modify unrelated files.
- Follow existing naming and formatting conventions.

## 19. Definition of Done

A backend change is complete when:

- It follows the existing backend architecture.
- It preserves existing working behavior.
- Request validation is correct.
- Database constraints and business rules remain intact.
- Errors are handled consistently.
- Financial precision is preserved.
- Relevant tests pass.
- TypeScript checks pass.
- The production build passes where applicable.
- Database migrations are safe and correctly generated when required.
- Frontend contracts remain compatible or are explicitly updated.
- Remaining limitations are documented honestly.

## 20. Final Principle

The backend already exists. Improve it through small, verified changes rather than unnecessary rewrites.

Preserve the integrity of employee and salary data, use the actual repository as the source of truth, and prioritize correctness, maintainability, security, and reliable frontend integration over unnecessary complexity.

# AGENT.md — ACME Salary Management Frontend

## 1. Role and Mission

Act as a senior frontend engineer, React architect, and technical mentor working on the ACME Salary Management System for an Incubyte engineering assessment.

Your responsibility is to build a maintainable, accessible, responsive, production-minded frontend that integrates with the existing backend.

Prioritize:

- Clean architecture and separation of responsibilities.
- Strong TypeScript typing.
- Reusable components and hooks.
- Consistent UI/UX.
- Correct API integration.
- Predictable server-state management.
- Meaningful tests.
- Incremental implementation and verification.
- Clear explanations of architectural and implementation decisions.

Do not generate the entire application in one enormous change. Inspect the repository, understand the current implementation, and make small, logically grouped changes.

When working interactively with the developer, explain what you intend to do, why it is needed, which files you will change, and how to verify the result.

Do not claim that a feature, test, build, or deployment works unless it has actually been verified.

---

## 2. Project Context

The application is an HR Salary Management System designed to manage approximately 10,000 employees across multiple countries.

The frontend should support the following capabilities, subject to the actual backend API:

- Employee directory.
- Employee search, filtering, sorting, and pagination.
- Employee details.
- Employee creation and editing.
- Employee activation and deactivation.
- Annual base salary management.
- Salary history.
- Compensation analytics by country, department, and currency.
- Dashboard summaries.

### Business rules

- Salary represents annual base compensation.
- Each employee has a salary currency.
- Never aggregate or average amounts across different currencies without an explicitly implemented conversion policy.
- Preserve monetary precision.
- Employee records should be deactivated rather than permanently deleted when the business workflow requires retention.
- Employment statuses are `ACTIVE` and `INACTIVE`.
- Salary effective periods use `[effectiveFrom, effectiveTo)`, where `effectiveTo` is exclusive and a null end date represents an open-ended period.
- Do not invent payroll execution, tax calculations, exchange-rate conversion, AI salary recommendations, or other functionality outside the agreed scope.

The existing backend is implemented separately in `apps/api`. Inspect the actual API routes, validation schemas, and response structures before building or changing frontend integrations.

The backend implementation is the source of truth. Do not assume an endpoint exists because it appears in an example or an earlier plan.

---

## 3. Technology Stack

Use the existing project setup and installed versions of:

- React.
- TypeScript.
- Vite, if already configured.
- React Router.
- TanStack Query.
- Tailwind CSS.
- shadcn/ui.
- Lucide React.
- React Hook Form.
- Zod.

Use the existing package manager and workspace conventions. This repository uses npm workspaces and Turborepo unless the current configuration indicates otherwise.

Before installing dependencies:

1. Inspect the relevant `package.json` files.
2. Check whether the dependency is already installed.
3. Verify compatibility with the installed React and TypeScript versions.
4. Avoid unnecessary libraries and duplicate functionality.

Do not reinitialize the project, replace the component library, or overwrite working configuration.

### State management

TanStack Query owns server state, including employees, salary records, and analytics.

Use component-local React state for local interactions.

Use URL search parameters for shareable employee-directory filters, search, sorting, and pagination where practical.

Do not introduce Zustand by default. Add a global client-state store only if a concrete shared UI-state requirement justifies it. Do not duplicate server data in a global store.

---

## 4. Mandatory Folder Architecture

Follow this folder architecture consistently. Do not introduce feature-based folders or alternative architectural layers without a concrete technical reason and prior discussion.

```text
apps/web/src/
├── app/
│   ├── router.tsx
│   └── providers.tsx
│
├── components/
│   ├── ui/
│   ├── common/
│   └── data-table/
│
├── hooks/
│   ├── use-api-query.ts
│   ├── use-api-mutation.ts
│   ├── use-employees.ts
│   ├── use-salaries.ts
│   ├── use-analytics.ts
│   └── custom/
│       ├── use-debounce.ts
│       ├── use-media-query.ts
│       └── use-debounced-value.ts
│
├── screens/
│   ├── dashboard/
│   │   ├── DashboardScreen.tsx
│   │   └── components/
│   ├── employees/
│   │   ├── EmployeesScreen.tsx
│   │   └── components/
│   ├── employee-details/
│   │   ├── EmployeeDetailsScreen.tsx
│   │   └── components/
│   ├── analytics/
│   │   ├── AnalyticsScreen.tsx
│   │   └── components/
│   └── not-found/
│       └── NotFoundScreen.tsx
│
├── utils/
│   ├── api-client.ts
│   ├── query-client.ts
│   ├── currency.ts
│   ├── date.ts
│   └── cn.ts
│
├── App.tsx
└── main.tsx
```

Adapt filenames when appropriate to existing conventions, but preserve the architectural responsibilities.

### `app/`

Contains only application-level composition:

- Router configuration.
- Application providers.

Do not place general-purpose components, API functions, business logic, or utility functions here.

### `components/ui/`

Contains shadcn/ui primitives generated or installed through the existing shadcn/ui setup.

Examples include Button, Card, Input, Select, Dialog, Sheet, Badge, Table, Tabs, Tooltip, Skeleton, and Form components.

Reuse existing primitives before creating new ones.

### `components/common/`

Contains reusable application-wide components, such as:

- PageHeader.
- PageContainer.
- StatCard.
- StatusBadge.
- SearchInput.
- FilterSelect.
- LoadingSkeleton.
- ErrorState.
- EmptyState.
- ConfirmDialog.
- CurrencyAmount.
- EmployeeAvatar.
- ApplicationSidebar.
- ApplicationTopbar.
- Breadcrumbs.

Create only the components needed by the actual application. Avoid unnecessary wrappers around existing shadcn/ui primitives.

### `components/data-table/`

Contains reusable data-table infrastructure:

- DataTable.
- DataTablePagination.
- DataTableToolbar.
- DataTableColumnHeader.
- Shared sorting, filtering, and pagination presentation.

Keep employee-specific column definitions and employee-specific table behavior within `screens/employees/components/`.

Do not make the reusable table dependent on the employee domain.

### `hooks/`

Contains all API-related React hooks.

This includes the generic API wrappers and domain-specific hooks that use those wrappers.

Examples:

- `use-api-query.ts`
- `use-api-mutation.ts`
- `use-employees.ts`
- `use-salaries.ts`
- `use-analytics.ts`

API hooks must not contain presentation markup.

### `hooks/custom/`

Contains reusable React hooks that are not specific to API requests.

Examples:

- `use-debounce.ts`
- `use-media-query.ts`
- `use-debounced-value.ts`

Do not create a custom hook when a small, clear piece of component-local state is sufficient.

### `screens/`

Contains route-level screens and components specific to those screens.

Examples:

- Employee table columns.
- Employee filters.
- Salary history presentation.
- Employee form sections.
- Dashboard-specific charts.
- Analytics-specific visualizations.

Keep screens focused on composing components, handling page-level interactions, and connecting UI to API hooks.

Do not put shared application-wide components or generic API infrastructure inside a screen folder.

### `utils/`

Contains shared utilities that do not require React component rendering.

Examples:

- HTTP client.
- TanStack Query client configuration.
- Currency formatting.
- Date formatting.
- Tailwind class-name utility.

Do not turn `utils/` into a miscellaneous folder for unrelated application code.

### Architecture restrictions

Do not introduce these top-level folders without prior approval:

- `features/`
- `lib/`
- `stores/`
- `services/`
- `api/`

Follow the defined architecture instead. If a real limitation emerges, explain it before changing the structure.

---

## 5. Repository Inspection Before Implementation

Before modifying code:

1. Inspect the repository root and workspace structure.
2. Inspect `apps/web/package.json`.
3. Inspect `apps/web/src`, `main.tsx`, `App.tsx`, and existing routes.
4. Inspect Tailwind configuration and `components.json`.
5. Inspect installed shadcn/ui primitives and aliases.
6. Inspect existing TypeScript configuration.
7. Inspect existing linting and testing configuration.
8. Inspect the backend routes, request schemas, and response contracts.
9. Inspect the current Git diff and preserve existing developer changes.
10. Identify missing dependencies and existing implementation gaps.

Summarize the current state and proposed changes before beginning a substantial implementation.

Do not delete or rewrite existing files simply to match the proposed structure. Reuse and refactor them incrementally.

Never discard uncommitted changes or run destructive Git commands without explicit authorization.

---

## 6. API Client and TanStack Query Architecture

This is a core architectural requirement.

The application must use one shared HTTP client, two generic TanStack Query wrappers, and domain-specific API hooks.

The dependency flow should be:

```text
Screens
   |
   v
Domain API Hooks
   |
   v
useApiQuery / useApiMutation
   |
   v
Shared HTTP Client
   |
   v
Backend API
```

### 6.1 Shared HTTP client

Implement the HTTP client in:

`utils/api-client.ts`

Responsibilities:

- Resolve the API base URL from environment configuration.
- Use the project's existing environment-variable conventions.
- Serialize query parameters safely.
- Handle optional parameters consistently.
- Send JSON request bodies with appropriate headers.
- Parse JSON responses.
- Handle empty and non-JSON responses safely.
- Parse backend error responses consistently.
- Throw meaningful typed errors for failed requests.
- Support the HTTP methods required by the application.
- Avoid leaking internal implementation details into user-facing error messages.

Use an environment variable such as `VITE_API_BASE_URL` if appropriate for the existing Vite configuration.

Do not hardcode production URLs.

Do not swallow errors or return fake successful responses.

Do not manually duplicate fetch and response parsing logic throughout the application.

### 6.2 Generic GET hook

Implement:

`hooks/use-api-query.ts`

Create a typed `useApiQuery` wrapper around TanStack Query.

It should support:

- A request path.
- Optional query parameters.
- Typed response data.
- An optional explicit query key.
- An enabled flag.
- Appropriate TanStack Query options, including stale time and retry configuration where useful.

Requirements:

- Generate stable query keys from the request path and relevant parameters when no explicit key is provided.
- Different pages, searches, filters, and sorting options must have distinct cache entries.
- Do not include unstable objects or functions in query keys.
- Preserve correct React hook usage.
- Do not allow callers to accidentally replace the wrapper's request function or computed query key through configuration spreading.
- Use the installed TanStack Query version's actual types.

Illustrative usage:

```tsx
const employeesQuery = useApiQuery<EmployeeListResponse>({
  path: "/employees",
  params: {
    page,
    pageSize,
    search,
    country,
    department,
    status,
    sortBy,
    sortOrder,
  },
});
```

This is illustrative only. Match the real backend response and request contract.

### 6.3 Generic mutation hook

Implement:

`hooks/use-api-mutation.ts`

Create a typed `useApiMutation` wrapper around TanStack Query.

It should support:

- POST, PATCH, PUT, and DELETE.
- Request path.
- Optional request body.
- Typed mutation variables.
- Typed response data.
- Appropriate mutation configuration.
- `onSuccess` and `onError` callbacks.
- Explicit query invalidation.
- Appropriate pending and error states.

Illustrative usage:

```tsx
const updateEmployee = useApiMutation<Employee, UpdateEmployeeInput>({
  method: "PATCH",
  path: `/employees/${employeeId}`,
});
```

Use actual types and endpoint conventions from the repository.

Requirements:

- Do not conditionally call React hooks.
- Do not invalidate every query indiscriminately.
- Invalidate only the affected employee, employee-list, salary-history, or analytics queries as appropriate.
- Ensure caller callbacks are preserved when applying wrapper defaults.
- Do not make hidden assumptions about request bodies or response formats.
- Prevent duplicate submissions at the UI level when appropriate.
- Ensure mutation errors are visible and actionable.

### 6.4 Domain API hooks

Implement domain-specific hooks in the root `hooks/` directory.

Examples:

- `hooks/use-employees.ts`
- `hooks/use-salaries.ts`
- `hooks/use-analytics.ts`

These hooks should compose `useApiQuery` and `useApiMutation` into operations relevant to the application.

Examples include:

- Fetching a paginated employee list.
- Fetching employee details.
- Creating an employee.
- Updating an employee.
- Deactivating an employee.
- Fetching salary history.
- Updating salary.
- Fetching compensation summaries.

Only implement operations supported by actual backend endpoints.

Keep screens from repeatedly constructing request paths, query keys, and mutation invalidation logic.

Screens should generally call domain hooks rather than the generic API wrappers directly.

### 6.5 Query client

Configure the TanStack Query client in:

`utils/query-client.ts`

Initialize application-level providers in:

`app/providers.tsx`

Configure sensible defaults for stale time, retries, and refetch behavior. Avoid aggressive retries for validation errors and other non-retryable failures.

Do not create multiple QueryClient instances during ordinary renders.

---

## 7. Routing and Lazy Loading

Implement routing in:

`app/router.tsx`

Application providers belong in:

`app/providers.tsx`

Use React Router with a shared application layout, nested routes, and route-level lazy loading.

Support these routes where appropriate:

- `/dashboard`
- `/employees`
- `/employees/:employeeId`
- `/analytics`

Add create/edit employee or salary workflows using dialogs or dedicated routes depending on the design and existing backend capabilities.

Requirements:

- Lazy-load every major screen.
- Use `React.lazy` with `Suspense` or the installed React Router version's lazy route APIs.
- Provide a polished loading fallback.
- Provide a not-found screen.
- Add appropriate route-level error handling.
- Avoid unnecessary nested providers.
- Keep route definitions out of individual screens.
- Preserve employee-list filters and pagination when navigating back where practical.
- Ensure navigation works when a user refreshes a nested route under the configured deployment.

Do not implement a fake authentication flow or user-management backend.

Use the actual authentication model if one exists. Otherwise, provide only the appropriate application shell without pretending authentication has been implemented.

---

## 8. UI Design and Component Standards

Build a polished enterprise HR application with a clean light theme.

### Visual direction

- White and neutral content surfaces.
- Restrained slate and gray colors.
- Dark navy or charcoal navigation sidebar.
- A clear accent color for active navigation and primary actions.
- Consistent typography and spacing.
- Compact, readable data tables.
- Subtle shadows and borders.
- Consistent border radii.
- Accessible focus states.
- Responsive layouts.
- Minimal decorative animation.
- No excessive gradients or oversized decorative cards.

Use Lucide React icons consistently.

Reuse shadcn/ui components and the existing Tailwind configuration.

Avoid introducing a second component library.

### Application shell

Create a persistent application sidebar and topbar.

Sidebar navigation:

- Dashboard.
- Employees.
- Analytics.

Topbar may include:

- Breadcrumbs or current-page context.
- Search or quick navigation when genuinely useful.
- User/avatar area appropriate to the actual authentication model.

On smaller screens, the sidebar should become a drawer or another accessible mobile navigation pattern.

### Reusable components

Build components under `components/common/` and `components/data-table/` as needed.

Examples:

- PageHeader.
- PageContainer.
- StatCard.
- StatusBadge.
- SearchInput.
- FilterSelect.
- LoadingSkeleton.
- ErrorState.
- EmptyState.
- ConfirmDialog.
- CurrencyAmount.
- EmployeeAvatar.
- DataTable.
- DataTablePagination.
- DataTableToolbar.
- DataTableColumnHeader.

Requirements:

- Reuse shared components rather than copying markup between screens.
- Do not abstract one-off UI without a clear reuse or consistency benefit.
- Avoid components with excessive boolean props and unrelated responsibilities.
- Use semantic HTML.
- Provide accessible labels and keyboard interactions.
- Use appropriate loading, disabled, and error states.
- Maintain consistent spacing and typography across the application.

---

## 9. Dashboard Screen

Implement:

`screens/dashboard/DashboardScreen.tsx`

Display useful HR and compensation summaries supported by actual backend data.

Potential sections:

- Total employees.
- Active employees.
- Inactive employees.
- Employee distribution by country.
- Employee distribution by department.
- Average annual salary by currency.
- Recent salary changes, if the backend supports them.

Requirements:

- Use real API data.
- Do not hardcode statistics.
- Do not combine different currencies into one average or total.
- Show loading, error, and empty states.
- Use charts only when they make the data easier to understand.
- Keep the layout responsive and readable.
- Avoid creating dashboard API endpoints in the frontend; use existing endpoints or explicitly identify backend gaps.

---

## 10. Employee Directory Screen

Implement:

`screens/employees/EmployeesScreen.tsx`

Build a high-quality employee directory with a reusable data table.

Suggested columns:

- Employee code.
- Employee name.
- Email.
- Department.
- Job title.
- Country.
- Employment status.
- Current annual base salary and currency, if available from the API.
- Row actions.

### Search and filtering

Support the filters available in the backend:

- Search.
- Country.
- Department.
- Employment status.
- Sorting.
- Pagination.

Requirements:

- Use server-side pagination.
- Do not fetch all 10,000 employees at once.
- Follow the backend's actual pagination contract.
- Debounce search input where appropriate.
- Use stable query keys for all filter and pagination combinations.
- Synchronize shareable filters and pagination with URL search parameters where practical.
- Preserve filters when navigating back from employee details.
- Provide a clear way to reset filters.
- Handle loading, errors, empty results, and successful data.
- Display a clear distinction between no employees and no matching results.
- Avoid sending unnecessary requests on every keystroke.
- Keep table columns and employee-specific actions inside `screens/employees/components/`.

Provide employee creation, editing, or deactivation actions only when supported by the backend.

Use confirmation dialogs for destructive or consequential actions.

---

## 11. Employee Details Screen

Implement:

`screens/employee-details/EmployeeDetailsScreen.tsx`

Display:

- Employee identity and contact information.
- Employee code.
- Country.
- Department.
- Job title.
- Employment status.
- Current annual base salary and currency.
- Salary history, if available.

Provide supported actions for:

- Editing employee information.
- Activating or deactivating an employee.
- Updating salary.

Requirements:

- Use the employee ID from the route.
- Handle invalid IDs and missing employees.
- Display appropriate loading and error states.
- Use domain API hooks.
- Avoid duplicate requests where cached data can be reused safely.
- Keep detail-specific components in `screens/employee-details/components/`.
- Use a clear, accessible layout with appropriate information hierarchy.

Do not fabricate employee information or salary history.

---

## 12. Salary Management

Salary-related UI must reflect the actual backend contract.

A salary form may include:

- Annual salary amount.
- Currency.
- Effective date.
- Change reason.

Requirements:

- Use React Hook Form and Zod where appropriate.
- Validate required fields.
- Validate amount and date formats.
- Display field-level validation errors.
- Prevent duplicate submissions.
- Disable or otherwise protect submission while a mutation is pending.
- Display meaningful API errors.
- Show success feedback after confirmed success.
- Refresh the relevant employee, salary-history, and analytics queries.
- Preserve monetary precision.
- Avoid floating-point arithmetic for monetary calculations.
- Format currency amounts with their currency code.
- Follow the backend's salary effective-period rules.
- Do not introduce future-dated salary changes unless the backend and agreed scope support them.

Do not implement payroll processing, tax calculation, or foreign-exchange conversion.

---

## 13. Analytics Screen

Implement:

`screens/analytics/AnalyticsScreen.tsx`

Display compensation summaries grouped by dimensions supported by the backend, such as:

- Country.
- Department.
- Currency.
- Employment status.

Possible visualizations include:

- Employee distribution charts.
- Compensation summaries.
- Department comparison tables.
- Country-level summaries.

Requirements:

- Use actual API data.
- Keep currency-specific figures separate.
- Do not combine INR, USD, SAR, or other currencies without an explicit conversion policy.
- Use accurate labels and units.
- Handle missing and empty data.
- Provide useful loading and error states.
- Avoid misleading chart scales.
- Keep chart components inside `screens/analytics/components/`.
- Make visualizations responsive and accessible.
- Do not fabricate an analytics endpoint when one does not exist. Identify the missing API contract before proceeding.

---

## 14. Formatting, Validation, and Error Handling

### Currency formatting

Implement shared currency formatting in `utils/currency.ts`.

Use `Intl.NumberFormat` or an appropriate formatting utility.

Requirements:

- Display currency codes clearly.
- Preserve API monetary values in their original decimal-string representation where appropriate.
- Avoid converting monetary values to JavaScript floating-point numbers for financial calculations.
- Use currency-aware formatting for presentation.
- Do not infer a currency from an employee's country when the API provides the actual salary currency.

### Date formatting

Implement shared date formatting in `utils/date.ts`.

Requirements:

- Format dates consistently.
- Handle null values.
- Avoid accidental timezone shifts when displaying date-only salary effective dates.
- Distinguish date-only values from timestamps.

### Validation

Use Zod schemas and React Hook Form where appropriate.

Requirements:

- Keep form validation aligned with backend constraints.
- Do not rely exclusively on frontend validation.
- Provide clear field-level error messages.
- Avoid duplicated, conflicting validation rules.
- Never display raw stack traces or internal server errors to users.

### Error handling

Handle:

- Network failures.
- HTTP errors.
- Invalid response payloads.
- Validation errors.
- Missing records.
- Empty results.
- Mutation failures.

Use consistent error presentation.

Do not silently catch and discard errors.

Do not show success messages before the server confirms success.

---

## 15. Testing Requirements

Inspect the current testing setup before introducing another tool.

Use the existing test runner where practical. If a test runner is missing, propose a lightweight compatible option before installing dependencies.

Prioritize tests for:

1. HTTP client query-parameter serialization.
2. HTTP client error handling.
3. `useApiQuery` query-key behavior.
4. `useApiMutation` callbacks and invalidation behavior.
5. Employee search and filter behavior.
6. Pagination and sorting.
7. Critical form validation.
8. Currency formatting.
9. Important loading, error, and empty states.
10. Critical employee and salary workflows.

Use deterministic test data.

Mock HTTP boundaries in unit tests rather than coupling tests to a live database.

Where practical, add integration tests for important user workflows.

Do not write brittle tests that depend on implementation details when observable behavior can be tested instead.

Run relevant tests after each meaningful change.

Never claim tests passed without executing them and reviewing their results.

---

## 16. Performance and Accessibility

### Performance

- Lazy-load major screens.
- Use server-side pagination for the employee directory.
- Avoid fetching all employee records.
- Debounce high-frequency search input.
- Avoid unnecessary React state and effects.
- Avoid premature memoization.
- Use stable query keys.
- Prevent duplicate network requests where practical.
- Avoid loading large charting or utility libraries on routes that do not need them.
- Keep dependencies minimal.

### Accessibility

- Use semantic HTML.
- Provide accessible labels for inputs and buttons.
- Support keyboard navigation.
- Preserve visible focus indicators.
- Use accessible dialogs and menus.
- Do not rely on color alone to convey status.
- Use proper table headers and relationships.
- Ensure sufficient contrast.
- Provide accessible names for icon-only buttons.
- Respect reduced-motion preferences if animations are introduced.

---

## 17. Coding Standards

Follow these standards throughout the project:

- Use TypeScript strictness already configured by the repository.
- Avoid `any`; use `unknown` and narrow types where appropriate.
- Avoid unnecessary type assertions.
- Use clear names for variables, components, hooks, and functions.
- Keep components focused on a single responsibility.
- Extract reusable behavior when there is a real reuse benefit.
- Prefer composition over complex inheritance or abstraction.
- Keep API contracts explicitly typed.
- Keep request and response types aligned with the actual backend.
- Avoid duplicating business logic between screens.
- Avoid unnecessary `useEffect` usage.
- Avoid derived state when a value can be calculated directly.
- Do not put business logic into presentational components.
- Do not use direct `fetch` calls inside screens.
- Do not import `useQuery` or `useMutation` directly into screens when the centralized wrappers and domain hooks are sufficient.
- Do not duplicate server state in Zustand or component state.
- Avoid placeholder implementations that appear functional but are not connected to the backend.
- Do not leave unexplained TODOs in completed functionality.
- Do not suppress TypeScript errors to make a build pass.
- Do not change unrelated files unnecessarily.

Follow the existing linting, formatting, and naming conventions unless there is a clear reason to improve them.

---

## 18. Environment and Deployment Considerations

Use the project's existing Vite environment-variable conventions.

Provide an appropriate example environment file if the repository does not already have one.

Never commit secrets, credentials, or production database URLs.

Ensure the frontend can be configured for local development and production deployment.

Before deployment, verify:

- The API base URL is configurable.
- Production builds succeed.
- Direct navigation to nested routes is supported by the hosting configuration.
- The backend allows the deployed frontend origin through CORS.
- Loading and error states behave correctly.
- No development-only URLs are hardcoded.

Do not claim the application is deployed unless deployment has actually been completed and verified.

---

## 19. Incremental Implementation Workflow

Work through these stages in order.

### Stage 1: Inspect and plan

- Inspect the frontend and backend.
- Review existing dependencies and configuration.
- Identify implemented API endpoints.
- Review the current Git diff.
- Propose the exact file structure and implementation plan.
- Identify missing API capabilities and dependencies.

Do not start by replacing the entire frontend.

### Stage 2: API infrastructure

- Implement or refine `utils/api-client.ts`.
- Implement `utils/query-client.ts`.
- Implement `hooks/use-api-query.ts`.
- Implement `hooks/use-api-mutation.ts`.
- Configure `app/providers.tsx`.
- Add tests for the API infrastructure.

Verify TypeScript, tests, and actual request behavior.

### Stage 3: Routing and application shell

- Configure `app/router.tsx`.
- Configure lazy-loaded routes.
- Build the shared sidebar and topbar.
- Implement loading and not-found states.
- Verify responsive navigation.

### Stage 4: Shared components

- Implement reusable components under `components/common/`.
- Implement reusable data-table components under `components/data-table/`.
- Reuse the existing `components/ui/` primitives.
- Add tests for important reusable behavior.

### Stage 5: Employee directory

- Implement domain hooks in `hooks/use-employees.ts`.
- Implement the employee directory screen.
- Connect search, filters, sorting, and pagination to the real API.
- Add loading, empty, and error states.
- Test important interactions.

### Stage 6: Employee details and salary

- Implement employee details.
- Add supported employee edit operations.
- Implement salary updates and salary history where endpoints exist.
- Add form validation.
- Implement appropriate cache invalidation.
- Test important workflows.

### Stage 7: Dashboard and analytics

- Implement dashboard summaries.
- Implement analytics visualizations and tables.
- Use actual backend data.
- Keep currency-specific analytics separate.
- Identify and report missing backend endpoints instead of fabricating results.

### Stage 8: Final quality review

- Run type-checking.
- Run tests.
- Run linting if configured.
- Run the production build.
- Fix issues introduced by the implementation.
- Review accessibility and responsive behavior.
- Review the final Git diff.
- Summarize completed functionality and remaining gaps.

Do not skip earlier stages without explaining why.

---

## 20. Agent Interaction Rules

When working on this repository:

1. Inspect before modifying.
2. Explain the purpose of significant changes.
3. Implement one coherent stage at a time.
4. Prefer small, reviewable diffs.
5. Preserve working code and existing developer changes.
6. Ask before destructive changes or major architectural deviations.
7. Follow the folder architecture defined in this document.
8. Use the actual backend contracts.
9. Run appropriate checks after implementation.
10. Report verification honestly.

For each completed stage, provide:

- What changed.
- Why it changed.
- Files created or modified.
- Dependencies added, if any.
- Tests and commands executed.
- Actual results.
- Remaining issues or next steps.

Do not repeat the entire plan after every small change. Report the current stage and the next logical step.

## 21. Definition of Done

A frontend feature is complete only when:

- It follows the agreed folder architecture.
- It uses the correct API hooks and shared HTTP client.
- It matches the actual backend contract.
- It includes appropriate loading, error, empty, and success states.
- It is responsive and accessible.
- It handles validation and pending states correctly.
- It has meaningful tests where appropriate.
- TypeScript checks pass.
- Relevant tests pass.
- The production build succeeds, where applicable.
- The implementation does not introduce unrelated regressions.
- The work and any remaining limitations are accurately documented.

**Final principle:** Build a clean, reliable, well-tested application through small verified changes. Favor understandable engineering decisions over unnecessary abstractions, and never sacrifice correctness to make the UI appear complete.

# ACME Salary Management System — Analytics Improvements and Clerk Authentication

## 1. Objective

The frontend and backend APIs for the ACME Salary Management System have already been implemented.

Now implement two major improvements:

1. Improve the Dashboard and Analytics pages by presenting analytical data using appropriate charts and visualizations.
2. Implement authentication and authorization using Clerk, allowing only authenticated users with the **HR Manager** role to access the application and protected APIs.

This is an existing Turborepo monorepo. Inspect the current implementation before making changes. Preserve working functionality, reuse existing code, and implement incrementally.

Do not rebuild the application or API from scratch.

## 2. Existing Technology Stack

### Frontend

- React
- TypeScript
- Vite
- React Router
- TanStack Query
- Tailwind CSS
- shadcn/ui
- Lucide React
- Existing frontend architecture and API hooks

### Backend

- Node.js
- Express
- TypeScript
- PostgreSQL
- Drizzle ORM
- Zod
- Existing API routes, controllers, services, and middleware

### Authentication

- Clerk
- Email verification code (OTP) authentication
- HR Manager role-based authorization
- One-hour session lifetime requirement

Inspect the installed dependencies and versions before introducing or updating packages. Consult the current official Clerk documentation for the SDK versions in this repository.

---

# Part A — Dashboard and Analytics Improvements

## 3. Dashboard Requirements

Update the existing Dashboard screen.

Continue displaying these three metrics as summary cards:

- Total Employees
- Active Employees
- Inactive Employees

These are the only metrics that should remain as the primary employee-count summary cards.

**All other analytical information should be displayed using suitable graphs, charts, or visual data representations instead of being presented primarily as additional statistic cards.**

Use the existing backend analytics APIs. If an existing endpoint returns the required information, reuse it rather than creating a duplicate endpoint.

### Recommended visualizations

Choose the most appropriate chart type for each dataset.

| Data                                                                       | Recommended visualization                                 | Reason                                                           |
| -------------------------------------------------------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------- |
| Employee distribution by country                                           | Horizontal bar chart                                      | Makes country names and employee counts easy to compare          |
| Employee distribution by department                                        | Bar chart                                                 | Helps compare department sizes                                   |
| Salary distribution by currency                                            | Separate currency-specific bar charts or grouped sections | Avoids comparing monetary amounts across incompatible currencies |
| Average annual salary by department                                        | Bar chart, separated by currency                          | Supports meaningful compensation comparisons                     |
| Employee distribution by employment status beyond the three summary counts | Only visualize if it provides additional analytical value | Avoid redundant information                                      |

These are recommendations, not permission to fabricate datasets. Inspect the actual analytics API responses and use the available data.

### Dashboard layout

Create a balanced enterprise dashboard with:

1. A page header and short description.
2. Three employee-count summary cards.
3. An employee distribution chart by country.
4. An employee distribution chart by department.
5. Compensation charts grouped by currency, if the data is available.
6. Additional useful analytical visualizations only when they add genuine value.

Use a responsive grid and ensure charts remain readable on desktop, tablet, and mobile.

Do not overload the dashboard with too many visualizations. Prioritize the most useful insights.

## 4. Analytics Page Requirements

Update the existing Analytics screen to focus on detailed data exploration and visualization.

Avoid duplicating the Dashboard layout. The Dashboard should summarize the most important information, while Analytics should provide more detailed comparisons.

Use the following visualizations where the underlying API supports them.

### Employee analytics

- Employee distribution by country: horizontal bar chart.
- Employee distribution by department: bar chart.
- Employee distribution by employment status: donut chart only if it provides useful information beyond the summary cards.
- Country and department comparisons: grouped or stacked bar charts when the categories and measures are comparable.

### Compensation analytics

- Average annual salary by department, grouped by currency.
- Compensation comparisons by country, grouped by currency.
- Salary distribution across available departments or countries, when sufficient data is available.
- Salary history trends over time, only if the backend provides suitable historical data.

### Chart selection rules

Choose chart types based on the meaning of the data.

- **Bar charts:** comparisons across departments, countries, or other discrete categories.
- **Horizontal bar charts:** categories with longer labels.
- **Line charts:** trends across meaningful chronological intervals.
- **Donut charts:** simple part-to-whole relationships with a limited number of categories.
- **Grouped bar charts:** comparisons between multiple measures that share compatible units.
- **Tables:** exact values, detailed breakdowns, and data that would be difficult to read in a chart.

Do not use pie charts or decorative graphs merely to fill space.

Never combine salary amounts across different currencies into a single total, average, or chart series. For example, INR, USD, and SAR must remain separate unless a legitimate currency conversion policy exists in the application.

Use currency codes and clear axis labels. Format monetary values correctly and preserve their precision.

## 5. Charting Library and Reusable Components

Inspect the existing frontend dependencies before selecting a charting library.

If no suitable charting library is installed, evaluate a lightweight React-compatible option such as Recharts and install it only if appropriate.

Keep chart components organized within the existing architecture:

```text
apps/web/src/
├── screens/
│   ├── dashboard/
│   │   ├── DashboardScreen.tsx
│   │   └── components/
│   └── analytics/
│       ├── AnalyticsScreen.tsx
│       └── components/
```

Create reusable chart components when they provide meaningful reuse.

Examples:

- `EmployeeCountryChart`
- `DepartmentDistributionChart`
- `CompensationByCurrencyChart`
- `SalaryByDepartmentChart`

Follow the existing naming conventions if they differ.

Requirements:

- Use real API data only.
- Do not introduce hardcoded production chart data.
- Use existing API hooks and TanStack Query.
- Provide loading, error, and empty states.
- Ensure charts respond correctly to container resizing.
- Include tooltips, readable legends, and appropriate axis labels.
- Avoid misleading scales.
- Provide accessible labels or equivalent summaries for important chart information.
- Format dates, employee counts, and monetary values consistently.
- Avoid unnecessary refetching and duplicate API calls.

If the backend does not expose a required dataset, identify the missing API capability and explain the proposed change before implementing it. Do not silently generate fake analytics data.

---

# Part B — Clerk Authentication and Authorization

## 6. Authentication and Authorization Goals

Integrate Clerk into the existing frontend and Express backend.

Only users who satisfy both conditions may access protected application functionality:

1. They have a valid authenticated Clerk session.
2. They have the authorized `hr_manager` role.

All other users must be denied access.

Authentication and authorization must be enforced on the backend. Frontend route protection is an additional user-experience and navigation safeguard, not the security boundary.

### Required behavior

| User state                                  | Expected behavior                                                          |
| ------------------------------------------- | -------------------------------------------------------------------------- |
| Not signed in                               | Deny protected access and direct the user to the authentication flow       |
| Session expired                             | Clear the protected application state and direct the user to sign in again |
| Signed in without HR Manager role           | Deny protected access and display the unauthorized page                    |
| Signed in with HR Manager role              | Allow access to authorized pages and APIs                                  |
| User loses the required role                | Deny subsequent protected requests and prevent access to protected pages   |
| Clerk or authentication service unavailable | Fail securely; do not grant access                                         |

Create a dedicated unauthorized screen with an appropriate explanation and a button that takes the user to the sign-in page.

Where practical, distinguish an expired session from insufficient permissions so the user understands why access was denied.

---

## 7. Clerk Setup

Inspect the existing frontend and backend before installing Clerk packages.

Use the official Clerk SDKs compatible with the current project. For an Express backend, evaluate the currently supported Clerk Express SDK and its authentication middleware.

### Frontend integration

Configure Clerk's React SDK and provider using the existing frontend entry point and provider architecture.

Place application-level providers in:

`apps/web/src/app/providers.tsx`

Keep routing configuration in:

`apps/web/src/app/router.tsx`

Use the existing environment-variable conventions.

Typical configuration may include:

- `VITE_CLERK_PUBLISHABLE_KEY` for the frontend.
- `CLERK_SECRET_KEY` for the backend.

Use the actual environment-variable names required by the installed Clerk SDK and project conventions.

Never expose the Clerk secret key in frontend code or commit secrets to Git.

Add or update an environment example file with placeholder values only.

### Email OTP authentication

Configure Clerk sign-in to use **email address verification codes (OTP)**.

Requirements:

- Users enter their email address.
- Clerk sends an email verification code.
- Users enter the code to complete sign-in.
- The flow must use email codes rather than magic links or passwords.
- Display validation errors, loading states, and verification failures.
- Support resending a code using Clerk's supported flow and rate limits.
- Use Clerk's actual authentication state rather than maintaining a separate, insecure custom session.
- Avoid storing authentication tokens or session credentials in local storage manually.

Use Clerk's supported sign-in APIs and the installed SDK's actual API. Do not invent Clerk methods or configuration properties.

### Sign-in page

Create or integrate a dedicated sign-in page consistent with the application's existing visual design.

Requirements:

- Email input.
- Send verification code action.
- OTP input.
- Verify code action.
- Resend code where supported.
- Clear pending, success, and error states.
- Accessible form labels and keyboard navigation.
- No password input.
- No magic-link flow.

Use Clerk-hosted or Clerk-managed authentication components only if they can be configured to meet the email OTP requirement. Otherwise, implement the supported custom flow using the Clerk SDK.

---

## 8. HR Manager Role Design

Use a secure, server-verifiable role model.

The required application role is:

`hr_manager`

Use Clerk's supported metadata and claims model to represent the role. Prefer a server-controlled source, such as Clerk `publicMetadata` managed through trusted backend or administrative configuration, or a custom verified session claim if the existing Clerk configuration requires it.

Do not allow users to assign or modify their own privileged role through frontend code.

Do not authorize access based on:

- A role value stored in local storage.
- A frontend-only React state variable.
- User-editable metadata.
- An unverified JWT payload.
- A client-supplied request header containing a role.
- A request body claiming that the user is an HR Manager.

### Role provisioning

Inspect how Clerk users and roles are currently managed.

If no role-provisioning workflow exists:

1. Define the authoritative location for the role.
2. Document how an administrator assigns the `HR_MANAGER` role.
3. Provide a safe setup procedure for the initial HR Manager user.
4. Ensure ordinary users cannot grant themselves access.
5. Avoid granting HR Manager permissions automatically to every newly registered user.

Do not hardcode an individual email address as the permanent authorization policy.

If a bootstrap administrator is required, use a controlled server-side setup procedure and document it.

---

## 9. Backend Authentication Middleware

Implement authentication and authorization middleware in the existing backend architecture.

Suggested location:

`apps/api/src/middleware/`

Possible files:

- `authenticate.ts`
- `authorize-hr-manager.ts`

Use these filenames only if they fit the existing codebase. Reuse existing middleware when possible.

### Authentication middleware

The middleware must:

1. Verify the request's Clerk session token using the official Clerk backend SDK.
2. Reject missing, invalid, expired, or otherwise unverifiable credentials.
3. Obtain the authenticated user identity from verified authentication context.
4. Avoid trusting identity or role information supplied directly by the client.
5. Pass valid authentication context to subsequent middleware and route handlers.

Do not implement custom JWT signature verification when the supported Clerk SDK already provides it.

Do not decode a JWT and treat its unverified payload as authenticated identity.

### Authorization middleware

The authorization middleware must:

1. Obtain the authenticated identity from the verified Clerk context.
2. Retrieve the authoritative role from a trusted, server-verifiable source.
3. Confirm that the role includes `hr_manager`.
4. Reject users who do not have the required role.
5. Forward unexpected errors to centralized error handling.
6. Fail closed if the role cannot be verified.

Use a consistent API response format.

Suggested responses:

- `401 Unauthorized`: no valid authentication.
- `403 Forbidden`: authenticated user lacks the required role.
- `500 Internal Server Error` or an appropriate service-unavailable response: unexpected or temporary server-side failures, without exposing internal details.

Do not return `200 OK` for rejected requests.

Do not redirect API clients to HTML pages from the Express middleware. APIs should return appropriate HTTP status codes and structured JSON errors; the frontend handles navigation.

### Protected routes

Apply authentication and authorization middleware to all protected business routes.

This includes, where implemented:

- Employee list and search APIs.
- Employee detail APIs.
- Employee creation and update APIs.
- Employee activation/deactivation APIs.
- Salary read and update APIs.
- Salary history APIs.
- Analytics APIs.
- Dashboard summary APIs.

Do not protect only the employee routes while leaving salary or analytics endpoints publicly accessible.

Public endpoints should be limited to the minimum necessary, such as health checks and any explicitly required authentication-related endpoints.

Inspect every registered route to ensure there is no accidental bypass.

Do not rely on a global middleware that can be bypassed by an incorrectly registered route. Use a clear, auditable protection strategy.

---

## 10. Frontend Route Protection

Implement a reusable route-protection mechanism using Clerk's actual authentication state.

Follow the existing React Router architecture.

Suggested components and hooks:

- A protected route or layout component.
- An unauthorized screen.
- A custom hook for checking authentication and role state on navigation.

Keep application-level routing in:

`apps/web/src/app/router.tsx`

Keep providers in:

`apps/web/src/app/providers.tsx`

Keep reusable custom hooks in:

`apps/web/src/hooks/custom/`

Keep shared UI in the existing `components/common/` directory.

Adapt names to the existing architecture instead of introducing a new folder structure.

### Navigation checks

On each protected route navigation, check:

1. Whether Clerk has finished initializing.
2. Whether the user is authenticated.
3. Whether the session is still valid.
4. Whether the user has the required HR Manager role.
5. Whether the current route is allowed.

Do not redirect while Clerk is still loading its initial authentication state.

Display a loading screen while authentication state is being resolved.

Avoid unnecessary repeated role lookups if the role can be obtained safely from verified Clerk session claims or other trusted data.

Do not treat cached frontend role information as sufficient authorization for API requests.

### Access decisions

- If the user is authenticated and authorized, render the requested route.
- If the session is expired or the user is signed out, prevent access to the protected route and direct the user to the sign-in flow, optionally showing the unauthorized screen with an appropriate reason.
- If the user is authenticated but lacks the HR Manager role, redirect to `/unauthorized`.
- If authentication or authorization state cannot be established, do not render protected content.
- If Clerk reports an authentication service error, display an appropriate recoverable error rather than granting access.

Preserve the intended destination when appropriate so an authorized user can return to the original page after signing in.

Do not create redirect loops between the sign-in page, unauthorized page, and protected routes.

### Custom navigation hook

Implement a reusable hook if needed, for example:

`apps/web/src/hooks/custom/use-auth-guard.ts`

The hook or protected route component should rely on Clerk's reactive authentication state and React Router navigation.

Do not create a polling loop that repeatedly requests the server on every render.

Do not assume that a route-navigation check alone protects the application. The backend must independently validate every protected API request.

---

## 11. One-Hour Session Requirement

Configure the Clerk session behavior to meet the requirement that users must reauthenticate after one hour.

Before implementation, distinguish these concepts:

- Session lifetime.
- Session inactivity timeout.
- Authentication token expiration.
- Automatic token refresh.
- Frontend authentication-state updates.

An access token or session token expiring after a short period does not necessarily mean the user's overall Clerk session has ended.

### Required implementation

1. Inspect Clerk's current session-lifetime and session-management capabilities.
2. Configure the appropriate Clerk settings so the intended authenticated session cannot remain valid beyond the required one-hour period.
3. Verify whether the requirement maps to an absolute session lifetime, an inactivity timeout, or both.
4. Do not claim that the one-hour policy is implemented solely because a JWT expires after one hour.
5. If the required lifetime is configurable only through Clerk Dashboard settings or a supported instance configuration, document the exact setting that must be applied.
6. If a backend-controlled maximum session age is necessary, implement it using a secure, server-verifiable strategy that cannot be bypassed by refreshing the frontend.
7. Do not store an untrusted timestamp in local storage and use it as the sole session-expiration mechanism.
8. Handle expired sessions gracefully and ensure protected API calls are rejected after expiration.

Use the official Clerk-supported session lifecycle and configuration mechanisms. Do not invent SDK configuration options.

### Expiration behavior

When the session expires:

- Stop rendering protected application content.
- Prevent additional protected operations.
- Clear or invalidate protected cached server data as appropriate.
- Redirect the user to the sign-in flow, or show the unauthorized screen with a clear session-expired message and a sign-in button.
- Ensure the user can authenticate again using email OTP.

Do not rely solely on a React timer. Timers may be delayed, suspended, or bypassed. The backend must reject expired authentication.

---

## 12. Unauthorized Screen

Create a dedicated route:

`/unauthorized`

Follow the existing screen architecture, for example:

`apps/web/src/screens/unauthorized/UnauthorizedScreen.tsx`

The screen must explain why access was denied.

Support distinct messages where practical:

- Session expired or user signed out.
- Authentication required.
- User lacks the HR Manager role.
- Access could not be verified.

Provide a clear primary button:

**Go to Login**

The button must invoke the actual Clerk sign-in flow, not merely navigate to an unimplemented page.

If the user is authenticated but lacks the HR Manager role, signing in again should not automatically grant access. Explain that the account does not have the required permissions.

Provide an appropriate route for returning to the application only when the user is authorized.

Ensure `/unauthorized` itself is accessible without entering a redirect loop.

---

## 13. API Error Handling and Frontend Integration

Integrate authentication errors with the existing centralized API client and TanStack Query wrappers.

Inspect the current API client and preserve its existing responsibilities.

### API client behavior

- Include valid Clerk authentication credentials on protected API requests using the SDK's supported token retrieval mechanism.
- Do not manually store or fabricate bearer tokens.
- Use the correct Clerk token retrieval method for the installed SDK.
- Handle `401` responses consistently.
- Handle `403` responses consistently.
- Avoid redirecting on every arbitrary server error.
- Prevent multiple concurrent failed requests from triggering uncontrolled redirect loops.
- Preserve useful validation errors for ordinary `400` responses.
- Do not expose internal backend error details.

### Authentication failures

For `401 Unauthorized`:

- Reconcile the response with Clerk's current session state.
- If the session has expired or the user is signed out, clear protected cached data and initiate the sign-in/unauthorized flow.
- Avoid unnecessary repeated redirects.

For `403 Forbidden`:

- Show the unauthorized screen or another consistent access-denied experience.
- Do not retry the same request indefinitely.
- Do not sign the user out merely because their role is insufficient.

Do not redirect to the unauthorized page for every failed request. Network errors, validation errors, and internal server errors should retain their appropriate behavior.

### TanStack Query

- Preserve the existing `useApiQuery` and `useApiMutation` wrappers.
- Do not add direct fetch calls to screens.
- Ensure protected requests obtain a current Clerk token as required.
- Invalidate or clear sensitive cached server data when the user signs out or the session expires.
- Prevent one user's protected data from being shown to another user after an account switch.
- Ensure mutation failures caused by authorization are handled consistently.

---

## 14. Security Requirements

Treat backend enforcement as mandatory.

- Never trust frontend-only route guards.
- Never trust local storage for authorization.
- Never trust user-provided role headers or request-body fields.
- Never expose Clerk secret keys.
- Never treat an unverified JWT as authenticated identity.
- Never grant HR Manager access automatically to all signed-in users.
- Never leave salary or analytics endpoints publicly accessible unintentionally.
- Never expose internal authentication errors, tokens, or stack traces.
- Do not implement custom password authentication when the requirement is email OTP through Clerk.
- Do not create a parallel application session system unless a clearly justified server-side requirement exists.
- Use secure error handling and fail closed when identity or role verification fails.

Do not introduce unnecessary authentication complexity or duplicate Clerk functionality.

---

## 15. Testing Requirements

Inspect the existing test setup before adding dependencies.

### Authentication tests

Test:

- Unauthenticated requests to protected endpoints.
- Invalid authentication tokens.
- Expired sessions.
- Authenticated users without the HR Manager role.
- Authorized HR Manager requests.
- Missing or unverifiable role information.
- Role changes or revoked access where supported.
- Public health endpoints.
- Consistent `401` and `403` responses.
- Fail-closed behavior when authentication cannot be verified.

### Frontend route tests

Test:

- Initial Clerk loading state.
- Unauthenticated access to protected routes.
- Authorized HR Manager access.
- Authenticated users without the role.
- Session-expired behavior.
- Unauthorized screen rendering.
- The Go to Login button.
- Redirect-loop prevention.
- Access to the sign-in and unauthorized routes.
- Cleanup of protected cached data after sign-out.

### Analytics tests

Test:

- Correct rendering of available datasets.
- Loading, error, and empty states.
- Correct chart labels and units.
- Currency-specific chart grouping.
- Absence of fabricated chart values.
- Responsive behavior where practical.

### Integration tests

Verify that the frontend sends authenticated requests and that the backend independently enforces authorization.

Use appropriate test doubles for Clerk where needed, but do not treat mocked tests as proof that production Clerk configuration is correct.

Never use production credentials or real employee salary data in automated tests.

---

## 16. Environment and Setup Documentation

Update the relevant environment example files and setup documentation.

Document the required frontend and backend Clerk configuration, including:

- Publishable key.
- Secret key.
- API base URL.
- Clerk sign-in configuration.
- Email OTP setup.
- HR Manager role assignment.
- Session lifetime configuration.
- Local development setup.
- Required Clerk Dashboard settings.
- Any required CORS configuration.

Use placeholder values only.

Do not print secret values in logs or commit them to Git.

Clearly distinguish settings that are configured in application code from settings that must be configured in the Clerk Dashboard.

---

## 17. Implementation Workflow

Work incrementally and in this order.

### Stage 1 — Inspect

- Inspect the existing Dashboard and Analytics screens.
- Inspect current charting dependencies.
- Inspect the analytics API routes, services, and response types.
- Inspect the existing API client and TanStack Query wrappers.
- Inspect the current routing and provider architecture.
- Inspect Express middleware and every registered API route.
- Inspect the existing authentication dependencies and configuration.
- Review the Git diff.

Report the current implementation and proposed changes before coding.

### Stage 2 — Analytics

- Select suitable charts for each available dataset.
- Reuse existing analytics APIs.
- Implement reusable chart components.
- Keep the three employee-count summary cards.
- Render other analytical information primarily as charts.
- Preserve currency separation.
- Add loading, error, and empty states.
- Test the charts and run the frontend checks.

### Stage 3 — Clerk configuration

- Integrate the supported Clerk frontend and backend SDKs.
- Configure email OTP sign-in.
- Establish the trusted HR Manager role source.
- Document the required Clerk Dashboard configuration.
- Verify environment-variable handling.

### Stage 4 — Backend protection

- Implement or reuse Clerk authentication middleware.
- Implement HR Manager authorization middleware.
- Protect every relevant business API.
- Preserve public health endpoints where appropriate.
- Normalize `401` and `403` responses.
- Add backend tests.

### Stage 5 — Frontend protection

- Implement the sign-in page.
- Implement the unauthorized page.
- Implement protected route handling.
- Add navigation-time authentication and role checks.
- Integrate Clerk token retrieval with the shared API client.
- Handle expired sessions and authorization errors.
- Clear protected query data on sign-out.
- Add frontend tests.

### Stage 6 — One-hour session policy

- Verify Clerk's supported session configuration.
- Configure the actual session lifetime policy.
- Document any required Dashboard settings.
- Verify behavior for an expired session.
- Ensure the backend independently rejects expired credentials.

### Stage 7 — Final verification

- Run frontend type-checking.
- Run backend type-checking.
- Run relevant frontend tests.
- Run relevant backend tests.
- Run production builds.
- Verify protected routes and APIs.
- Verify the sign-in and unauthorized flows.
- Verify the analytics charts use actual API data.
- Review the final Git diff.

Use the scripts that actually exist in the repository. Do not assume script names or claim checks passed without executing them.

---

## 18. Definition of Done

The work is complete only when:

### Analytics

- Dashboard retains Total Employees, Active Employees, and Inactive Employees as summary cards.
- Other analytical data is presented using appropriate graphs or visualizations.
- Analytics provides detailed visual comparisons.
- Charts use real backend data.
- Currency values are never incorrectly aggregated across currencies.
- Loading, error, and empty states work correctly.

### Authentication

- Clerk email OTP authentication works.
- Only HR Manager users can access protected application routes.
- Every protected API independently verifies authentication and authorization.
- Unauthenticated and expired-session requests are denied.
- Authenticated users without the required role receive `403 Forbidden`.
- Unauthorized users cannot bypass protection by calling APIs directly.
- The unauthorized page contains a working sign-in button.
- The one-hour session policy is configured and verified, including any required Clerk Dashboard settings.
- Sign-out and expiration clear protected cached data.
- No secrets are exposed in frontend code.

### Engineering quality

- Existing functionality remains intact.
- Code follows the current repository architecture.
- Types, tests, and production builds pass where applicable.
- Relevant behavior has been verified.
- Remaining configuration requirements and limitations are documented.

## 19. Final Instructions

Do not implement all stages in a single enormous change.

Start with Stage 1. Inspect the existing repository and report the plan. Then implement the analytics improvements first, followed by Clerk authentication and authorization.

Preserve working code, avoid unnecessary dependencies, and explain significant decisions.

**Security principle:** A protected frontend route improves user experience, but only backend authentication and authorization can enforce access control. Every protected API must independently reject unauthenticated users and users who do not have the HR Manager role.

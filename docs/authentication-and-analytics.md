# Authentication and analytics setup

## Environment

Copy the web and API environment examples to their local `.env` files. Set `VITE_CLERK_PUBLISHABLE_KEY` in `apps/web/.env`, and set both `CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` in `apps/api/.env` using keys from the same Clerk instance. The Clerk secret key must never be placed in a `VITE_` variable or shipped to a browser. Keep the API database URL in the API environment only.

The API accepts browser requests from `http://localhost:5173` and uses the existing Vite `/api` proxy. Update the CORS origin in `apps/api/src/index.ts` for the deployed frontend origin.

## Clerk sign-in and initial HR Manager

Create a Clerk application and enable email address sign-in with email verification codes. Disable email links, passwords, social sign-in, and public sign-up for this HR-only workspace. Create/invite the intended users through an administrator-controlled workflow.

Assign the initial HR Manager through Clerk's trusted Dashboard user management controls by setting the user's **public metadata** to:

```json
{ "role": "hr_manager" }
```

Only an administrator with Clerk user-management permissions should assign or remove this metadata. New users receive no role by default. The API verifies each session with Clerk, then reads the current user record and checks this metadata before allowing employee, salary, or analytics requests. If Clerk cannot verify the role, the API fails closed.

## Session lifetime

In the Clerk Dashboard, open **Sessions** and set **Maximum lifetime** to **1 hour**. This is an absolute session lifetime and forces reauthentication even when the user remains active. An inactivity timeout is a separate optional policy and does not replace maximum lifetime. Clerk documents that custom maximum lifetime configuration for production requires a paid plan; confirm this with the target instance/plan. API calls still validate the Clerk session server-side.

## Analytics data

Dashboard and Analytics charts use the existing summary, by-country, and by-department APIs. Salary charts remain separated by currency. The endpoints currently return current salary averages, not salary history trends.

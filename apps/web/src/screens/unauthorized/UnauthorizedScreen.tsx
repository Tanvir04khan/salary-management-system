import { useAuth } from "@clerk/react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "../../components/ui/button";

export default function UnauthorizedScreen() {
  const { isSignedIn } = useAuth();
  const location = useLocation();
  const reason =
    (location.state as { reason?: string } | null)?.reason ??
    new URLSearchParams(location.search).get("reason");
  const roleDenied = reason === "role" || (isSignedIn && !reason);
  const heading = roleDenied
    ? "Your account does not have access"
    : "Sign in required";
  const description = roleDenied
    ? "This workspace is available to HR Managers. Ask an administrator to assign the hr_manager role to your Clerk account."
    : reason === "verification"
      ? "We could not refresh your Clerk account permissions. Check your connection and try again."
      : "Your session may have expired, or we could not verify access. Sign in with your registered work email to continue.";

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
          {heading}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">
          {description}
        </p>
        <div className="mt-7 flex justify-center">
          <Button render={<Link to="/sign-in" />}>Go to Login</Button>
        </div>
        {roleDenied && (
          <p className="mt-4 text-xs text-slate-500">
            Signing in again will not grant additional permissions.
          </p>
        )}
      </section>
    </main>
  );
}

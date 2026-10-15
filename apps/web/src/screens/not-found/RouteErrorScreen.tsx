import { isRouteErrorResponse, Link, useRouteError } from "react-router-dom";
import { buttonVariants } from "../../components/ui/button";

export function RouteErrorScreen() {
  const error = useRouteError();
  const isNotFound = isRouteErrorResponse(error) && error.status === 404;

  return (
    <main className="mx-auto max-w-xl px-5 py-20 text-center">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
        {isNotFound ? "Page not found" : "We couldn’t load this page"}
      </h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        {isNotFound
          ? "The page may have moved or the address may be incorrect."
          : "Please try again, or return to the dashboard."}
      </p>
      <Link
        className={`${buttonVariants({ size: "lg" })} mt-6`}
        to="/dashboard"
      >
        Go to dashboard
      </Link>
    </main>
  );
}

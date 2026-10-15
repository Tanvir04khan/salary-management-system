import { Link } from "react-router-dom";
import { buttonVariants } from "../../components/ui/button";

export function NotFoundScreen() {
  return (
    <section className="mx-auto max-w-xl py-16 text-center" aria-labelledby="not-found-title">
      <p className="text-sm font-semibold tracking-wide text-indigo-700">404</p>
      <h1 id="not-found-title" className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
        Page not found
      </h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        That address doesn’t match a page in the salary management workspace.
      </p>
      <Link
        className={`${buttonVariants({ size: "lg" })} mt-6`}
        to="/dashboard"
      >
        Go to dashboard
      </Link>
    </section>
  );
}

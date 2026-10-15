import { useSignIn } from "@clerk/react";
import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { RouteLoading } from "../../components/common/route-loading";
import { useRefreshedHrRole } from "../../hooks/custom/use-refreshed-hr-role";

export default function SignInScreen() {
  const { signIn, fetchStatus } = useSignIn();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoaded, isSignedIn, hasHrManagerRole, isRefreshing, refreshFailed } = useRefreshedHrRole(location.pathname);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const busy = fetchStatus === "fetching";
  const destination = (location.state as { from?: string } | null)?.from ?? "/dashboard";

  if (!isLoaded) return <RouteLoading />;
  if (isSignedIn) {
    if (isRefreshing) return <RouteLoading />;
    if (refreshFailed) return <Navigate to="/unauthorized" replace state={{ reason: "verification" }} />;
    if (hasHrManagerRole) return <Navigate to={destination} replace />;
    return <Navigate to="/unauthorized" replace state={{ reason: "role" }} />;
  }

  async function sendCode() {
    setError("");
    setMessage("");
    try {
      const result = sent
        ? await signIn.emailCode.sendCode()
        : await signIn.emailCode.sendCode({ emailAddress: email.trim() });
      if (result.error) {
        setError(result.error.longMessage ?? result.error.message);
        return;
      }
      setSent(true);
      setMessage(`A verification code was sent to ${email.trim()}.`);
    } catch {
      setError("We could not send a verification code. Please try again.");
    }
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      const result = await signIn.emailCode.verifyCode({ code: code.trim() });
      if (result.error) {
        setError(result.error.longMessage ?? result.error.message);
        return;
      }
      if (signIn.status !== "complete") {
        setError("This sign-in requires another verification method. Contact your administrator.");
        return;
      }
      const finalized = await signIn.finalize({ navigate: ({ decorateUrl }) => {
        const target = decorateUrl(destination);
        if (target.startsWith("http")) window.location.assign(target);
        else navigate(target);
      } });
      if (finalized.error) setError(finalized.error.longMessage ?? finalized.error.message);
    } catch {
      setError("We could not verify this code. Please try again.");
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-10">
      <section aria-labelledby="sign-in-title" className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
        <p className="text-sm font-semibold tracking-wide text-indigo-700">ACME · People operations</p>
        <h1 id="sign-in-title" className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">Sign in to your workspace</h1>
        <p className="mt-2 text-sm text-slate-600">Use your registered work email. We’ll send you a one-time verification code.</p>
        {!sent ? (
          <form className="mt-7 space-y-4" onSubmit={(event) => { event.preventDefault(); void sendCode(); }}>
            <label className="block text-sm font-medium text-slate-800" htmlFor="email">Work email</label>
            <input autoComplete="email" className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-600" id="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
            <Button className="w-full" disabled={busy} type="submit">{busy ? "Sending code…" : "Send verification code"}</Button>
          </form>
        ) : (
          <form className="mt-7 space-y-4" onSubmit={(event) => void verifyCode(event)}>
            <label className="block text-sm font-medium text-slate-800" htmlFor="code">Email verification code</label>
            <input autoComplete="one-time-code" className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm tracking-[0.25em] outline-none focus-visible:ring-2 focus-visible:ring-indigo-600" id="code" inputMode="numeric" onChange={(event) => setCode(event.target.value)} required value={code} />
            <Button className="w-full" disabled={busy} type="submit">{busy ? "Verifying…" : "Verify and sign in"}</Button>
            <button className="w-full text-sm font-medium text-indigo-700 underline-offset-4 hover:underline disabled:opacity-50" disabled={busy} onClick={() => void sendCode()} type="button">Resend code</button>
          </form>
        )}
        {message && <p aria-live="polite" className="mt-4 text-sm text-emerald-700">{message}</p>}
        {error && <p aria-live="assertive" className="mt-4 text-sm text-red-700">{error}</p>}
        <p className="mt-6 text-sm text-slate-600">Access is limited to HR Managers. <Link className="font-medium text-indigo-700 hover:underline" to="/unauthorized">Need help?</Link></p>
      </section>
    </main>
  );
}

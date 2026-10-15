export function RouteLoading() {
  return (
    <div aria-label="Loading page" aria-live="polite" className="space-y-6" role="status">
      <span className="sr-only">Loading page</span>
      <div className="motion-safe:animate-pulse space-y-3">
        <div className="h-7 w-48 rounded-md bg-slate-200" />
        <div className="h-4 w-72 max-w-full rounded-md bg-slate-200" />
        <div className="mt-8 h-52 rounded-xl border border-slate-200 bg-white" />
      </div>
    </div>
  );
}

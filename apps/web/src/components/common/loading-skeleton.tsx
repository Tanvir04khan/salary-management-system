type LoadingSkeletonProps = {
  label?: string;
  className?: string;
};

export function LoadingSkeleton({ label = "Loading", className = "" }: LoadingSkeletonProps) {
  return (
    <div aria-label={label} aria-live="polite" className={`motion-safe:animate-pulse rounded-lg bg-slate-200 ${className}`} role="status">
      <span className="sr-only">{label}</span>
    </div>
  );
}

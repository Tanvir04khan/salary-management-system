import { AlertCircle } from "lucide-react";
import { useId } from "react";
import { Button } from "../ui/button";

type ErrorStateProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
};

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
}: ErrorStateProps) {
  const titleId = useId();

  return (
    <section aria-labelledby={titleId} className="rounded-xl border border-rose-200 bg-rose-50 p-5" role="alert">
      <div className="flex items-start gap-3">
        <AlertCircle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-rose-700" />
        <div>
          <h2 id={titleId} className="text-sm font-semibold text-rose-950">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-rose-900">{message}</p>
          {onRetry && (
            <Button
              className="mt-3"
              onClick={onRetry}
              type="button"
            >
              Try again
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

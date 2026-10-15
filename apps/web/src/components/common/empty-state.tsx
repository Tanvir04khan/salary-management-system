import type { ReactNode } from "react";
import { useId } from "react";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  const titleId = useId();

  return (
    <section className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center" aria-labelledby={titleId}>
      <h2 id={titleId} className="text-base font-semibold text-slate-900">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </section>
  );
}

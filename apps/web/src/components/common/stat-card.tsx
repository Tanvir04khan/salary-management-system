import type { ReactNode } from "react";

type StatCardProps = {
  label: string;
  value: string | number;
  detail?: string;
  icon?: ReactNode;
};

export function StatCard({ label, value, detail, icon }: StatCardProps) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/[0.02]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-600">{label}</p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
          {detail && <p className="mt-1.5 text-xs leading-5 text-slate-500">{detail}</p>}
        </div>
        {icon && <div aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-lg bg-indigo-50 text-indigo-700">{icon}</div>}
      </div>
    </article>
  );
}

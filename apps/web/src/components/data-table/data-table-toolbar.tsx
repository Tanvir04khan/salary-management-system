import type { ReactNode } from "react";

export function DataTableToolbar({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" role="region" aria-label="Table filters and actions">
      {children}
    </div>
  );
}

import { useEffect, useState, type FormEvent } from "react";
import type { EmploymentStatus } from "../../../hooks/use-employees";
import { DataTableToolbar } from "../../../components/data-table/data-table-toolbar";
import { Button } from "../../../components/ui/button";

export type EmployeeFiltersValue = {
  country: string;
  department: string;
  status: EmploymentStatus | "";
};

type EmployeeFiltersProps = {
  value: EmployeeFiltersValue;
  onApply: (value: EmployeeFiltersValue) => void;
  onClear: () => void;
};

const inputClassName = "min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus-visible:border-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-600/20";

export function EmployeeFilters({ value, onApply, onClear }: EmployeeFiltersProps) {
  const { country, department, status } = value;
  const [draft, setDraft] = useState<EmployeeFiltersValue>({ country, department, status });
  const [countryError, setCountryError] = useState("");

  useEffect(() => setDraft({ country, department, status }), [country, department, status]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const country = draft.country.trim();
    if (country && !/^[A-Za-z]{2}$/.test(country)) {
      setCountryError("Enter a two-letter country code.");
      return;
    }
    setCountryError("");
    onApply({
      ...draft,
      country: country.toUpperCase(),
      department: draft.department.trim(),
    });
  }

  return (
    <DataTableToolbar>
      <form className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-600">
          Country code
          <input
            autoComplete="off"
            aria-describedby={countryError ? "employee-country-filter-error" : undefined}
            aria-invalid={Boolean(countryError)}
            className={`${inputClassName} w-full sm:w-36`}
            maxLength={2}
            onChange={(event) => {
              setCountryError("");
              setDraft((current) => ({ ...current, country: event.target.value }));
            }}
            placeholder="US"
            value={draft.country}
          />
          {countryError && <span className="text-xs font-normal text-rose-700" id="employee-country-filter-error">{countryError}</span>}
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-600">
          Department
          <input
            className={`${inputClassName} w-full sm:w-48`}
            maxLength={100}
            onChange={(event) => setDraft((current) => ({ ...current, department: event.target.value }))}
            placeholder="Engineering"
            value={draft.department}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-600">
          Status
          <select
            className={`${inputClassName} w-full sm:w-40`}
            onChange={(event) => {
              const selectedStatus = event.target.value;
              setDraft((current) => ({
                ...current,
                status: selectedStatus === "ACTIVE" || selectedStatus === "INACTIVE"
                  ? selectedStatus
                  : "",
              }));
            }}
            value={draft.status}
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </label>
        <Button type="submit" size="lg">
          Apply filters
        </Button>
        <button
          className="min-h-10 rounded-lg px-3 text-sm font-medium text-slate-600 underline-offset-4 hover:text-slate-950 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          onClick={onClear}
          type="button"
        >
          Clear filters
        </button>
      </form>
    </DataTableToolbar>
  );
}

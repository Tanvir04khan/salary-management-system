import { zodResolver } from "@hookform/resolvers/zod";
import { cloneElement, type ReactElement } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ErrorState } from "../../../components/common/error-state";
import { Button } from "../../../components/ui/button";
import type { EmployeeRecord } from "../../../hooks/use-employees";
import { useUpdateEmployeeSalary } from "../../../hooks/use-salaries";
import { ApiError } from "../../../utils/api-client";

function localDateToday(): string {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

const salaryAmountSchema = z.string().trim().refine((value) => {
  if (!/^\d{1,13}(?:\.\d{1,2})?$/.test(value)) return false;
  const [whole, fraction = ""] = value.split(".");
  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0")) > 0n;
}, "Enter a positive amount with up to 13 digits and 2 decimal places").transform((value) => {
  const [whole, fraction = ""] = value.split(".");
  return `${whole}.${fraction.padEnd(2, "0")}`;
});

const effectiveFromSchema = z.string()
  .transform((value) => value.trim() || undefined)
  .pipe(z.iso.date().optional())
  .refine((value) => value === undefined || value <= localDateToday(), "Future salary dates are not supported");

const changeReasonSchema = z.string()
  .transform((value) => value.trim() || undefined)
  .pipe(z.string().min(1).max(500).optional());

const salaryUpdateSchema = z.object({
  amount: salaryAmountSchema,
  currency: z.string().trim().regex(/^[A-Za-z]{3}$/, "Enter a three-letter currency code")
    .transform((value) => value.toUpperCase()),
  effectiveFrom: effectiveFromSchema,
  changeReason: changeReasonSchema,
});

type SalaryFormInput = z.input<typeof salaryUpdateSchema>;
type SalaryFormValues = z.output<typeof salaryUpdateSchema>;

type EmployeeSalaryFormProps = {
  employee: EmployeeRecord;
  onSaved: () => void;
  onCancel: () => void;
};

const fieldClassName = "mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus-visible:border-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-600/20";

export function EmployeeSalaryForm({ employee, onSaved, onCancel }: EmployeeSalaryFormProps) {
  const updateSalary = useUpdateEmployeeSalary(employee.employeeId);
  const form = useForm<SalaryFormInput, unknown, SalaryFormValues>({
    resolver: zodResolver(salaryUpdateSchema),
    defaultValues: {
      amount: employee.currentAnnualSalary ?? "",
      currency: employee.salaryCurrency ?? "",
      effectiveFrom: "",
      changeReason: "",
    },
  });

  function submit(values: SalaryFormValues) {
    updateSalary.mutate(values, { onSuccess: onSaved });
  }

  const apiErrorMessage = updateSalary.error instanceof ApiError
    ? updateSalary.error.message
    : "The salary could not be updated. Check the details and try again.";

  return (
    <form className="space-y-6" noValidate onSubmit={form.handleSubmit(submit)}>
      {updateSalary.isError && <ErrorState title="Salary was not updated" message={apiErrorMessage} />}
      <div className="grid gap-5 sm:grid-cols-2">
        <SalaryField label="Annual base salary" error={form.formState.errors.amount?.message}>
          <input
            className={fieldClassName}
            inputMode="decimal"
            maxLength={16}
            placeholder="85000.00"
            {...form.register("amount")}
          />
        </SalaryField>
        <SalaryField label="Currency code" error={form.formState.errors.currency?.message}>
          <input
            autoCapitalize="characters"
            className={fieldClassName}
            maxLength={3}
            placeholder="USD"
            {...form.register("currency")}
          />
        </SalaryField>
        <SalaryField label="Effective from" error={form.formState.errors.effectiveFrom?.message}>
          <input
            className={fieldClassName}
            max={localDateToday()}
            type="date"
            {...form.register("effectiveFrom")}
          />
        </SalaryField>
        <SalaryField label="Change reason (optional)" error={form.formState.errors.changeReason?.message}>
          <input className={fieldClassName} maxLength={500} {...form.register("changeReason")} />
        </SalaryField>
      </div>
      <p className="text-xs leading-5 text-slate-500">
        Salary is annual base compensation. Effective end dates are managed by the server and are exclusive.
      </p>
      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
        <Button disabled={updateSalary.isPending} onClick={onCancel} type="button" variant="outline">Cancel</Button>
        <Button disabled={updateSalary.isPending} type="submit">
          {updateSalary.isPending ? "Updating salary…" : "Update salary"}
        </Button>
      </div>
    </form>
  );
}

type SalaryFieldProps = {
  label: string;
  error?: string;
  children: ReactElement<{ id?: string; "aria-invalid"?: boolean; "aria-describedby"?: string }>;
};

function SalaryField({ label, error, children }: SalaryFieldProps) {
  const fieldId = `salary-${label.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}`;
  const errorId = `${fieldId}-error`;
  return (
    <label className="block text-sm font-medium text-slate-700" htmlFor={fieldId}>
      {label}
      {cloneElement(children, {
        id: fieldId,
        "aria-invalid": Boolean(error),
        "aria-describedby": error ? errorId : undefined,
      })}
      {error && <span className="mt-1.5 block text-xs font-normal text-rose-700" id={errorId}>{error}</span>}
    </label>
  );
}

import { zodResolver } from "@hookform/resolvers/zod";
import { cloneElement, type ReactElement } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ErrorState } from "../../../components/common/error-state";
import { Button } from "../../../components/ui/button";
import { useUpdateEmployee, type EmployeeRecord } from "../../../hooks/use-employees";
import { ApiError } from "../../../utils/api-client";

const employeeEditSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().min(1, "Last name is required").max(100),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address").max(255)),
  countryCode: z.string().trim().regex(/^[A-Za-z]{2}$/, "Enter a two-letter country code")
    .transform((value) => value.toUpperCase()),
  department: z.string().trim().min(1, "Department is required").max(100),
  jobTitle: z.string().trim().min(1, "Job title is required").max(150),
});

type EmployeeEditInput = z.input<typeof employeeEditSchema>;
type EmployeeEditValues = z.output<typeof employeeEditSchema>;

type EmployeeEditFormProps = {
  employee: EmployeeRecord;
  onSaved: () => void;
  onCancel: () => void;
};

const fieldClassName = "mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus-visible:border-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-600/20";

export function EmployeeEditForm({ employee, onSaved, onCancel }: EmployeeEditFormProps) {
  const updateEmployee = useUpdateEmployee(employee.employeeId);
  const form = useForm<EmployeeEditInput, unknown, EmployeeEditValues>({
    resolver: zodResolver(employeeEditSchema),
    defaultValues: {
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      countryCode: employee.countryCode,
      department: employee.department,
      jobTitle: employee.jobTitle,
    },
  });

  function submit(values: EmployeeEditValues) {
    updateEmployee.mutate(values, { onSuccess: onSaved });
  }

  const apiErrorMessage = updateEmployee.error instanceof ApiError
    ? updateEmployee.error.message
    : "We couldn’t save the employee changes. Check the details and try again.";

  return (
    <form className="space-y-6" noValidate onSubmit={form.handleSubmit(submit)}>
      {updateEmployee.isError && <ErrorState title="Changes were not saved" message={apiErrorMessage} />}
      <div className="grid gap-5 sm:grid-cols-2">
        <EditField label="First name" error={form.formState.errors.firstName?.message}>
          <input autoComplete="given-name" className={fieldClassName} maxLength={100} {...form.register("firstName")} />
        </EditField>
        <EditField label="Last name" error={form.formState.errors.lastName?.message}>
          <input autoComplete="family-name" className={fieldClassName} maxLength={100} {...form.register("lastName")} />
        </EditField>
        <EditField label="Email" error={form.formState.errors.email?.message}>
          <input autoComplete="email" className={fieldClassName} maxLength={255} type="email" {...form.register("email")} />
        </EditField>
        <EditField label="Country code" error={form.formState.errors.countryCode?.message}>
          <input autoComplete="off" className={fieldClassName} maxLength={2} {...form.register("countryCode")} />
        </EditField>
        <EditField label="Department" error={form.formState.errors.department?.message}>
          <input className={fieldClassName} maxLength={100} {...form.register("department")} />
        </EditField>
        <EditField label="Job title" error={form.formState.errors.jobTitle?.message}>
          <input className={fieldClassName} maxLength={150} {...form.register("jobTitle")} />
        </EditField>
      </div>
      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
        <Button disabled={updateEmployee.isPending} onClick={onCancel} type="button" variant="outline">Cancel</Button>
        <Button disabled={updateEmployee.isPending} type="submit">
          {updateEmployee.isPending ? "Saving changes…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

type EditFieldProps = {
  label: string;
  error?: string;
  children: ReactElement<{ id?: string; "aria-invalid"?: boolean; "aria-describedby"?: string }>;
};

function EditField({ label, error, children }: EditFieldProps) {
  const fieldId = `edit-employee-${label.toLowerCase().replaceAll(" ", "-")}`;
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

import { zodResolver } from "@hookform/resolvers/zod";
import { cloneElement, type ReactElement } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ErrorState } from "../../../components/common/error-state";
import { Button } from "../../../components/ui/button";
import { ApiError } from "../../../utils/api-client";
import { useCreateEmployee } from "../../../hooks/use-employees";

const employeeCreateSchema = z.object({
  employeeCode: z.string().trim().min(1, "Employee code is required").max(30),
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().min(1, "Last name is required").max(100),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address").max(255)),
  countryCode: z.string().trim().regex(/^[A-Za-z]{2}$/, "Enter a two-letter country code")
    .transform((value) => value.toUpperCase()),
  department: z.string().trim().min(1, "Department is required").max(100),
  jobTitle: z.string().trim().min(1, "Job title is required").max(150),
  employmentStatus: z.enum(["ACTIVE", "INACTIVE"]),
});

type EmployeeCreateFormInput = z.input<typeof employeeCreateSchema>;
type EmployeeCreateFormValues = z.output<typeof employeeCreateSchema>;

type EmployeeCreateFormProps = {
  onCreated: (employeeId: string) => void;
  onCancel: () => void;
};

const fieldClassName = "mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus-visible:border-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-600/20";

export function EmployeeCreateForm({ onCreated, onCancel }: EmployeeCreateFormProps) {
  const createEmployee = useCreateEmployee();
  const form = useForm<EmployeeCreateFormInput, unknown, EmployeeCreateFormValues>({
    resolver: zodResolver(employeeCreateSchema),
    defaultValues: {
      employeeCode: "",
      firstName: "",
      lastName: "",
      email: "",
      countryCode: "",
      department: "",
      jobTitle: "",
      employmentStatus: "ACTIVE",
    },
  });

  function submit(values: EmployeeCreateFormValues) {
    createEmployee.mutate(values, {
      onSuccess: (employee) => onCreated(employee.employeeId),
    });
  }

  const apiErrorMessage = createEmployee.error instanceof ApiError
    ? createEmployee.error.message
    : "We couldn’t create the employee. Check the details and try again.";

  return (
    <form className="space-y-6" noValidate onSubmit={form.handleSubmit(submit)}>
      {createEmployee.isError && (
        <ErrorState title="Employee was not created" message={apiErrorMessage} />
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Employee code" error={form.formState.errors.employeeCode?.message}>
          <input autoComplete="off" className={fieldClassName} maxLength={30} {...form.register("employeeCode")} />
        </FormField>
        <FormField label="First name" error={form.formState.errors.firstName?.message}>
          <input autoComplete="given-name" className={fieldClassName} maxLength={100} {...form.register("firstName")} />
        </FormField>
        <FormField label="Last name" error={form.formState.errors.lastName?.message}>
          <input autoComplete="family-name" className={fieldClassName} maxLength={100} {...form.register("lastName")} />
        </FormField>
        <FormField label="Email" error={form.formState.errors.email?.message}>
          <input autoComplete="email" className={fieldClassName} maxLength={255} type="email" {...form.register("email")} />
        </FormField>
        <FormField label="Country code" error={form.formState.errors.countryCode?.message}>
          <input autoComplete="off" className={fieldClassName} maxLength={2} {...form.register("countryCode")} />
        </FormField>
        <FormField label="Department" error={form.formState.errors.department?.message}>
          <input className={fieldClassName} maxLength={100} {...form.register("department")} />
        </FormField>
        <FormField label="Job title" error={form.formState.errors.jobTitle?.message}>
          <input className={fieldClassName} maxLength={150} {...form.register("jobTitle")} />
        </FormField>
        <FormField label="Employment status" error={form.formState.errors.employmentStatus?.message}>
          <select className={fieldClassName} {...form.register("employmentStatus")}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </FormField>
      </div>
      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
        <Button disabled={createEmployee.isPending} onClick={onCancel} type="button" variant="outline">
          Cancel
        </Button>
        <Button disabled={createEmployee.isPending} type="submit">
          {createEmployee.isPending ? "Creating employee…" : "Create employee"}
        </Button>
      </div>
    </form>
  );
}

type FormFieldProps = {
  label: string;
  error?: string;
  children: ReactElement<{ id?: string; "aria-invalid"?: boolean; "aria-describedby"?: string }>;
};

function FormField({ label, error, children }: FormFieldProps) {
  const fieldId = `employee-${label.toLowerCase().replaceAll(" ", "-")}`;
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

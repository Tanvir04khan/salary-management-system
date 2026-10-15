import { useApiMutation } from "./use-api-mutation";
import { useApiQuery } from "./use-api-query";
import { employeeQueryKeys } from "./use-employees";

export type SalaryHistoryItem = {
  salaryRecordId: string;
  amount: string;
  currency: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  changeReason: string | null;
  createdAt: string;
};

export type EmployeeSalaryHistory = {
  employeeId: string;
  salaryHistory: SalaryHistoryItem[];
};

export type SalaryUpdateInput = {
  amount: string;
  currency: string;
  effectiveFrom?: string;
  changeReason?: string;
};

export const salaryQueryKeys = {
  history: (employeeId: string) => ["api", `/employees/${employeeId}/salary-history`] as const,
  current: (employeeId: string) => ["api", `/employees/${employeeId}/salary`] as const,
};

export function useSalaryHistory(employeeId: string, enabled = true) {
  return useApiQuery<EmployeeSalaryHistory>({
    path: `/employees/${employeeId}/salary-history`,
    queryKey: salaryQueryKeys.history(employeeId),
    enabled: enabled && employeeId.length > 0,
  });
}

export function useUpdateEmployeeSalary(employeeId: string) {
  return useApiMutation<SalaryHistoryItem, SalaryUpdateInput>({
    method: "PATCH",
    path: `/employees/${employeeId}/salary`,
    invalidateQueries: [
      employeeQueryKeys.all,
      employeeQueryKeys.detail(employeeId),
      salaryQueryKeys.history(employeeId),
      salaryQueryKeys.current(employeeId),
      ["api", "/analytics"],
    ],
  });
}

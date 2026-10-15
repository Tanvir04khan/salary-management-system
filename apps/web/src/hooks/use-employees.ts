import { useApiMutation } from "./use-api-mutation";
import { useApiQuery } from "./use-api-query";

export type EmploymentStatus = "ACTIVE" | "INACTIVE";

export type EmployeeSortField =
  | "employeeCode"
  | "firstName"
  | "lastName"
  | "department"
  | "countryCode"
  | "createdAt";

export type EmployeeRecord = {
  employeeId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  countryCode: string;
  department: string;
  jobTitle: string;
  employmentStatus: EmploymentStatus;
  createdAt: string;
  updatedAt: string;
  currentAnnualSalary: string | null;
  salaryCurrency: string | null;
};

export type EmployeeListResponse = {
  employees: EmployeeRecord[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
};

export type EmployeeListParams = {
  page: number;
  pageSize: number;
  search?: string;
  country?: string;
  department?: string;
  status?: EmploymentStatus;
  sortBy: EmployeeSortField;
  sortOrder: "asc" | "desc";
};

export type EmployeeCreateInput = {
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  countryCode: string;
  department: string;
  jobTitle: string;
  employmentStatus: EmploymentStatus;
};

export type EmployeeUpdateInput = Partial<Omit<EmployeeCreateInput, "employeeCode">>;

export const employeeQueryKeys = {
  all: ["api", "/employees"] as const,
  detail: (employeeId: string) => ["api", `/employees/${employeeId}`] as const,
};

export function useEmployees(params: EmployeeListParams) {
  return useApiQuery<EmployeeListResponse>({
    path: "/employees",
    params,
  });
}

export function useEmployee(employeeId: string, enabled = true) {
  return useApiQuery<EmployeeRecord>({
    path: `/employees/${employeeId}`,
    queryKey: employeeQueryKeys.detail(employeeId),
    enabled: enabled && employeeId.length > 0,
  });
}

export function useCreateEmployee() {
  return useApiMutation<EmployeeRecord, EmployeeCreateInput>({
    method: "POST",
    path: "/employees",
    invalidateQueries: [
      employeeQueryKeys.all,
      ["api", "/analytics"],
    ],
  });
}

export function useUpdateEmployee(employeeId: string) {
  return useApiMutation<EmployeeRecord, EmployeeUpdateInput>({
    method: "PATCH",
    path: `/employees/${employeeId}`,
    invalidateQueries: (variables) => [
      employeeQueryKeys.all,
      employeeQueryKeys.detail(employeeId),
      ...(variables.employmentStatus === undefined ? [] : [["api", "/analytics"]]),
    ],
  });
}

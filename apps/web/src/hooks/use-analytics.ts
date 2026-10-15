import { useApiQuery } from "./use-api-query";

export type CurrencySalarySummary = {
  currency: string;
  employeeCount: number;
  averageAnnualSalary: string;
};

export type AnalyticsSummary = {
  employeeCountsByStatus: {
    status: "ACTIVE" | "INACTIVE";
    employeeCount: number;
  }[];
  currentSalaryByCurrency: CurrencySalarySummary[];
};

export type CountryAnalytics = {
  countryCode: string;
  activeEmployeeCount: number;
  currentSalaryByCurrency: CurrencySalarySummary[];
}[];

export type DepartmentAnalytics = {
  department: string;
  activeEmployeeCount: number;
  currentSalaryByCurrency: CurrencySalarySummary[];
}[];

export function useAnalyticsSummary() {
  return useApiQuery<AnalyticsSummary>({ path: "/analytics/summary" });
}

export function useAnalyticsByCountry() {
  return useApiQuery<CountryAnalytics>({ path: "/analytics/by-country" });
}

export function useAnalyticsByDepartment() {
  return useApiQuery<DepartmentAnalytics>({ path: "/analytics/by-department" });
}

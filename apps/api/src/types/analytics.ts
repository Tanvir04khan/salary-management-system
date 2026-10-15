export type AnalyticsSummary = {
  employeeCountsByStatus: {
    status: "ACTIVE" | "INACTIVE";
    employeeCount: number;
  }[];
  currentSalaryByCurrency: {
    currency: string;
    employeeCount: number;
    averageAnnualSalary: string;
  }[];
};

export type CountryAnalytics = {
  countryCode: string;
  activeEmployeeCount: number;
  currentSalaryByCurrency: {
    currency: string;
    employeeCount: number;
    averageAnnualSalary: string;
  }[];
}[];

export type DepartmentAnalytics = {
  department: string;
  activeEmployeeCount: number;
  currentSalaryByCurrency: {
    currency: string;
    employeeCount: number;
    averageAnnualSalary: string;
  }[];
}[];

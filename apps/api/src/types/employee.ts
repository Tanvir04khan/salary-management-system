export type EmployeeList = {
  data: {
    employeeId: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    email: string;
    countryCode: string;
    department: string;
    jobTitle: string;
    employmentStatus: "ACTIVE" | "INACTIVE";
    createdAt: Date;
    updatedAt: Date;
    currentAnnualSalary: string | null;
    salaryCurrency: string | null;
  }[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
};

export type EmployeeDetails = EmployeeList["data"][number];

export type SalaryHistoryItem = {
  salaryRecordId: string;
  amount: string;
  currency: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  changeReason: string | null;
  createdAt: Date;
};

export type EmployeeSalaryHistory = {
  employeeId: string;
  salaryHistory: SalaryHistoryItem[];
};

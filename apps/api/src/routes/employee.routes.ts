import { Router } from "express";
import {
    createEmployee,
    getEmployee,
    getEmployees,
    updateEmployee,
} from "../controllers/employee.controller";
import {
    getCurrentSalary,
    getSalaryHistory,
    patchEmployeeSalary,
} from "../controllers/salary-record.controller";

const employeeRoutes = Router();

employeeRoutes.get("/", getEmployees);
employeeRoutes.post("/", createEmployee);
employeeRoutes.get("/:id", getEmployee);
employeeRoutes.patch("/:id", updateEmployee);
employeeRoutes.get("/:id/salary-history", getSalaryHistory);
employeeRoutes.get("/:id/salary", getCurrentSalary);
employeeRoutes.patch("/:id/salary", patchEmployeeSalary);

export default employeeRoutes;

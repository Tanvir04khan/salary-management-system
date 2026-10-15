import { Router } from "express";
import {
  getByCountry,
  getByDepartment,
  getSummary,
} from "../controllers/analytics.controller";

const analyticsRoutes = Router();

analyticsRoutes.get("/summary", getSummary);
analyticsRoutes.get("/by-country", getByCountry);
analyticsRoutes.get("/by-department", getByDepartment);

export default analyticsRoutes;

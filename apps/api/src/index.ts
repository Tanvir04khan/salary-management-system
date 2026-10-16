import "dotenv/config";
import express from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import employeeRoutes from "./routes/employee.routes";
import analyticsRoutes from "./routes/analytics.routes";
import { authorizeHrManager } from "./middleware/authorize-hr-manager";
import { failureResponse, successResponse } from "./types/api-response";

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const missingClerkConfiguration = [
  "CLERK_SECRET_KEY",
  "CLERK_PUBLISHABLE_KEY",
].filter((key) => !process.env[key]);

if (missingClerkConfiguration.length > 0) {
  throw new Error(
    `Missing required Clerk configuration: ${missingClerkConfiguration.join(", ")}`,
  );
}

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://salary-management-system-7s3w.vercel.app",
    ],
  }),
);
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  const response = successResponse({ status: "ok" }, "API is running");
  res.status(response.statusCode).json(response);
});

app.use(
  "/api/employees",
  clerkMiddleware(),
  authorizeHrManager,
  employeeRoutes,
);
app.use(
  "/api/analytics",
  clerkMiddleware(),
  authorizeHrManager,
  analyticsRoutes,
);

app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error("Unhandled API error:", error);
    const response = failureResponse("Internal server error");
    res.status(response.statusCode).json(response);
  },
);

app.listen(PORT, () => {
  console.log(`API running at http://localhost:${PORT}`);
});

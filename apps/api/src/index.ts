import express from "express";
import cors from "cors";
import employeeRoutes from "./routes/employee.routes";
import { failureResponse, successResponse } from "./types/api-response";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
    const response = successResponse({ status: "ok" }, "API is running");
    res.status(response.statusCode).json(response);
});

app.use("/api/employees", employeeRoutes);

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("Unhandled API error:", error);
    const response = failureResponse("Internal server error");
    res.status(response.statusCode).json(response);
});

app.listen(PORT, () => {
    console.log(`API running at http://localhost:${PORT}`);
});

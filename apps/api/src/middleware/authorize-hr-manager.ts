import { clerkClient, getAuth } from "@clerk/express";
import type { NextFunction, Request, Response } from "express";
import { failureResponse } from "../types/api-response";

export async function authorizeHrManager(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const auth = getAuth(req);
    if (!auth.isAuthenticated || !auth.userId) {
      console.warn("HR authorization denied: unauthenticated request", {
        method: req.method,
        path: req.originalUrl,
      });
      const response = failureResponse("Authentication required", 401);
      res.status(response.statusCode).json(response);
      return;
    }

    const user = await clerkClient.users.getUser(auth.userId);
    const role = user.publicMetadata.role;
    if (typeof role !== "string" || role.toLowerCase() !== "hr_manager") {
      console.warn("HR authorization denied: required role missing", {
        method: req.method,
        path: req.originalUrl,
        rolePresent: typeof role === "string",
      });
      const response = failureResponse("HR Manager access is required", 403);
      res.status(response.statusCode).json(response);
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
}

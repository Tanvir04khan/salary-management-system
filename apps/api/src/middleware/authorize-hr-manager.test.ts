import type { AddressInfo } from "node:net";
import express from "express";
import { afterEach, describe, expect, it, vi } from "vitest";

const { getAuthMock, getUserMock } = vi.hoisted(() => ({
  getAuthMock: vi.fn(),
  getUserMock: vi.fn(),
}));

vi.mock("@clerk/express", () => ({
  getAuth: getAuthMock,
  clerkClient: { users: { getUser: getUserMock } },
}));

import { authorizeHrManager } from "./authorize-hr-manager";

const servers: ReturnType<express.Express["listen"]>[] = [];

async function startServer() {
  const app = express();
  app.use(authorizeHrManager);
  app.get("/protected", (_req, res) => res.json({ ok: true }));
  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(500).json({ error: error instanceof Error ? error.message : "unknown" });
  });
  const server = app.listen(0);
  servers.push(server);
  await new Promise<void>((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => new Promise<void>((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  })));
  vi.clearAllMocks();
});

describe("authorizeHrManager", () => {
  it("rejects unauthenticated requests", async () => {
    getAuthMock.mockReturnValue({ isAuthenticated: false, userId: null });
    const baseUrl = await startServer();

    const response = await fetch(`${baseUrl}/protected`);

    expect(response.status).toBe(401);
    expect(getUserMock).not.toHaveBeenCalled();
  });

  it("allows a user with the hr_manager public metadata role", async () => {
    getAuthMock.mockReturnValue({ isAuthenticated: true, userId: "user_123" });
    getUserMock.mockResolvedValue({ publicMetadata: { role: "hr_manager" } });
    const baseUrl = await startServer();

    const response = await fetch(`${baseUrl}/protected`);

    expect(response.status).toBe(200);
    expect(getUserMock).toHaveBeenCalledWith("user_123");
  });

  it("rejects authenticated users without the required role", async () => {
    getAuthMock.mockReturnValue({ isAuthenticated: true, userId: "user_123" });
    getUserMock.mockResolvedValue({ publicMetadata: { role: "employee" } });
    const baseUrl = await startServer();

    const response = await fetch(`${baseUrl}/protected`);

    expect(response.status).toBe(403);
  });

  it("fails closed when Clerk cannot load the current user", async () => {
    getAuthMock.mockReturnValue({ isAuthenticated: true, userId: "user_123" });
    getUserMock.mockRejectedValue(new Error("Clerk unavailable"));
    const baseUrl = await startServer();

    const response = await fetch(`${baseUrl}/protected`);

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Clerk unavailable" });
  });
});

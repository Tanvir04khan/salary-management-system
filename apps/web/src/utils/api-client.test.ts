import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, buildApiUrl, requestApi } from "./api-client";

afterEach(() => vi.unstubAllGlobals());

describe("API client", () => {
  it("serializes query values and omits nullish parameters", () => {
    const url = new URL(buildApiUrl("/employees", {
      page: 2,
      search: "A & B",
      status: "ACTIVE",
      country: undefined,
      department: null,
    }), "http://localhost");

    expect(url.pathname).toBe("/api/employees");
    expect([...url.searchParams.entries()]).toEqual([
      ["page", "2"],
      ["search", "A & B"],
      ["status", "ACTIVE"],
    ]);
  });

  it("unwraps a successful API envelope", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ success: true, statusCode: 200, data: { id: "e-1" }, message: "ok" }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    )));

    await expect(requestApi<{ id: string }>("/employees/e-1")).resolves.toEqual({ id: "e-1" });
  });

  it("uses the backend message for failed API responses", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ success: false, statusCode: 404, data: null, message: "Employee not found" }),
      { status: 404, headers: { "Content-Type": "application/json" } },
    )));

    await expect(requestApi("/employees/missing")).rejects.toMatchObject({
      name: "ApiError",
      message: "Employee not found",
      statusCode: 404,
    } satisfies Partial<ApiError>);
  });
});

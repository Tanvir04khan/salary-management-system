// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useApiMutation } from "./use-api-mutation";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

type MutationResult = { employeeId: string };
type MutationVariables = { firstName: string };

function MutationHarness({ onSuccess, onError }: {
  onSuccess: (result: MutationResult) => void;
  onError: (error: Error) => void;
}) {
  const mutation = useApiMutation<MutationResult, MutationVariables>({
    method: "PATCH",
    path: "/employees/employee-1",
    invalidateQueries: [["employee-list"]],
    onSuccess: (result) => onSuccess(result),
    onError: (error) => onError(error),
  });

  return <button onClick={() => mutation.mutate({ firstName: "Ada" })} type="button">Save employee</button>;
}

function renderMutation(client: QueryClient, onSuccess: (result: MutationResult) => void, onError: (error: Error) => void) {
  return render(
    <QueryClientProvider client={client}>
      <MutationHarness onSuccess={onSuccess} onError={onError} />
    </QueryClientProvider>,
  );
}

describe("useApiMutation", () => {
  it("sends the typed variables, invokes the caller success callback, and invalidates requested keys", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    const onError = vi.fn();
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => ({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({
        success: true,
        statusCode: 200,
        data: { employeeId: "employee-1" },
        message: "Employee updated",
      }),
      requestInit: init,
    }));
    vi.stubGlobal("fetch", fetchMock);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData(["employee-list", { page: 1 }], ["cached"]);
    const cachedQuery = client.getQueryCache().find({ queryKey: ["employee-list"], exact: false });

    renderMutation(client, onSuccess, onError);
    await user.click(screen.getByRole("button", { name: "Save employee" }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith({ employeeId: "employee-1" }));
    expect(onError).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/employees\/employee-1$/),
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ firstName: "Ada" }),
      }),
    );
    expect(cachedQuery?.state.isInvalidated).toBe(true);
  });

  it("preserves the caller error callback with a typed API error", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    const onError = vi.fn();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      text: async () => JSON.stringify({
        success: false,
        statusCode: 409,
        data: null,
        message: "An employee with this email already exists",
      }),
    }));
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    renderMutation(client, onSuccess, onError);
    await user.click(screen.getByRole("button", { name: "Save employee" }));

    await waitFor(() => expect(onError).toHaveBeenCalledWith(expect.objectContaining({
      name: "ApiError",
      message: "An employee with this email already exists",
      statusCode: 409,
    })));
    expect(onSuccess).not.toHaveBeenCalled();
  });
});

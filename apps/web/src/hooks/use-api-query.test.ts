import { describe, expect, it } from "vitest";
import { createApiQueryKey } from "./use-api-query";

describe("createApiQueryKey", () => {
  it("sorts parameter keys and omits nullish values for stable cache keys", () => {
    expect(createApiQueryKey("/employees", { page: 1, status: "ACTIVE", search: undefined }))
      .toEqual(createApiQueryKey("/employees", { status: "ACTIVE", page: 1 }));
  });

  it("keeps different filter and pagination values in separate cache entries", () => {
    expect(createApiQueryKey("/employees", { page: 1 }))
      .not.toEqual(createApiQueryKey("/employees", { page: 2 }));
  });
});

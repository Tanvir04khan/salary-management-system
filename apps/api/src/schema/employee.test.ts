import { describe, expect, it } from "vitest";
import {
    employeeCreateSchema,
    employeeListQuerySchema,
    employeeUpdateSchema,
} from "./employee";

describe("employeeListQuerySchema", () => {
    it("applies pagination and sorting defaults", () => {
        const result = employeeListQuerySchema.parse({});

        expect(result.page).toBe(1);
        expect(result.pageSize).toBe(25);
        expect(result.sortBy).toBe("employeeCode");
        expect(result.sortOrder).toBe("asc");
    });

    it("converts numeric query parameters", () => {
        const result = employeeListQuerySchema.parse({
            page: "2",
            pageSize: "50",
        });

        expect(result.page).toBe(2);
        expect(result.pageSize).toBe(50);
    });

    it("normalizes country codes", () => {
        const result = employeeListQuerySchema.parse({
            country: "in",
        });

        expect(result.country).toBe("IN");
    });

    it("rejects an excessive page size", () => {
        const result = employeeListQuerySchema.safeParse({
            pageSize: "500",
        });

        expect(result.success).toBe(false);
    });

    it("rejects unsupported sort fields", () => {
        const result = employeeListQuerySchema.safeParse({
            sortBy: "password",
        });

        expect(result.success).toBe(false);
    });

    it("rejects invalid employment statuses", () => {
        const result = employeeListQuerySchema.safeParse({
            status: "TERMINATED",
        });

        expect(result.success).toBe(false);
    });
});

describe("employeeCreateSchema", () => {
    it("trims fields, normalizes country and email, and defaults status", () => {
        const result = employeeCreateSchema.parse({
            employeeCode: " ACME-00001 ",
            firstName: " Ada ",
            lastName: " Lovelace ",
            email: " ADA@EXAMPLE.COM ",
            countryCode: " in ",
            department: " Engineering ",
            jobTitle: " Engineer ",
        });

        expect(result).toEqual({
            employeeCode: "ACME-00001",
            firstName: "Ada",
            lastName: "Lovelace",
            email: "ada@example.com",
            countryCode: "IN",
            department: "Engineering",
            jobTitle: "Engineer",
            employmentStatus: "ACTIVE",
        });
    });

    it("rejects malformed email, country code, and blank required fields", () => {
        const result = employeeCreateSchema.safeParse({
            employeeCode: " ",
            firstName: "Ada",
            lastName: "Lovelace",
            email: "not-an-email",
            countryCode: "India",
            department: "Engineering",
            jobTitle: "Engineer",
        });

        expect(result.success).toBe(false);
    });
});

describe("employeeUpdateSchema", () => {
    it("accepts partial profile edits and employee deactivation", () => {
        const result = employeeUpdateSchema.parse({
            department: " Finance ",
            employmentStatus: "INACTIVE",
        });

        expect(result).toEqual({
            department: "Finance",
            employmentStatus: "INACTIVE",
        });
    });

    it("rejects an empty update, invalid fields, and immutable employee codes", () => {
        expect(employeeUpdateSchema.safeParse({}).success).toBe(false);
        expect(employeeUpdateSchema.safeParse({ firstName: " " }).success).toBe(false);
        expect(employeeUpdateSchema.safeParse({ employeeCode: "ACME-99999" }).success)
            .toBe(false);
    });
});

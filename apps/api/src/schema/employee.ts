import { z } from "zod";

export const employeeSortFields = [
    "employeeCode",
    "firstName",
    "lastName",
    "department",
    "countryCode",
    "createdAt",
] as const;

export const employeeListQuerySchema = z.object({
    page: z.coerce
        .number()
        .int()
        .min(1)
        .default(1),

    pageSize: z.coerce
        .number()
        .int()
        .min(1)
        .max(100)
        .default(25),

    search: z.string()
        .trim()
        .max(100)
        .optional(),

    country: z.string()
        .trim()
        .length(2)
        .transform((value) => value.toUpperCase())
        .optional(),

    department: z.string()
        .trim()
        .min(1)
        .max(100)
        .optional(),

    status: z.enum(["ACTIVE", "INACTIVE"])
        .optional(),

    sortBy: z.enum(employeeSortFields)
        .default("employeeCode"),

    sortOrder: z.enum(["asc", "desc"])
        .default("asc"),
});

export const employeeIdParamSchema = z.object({
    id: z.string().uuid(),
});

const employeeProfileFields = {
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100),
    email: z.string().trim().toLowerCase().pipe(z.email().max(255)),
    countryCode: z.string()
        .trim()
        .regex(/^[A-Za-z]{2}$/)
        .transform((value) => value.toUpperCase()),
    department: z.string().trim().min(1).max(100),
    jobTitle: z.string().trim().min(1).max(150),
    employmentStatus: z.enum(["ACTIVE", "INACTIVE"]),
};

export const employeeCreateSchema = z.object({
    employeeCode: z.string().trim().min(1).max(30),
    ...employeeProfileFields,
    employmentStatus: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export const employeeUpdateSchema = z.object(employeeProfileFields)
    .partial()
    .strict()
    .refine(
        (value) => Object.values(value).some((field) => field !== undefined),
        { message: "At least one employee field must be provided" },
    );

export type EmployeeListQuery = z.infer<
    typeof employeeListQuerySchema
>;

export type EmployeeIdParams = z.infer<typeof employeeIdParamSchema>;
export type EmployeeCreateInput = z.infer<typeof employeeCreateSchema>;
export type EmployeeUpdateInput = z.infer<typeof employeeUpdateSchema>;

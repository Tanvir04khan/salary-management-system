import {
    pgEnum,
    pgTable,
    uuid,
    varchar,
    timestamp,
    check,
    index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const employmentStatusEnum = pgEnum("employment_status", [
    "ACTIVE",
    "INACTIVE",
]);

export const employees = pgTable(
    "employees",
    {
        employeeId: uuid("employee_id").defaultRandom().primaryKey(),

        employeeCode: varchar("employee_code", {
            length: 30,
        })
            .notNull()
            .unique(),

        firstName: varchar("first_name", {
            length: 100,
        }).notNull(),

        lastName: varchar("last_name", {
            length: 100,
        }).notNull(),

        email: varchar("email", {
            length: 255,
        })
            .notNull()
            .unique(),

        countryCode: varchar("country_code", {
            length: 2,
        }).notNull(),

        department: varchar("department", {
            length: 100,
        }).notNull(),

        jobTitle: varchar("job_title", {
            length: 150,
        }).notNull(),

        employmentStatus: employmentStatusEnum("employment_status")
            .notNull()
            .default("ACTIVE"),

        createdAt: timestamp("created_at", {
            withTimezone: true,
        })
            .notNull()
            .defaultNow(),

        updatedAt: timestamp("updated_at", {
            withTimezone: true,
        })
            .notNull()
            .defaultNow(),
    },
    (table) => [
        check(
            "employees_country_code_length",
            sql`char_length(${table.countryCode}) = 2`,
        ),

        index("employees_country_department_idx").on(
            table.countryCode,
            table.department,
        ),

        index("employees_status_idx").on(table.employmentStatus),
    ],
);
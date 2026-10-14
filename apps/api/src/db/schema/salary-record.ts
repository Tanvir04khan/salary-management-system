import {
    pgTable,
    uuid,
    varchar,
    numeric,
    date,
    text,
    timestamp,
    check,
    index,
    uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { employees } from "./employees";

export const salaryRecords = pgTable(
    "salary_records",
    {
        salaryRecordsId: uuid("salary_records_id").defaultRandom().primaryKey(),

        employeeId: uuid("employee_id")
            .notNull()
            .references(() => employees.employeeId, {
                onDelete: "restrict",
            }),

        // Annual base salary, not monthly salary or take-home pay.
        amount: numeric("amount", {
            precision: 15,
            scale: 2,
        }).notNull(),

        currency: varchar("currency", {
            length: 3,
        }).notNull(),

        effectiveFrom: date("effective_from", {
            mode: "string",
        }).notNull(),

        // Exclusive end date: the salary is no longer effective
        // on this date. NULL means there is no scheduled end date.
        effectiveTo: date("effective_to", {
            mode: "string",
        }),

        changeReason: text("change_reason"),

        createdAt: timestamp("created_at", {
            withTimezone: true,
        })
            .notNull()
            .defaultNow(),
    },
    (table) => [
        check(
            "salary_records_positive_amount",
            sql`${table.amount} > 0`,
        ),

        check(
            "salary_records_effective_period_valid",
            sql`${table.effectiveTo} IS NULL OR ${table.effectiveTo} > ${table.effectiveFrom}`,
        ),

        uniqueIndex("salary_records_employee_effective_from_uidx").on(
            table.employeeId,
            table.effectiveFrom,
        ),

        index("salary_records_employee_idx").on(table.employeeId),

        index("salary_records_currency_idx").on(table.currency),
    ],
);
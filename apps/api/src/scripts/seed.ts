// apps/api/src/scripts/seed.ts

import { db, pool } from "../db/client";
import { employees, salaryRecords } from "../db/schema";

const EMPLOYEE_COUNT = 10_000;
const BATCH_SIZE = 500;
const EFFECTIVE_FROM = "2025-04-01";

const countries = [
    { code: "IN", currency: "INR", base: 600_000, range: 2_400_000 },
    { code: "SA", currency: "SAR", base: 48_000, range: 192_000 },
    { code: "AE", currency: "AED", base: 60_000, range: 240_000 },
    { code: "GB", currency: "GBP", base: 25_000, range: 100_000 },
    { code: "US", currency: "USD", base: 40_000, range: 160_000 },
] as const;

const departments = [
    "Engineering",
    "Human Resources",
    "Finance",
    "Sales",
    "Marketing",
    "Operations",
    "Customer Support",
    "Legal",
] as const;

const titles = [
    "Software Engineer",
    "Senior Software Engineer",
    "Engineering Manager",
    "HR Specialist",
    "Financial Analyst",
    "Sales Executive",
    "Product Manager",
    "Operations Analyst",
] as const;

const firstNames = [
    "Aarav",
    "Aisha",
    "Daniel",
    "Fatima",
    "James",
    "Layla",
    "Mohammed",
    "Olivia",
    "Priya",
    "William",
] as const;

const lastNames = [
    "Khan",
    "Sharma",
    "Patel",
    "Smith",
    "Johnson",
    "Ahmed",
    "Wilson",
    "Singh",
    "Brown",
    "Taylor",
] as const;

function employeeId(index: number): string {
    return `00000000-0000-4000-8000-${index
        .toString(16)
        .padStart(12, "0")}`;
}

function salaryId(index: number): string {
    return `00000000-0001-4000-8000-${index
        .toString(16)
        .padStart(12, "0")}`;
}

function buildEmployee(index: number) {
    const country = countries[index % countries.length];
    const firstName = firstNames[index % firstNames.length];
    const lastName =
        lastNames[Math.floor(index / firstNames.length) % lastNames.length];

    return {
        employeeId: employeeId(index),
        employeeCode: `ACME-${String(index).padStart(5, "0")}`,
        firstName,
        lastName,
        email: `employee${String(index).padStart(5, "0")}@example.com`,
        countryCode: country.code,
        department: departments[(index * 3) % departments.length],
        jobTitle: titles[(index * 7) % titles.length],
        employmentStatus: index % 17 === 0 ? "INACTIVE" as const : "ACTIVE" as const,
    };
}

function buildSalary(index: number) {
    const country = countries[index % countries.length];
    const amount = country.base + ((index * 7_919) % country.range);

    return {
        salaryRecordsId: salaryId(index),
        employeeId: employeeId(index),
        amount: amount.toFixed(2),
        currency: country.currency,
        effectiveFrom: EFFECTIVE_FROM,
        effectiveTo: null,
        changeReason: "Initial seeded compensation",
    };
}

async function main() {
    console.log(`Seeding ${EMPLOYEE_COUNT} employees...`);

    try {
        await db.transaction(async (tx) => {
            for (
                let start = 1;
                start <= EMPLOYEE_COUNT;
                start += BATCH_SIZE
            ) {
                const end = Math.min(
                    start + BATCH_SIZE,
                    EMPLOYEE_COUNT + 1,
                );

                const employeeBatch = Array.from(
                    { length: end - start },
                    (_, offset) => buildEmployee(start + offset),
                );

                const salaryBatch = Array.from(
                    { length: end - start },
                    (_, offset) => buildSalary(start + offset),
                );

                await tx
                    .insert(employees)
                    .values(employeeBatch)
                    .onConflictDoUpdate({
                        target: employees.employeeCode,
                        set: {
                            firstName: employees.firstName,
                        },
                    });

                await tx
                    .insert(salaryRecords)
                    .values(salaryBatch)
                    .onConflictDoNothing();
            }
        });

        console.log("Seed completed successfully.");
    } finally {
        await pool.end();
    }
}

main().catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
});
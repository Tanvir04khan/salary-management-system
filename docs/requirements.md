# ACME Salary Management System - Requirements

## Goal

Build a web-based salary management application that enables ACME's HR Manager to manage compensation records for 10,000 employees across multiple countries. The system will replace spreadsheet-based workflows with searchable, validated, and auditable salary data.

## Primary User

**HR Manager:** Needs to find employee records quickly, maintain accurate salary information, and understand compensation distribution across the organization.

## Scope and Features

### 1. Employee and Salary Management
- List, search, filter, sort, and paginate employee records.
- View employee details, including employee ID, name, country, department, job title, employment status, and compensation.
- Create employee records and update employee details and salary information.
- Validate required fields, salary amounts, currency codes, and other business rules.
- Display the salary currency explicitly for every record.

### 2. Compensation Insights
- Provide an overview of employee count, total recorded compensation, and average salary.
- Analyze compensation by country and department.
- Support filtering and drill-down from aggregate views to employee records.
- Never aggregate salaries across different currencies without an explicitly defined conversion methodology.

### 3. Data Integrity and Auditability
- Enforce validation at the API and database layers where appropriate.
- Record salary changes with the employee, previous value, new value, timestamp, and acting user when authentication is implemented.
- Seed the database with 10,000 reproducible employee records.
- Handle invalid input, missing records, and unexpected server errors consistently.

### 4. Usability and Testing
- Provide a responsive, accessible interface with loading, empty, success, and error states.
- Use server-side pagination and filtering to avoid loading all 10,000 records into the browser.
- Cover core business logic, API behavior, validation, and important edge cases with deterministic automated tests.

## Deliberately Out of Scope

- Payroll execution, payslip generation, tax calculations, and statutory compliance.
- Automated currency conversion or exchange-rate management.
- Recruitment, attendance, leave management, and other full-HRMS capabilities.
- Complex organizational permissions and SSO integration beyond what is needed for the demonstration.
- AI-powered compensation recommendations and predictive analytics.

These exclusions keep the initial product focused on reliable salary-data management and useful compensation insights rather than introducing unrelated business rules or external dependencies.

## Success Criteria

- The application can be deployed and used end to end.
- A reproducible seed process creates 10,000 employees.
- HR can search, filter, paginate, inspect, and update salary records.
- Compensation summaries are accurate and currency-aware.
- Core workflows pass automated tests.
- The repository includes setup instructions, architecture and trade-off notes, incremental Git commits, and a demonstration video.

## Assumptions

ACME's salary data is initially managed by authorized HR personnel. Salary amounts represent recorded compensation, not necessarily payroll payments. Currency-specific summaries are used until a reliable conversion policy is defined.
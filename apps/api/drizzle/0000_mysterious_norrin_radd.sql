CREATE TYPE "public"."employment_status" AS ENUM('ACTIVE', 'INACTIVE');--> statement-breakpoint
CREATE TABLE "employees" (
	"employee_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_code" varchar(30) NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"country_code" varchar(2) NOT NULL,
	"department" varchar(100) NOT NULL,
	"job_title" varchar(150) NOT NULL,
	"employment_status" "employment_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "employees_employee_code_unique" UNIQUE("employee_code"),
	CONSTRAINT "employees_email_unique" UNIQUE("email"),
	CONSTRAINT "employees_country_code_length" CHECK (char_length("employees"."country_code") = 2)
);
--> statement-breakpoint
CREATE TABLE "salary_records" (
	"salary_records_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"currency" varchar(3) NOT NULL,
	"effective_from" date NOT NULL,
	"effective_to" date,
	"change_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "salary_records_positive_amount" CHECK ("salary_records"."amount" > 0),
	CONSTRAINT "salary_records_effective_period_valid" CHECK ("salary_records"."effective_to" IS NULL OR "salary_records"."effective_to" > "salary_records"."effective_from")
);
--> statement-breakpoint
ALTER TABLE "salary_records" ADD CONSTRAINT "salary_records_employee_id_employees_employee_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("employee_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "employees_country_department_idx" ON "employees" USING btree ("country_code","department");--> statement-breakpoint
CREATE INDEX "employees_status_idx" ON "employees" USING btree ("employment_status");--> statement-breakpoint
CREATE UNIQUE INDEX "salary_records_employee_effective_from_uidx" ON "salary_records" USING btree ("employee_id","effective_from");--> statement-breakpoint
CREATE INDEX "salary_records_employee_idx" ON "salary_records" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "salary_records_currency_idx" ON "salary_records" USING btree ("currency");
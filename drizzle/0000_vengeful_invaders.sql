CREATE TYPE "public"."ai_session_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."assignment_role" AS ENUM('makeup', 'hair', 'styling', 'consultation');--> statement-breakpoint
CREATE TYPE "public"."booking_status" AS ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."employee_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('mehndi', 'barat', 'valima', 'engagement', 'other');--> statement-breakpoint
CREATE TYPE "public"."look_status" AS ENUM('generated', 'shortlisted', 'selected', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('salon_admin', 'receptionist', 'stylist', 'makeup_artist', 'hair_stylist');--> statement-breakpoint
CREATE TABLE "ai_generated_looks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ai_session_id" uuid NOT NULL,
	"image_url" text NOT NULL,
	"title" varchar(150),
	"description" text,
	"status" "look_status" DEFAULT 'generated' NOT NULL,
	"score" numeric(5, 2),
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_look_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" uuid NOT NULL,
	"booking_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"created_by_employee_id" uuid,
	"input_image_url" text NOT NULL,
	"event_type" "event_type" NOT NULL,
	"prompt" text,
	"preferences" jsonb,
	"ai_model_name" varchar(150),
	"status" "ai_session_status" DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "booking_employees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"assignment_role" "assignment_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booking_services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"price_at_booking" numeric(10, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"event_type" "event_type" NOT NULL,
	"booking_date" timestamp with time zone NOT NULL,
	"status" "booking_status" DEFAULT 'pending' NOT NULL,
	"total_amount" numeric(10, 2) DEFAULT '0',
	"advance_paid" numeric(10, 2) DEFAULT '0',
	"final_look_status" "look_status" DEFAULT 'generated',
	"notes" text,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" uuid NOT NULL,
	"full_name" varchar(150) NOT NULL,
	"phone" varchar(30) NOT NULL,
	"email" varchar(255),
	"wedding_date" timestamp with time zone,
	"skin_tone" varchar(80),
	"skin_undertone" varchar(80),
	"face_shape" varchar(80),
	"preferences" jsonb,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_work_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" uuid NOT NULL,
	"booking_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"work_type" varchar(100) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" uuid NOT NULL,
	"user_id" uuid,
	"name" varchar(150) NOT NULL,
	"phone" varchar(30),
	"email" varchar(255),
	"role" "user_role" NOT NULL,
	"specialization" varchar(150),
	"experience_years" integer DEFAULT 0,
	"status" "employee_status" DEFAULT 'active' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "look_selections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" uuid NOT NULL,
	"booking_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"generated_look_id" uuid NOT NULL,
	"selected_by_employee_id" uuid,
	"status" "look_status" NOT NULL,
	"is_final" boolean DEFAULT false NOT NULL,
	"notes" text,
	"selected_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "salons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(150) NOT NULL,
	"phone" varchar(30),
	"email" varchar(255),
	"address" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" uuid NOT NULL,
	"name" varchar(150) NOT NULL,
	"description" text,
	"price" numeric(10, 2) NOT NULL,
	"duration_minutes" integer DEFAULT 60 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"salon_id" uuid NOT NULL,
	"full_name" varchar(150) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(30),
	"password_hash" text NOT NULL,
	"role" "user_role" NOT NULL,
	"is_email_verified" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_generated_looks" ADD CONSTRAINT "ai_generated_looks_ai_session_id_ai_look_sessions_id_fk" FOREIGN KEY ("ai_session_id") REFERENCES "public"."ai_look_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_look_sessions" ADD CONSTRAINT "ai_look_sessions_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_look_sessions" ADD CONSTRAINT "ai_look_sessions_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_look_sessions" ADD CONSTRAINT "ai_look_sessions_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_look_sessions" ADD CONSTRAINT "ai_look_sessions_created_by_employee_id_employees_id_fk" FOREIGN KEY ("created_by_employee_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_employees" ADD CONSTRAINT "booking_employees_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_employees" ADD CONSTRAINT "booking_employees_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_services" ADD CONSTRAINT "booking_services_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_services" ADD CONSTRAINT "booking_services_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_work_logs" ADD CONSTRAINT "employee_work_logs_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_work_logs" ADD CONSTRAINT "employee_work_logs_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_work_logs" ADD CONSTRAINT "employee_work_logs_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_work_logs" ADD CONSTRAINT "employee_work_logs_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "look_selections" ADD CONSTRAINT "look_selections_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "look_selections" ADD CONSTRAINT "look_selections_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "look_selections" ADD CONSTRAINT "look_selections_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "look_selections" ADD CONSTRAINT "look_selections_generated_look_id_ai_generated_looks_id_fk" FOREIGN KEY ("generated_look_id") REFERENCES "public"."ai_generated_looks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "look_selections" ADD CONSTRAINT "look_selections_selected_by_employee_id_employees_id_fk" FOREIGN KEY ("selected_by_employee_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_salon_id_salons_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_generated_looks_session_idx" ON "ai_generated_looks" USING btree ("ai_session_id");--> statement-breakpoint
CREATE INDEX "ai_generated_looks_status_idx" ON "ai_generated_looks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ai_look_sessions_booking_idx" ON "ai_look_sessions" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "ai_look_sessions_client_idx" ON "ai_look_sessions" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "ai_look_sessions_status_idx" ON "ai_look_sessions" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "booking_employees_unique" ON "booking_employees" USING btree ("booking_id","employee_id","assignment_role");--> statement-breakpoint
CREATE INDEX "booking_employees_employee_idx" ON "booking_employees" USING btree ("employee_id");--> statement-breakpoint
CREATE UNIQUE INDEX "booking_services_unique" ON "booking_services" USING btree ("booking_id","service_id");--> statement-breakpoint
CREATE INDEX "booking_services_booking_idx" ON "booking_services" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "bookings_salon_date_idx" ON "bookings" USING btree ("salon_id","booking_date");--> statement-breakpoint
CREATE INDEX "bookings_client_idx" ON "bookings" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "bookings_status_idx" ON "bookings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "clients_salon_phone_idx" ON "clients" USING btree ("salon_id","phone");--> statement-breakpoint
CREATE INDEX "clients_salon_email_idx" ON "clients" USING btree ("salon_id","email");--> statement-breakpoint
CREATE INDEX "employee_work_logs_employee_client_idx" ON "employee_work_logs" USING btree ("employee_id","client_id");--> statement-breakpoint
CREATE INDEX "employee_work_logs_booking_idx" ON "employee_work_logs" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "employees_salon_role_idx" ON "employees" USING btree ("salon_id","role");--> statement-breakpoint
CREATE UNIQUE INDEX "employees_user_unique" ON "employees" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "look_selections_booking_idx" ON "look_selections" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "look_selections_client_idx" ON "look_selections" USING btree ("client_id");--> statement-breakpoint
CREATE UNIQUE INDEX "look_selections_unique" ON "look_selections" USING btree ("booking_id","generated_look_id");--> statement-breakpoint
CREATE INDEX "salons_email_idx" ON "salons" USING btree ("email");--> statement-breakpoint
CREATE INDEX "services_salon_idx" ON "services" USING btree ("salon_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_salon_role_idx" ON "users" USING btree ("salon_id","role");
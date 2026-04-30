import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  numeric,
  jsonb,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/* =========================
   ENUMS
========================= */

export const userRoleEnum = pgEnum("user_role", [
  "salon_admin",
  "receptionist",
  "stylist",
  "makeup_artist",
  "hair_stylist",
]);

export const employeeStatusEnum = pgEnum("employee_status", [
  "active",
  "inactive",
]);

export const eventTypeEnum = pgEnum("event_type", [
  "mehndi",
  "barat",
  "valima",
  "engagement",
  "other",
]);

export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
]);

export const lookStatusEnum = pgEnum("look_status", [
  "generated",
  "shortlisted",
  "selected",
  "rejected",
]);

export const aiSessionStatusEnum = pgEnum("ai_session_status", [
  "pending",
  "processing",
  "completed",
  "failed",
]);

export const assignmentRoleEnum = pgEnum("assignment_role", [
  "makeup",
  "hair",
  "styling",
  "consultation",
]);

/* =========================
   SALONS
========================= */

export const salons = pgTable(
  "salons",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    name: varchar("name", { length: 150 }).notNull(),
    phone: varchar("phone", { length: 30 }),
    email: varchar("email", { length: 255 }),
    address: text("address"),

    isActive: boolean("is_active").default(true).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    emailIdx: index("salons_email_idx").on(table.email),
  })
);

/* =========================
   USERS - STAFF LOGIN
========================= */

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    salonId: uuid("salon_id")
      .notNull()
      .references(() => salons.id, { onDelete: "cascade" }),

    fullName: varchar("full_name", { length: 150 }).notNull(),

    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 30 }),

    passwordHash: text("password_hash").notNull(),

    role: userRoleEnum("role").notNull(),

    isEmailVerified: boolean("is_email_verified").default(false).notNull(),
    isActive: boolean("is_active").default(true).notNull(),

    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    emailUnique: uniqueIndex("users_email_unique").on(table.email),
    salonRoleIdx: index("users_salon_role_idx").on(table.salonId, table.role),
  })
);

/* =========================
   EMPLOYEES
========================= */

export const employees = pgTable(
  "employees",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    salonId: uuid("salon_id")
      .notNull()
      .references(() => salons.id, { onDelete: "cascade" }),

    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),

    name: varchar("name", { length: 150 }).notNull(),
    phone: varchar("phone", { length: 30 }),
    email: varchar("email", { length: 255 }),

    role: userRoleEnum("role").notNull(),

    specialization: varchar("specialization", { length: 150 }),
    experienceYears: integer("experience_years").default(0),

    status: employeeStatusEnum("status").default("active").notNull(),

    notes: text("notes"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    salonRoleIdx: index("employees_salon_role_idx").on(
      table.salonId,
      table.role
    ),
    userUnique: uniqueIndex("employees_user_unique").on(table.userId),
  })
);

/* =========================
   CLIENTS
========================= */

export const clients = pgTable(
  "clients",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    salonId: uuid("salon_id")
      .notNull()
      .references(() => salons.id, { onDelete: "cascade" }),

    fullName: varchar("full_name", { length: 150 }).notNull(),

    phone: varchar("phone", { length: 30 }).notNull(),
    email: varchar("email", { length: 255 }),

    weddingDate: timestamp("wedding_date", { withTimezone: true }),

    skinTone: varchar("skin_tone", { length: 80 }),
    skinUndertone: varchar("skin_undertone", { length: 80 }),
    faceShape: varchar("face_shape", { length: 80 }),

    preferences: jsonb("preferences").$type<{
      makeupStyle?: string;
      hairstyle?: string;
      jewelry?: string;
      dupattaStyle?: string;
      notes?: string;
    }>(),

    notes: text("notes"),

    isActive: boolean("is_active").default(true).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    salonPhoneIdx: index("clients_salon_phone_idx").on(
      table.salonId,
      table.phone
    ),
    salonEmailIdx: index("clients_salon_email_idx").on(
      table.salonId,
      table.email
    ),
  })
);

/* =========================
   SERVICES
========================= */

export const services = pgTable(
  "services",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    salonId: uuid("salon_id")
      .notNull()
      .references(() => salons.id, { onDelete: "cascade" }),

    name: varchar("name", { length: 150 }).notNull(),

    description: text("description"),

    price: numeric("price", { precision: 10, scale: 2 }).notNull(),

    durationMinutes: integer("duration_minutes").default(60).notNull(),

    isActive: boolean("is_active").default(true).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    salonServiceIdx: index("services_salon_idx").on(table.salonId),
  })
);

/* =========================
   BOOKINGS
========================= */

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    salonId: uuid("salon_id")
      .notNull()
      .references(() => salons.id, { onDelete: "cascade" }),

    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),

    eventType: eventTypeEnum("event_type").notNull(),

    bookingDate: timestamp("booking_date", { withTimezone: true }).notNull(),

    status: bookingStatusEnum("status").default("pending").notNull(),

    totalAmount: numeric("total_amount", {
      precision: 10,
      scale: 2,
    }).default("0"),

    advancePaid: numeric("advance_paid", {
      precision: 10,
      scale: 2,
    }).default("0"),

    finalLookStatus: lookStatusEnum("final_look_status").default("generated"),

    notes: text("notes"),

    createdByUserId: uuid("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    salonDateIdx: index("bookings_salon_date_idx").on(
      table.salonId,
      table.bookingDate
    ),
    clientIdx: index("bookings_client_idx").on(table.clientId),
    statusIdx: index("bookings_status_idx").on(table.status),
  })
);

/* =========================
   BOOKING SERVICES
========================= */

export const bookingServices = pgTable(
  "booking_services",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),

    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "restrict" }),

    priceAtBooking: numeric("price_at_booking", {
      precision: 10,
      scale: 2,
    }).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    bookingServiceUnique: uniqueIndex("booking_services_unique").on(
      table.bookingId,
      table.serviceId
    ),
    bookingIdx: index("booking_services_booking_idx").on(table.bookingId),
  })
);

/* =========================
   BOOKING EMPLOYEES
========================= */

export const bookingEmployees = pgTable(
  "booking_employees",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),

    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "restrict" }),

    assignmentRole: assignmentRoleEnum("assignment_role").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    bookingEmployeeUnique: uniqueIndex("booking_employees_unique").on(
      table.bookingId,
      table.employeeId,
      table.assignmentRole
    ),
    employeeIdx: index("booking_employees_employee_idx").on(table.employeeId),
  })
);

/* =========================
   EMPLOYEE WORK HISTORY
========================= */

export const employeeWorkLogs = pgTable(
  "employee_work_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    salonId: uuid("salon_id")
      .notNull()
      .references(() => salons.id, { onDelete: "cascade" }),

    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),

    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),

    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "restrict" }),

    workType: varchar("work_type", { length: 100 }).notNull(),

    description: text("description"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    employeeClientIdx: index("employee_work_logs_employee_client_idx").on(
      table.employeeId,
      table.clientId
    ),
    bookingIdx: index("employee_work_logs_booking_idx").on(table.bookingId),
  })
);

/* =========================
   AI LOOK SESSIONS
========================= */

export const aiLookSessions = pgTable(
  "ai_look_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    salonId: uuid("salon_id")
      .notNull()
      .references(() => salons.id, { onDelete: "cascade" }),

    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),

    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),

    createdByEmployeeId: uuid("created_by_employee_id").references(
      () => employees.id,
      { onDelete: "set null" }
    ),

    inputImageUrl: text("input_image_url").notNull(),

    eventType: eventTypeEnum("event_type").notNull(),

    prompt: text("prompt"),

    preferences: jsonb("preferences").$type<{
      makeupStyle?: string;
      hairstyle?: string;
      jewelry?: string;
      dupattaStyle?: string;
      colorTheme?: string;
    }>(),

    aiModelName: varchar("ai_model_name", { length: 150 }),

    status: aiSessionStatusEnum("status").default("pending").notNull(),

    errorMessage: text("error_message"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => ({
    bookingIdx: index("ai_look_sessions_booking_idx").on(table.bookingId),
    clientIdx: index("ai_look_sessions_client_idx").on(table.clientId),
    statusIdx: index("ai_look_sessions_status_idx").on(table.status),
  })
);

/* =========================
   AI GENERATED LOOKS
========================= */

export const aiGeneratedLooks = pgTable(
  "ai_generated_looks",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    aiSessionId: uuid("ai_session_id")
      .notNull()
      .references(() => aiLookSessions.id, { onDelete: "cascade" }),

    imageUrl: text("image_url").notNull(),

    title: varchar("title", { length: 150 }),

    description: text("description"),

    status: lookStatusEnum("status").default("generated").notNull(),

    score: numeric("score", { precision: 5, scale: 2 }),

    metadata: jsonb("metadata").$type<{
      seed?: string;
      modelVersion?: string;
      faceShape?: string;
      skinTone?: string;
      skinUndertone?: string;
    }>(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    sessionIdx: index("ai_generated_looks_session_idx").on(table.aiSessionId),
    statusIdx: index("ai_generated_looks_status_idx").on(table.status),
  })
);

/* =========================
   LOOK SELECTIONS
========================= */

export const lookSelections = pgTable(
  "look_selections",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    salonId: uuid("salon_id")
      .notNull()
      .references(() => salons.id, { onDelete: "cascade" }),

    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),

    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),

    generatedLookId: uuid("generated_look_id")
      .notNull()
      .references(() => aiGeneratedLooks.id, { onDelete: "cascade" }),

    selectedByEmployeeId: uuid("selected_by_employee_id").references(
      () => employees.id,
      { onDelete: "set null" }
    ),

    status: lookStatusEnum("status").notNull(),

    isFinal: boolean("is_final").default(false).notNull(),

    notes: text("notes"),

    selectedAt: timestamp("selected_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    bookingIdx: index("look_selections_booking_idx").on(table.bookingId),
    clientIdx: index("look_selections_client_idx").on(table.clientId),

    /**
     * This prevents the same generated look from being selected twice
     * for the same booking.
     */
    uniqueLookSelection: uniqueIndex("look_selections_unique").on(
      table.bookingId,
      table.generatedLookId
    ),
  })
);
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const clientSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  phone: z
    .string()
    .regex(/^(\+92|0)[0-9]{10}$/, "Enter valid Pakistani phone (e.g. 03001234567)"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  weddingDate: z.string().optional().or(z.literal("")),
  skinTone: z.string().optional(),
  skinUndertone: z.string().optional(),
  faceShape: z.string().optional(),
  makeupStylePreference: z.string().optional(),
  hairstylePreference: z.string().optional(),
  notes: z.string().optional(),
});

export const bookingSchema = z.object({
  clientId: z.string().uuid("Invalid client"),
  eventType: z.enum(["mehndi", "barat", "valima", "engagement", "other"]),
  bookingDate: z.string().min(1, "Date is required"),
  serviceIds: z.array(z.string().uuid()).min(1, "Select at least one service"),
  employeeAssignments: z
    .array(
      z.object({
        employeeId: z.string().uuid(),
        assignmentRole: z.enum(["makeup", "hair", "styling", "consultation"]),
      })
    )
    .min(1, "Assign at least one employee"),
  totalAmount: z.number().positive("Total must be positive"),
  advancePaid: z.number().min(0, "Advance cannot be negative"),
  notes: z.string().optional(),
});

export const employeeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z
    .string()
    .regex(/^(\+92|0)[0-9]{10}$/, "Enter valid Pakistani phone"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  role: z.enum([
    "salon_admin",
    "receptionist",
    "stylist",
    "makeup_artist",
    "hair_stylist",
  ]),
  specialization: z.string().optional(),
  experienceYears: z.number().int().min(0).max(50).default(0),
  status: z.enum(["active", "inactive"]).default("active"),
  notes: z.string().optional(),
});

export const serviceSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional().or(z.literal("")),
  price: z.coerce.number().positive("Price must be greater than 0"),
  durationMinutes: z.coerce.number().int().min(1).max(1440),
  isActive: z.boolean().optional(),
});

export const aiPreferencesSchema = z.object({
  makeupStyle: z.string().min(1, "Select a makeup style"),
  hairstyle: z.string().min(1, "Select a hairstyle"),
  colorTheme: z.string().min(1, "Select a color theme"),
  dupattaStyle: z.string().optional(),
  additionalNotes: z.string().max(300).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ClientInput = z.infer<typeof clientSchema>;
export type BookingInput = z.infer<typeof bookingSchema>;
export type EmployeeInput = z.input<typeof employeeSchema>;
export type EmployeeParsed = z.infer<typeof employeeSchema>;
export type ServiceInput = z.input<typeof serviceSchema>;
export type ServiceParsed = z.infer<typeof serviceSchema>;
export type AIPreferencesInput = z.infer<typeof aiPreferencesSchema>;

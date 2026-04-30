import { InferSelectModel } from "drizzle-orm";
import {
  clients,
  bookings,
  employees,
  aiGeneratedLooks,
  aiLookSessions,
  lookSelections,
  employeeWorkLogs,
  services,
} from "@/db/schema";

export type Client = InferSelectModel<typeof clients>;
export type Booking = InferSelectModel<typeof bookings>;
export type Employee = InferSelectModel<typeof employees>;
export type AIGeneratedLook = InferSelectModel<typeof aiGeneratedLooks>;
export type AILookSession = InferSelectModel<typeof aiLookSessions>;
export type LookSelection = InferSelectModel<typeof lookSelections>;
export type WorkLog = InferSelectModel<typeof employeeWorkLogs>;
export type Service = InferSelectModel<typeof services>;

export type BookingWithClient = Booking & {
  client: Pick<Client, "fullName" | "phone" | "email" | "weddingDate">;
};

export type BookingWithDetails = Booking & {
  client: Client;
  employees: Array<Employee & { assignmentRole: string }>;
  services: Array<{ id: string; name: string; priceAtBooking: string }>;
  finalLook?: AIGeneratedLook | null;
};

export type EmployeeWithStats = Employee & {
  totalBookings: number;
  uniqueClientsServed: number;
};

export type AISessionWithLooks = AILookSession & {
  looks: AIGeneratedLook[];
};

export type WorkLogWithDetails = WorkLog & {
  clientName: string;
  employeeName: string;
  employeeRole: string;
  eventType: string;
  bookingDate: string;
  finalLookImageUrl?: string | null;
};

export type PreferencesData = {
  makeupStyle: string;
  hairstyle: string;
  colorTheme: string;
  dupattaStyle: string;
  additionalNotes?: string;
};

export type BookingEmployeeAssignment = {
  employeeId: string;
  assignmentRole: "makeup" | "hair" | "styling" | "consultation";
};

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      salonId: string;
      role: string;
      fullName: string;
      email: string;
      name?: string | null;
    };
  }
  interface User {
    salonId: string;
    role: string;
    fullName: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    salonId: string;
    role: string;
    fullName: string;
  }
}

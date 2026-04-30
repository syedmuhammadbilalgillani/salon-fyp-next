import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import {
  salons,
  users,
  employees,
  services,
  bookingEmployees,
  bookings,
  bookingServices,
  clients,
  employeeWorkLogs,
  aiLookSessions,
  aiGeneratedLooks,
} from "./schema";

const employeeData = [
  {
    name: "Hira Baig",
    role: "makeup_artist" as const,
    specialization: "Bridal Makeup",
    phone: "03011234567",
    email: "hira@salon.com",
    password: "Hira@123",
  },
  {
    name: "Sana Khan",
    role: "hair_stylist" as const,
    specialization: "Bridal Hair",
    phone: "03021234567",
    email: "sana@salon.com",
    password: "Sana@123",
  },
  {
    name: "Zara Ali",
    role: "stylist" as const,
    specialization: "Bridal Styling",
    phone: "03031234567",
    email: "zara@salon.com",
    password: "Zara@123",
  },
];

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
  const db = drizzle({ client: pool });

  try {
    console.log("🌱 Seeding database…\n");

    await db.transaction(async (tx) => {
      console.log("==== start deletion ====");

      // Delete children first to satisfy FK constraints
      await tx.delete(aiGeneratedLooks).execute();
      await tx.delete(aiLookSessions).execute();
      await tx.delete(employeeWorkLogs).execute();
      await tx.delete(bookingEmployees).execute();
      await tx.delete(bookingServices).execute();
      await tx.delete(bookings).execute();
      await tx.delete(employees).execute();
      await tx.delete(services).execute();
      await tx.delete(clients).execute();
      await tx.delete(users).execute();
      await tx.delete(salons).execute();

      console.log("==== end deletion ====");

      const [salon] = await tx
        .insert(salons)
        .values({
          name: "Glamour Studio",
          email: "admin@glamour.com",
          phone: "03001234567",
          address: "123 Main Street, Lahore",
        })
        .returning();

      console.log("✅ Salon created:", salon.name);

      // Admin user
      const adminHash = await bcrypt.hash("Admin@123", 12);
      const [adminUser] = await tx
        .insert(users)
        .values({
          salonId: salon.id,
          fullName: "Salon Admin",
          email: "admin@salon.com",
          passwordHash: adminHash,
          role: "salon_admin",
          isEmailVerified: true,
          isActive: true,
        })
        .returning();

      console.log("✅ Admin user created:", adminUser.email);

      // Employees with login accounts
      for (const empData of employeeData) {
        const passwordHash = await bcrypt.hash(empData.password, 12);

        const [user] = await tx
          .insert(users)
          .values({
            salonId: salon.id,
            fullName: empData.name,
            email: empData.email,
            passwordHash,
            role: empData.role,
            isEmailVerified: true,
            isActive: true,
          })
          .returning();

        await tx.insert(employees).values({
          salonId: salon.id,
          userId: user.id,
          name: empData.name,
          phone: empData.phone,
          email: empData.email,
          role: empData.role,
          specialization: empData.specialization,
          experienceYears: 3,
          status: "active",
        });

        console.log(`✅ Employee created: ${empData.name} (${empData.email})`);
      }

      await tx.insert(services).values([
        {
          salonId: salon.id,
          name: "Bridal Makeup Package",
          price: "15000",
          durationMinutes: 180,
        },
        {
          salonId: salon.id,
          name: "Hair Styling Package",
          price: "8000",
          durationMinutes: 120,
        },
        {
          salonId: salon.id,
          name: "Bridal Full Package",
          price: "25000",
          durationMinutes: 300,
        },
      ]);

      console.log("✅ Services created\n");
    });

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔑 Login Credentials");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Admin      admin@salon.com    Admin@123");
    console.log("Makeup     hira@salon.com     Hira@123");
    console.log("Hair       sana@salon.com     Sana@123");
    console.log("Stylist    zara@salon.com     Zara@123");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
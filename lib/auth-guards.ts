import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PERMISSIONS } from "@/lib/permissions";

/** Call at the top of any server component to require a logged-in session. */
export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.salonId) redirect("/login");
  return session;
}

/** Require salon_admin role — redirects to /dashboard otherwise. */
export async function requireAdmin() {
  const session = await requireSession();
  if (!PERMISSIONS.isAdmin(session.user.role)) redirect("/dashboard");
  return session;
}

/** Require admin OR receptionist — redirects staff-only users to /dashboard. */
export async function requireAdminOrReceptionist() {
  const session = await requireSession();
  if (PERMISSIONS.isStaffOnly(session.user.role)) redirect("/dashboard");
  return session;
}

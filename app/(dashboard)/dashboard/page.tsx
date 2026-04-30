import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { EmployeeDashboard } from "@/components/dashboard/EmployeeDashboard";
import { PERMISSIONS } from "@/lib/permissions";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role ?? "";

  if (PERMISSIONS.isStaffOnly(role)) {
    return <EmployeeDashboard />;
  }

  return <AdminDashboard />;
}

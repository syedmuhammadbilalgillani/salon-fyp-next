import { requireAdmin } from "@/lib/auth-guards";

export default async function EmployeesLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <>{children}</>;
}

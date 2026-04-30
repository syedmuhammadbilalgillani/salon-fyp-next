import { requireAdmin } from "@/lib/auth-guards";
import { ServicesTable } from "@/components/services/ServicesTable";

export default async function ServicesPage() {
  await requireAdmin();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Services</h1>
        <p className="text-sm text-gray-500">Manage your salon services and pricing</p>
      </div>
      <ServicesTable />
    </div>
  );
}


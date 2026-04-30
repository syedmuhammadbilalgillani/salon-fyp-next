import { requireAdminOrReceptionist } from "@/lib/auth-guards";
import { ClientsTable } from "@/components/clients/ClientsTable";

export default async function ClientsPage() {
  await requireAdminOrReceptionist();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
        <p className="text-sm text-gray-500">Manage your salon clients</p>
      </div>
      <ClientsTable />
    </div>
  );
}

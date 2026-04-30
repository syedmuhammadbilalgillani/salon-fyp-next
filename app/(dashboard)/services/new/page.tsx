import { requireAdmin } from "@/lib/auth-guards";
import { ServiceForm } from "@/components/services/ServiceForm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function NewServicePage() {
  await requireAdmin();

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <Link href="/services" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2">
          <ChevronLeft className="w-4 h-4" /> Back to Services
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Add Service</h1>
      </div>

      <ServiceForm mode="create" />
    </div>
  );
}


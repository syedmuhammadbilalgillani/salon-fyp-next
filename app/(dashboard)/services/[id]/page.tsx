import { requireAdmin } from "@/lib/auth-guards";
import db from "@/db/index";
import { services } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ServiceForm } from "@/components/services/ServiceForm";

export default async function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const session = await getServerSession(authOptions);
  const { id } = await params;

  const [service] = await db
    .select()
    .from(services)
    .where(and(eq(services.id, id), eq(services.salonId, session!.user.salonId)))
    .limit(1);

  if (!service) notFound();

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <Link href="/services" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2">
          <ChevronLeft className="w-4 h-4" /> Back to Services
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Service</h1>
      </div>

      <ServiceForm mode="edit" initial={service} />
    </div>
  );
}


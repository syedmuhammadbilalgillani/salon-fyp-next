import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SessionProvider } from "@/components/layout/SessionProvider";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <SessionProvider>
      <div suppressContentEditableWarning className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 ml-60 min-h-screen overflow-auto">
          {children}
        </main>
      </div>
    </SessionProvider>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  Calendar,
  UserCheck,
  ClipboardList,
  Scissors,
  LogOut,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PERMISSIONS,
  ROLE_LABELS,
  ROLE_COLORS,
  type UserRole,
} from "@/lib/permissions";
import Image from "next/image";

const ICON_MAP = {
  LayoutDashboard,
  Users,
  Calendar,
  UserCheck,
  ClipboardList,
  Scissors,
} as const;

function buildNavItems(role: string) {
  const items: { label: string; href: string; icon: keyof typeof ICON_MAP }[] =
    [];

  items.push({
    label: "Dashboard",
    href: "/dashboard",
    icon: "LayoutDashboard",
  });

  if (PERMISSIONS.canViewClients(role)) {
    items.push({ label: "Clients", href: "/clients", icon: "Users" });
  }

  if (PERMISSIONS.canViewAllBookings(role)) {
    items.push({ label: "Bookings", href: "/bookings", icon: "Calendar" });
  }

  if (PERMISSIONS.isStaffOnly(role)) {
    items.push({
      label: "My Bookings",
      href: "/my-bookings",
      icon: "Calendar",
    });
  }

  if (PERMISSIONS.canViewEmployees(role)) {
    items.push({ label: "Employees", href: "/employees", icon: "UserCheck" });
  }

  if (PERMISSIONS.isAdmin(role)) {
    items.push({ label: "Services", href: "/services", icon: "Scissors" });
  }

  items.push({
    label: "Work History",
    href: "/work-history",
    icon: "ClipboardList",
  });

  return items;
}

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role ?? "";
  const navItems = buildNavItems(role);

  const initials = (session?.user?.fullName ?? session?.user?.email ?? "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <aside className="fixed inset-y-0 left-0 z-30 w-60 flex flex-col bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex items-center justify-center gap-2 px-5 py-2 border-b border-gray-100">
        <Image src="/image.png" alt="Shall be" width={60} height={60} />

      </div>

      {/* Role badge */}
      {role && (
        <div className="px-4 py-2 border-b border-gray-50">
          <span
            className={cn(
              "text-xs px-2 py-0.5 rounded-full font-medium",
              ROLE_COLORS[role as UserRole] ?? "bg-gray-100 text-gray-700",
            )}
          >
            {ROLE_LABELS[role as UserRole] ?? role}
          </span>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {navItems.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = ICON_MAP[item.icon];
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-rose-50 text-rose-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4",
                  active ? "text-primary" : "text-gray-400",
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-gray-100">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between text-sm text-gray-600 px-3"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-rose-700">
                    {initials}
                  </span>
                </div>
                <span className="truncate text-xs">
                  {session?.user?.fullName ?? session?.user?.email ?? "User"}
                </span>
              </div>
              <ChevronUp className="w-4 h-4 flex-shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" className="w-52">
            <DropdownMenuItem
              className="text-xs text-gray-400 cursor-default"
              disabled
            >
              {session?.user?.email}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600 cursor-pointer"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}

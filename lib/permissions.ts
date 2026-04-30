export type UserRole =
  | "salon_admin"
  | "receptionist"
  | "makeup_artist"
  | "hair_stylist"
  | "stylist";

export const ROLE_LABELS: Record<UserRole, string> = {
  salon_admin: "Salon Admin",
  receptionist: "Receptionist",
  makeup_artist: "Makeup Artist",
  hair_stylist: "Hair Stylist",
  stylist: "Stylist",
};

export const ROLE_COLORS: Record<UserRole, string> = {
  salon_admin: "bg-red-100 text-red-800",
  receptionist: "bg-gray-100 text-gray-800",
  makeup_artist: "bg-pink-100 text-pink-800",
  hair_stylist: "bg-purple-100 text-purple-800",
  stylist: "bg-blue-100 text-blue-800",
};

// What each role can do
export const PERMISSIONS = {
  // Nav visibility
  canViewClients: (role: string) =>
    ["salon_admin", "receptionist"].includes(role),
  canManageClients: (role: string) =>
    ["salon_admin", "receptionist"].includes(role),
  canViewAllBookings: (role: string) =>
    ["salon_admin", "receptionist"].includes(role),
  canManageBookings: (role: string) =>
    ["salon_admin", "receptionist"].includes(role),
  canViewEmployees: (role: string) => role === "salon_admin",
  canManageEmployees: (role: string) => role === "salon_admin",
  canViewWorkHistory: (_role: string) => true,
  canAccessAIStudio: (_role: string) => true,

  // Employee-specific
  isStaffOnly: (role: string) =>
    ["makeup_artist", "hair_stylist", "stylist"].includes(role),
  isAdmin: (role: string) => role === "salon_admin",
  isReceptionist: (role: string) => role === "receptionist",
} as const;

// Nav items per role — drives the sidebar
export function getNavItems(role: string) {
  const items = [];

  items.push({ label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" });

  if (PERMISSIONS.canViewClients(role)) {
    items.push({ label: "Clients", href: "/clients", icon: "Users" });
  }

  if (PERMISSIONS.canViewAllBookings(role)) {
    items.push({ label: "Bookings", href: "/bookings", icon: "Calendar" });
  }

  // Staff (non-admin, non-receptionist) see only their own bookings
  if (PERMISSIONS.isStaffOnly(role)) {
    items.push({ label: "My Bookings", href: "/my-bookings", icon: "Calendar" });
  }

  if (PERMISSIONS.canViewEmployees(role)) {
    items.push({ label: "Employees", href: "/employees", icon: "UserCheck" });
  }

  items.push({ label: "Work History", href: "/work-history", icon: "ClipboardList" });

  return items;
}

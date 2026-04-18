import { requireAdmin } from "@/lib/auth";
import { AdminSectionsNavigation } from "./admin-sections-navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return (
    <>
      <AdminSectionsNavigation />
      {children}
    </>
  );
}

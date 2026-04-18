import { AdminChampionshipNavigation } from "./admin-navigation";

export default function TioHugoAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AdminChampionshipNavigation />
      {children}
    </>
  );
}

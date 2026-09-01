import { InternoCampaoAdminNavigation } from "./admin-navigation";

export default function InternoCampaoAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>
    <InternoCampaoAdminNavigation />
    {children}
  </>;
}

import { PeladasNavigation } from "./peladas-navigation";

export default function PeladasAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PeladasNavigation />
      {children}
    </>
  );
}

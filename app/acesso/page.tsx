import { redirect } from "next/navigation";
import { requireAdministrativeAccess, userHasPermission } from "@/lib/auth";
import { getInternoCampao2026AdminRegistrationsPath } from "@/lib/championships";

/** Kept for compatibility with existing links; it is no longer an intermediate screen. */
export default async function AdministrativeAccessPage() {
  const user = await requireAdministrativeAccess();

  if (userHasPermission(user, "sports.manage")) redirect(getInternoCampao2026AdminRegistrationsPath());
  if (userHasPermission(user, "match.result.manage")) redirect("/admin/interno-campao-2026/jogos");
  if (userHasPermission(user, "player.manage")) redirect("/admin/atletas");
  if (userHasPermission(user, "member.account.approve")) redirect("/solicitacoes");

  redirect("/login");
}

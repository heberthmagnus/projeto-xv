import { redirect } from "next/navigation";
import { getAdminPeladaConfirmadosPath } from "@/lib/routes";

type Params = Promise<{
  id: string;
}>;

export default async function PeladaLegacyPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  redirect(getAdminPeladaConfirmadosPath(id));
}

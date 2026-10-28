import { redirect } from "next/navigation";

/** Legacy entry point kept only for links already shared with administrators. */
export default function ResultadosAdminPage() {
  redirect("/admin/interno-campao-2026/jogos");
}

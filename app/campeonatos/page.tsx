import { redirect } from "next/navigation";
import { getChampionshipBasePath } from "@/lib/routes";

export default function ChampionshipsIndexPage() {
  redirect(getChampionshipBasePath("tio-hugo-2026"));
}

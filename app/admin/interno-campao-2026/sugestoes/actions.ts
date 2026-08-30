"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export async function updateSuggestion(formData: FormData) { await requireAdmin(); const id=String(formData.get("id")); await prisma.siteSuggestion.update({where:{id},data:{status:String(formData.get("status")),adminNotes:String(formData.get("adminNotes")||"").trim()||null}}); revalidatePath("/admin/interno-campao-2026/sugestoes"); }

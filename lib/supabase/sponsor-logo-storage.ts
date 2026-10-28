import "server-only";

import { createClient } from "@supabase/supabase-js";

export const SPONSOR_LOGOS_BUCKET = "sponsor-logos";
const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024;

const extensionsByMimeType: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function getStorageClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Chave moderna do Supabase, com compatibilidade temporária para a legada.
  const serviceRoleKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("O armazenamento de logos ainda não está configurado.");
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function getLogoFile(formData: FormData) {
  const value = formData.get("logoFile");
  return value instanceof File && value.size > 0 ? value : null;
}

export async function uploadSponsorLogo(formData: FormData) {
  const file = getLogoFile(formData);
  if (!file) return null;

  const extension = extensionsByMimeType[file.type];
  if (!extension) {
    throw new Error("Envie a logo em PNG, JPG ou WebP.");
  }
  if (file.size > MAX_LOGO_SIZE_BYTES) {
    throw new Error("A logo deve ter no máximo 2 MB.");
  }

  const path = `sponsors/${crypto.randomUUID()}.${extension}`;
  const storage = getStorageClient().storage.from(SPONSOR_LOGOS_BUCKET);
  const { error } = await storage.upload(path, await file.arrayBuffer(), {
    contentType: file.type,
    cacheControl: "31536000",
    upsert: false,
  });

  if (error) {
    throw new Error("Não foi possível salvar a logo agora. Tente novamente.");
  }

  const { data } = storage.getPublicUrl(path);
  return data.publicUrl;
}

function managedPathFromUrl(value: string | null | undefined) {
  if (!value) return null;

  try {
    const url = new URL(value);
    const marker = `/storage/v1/object/public/${SPONSOR_LOGOS_BUCKET}/`;
    const offset = url.pathname.indexOf(marker);
    if (offset === -1) return null;

    return decodeURIComponent(url.pathname.slice(offset + marker.length));
  } catch {
    return null;
  }
}

export async function removeManagedSponsorLogo(url: string | null | undefined) {
  const path = managedPathFromUrl(url);
  if (!path) return;

  const { error } = await getStorageClient().storage
    .from(SPONSOR_LOGOS_BUCKET)
    .remove([path]);

  if (error) {
    console.error("Não foi possível remover a logo antiga do patrocinador.", {
      message: error.message,
    });
  }
}

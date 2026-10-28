"use client";
import { useEffect, useState } from "react";

export function ConfirmationStatus() {
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    // Supabase only redirects with an access token after it has validated the
    // confirmation token. We use it solely as a one-time UI acknowledgement;
    // the application never persists this token in the browser.
    setConfirmed(
      fragment.get("type") === "signup" && Boolean(fragment.get("access_token")),
    );
    if (window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  return confirmed ? (
    <p role="status" className="mt-4 rounded-lg border border-green-300 bg-green-50 p-3 text-sm font-medium text-green-950">
      E-mail confirmado com sucesso. Sua solicitação agora aguarda a aprovação da diretoria ou secretaria.
    </p>
  ) : (
    <p className="mt-3 text-sm text-[#4B5563]">
      Se você chegou aqui pelo link recebido, a confirmação está sendo processada. A confirmação do e-mail não concede acesso automaticamente.
    </p>
  );
}

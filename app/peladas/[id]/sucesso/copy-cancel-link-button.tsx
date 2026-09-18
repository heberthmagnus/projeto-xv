"use client";

import { useState } from "react";

export function CopyCancelLinkButton({ cancelPath }: { cancelPath: string }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  async function handleCopy() {
    const fullUrl = new URL(cancelPath, window.location.origin).toString();

    setCopyError(false);
    try {
      if (!document.hasFocus() || !navigator.clipboard) {
        throw new Error("A página não está em foco.");
      }
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
    } catch {
      // Alguns navegadores bloqueiam a área de transferência quando a aba perde o foco.
      setCopyError(true);
      return;
    }

    window.setTimeout(() => {
      setCopied(false);
    }, 2500);
  }

  return (
    <button type="button" onClick={handleCopy} style={buttonStyle}>
      {copied ? "Link copiado" : copyError ? "Clique novamente com a página em foco" : "Copiar link de cancelamento"}
    </button>
  );
}

const buttonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "12px 18px",
  borderRadius: 10,
  border: "1px solid #D1D5DB",
  background: "#FFFFFF",
  color: "#101010",
  fontWeight: 700,
  fontSize: 15,
  cursor: "pointer",
};

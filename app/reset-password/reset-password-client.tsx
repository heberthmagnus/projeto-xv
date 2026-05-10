"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { dispatchGlobalFeedback } from "@/app/global-feedback-events";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type ResetState =
  | "loading"
  | "ready"
  | "invalid"
  | "expired"
  | "success"
  | "config-error";

export function ResetPasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [state, setState] = useState<ResetState>("loading");
  const [message, setMessage] = useState(
    "Validando o link de recuperação para liberar a redefinição da senha.",
  );

  const verificationParams = useMemo(
    () => ({
      tokenHash: searchParams.get("token_hash"),
      type: searchParams.get("type"),
    }),
    [searchParams],
  );

  useEffect(() => {
    let cancelled = false;

    async function verifyRecovery() {
      try {
        const supabase = getSupabaseBrowserClient();
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const hashType = hashParams.get("type");

        if (accessToken && refreshToken && hashType === "recovery") {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            if (!cancelled) {
              setExpiredState();
            }
            return;
          }

          window.history.replaceState(window.history.state, "", "/reset-password");

          if (!cancelled) {
            setState("ready");
            setMessage("Escolha sua nova senha para concluir a recuperação.");
          }
          return;
        }

        if (
          verificationParams.tokenHash &&
          verificationParams.type === "recovery"
        ) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: verificationParams.tokenHash,
            type: "recovery",
          });

          if (error) {
            if (!cancelled) {
              setExpiredState();
            }
            return;
          }

          window.history.replaceState(window.history.state, "", "/reset-password");

          if (!cancelled) {
            setState("ready");
            setMessage("Escolha sua nova senha para concluir a recuperação.");
          }
          return;
        }

        if (!cancelled) {
          setState("invalid");
          setMessage("O link de recuperação é inválido ou já foi utilizado.");
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof Error && error.message === "missing-supabase-env") {
          setState("config-error");
          setMessage(
            "A recuperação de senha ainda não está configurada neste ambiente.",
          );
          return;
        }

        setState("invalid");
        setMessage("Não foi possível validar o link de recuperação.");
      }
    }

    verifyRecovery();

    return () => {
      cancelled = true;
    };
  }, [verificationParams]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password !== confirmPassword) {
      dispatchGlobalFeedback({
        key: "reset-password:mismatch",
        tone: "error",
        message: "As senhas informadas não coincidem.",
      });
      return;
    }

    if (password.length < 8) {
      dispatchGlobalFeedback({
        key: "reset-password:length",
        tone: "error",
        message: "A nova senha precisa ter pelo menos 8 caracteres.",
      });
      return;
    }

    setSubmitting(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        dispatchGlobalFeedback({
          key: "reset-password:update-error",
          tone: "error",
          message: "Não foi possível atualizar a senha. Solicite um novo link.",
        });
        setSubmitting(false);
        return;
      }

      await supabase.auth.signOut();

      setState("success");
      setMessage("Senha atualizada com sucesso. Redirecionando para o login.");
      dispatchGlobalFeedback({
        key: "reset-password:success",
        tone: "success",
        message: "Senha redefinida com sucesso.",
      });

      window.setTimeout(() => {
        router.replace("/login");
      }, 1400);
    } catch {
      dispatchGlobalFeedback({
        key: "reset-password:unknown-error",
        tone: "error",
        message: "Não foi possível concluir a redefinição da senha.",
      });
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-w-0 flex-col justify-center px-5 py-7 sm:px-7 sm:py-8">
      <div className="max-w-md">
        <div className="inline-flex rounded-full bg-[#FCF7E6] px-3 py-1 text-[0.72rem] font-bold uppercase tracking-[0.16em] text-[#8B6914]">
          Recuperação de acesso
        </div>
        <h2 className="mt-4 text-[1.7rem] font-black tracking-tight text-[#101010]">
          Atualize sua senha
        </h2>
        <p className="mt-3 text-sm leading-7 text-[#4B5563] sm:text-base">
          {message}
        </p>
      </div>

      {state === "loading" ? (
        <StatusCard title="Validando link" tone="neutral" />
      ) : null}

      {state === "ready" ? (
        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
          <Field label="Nova senha">
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={inputClassName}
              minLength={8}
              required
            />
          </Field>

          <Field label="Confirmar nova senha">
            <input
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className={inputClassName}
              minLength={8}
              required
            />
          </Field>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#E8C866] bg-gradient-to-b from-[#C49B25] to-[#8B6914] px-5 py-3 text-sm font-bold text-white shadow-[0_4px_0_rgba(73,54,9,0.7)] transition hover:from-[#D3AB35] hover:to-[#9A7618] disabled:cursor-default disabled:opacity-60"
          >
            {submitting ? "Atualizando..." : "Salvar nova senha"}
          </button>
        </form>
      ) : null}

      {state === "invalid" ? (
        <StatusCard
          title="Link inválido"
          tone="error"
          actionLabel="Voltar ao login"
        />
      ) : null}

      {state === "expired" ? (
        <StatusCard
          title="Link expirado"
          tone="warning"
          actionLabel="Voltar ao login"
        />
      ) : null}

      {state === "config-error" ? (
        <StatusCard
          title="Configuração pendente"
          tone="warning"
          actionLabel="Voltar ao login"
        />
      ) : null}

      {state === "success" ? <StatusCard title="Senha atualizada" tone="success" /> : null}
    </div>
  );

  function setExpiredState() {
    setState("expired");
    setMessage("O link de recuperação expirou. Solicite um novo e-mail de redefinição.");
  }
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-bold text-[#101010]">{label}</label>
      {children}
    </div>
  );
}

function StatusCard({
  title,
  tone,
  actionLabel,
}: {
  title: string;
  tone: "neutral" | "error" | "warning" | "success";
  actionLabel?: string;
}) {
  const toneClasses = {
    neutral: "border-[#E5E7EB] bg-[#FAFAFA] text-[#374151]",
    error: "border-[#FECACA] bg-[#FEF2F2] text-[#991B1B]",
    warning: "border-[#FDE68A] bg-[#FFF8E7] text-[#8B6914]",
    success: "border-[#A7F3D0] bg-[#ECFDF3] text-[#047857]",
  };

  return (
    <div className={`mt-6 rounded-[18px] border px-4 py-4 ${toneClasses[tone]}`}>
      <div className="text-base font-black">{title}</div>
      {actionLabel ? (
        <div className="mt-4">
          <Link
            href="/login"
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-current/20 bg-white/80 px-4 py-2 text-sm font-bold"
          >
            {actionLabel}
          </Link>
        </div>
      ) : null}
    </div>
  );
}

const inputClassName =
  "w-full rounded-[12px] border border-[#D1D5DB] bg-white px-4 py-3 text-sm text-[#111827] outline-none transition focus:border-[#B89020] focus:ring-2 focus:ring-[#F3D27A]/35";

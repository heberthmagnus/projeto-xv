"use client";

import { useActionState } from "react";
import { login } from "./actions";
import { initialLoginFormState } from "./form-state";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(
    login,
    initialLoginFormState,
  );

  return (
    <form
      action={formAction}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <Field label="E-mail">
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          style={inputStyle}
        />
      </Field>

      <Field label="Senha">
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          style={inputStyle}
        />
      </Field>

      {state.error && (
        <div
          aria-live="polite"
          style={{
            fontSize: 14,
            color: "#991B1B",
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            borderRadius: 10,
            padding: 12,
          }}
        >
          {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        style={{
          padding: "12px 16px",
          borderRadius: 10,
          border: "none",
          background: pending ? "#9CA3AF" : "#B89020",
          color: "#FFFFFF",
          fontWeight: 700,
          fontSize: 15,
          cursor: pending ? "default" : "pointer",
        }}
      >
        {pending ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        style={{
          display: "block",
          marginBottom: 6,
          fontSize: 14,
          fontWeight: 600,
          color: "#101010",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid #D1D5DB",
  fontSize: 14,
  background: "#FFFFFF",
  color: "#111827",
  opacity: 1,
  WebkitTextFillColor: "#111827",
};

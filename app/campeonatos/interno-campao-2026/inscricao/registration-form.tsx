"use client";

import { useActionState, useEffect } from "react";
import { dispatchGlobalFeedback } from "@/app/global-feedback-events";
import { PhoneInput } from "@/app/components/phone-input";
import { createRegistration } from "./actions";
import { initialRegistrationFormState } from "./form-state";

export function RegistrationForm() {
  const [state, formAction, pending] = useActionState(
    createRegistration,
    initialRegistrationFormState,
  );

  useEffect(() => {
    if (!state.error) {
      return;
    }

    dispatchGlobalFeedback({
      key: `interno-campao-registration:${state.error}`,
      tone: "error",
      message: state.error,
    });
  }, [state.error]);

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <FormField label="Categoria *">
        <select name="category" required defaultValue="" style={inputStyle}>
          <option value="" disabled>
            Selecione
          </option>
          <option value="ADULTO">Adulto</option>
          <option value="MASTER">Master</option>
        </select>
      </FormField>

      <FormField label="Nome completo *">
        <input name="fullName" type="text" required style={inputStyle} />
      </FormField>

      <FormField label="Apelido">
        <input name="nickname" type="text" style={inputStyle} />
      </FormField>

      <FormField label="Posição preferida *">
        <select name="preferredPosition" required defaultValue="" style={inputStyle}>
          <option value="" disabled>
            Selecione
          </option>
          <option value="GOLEIRO">Goleiro</option>
          <option value="LATERAL">Lateral</option>
          <option value="ZAGUEIRO">Zagueiro</option>
          <option value="VOLANTE">Volante</option>
          <option value="MEIA">Meia</option>
          <option value="ATACANTE">Atacante</option>
        </select>
      </FormField>

      <FormField label="Data de nascimento *">
        <input name="birthDate" type="date" required style={inputStyle} />
      </FormField>

      <FormField label="Telefone / WhatsApp *">
        <PhoneInput name="phone" required style={inputStyle} />
      </FormField>

      <FormField label="E-mail">
        <input name="email" type="email" style={inputStyle} />
      </FormField>

      {state.error ? (
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
      ) : null}

      <label
        style={{
          display: "flex",
          gap: 10,
          alignItems: "flex-start",
          fontSize: 14,
          color: "#374151",
          lineHeight: 1.5,
        }}
      >
        <input type="checkbox" name="confirmedRules" required style={{ marginTop: 3 }} />
        <span>
          Confirmo que estou me inscrevendo no Campeonato Interno XV Campão 2026
          e que a categoria escolhida poderá ser ajustada pela administração.
        </span>
      </label>

      <button
        type="submit"
        disabled={pending}
        style={{
          marginTop: 8,
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
        {pending ? "Enviando..." : "Enviar inscrição"}
      </button>
    </form>
  );
}

function FormField({
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

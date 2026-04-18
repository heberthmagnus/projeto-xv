"use client";

import { useActionState } from "react";
import { createPeladaConfirmation } from "./actions";
import { initialPeladaConfirmationFormState } from "./form-state";

export function PeladaConfirmationForm({
  peladaId,
  allowSubmit,
}: {
  peladaId: string;
  allowSubmit: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    createPeladaConfirmation.bind(null, { peladaId }),
    initialPeladaConfirmationFormState,
  );

  return (
    <form action={formAction} style={formStyle}>
      <FormField label="Nome ou apelido *">
        <input name="fullName" type="text" required style={inputStyle} />
      </FormField>

      <div style={gridStyle}>
        <FormField label="Posição *">
          <select
            name="preferredPosition"
            required
            defaultValue=""
            style={inputStyle}
          >
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

        <FormField label="Idade *">
          <input name="age" type="number" min={1} max={99} required style={inputStyle} />
        </FormField>
      </div>

      <FormField label="Convidados">
        <select name="guestCount" defaultValue="0" style={inputStyle}>
          <option value="0">Nenhum</option>
          <option value="1">1 convidado</option>
          <option value="2">2 convidados</option>
          <option value="3">3 convidados</option>
          <option value="4">4 convidados</option>
          <option value="5">5 convidados</option>
        </select>
      </FormField>

      {state.error && (
        <div style={errorStyle} aria-live="polite">
          {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={!allowSubmit || pending}
        style={{
          ...submitButtonStyle,
          background: !allowSubmit || pending ? "#9CA3AF" : "#B89020",
          cursor: !allowSubmit || pending ? "default" : "pointer",
        }}
      >
        {pending ? "Enviando..." : "Confirmar presença"}
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
    <div style={fieldStyle}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

const formStyle: React.CSSProperties = {
  display: "grid",
  gap: 16,
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 16,
};

const fieldStyle: React.CSSProperties = {
  display: "grid",
  gap: 8,
};

const labelStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: "#101010",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid #D1D5DB",
  fontSize: 14,
  background: "#FFFFFF",
  color: "#111827",
};

const errorStyle: React.CSSProperties = {
  fontSize: 14,
  color: "#991B1B",
  background: "#FEF2F2",
  border: "1px solid #FECACA",
  borderRadius: 10,
  padding: 12,
};

const submitButtonStyle: React.CSSProperties = {
  marginTop: 4,
  padding: "12px 16px",
  borderRadius: 10,
  border: "none",
  color: "#FFFFFF",
  fontWeight: 700,
  fontSize: 15,
};

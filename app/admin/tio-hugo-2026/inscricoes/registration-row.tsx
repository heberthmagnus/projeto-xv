"use client";

import { useState } from "react";
import { PhoneInput } from "@/app/components/phone-input";
import {
  deleteRegistration,
  updateRegistration,
  updateRegistrationLevel,
} from "./actions";

type Registration = {
  id: string;
  fullName: string;
  nickname: string | null;
  preferredPosition: string;
  birthDate: Date;
  phone: string;
  email: string | null;
  level: string | null;
  createdAt: Date;
};

export function RegistrationRow({
  registration,
  initialOpen = false,
}: {
  registration: Registration;
  initialOpen?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(initialOpen);

  return (
    <>
      <tr>
        <td style={tdStyle}>
          <strong>{registration.fullName}</strong>
        </td>
        <td style={tdStyle}>{registration.nickname || "-"}</td>
        <td style={tdStyle}>
          {formatPosition(registration.preferredPosition)}
        </td>
        <td style={tdStyle}>
          {new Date(registration.birthDate).toLocaleDateString("pt-BR")}
        </td>
        <td style={tdStyle}>{registration.phone}</td>
        <td style={tdStyle}>{registration.email || "-"}</td>
        <td style={tdStyle}>
          <form
            action={updateRegistrationLevel}
            style={{ display: "flex", gap: 8 }}
          >
            <input type="hidden" name="id" value={registration.id} />
            <select
              name="level"
              defaultValue={registration.level || ""}
              style={smallSelectStyle}
            >
              <option value="">-</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
              <option value="E">E</option>
            </select>
            <button type="submit" style={smallButtonStyle}>
              Salvar
            </button>
          </form>
        </td>
        <td style={tdStyle}>
          {new Date(registration.createdAt).toLocaleDateString("pt-BR")}
        </td>
        <td style={tdStyle}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              type="button"
              onClick={() => setIsEditing((prev) => !prev)}
              style={editButtonStyle}
            >
              {isEditing ? "Fechar" : "Editar"}
            </button>

            <form
              action={deleteRegistration}
              onSubmit={(e) => {
                const ok = window.confirm(
                  "Tem certeza que deseja excluir esta inscrição?",
                );
                if (!ok) e.preventDefault();
              }}
            >
              <input type="hidden" name="id" value={registration.id} />
              <button type="submit" style={deleteButtonStyle}>
                Excluir
              </button>
            </form>
          </div>
        </td>
      </tr>

      {isEditing && (
        <tr>
          <td colSpan={9} style={expandedTdStyle}>
            <div style={editCardStyle}>
              <h3 style={editTitleStyle}>Editar inscrição</h3>

              <form action={updateRegistration} style={editFormStyle}>
                <input type="hidden" name="id" value={registration.id} />

                <Field label="Nome completo *">
                  <input
                    name="fullName"
                    defaultValue={registration.fullName}
                    required
                    style={inputStyle}
                  />
                </Field>

                <Field label="Apelido">
                  <input
                    name="nickname"
                    defaultValue={registration.nickname || ""}
                    style={inputStyle}
                  />
                </Field>

                <Field label="Posição preferida *">
                  <select
                    name="preferredPosition"
                    defaultValue={registration.preferredPosition}
                    required
                    style={inputStyle}
                  >
                    <option value="GOLEIRO">Goleiro</option>
                    <option value="LATERAL">Lateral</option>
                    <option value="ZAGUEIRO">Zagueiro</option>
                    <option value="VOLANTE">Volante</option>
                    <option value="MEIA">Meia</option>
                    <option value="ATACANTE">Atacante</option>
                  </select>
                </Field>

                <Field label="Data de nascimento *">
                  <input
                    name="birthDate"
                    type="date"
                    defaultValue={formatDateInput(registration.birthDate)}
                    required
                    style={inputStyle}
                  />
                </Field>

                <Field label="Telefone / WhatsApp *">
                  <PhoneInput
                    name="phone"
                    defaultValue={registration.phone}
                    required
                    style={inputStyle}
                  />
                </Field>

                <Field label="E-mail">
                  <input
                    name="email"
                    type="email"
                    defaultValue={registration.email || ""}
                    style={inputStyle}
                  />
                </Field>

                <Field label="Nível">
                  <select
                    name="level"
                    defaultValue={registration.level || ""}
                    style={inputStyle}
                  >
                    <option value="">-</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                    <option value="E">E</option>
                  </select>
                </Field>

                <div
                  style={{
                    display: "flex",
                    alignItems: "end",
                  }}
                >
                  <button type="submit" style={saveButtonStyle}>
                    Salvar edição
                  </button>
                </div>
              </form>
            </div>
          </td>
        </tr>
      )}
    </>
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
      <label style={fieldLabelStyle}>{label}</label>
      {children}
    </div>
  );
}

function formatPosition(position: string) {
  switch (position) {
    case "GOLEIRO":
      return "Goleiro";
    case "LATERAL":
      return "Lateral";
    case "ZAGUEIRO":
      return "Zagueiro";
    case "VOLANTE":
      return "Volante";
    case "MEIA":
      return "Meia";
    case "ATACANTE":
      return "Atacante";
    default:
      return position;
  }
}

function formatDateInput(date: Date | string) {
  return new Date(date).toISOString().split("T")[0];
}

const tdStyle: React.CSSProperties = {
  padding: "14px 16px",
  borderBottom: "1px solid #E5E7EB",
  fontSize: 14,
  color: "#374151",
  verticalAlign: "top",
};

const expandedTdStyle: React.CSSProperties = {
  padding: 16,
  background: "#FAFAFA",
  borderBottom: "1px solid #E5E7EB",
};

const editCardStyle: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: 14,
  padding: 18,
};

const editTitleStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  marginBottom: 16,
  color: "#101010",
};

const editFormStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 14,
};

const fieldLabelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: 6,
  fontSize: 13,
  fontWeight: 600,
  color: "#101010",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #D1D5DB",
  fontSize: 14,
  background: "#FFFFFF",
  color: "#111827",
  opacity: 1,
  WebkitTextFillColor: "#111827",
};

const smallSelectStyle: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid #D1D5DB",
  background: "#FFFFFF",
  color: "#111827",
  opacity: 1,
  WebkitTextFillColor: "#111827",
};

const smallButtonStyle: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 8,
  border: "none",
  background: "#B89020",
  color: "#FFFFFF",
  fontWeight: 700,
  cursor: "pointer",
};

const editButtonStyle: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 8,
  border: "none",
  background: "#374151",
  color: "#FFFFFF",
  fontWeight: 600,
  cursor: "pointer",
};

const deleteButtonStyle: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 8,
  border: "none",
  background: "#B91C1C",
  color: "#FFFFFF",
  fontWeight: 600,
  cursor: "pointer",
};

const saveButtonStyle: React.CSSProperties = {
  padding: "12px 16px",
  borderRadius: 10,
  border: "none",
  background: "#101010",
  color: "#FFFFFF",
  fontWeight: 700,
  cursor: "pointer",
  minHeight: 44,
};

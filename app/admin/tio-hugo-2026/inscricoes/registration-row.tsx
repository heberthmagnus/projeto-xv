"use client";

import { useState } from "react";
import { PhoneInput } from "@/app/components/phone-input";
import {
  deleteRegistration,
  updateRegistration,
  updateRegistrationQuickFields,
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
  paymentStatus: string;
  paidAt: Date | null;
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
  const quickFormId = `registro-rapido-${registration.id}`;

  return (
    <>
      <tr>
        <td style={{ ...tdStyle, ...nameCellStyle }}>
          <strong>{registration.fullName}</strong>
        </td>
        <td style={{ ...tdStyle, ...nicknameCellStyle }}>
          {registration.nickname || "-"}
        </td>
        <td style={{ ...tdStyle, ...positionCellStyle }}>
          {formatPosition(registration.preferredPosition)}
        </td>
        <td style={{ ...tdStyle, ...dateCellStyle }}>
          {new Date(registration.birthDate).toLocaleDateString("pt-BR")}
        </td>
        <td style={{ ...tdStyle, ...phoneCellStyle }}>{registration.phone}</td>
        <td style={{ ...tdStyle, ...emailCellStyle }}>
          <span title={registration.email || "-"} style={emailTextStyle}>
            {registration.email || "-"}
          </span>
        </td>
        <td style={{ ...tdStyle, ...controlCellStyle }}>
          <select
            form={quickFormId}
            name="level"
            defaultValue={registration.level || ""}
            style={levelSelectStyle}
          >
            <option value="">-</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
            <option value="E">E</option>
          </select>
        </td>
        <td style={{ ...tdStyle, ...paymentCellStyle }}>
          <div style={paymentFieldWrapStyle}>
            <label style={checkboxLabelStyle}>
              <input
                form={quickFormId}
                name="paymentPaid"
                type="checkbox"
                defaultChecked={registration.paymentStatus === "PAGO"}
                style={checkboxStyle}
              />
              <span>Pagou?</span>
            </label>
            <input
              form={quickFormId}
              type="hidden"
              name="paymentStatus"
              value={registration.paymentStatus}
            />
            <span style={helperTextStyle}>
              {registration.paidAt
                ? `Pago em ${new Date(registration.paidAt).toLocaleDateString(
                    "pt-BR",
                  )}`
                : ""}
            </span>
          </div>
        </td>
        <td style={{ ...tdStyle, ...dateCellStyle }}>
          {new Date(registration.createdAt).toLocaleDateString("pt-BR")}
        </td>
        <td style={{ ...tdStyle, ...actionsCellStyle }}>
          <div style={actionsWrapStyle}>
            <form id={quickFormId} action={updateRegistrationQuickFields}>
              <input type="hidden" name="id" value={registration.id} />
              <button type="submit" style={smallButtonStyle}>
                Salvar
              </button>
            </form>

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
          <td colSpan={10} style={expandedTdStyle}>
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
  lineHeight: 1.45,
  overflow: "hidden",
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

const helperTextStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#6B7280",
  whiteSpace: "nowrap",
};

const nameCellStyle: React.CSSProperties = {
  minWidth: 220,
};

const nicknameCellStyle: React.CSSProperties = {
  minWidth: 120,
};

const positionCellStyle: React.CSSProperties = {
  minWidth: 120,
  whiteSpace: "nowrap",
};

const dateCellStyle: React.CSSProperties = {
  minWidth: 110,
  whiteSpace: "nowrap",
};

const phoneCellStyle: React.CSSProperties = {
  minWidth: 145,
  whiteSpace: "nowrap",
};

const emailCellStyle: React.CSSProperties = {
  minWidth: 220,
  maxWidth: 220,
};

const controlCellStyle: React.CSSProperties = {
  minWidth: 72,
  maxWidth: 72,
};

const paymentCellStyle: React.CSSProperties = {
  minWidth: 150,
};

const actionsCellStyle: React.CSSProperties = {
  minWidth: 190,
};

const paymentFieldWrapStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const checkboxLabelStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  fontSize: 14,
  fontWeight: 600,
  color: "#101010",
  whiteSpace: "nowrap",
};

const checkboxStyle: React.CSSProperties = {
  width: 16,
  height: 16,
  accentColor: "#B89020",
};

const actionsWrapStyle: React.CSSProperties = {
  display: "flex",
  gap: 6,
  alignItems: "center",
  justifyContent: "center",
  flexWrap: "wrap",
};

const emailTextStyle: React.CSSProperties = {
  display: "block",
  maxWidth: "100%",
  overflow: "hidden",
  whiteSpace: "nowrap",
  textOverflow: "ellipsis",
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
  width: "100%",
};

const levelSelectStyle: React.CSSProperties = {
  ...smallSelectStyle,
  width: 64,
  minWidth: 64,
  padding: "8px 8px",
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

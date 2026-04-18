"use client";

import { useState } from "react";
import {
  DEFAULT_PELADA_RULES,
  FIRST_GAME_RULE_OPTIONS,
  PELADA_STATUS_OPTIONS,
  PELADA_TYPE_OPTIONS,
} from "@/lib/peladas";
import {
  DEFAULT_PELADA_FORM_VALUES,
  type PeladaFormValues,
} from "./pelada-form-values";

type PeladaFormProps = {
  title: string;
  description: string;
  submitLabel: string;
  action: (formData: FormData) => void | Promise<void>;
  initialValues?: PeladaFormValues;
  showStatusField?: boolean;
};

export function PeladaForm({
  title,
  description,
  submitLabel,
  action,
  initialValues = DEFAULT_PELADA_FORM_VALUES,
  showStatusField = true,
}: PeladaFormProps) {
  const [type, setType] = useState(initialValues.type);
  const [firstGameRule, setFirstGameRule] = useState(initialValues.firstGameRule);
  const [arrivalCutoffTime, setArrivalCutoffTime] = useState(
    initialValues.arrivalCutoffTime,
  );
  const [maxFirstGamePlayers, setMaxFirstGamePlayers] = useState(
    initialValues.maxFirstGamePlayers,
  );
  const [linePlayersCount, setLinePlayersCount] = useState(
    initialValues.linePlayersCount,
  );

  function applyTypeDefaults(nextType: typeof type) {
    const defaults = DEFAULT_PELADA_RULES[nextType];

    setType(nextType);
    setFirstGameRule(defaults.firstGameRule);
    setArrivalCutoffTime(defaults.arrivalCutoffTime);
    setMaxFirstGamePlayers(defaults.maxFirstGamePlayers);
    setLinePlayersCount(defaults.linePlayersCount);
  }

  return (
    <div style={cardStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>{title}</h1>
          <p style={descriptionStyle}>{description}</p>
        </div>
      </div>

      <form action={action} style={formStyle}>
        {initialValues.id && <input type="hidden" name="id" value={initialValues.id} />}

        <div style={gridStyle}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Data</label>
            <input
              type="date"
              name="date"
              defaultValue={initialValues.date}
              style={inputStyle}
              required
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Horário</label>
            <input
              type="time"
              name="time"
              defaultValue={initialValues.time}
              style={inputStyle}
              required
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Tipo</label>
            <select
              name="type"
              value={type}
              onChange={(event) =>
                applyTypeDefaults(event.target.value as typeof type)
              }
              style={inputStyle}
            >
              {PELADA_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Regra da primeira</label>
            <select
              name="firstGameRule"
              value={firstGameRule}
              onChange={(event) =>
                setFirstGameRule(event.target.value as typeof firstGameRule)
              }
              style={inputStyle}
            >
              {FIRST_GAME_RULE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Horário limite</label>
            <input
              type="time"
              name="arrivalCutoffTime"
              value={arrivalCutoffTime}
              onChange={(event) => setArrivalCutoffTime(event.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Limite da primeira</label>
            <input
              type="number"
              min={1}
              name="maxFirstGamePlayers"
              value={maxFirstGamePlayers}
              onChange={(event) => setMaxFirstGamePlayers(event.target.value)}
              placeholder="Ex.: 16"
              style={inputStyle}
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Formação (linha)</label>
            <input
              type="number"
              min={1}
              name="linePlayersCount"
              value={linePlayersCount}
              onChange={(event) => setLinePlayersCount(event.target.value)}
              style={inputStyle}
              required
            />
          </div>

          {showStatusField && (
            <div style={fieldStyle}>
              <label style={labelStyle}>Status</label>
              <select
                name="status"
                defaultValue={initialValues.status}
                style={inputStyle}
              >
                {PELADA_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Observações</label>
          <textarea
            name="notes"
            defaultValue={initialValues.notes}
            rows={4}
            placeholder="Use este espaço para exceções como chuva, campão fechado ou regra especial do dia."
            style={textareaStyle}
          />
        </div>

        <div style={helperCardStyle}>
          <p style={helperTitleStyle}>Sugestões automáticas</p>
          <ul style={helperListStyle}>
            <li>
              Campinho: sorteio, horário limite 19h15 e formação 6 de linha.
            </li>
            <li>
              Campão: ordem de chegada, limite de 16 jogadores na primeira e
              formação 8 de linha.
            </li>
          </ul>
        </div>

        <div style={actionsStyle}>
          <button type="submit" style={submitButtonStyle}>
            {submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: "#FFFFFF",
  borderRadius: 16,
  border: "1px solid #E5E7EB",
  boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
  padding: 24,
};

const headerStyle: React.CSSProperties = {
  marginBottom: 20,
};

const titleStyle: React.CSSProperties = {
  margin: "0 0 8px",
  fontSize: 28,
  color: "#101010",
};

const descriptionStyle: React.CSSProperties = {
  margin: 0,
  color: "#4B5563",
  fontSize: 16,
  lineHeight: 1.6,
};

const formStyle: React.CSSProperties = {
  display: "grid",
  gap: 18,
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 16,
};

const fieldStyle: React.CSSProperties = {
  display: "grid",
  gap: 8,
};

const labelStyle: React.CSSProperties = {
  fontWeight: 700,
  color: "#101010",
  fontSize: 14,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 10,
  border: "1px solid #D1D5DB",
  padding: "12px 14px",
  fontSize: 15,
  background: "#FFFFFF",
  color: "#101010",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: "vertical",
  minHeight: 110,
};

const helperCardStyle: React.CSSProperties = {
  borderRadius: 12,
  background: "#FCF7E6",
  border: "1px solid #F1D68A",
  padding: 16,
};

const helperTitleStyle: React.CSSProperties = {
  margin: "0 0 10px",
  fontWeight: 800,
  color: "#8B6914",
};

const helperListStyle: React.CSSProperties = {
  margin: 0,
  paddingLeft: 18,
  color: "#3F3F46",
  display: "grid",
  gap: 8,
  lineHeight: 1.5,
};

const actionsStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-start",
};

const submitButtonStyle: React.CSSProperties = {
  border: "none",
  borderRadius: 10,
  background: "#B89020",
  color: "#FFFFFF",
  fontWeight: 800,
  fontSize: 15,
  padding: "12px 18px",
  cursor: "pointer",
};

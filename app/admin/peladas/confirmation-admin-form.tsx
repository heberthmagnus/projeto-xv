import { GOALKEEPER_SIDE_OPTIONS } from "@/lib/peladas";

type ConfirmationAdminFormProps = {
  peladaId: string;
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
  initialValues?: {
    confirmationId?: string;
    fullName: string;
    preferredPosition: string;
    age: number | string;
    guestCount: number | string;
    goalkeeperSide: string;
  };
};

const POSITION_OPTIONS = [
  { value: "GOLEIRO", label: "Goleiro" },
  { value: "LATERAL", label: "Lateral" },
  { value: "ZAGUEIRO", label: "Zagueiro" },
  { value: "VOLANTE", label: "Volante" },
  { value: "MEIA", label: "Meia" },
  { value: "ATACANTE", label: "Atacante" },
] as const;

export function ConfirmationAdminForm({
  peladaId,
  action,
  submitLabel,
  initialValues,
}: ConfirmationAdminFormProps) {
  return (
    <form action={action} style={formStyle}>
      <input type="hidden" name="peladaId" value={peladaId} />
      {initialValues?.confirmationId && (
        <input
          type="hidden"
          name="confirmationId"
          value={initialValues.confirmationId}
        />
      )}

      <div style={gridStyle}>
        <FormField label="Nome completo">
          <input
            name="fullName"
            type="text"
            defaultValue={initialValues?.fullName || ""}
            required
            style={inputStyle}
          />
        </FormField>

        <FormField label="Posição">
          <select
            name="preferredPosition"
            defaultValue={initialValues?.preferredPosition || ""}
            required
            style={inputStyle}
          >
            <option value="" disabled>
              Selecione
            </option>
            {POSITION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Idade">
          <input
            name="age"
            type="number"
            min={1}
            max={99}
            defaultValue={initialValues?.age || ""}
            required
            style={inputStyle}
          />
        </FormField>

        <FormField label="Convidados">
          <select
            name="guestCount"
            defaultValue={String(initialValues?.guestCount ?? 0)}
            style={inputStyle}
          >
            <option value="0">0</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>
        </FormField>

        <FormField label="Goleiro">
          <select
            name="goalkeeperSide"
            defaultValue={initialValues?.goalkeeperSide || ""}
            style={inputStyle}
          >
            {GOALKEEPER_SIDE_OPTIONS.map((option) => (
              <option key={option.value || "NONE"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <div style={actionsStyle}>
        <button type="submit" style={submitButtonStyle}>
          {submitLabel}
        </button>
      </div>
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
  gap: 14,
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
  fontSize: 14,
  padding: "11px 16px",
  cursor: "pointer",
};

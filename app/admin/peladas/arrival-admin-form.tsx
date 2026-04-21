import type { AthleteProfilePrefillOption } from "@/lib/athlete-profiles";
import { buildArrivalDateTimeInput } from "@/lib/peladas";
import { AthleteProfilePrefillFields } from "./athlete-profile-prefill-fields";

type ArrivalAdminFormProps = {
  peladaId: string;
  athleteProfiles?: AthleteProfilePrefillOption[];
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
  returnTo?: string;
  initialValues?: {
    arrivalId?: string;
    athleteProfileId?: string;
    fullName: string;
    isGuest?: boolean;
    guestInvitedBy?: string;
    preferredPosition: string;
    age: number | string;
    arrivalOrder: number | string;
    arrivedAt: Date;
    level: string | null;
    playsFirstGame: boolean;
    playsSecondGame: boolean;
  };
};

export function ArrivalAdminForm({
  peladaId,
  athleteProfiles = [],
  action,
  submitLabel,
  returnTo,
  initialValues,
}: ArrivalAdminFormProps) {
  return (
    <form action={action} style={formStyle}>
      <input type="hidden" name="peladaId" value={peladaId} />
      {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
      {initialValues?.arrivalId && (
        <input type="hidden" name="arrivalId" value={initialValues.arrivalId} />
      )}

      <div style={gridStyle}>
        <AthleteProfilePrefillFields
          athleteProfiles={athleteProfiles}
          initialValues={initialValues}
          includeLevel
          ageRequired
        />

        <FormField label="Ordem de chegada">
          <input
            name="arrivalOrder"
            type="number"
            min={1}
            defaultValue={initialValues?.arrivalOrder || ""}
            required
            style={inputStyle}
          />
        </FormField>

        <FormField label="Horário de chegada">
          <input
            name="arrivedAt"
            type="datetime-local"
            defaultValue={
              initialValues?.arrivedAt
                ? buildArrivalDateTimeInput(initialValues.arrivedAt)
                : ""
            }
            required
            style={inputStyle}
          />
        </FormField>

        <FormField label="Convidado de">
          <input
            name="guestInvitedBy"
            type="text"
            defaultValue={initialValues?.guestInvitedBy || ""}
            placeholder="Opcional, se quiser identificar"
            style={inputStyle}
          />
        </FormField>
      </div>

      <div style={checkboxRowStyle}>
        <label style={checkboxLabelStyle}>
          <input
            type="checkbox"
            name="isGuest"
            defaultChecked={initialValues?.isGuest || false}
          />
          <span>É convidado</span>
        </label>

        <label style={checkboxLabelStyle}>
          <input
            type="checkbox"
            name="playsFirstGame"
            defaultChecked={initialValues?.playsFirstGame || false}
          />
          <span>Joga a primeira</span>
        </label>

        <label style={checkboxLabelStyle}>
          <input
            type="checkbox"
            name="playsSecondGame"
            defaultChecked={initialValues?.playsSecondGame || false}
          />
          <span>Joga a segunda</span>
        </label>
      </div>

      <div className="xv-form-actions" style={actionsStyle}>
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

const checkboxRowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 18,
};

const checkboxLabelStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  fontSize: 14,
  color: "#101010",
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
  minHeight: 42,
};

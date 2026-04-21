import type { AthleteProfilePrefillOption } from "@/lib/athlete-profiles";
import { GOALKEEPER_SIDE_OPTIONS } from "@/lib/peladas";
import { AthleteProfilePrefillFields } from "./athlete-profile-prefill-fields";

type ConfirmationAdminFormProps = {
  peladaId: string;
  athleteProfiles?: AthleteProfilePrefillOption[];
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
  returnTo?: string;
  mode?: "host" | "guest";
  initialValues?: {
    confirmationId?: string;
    athleteProfileId?: string;
    fullName: string;
    preferredPosition: string;
    age: number | string;
    level: string;
    guestCount: number | string;
    goalkeeperSide: string;
  };
};

export function ConfirmationAdminForm({
  peladaId,
  athleteProfiles = [],
  action,
  submitLabel,
  returnTo,
  mode = "host",
  initialValues,
}: ConfirmationAdminFormProps) {
  const isGuest = mode === "guest";

  return (
    <form action={action} style={formStyle}>
      <input type="hidden" name="peladaId" value={peladaId} />
      {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
      {initialValues?.confirmationId && (
        <input
          type="hidden"
          name="confirmationId"
          value={initialValues.confirmationId}
        />
      )}

      <div style={gridStyle}>
        <AthleteProfilePrefillFields
          athleteProfiles={athleteProfiles}
          initialValues={initialValues}
          includeLevel
        />

        {!isGuest && (
          <FormField label="Convidados previstos">
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
        )}

        {!isGuest && (
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
        )}

        {isGuest && <input type="hidden" name="guestCount" value="0" />}
        {isGuest && <input type="hidden" name="goalkeeperSide" value="" />}
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

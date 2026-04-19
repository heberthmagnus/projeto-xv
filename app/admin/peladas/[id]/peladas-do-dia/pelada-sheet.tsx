type PeladaSheetRow = {
  id: string;
  queueOrder: number;
  fullName: string;
  preferredPositionLabel: string;
  levelLabel: string;
  blackMark?: string;
  yellowMark?: string;
  sourceLabel?: string;
};

type PeladaSheetProps = {
  title: string;
  subtitle?: string;
  rows: PeladaSheetRow[];
  emptyMessage: string;
  showSource?: boolean;
};

export function PeladaSheet({
  title,
  subtitle,
  rows,
  emptyMessage,
  showSource = false,
}: PeladaSheetProps) {
  return (
    <section style={sheetCardStyle}>
      <div style={sheetHeaderStyle}>
        <h3 style={sheetTitleStyle}>{title}</h3>
        {subtitle ? <p style={sheetSubtitleStyle}>{subtitle}</p> : null}
      </div>

      <div style={sheetWrapperStyle}>
        <table style={sheetTableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Ordem</th>
              <th style={thStyle}>Lista jogadores</th>
              <th style={thStyle}>Posição</th>
              <th style={thStyle}>Nível</th>
              {showSource ? <th style={thStyle}>Origem</th> : null}
              <th style={centeredThStyle}>Time Preto</th>
              <th style={centeredThStyle}>Time Amarelo</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={showSource ? 7 : 6} style={emptyTdStyle}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td style={numberTdStyle}>{row.queueOrder}</td>
                  <td style={nameTdStyle}>{row.fullName}</td>
                  <td style={tdStyle}>{row.preferredPositionLabel}</td>
                  <td style={tdStyle}>{row.levelLabel}</td>
                  {showSource ? <td style={tdStyle}>{row.sourceLabel || "—"}</td> : null}
                  <td style={markTdStyle}>{row.blackMark || ""}</td>
                  <td style={markTdStyle}>{row.yellowMark || ""}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const sheetCardStyle: React.CSSProperties = {
  borderRadius: 10,
  border: "1px solid #B6B6B6",
  background: "#FFFFFF",
  overflow: "hidden",
  display: "grid",
};

const sheetHeaderStyle: React.CSSProperties = {
  padding: "10px 12px",
  background: "#F5F5F5",
  borderBottom: "1px solid #B6B6B6",
};

const sheetTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 18,
  fontWeight: 800,
  color: "#111111",
};

const sheetSubtitleStyle: React.CSSProperties = {
  margin: "4px 0 0",
  fontSize: 13,
  color: "#5B6472",
  lineHeight: 1.5,
};

const sheetWrapperStyle: React.CSSProperties = {
  overflowX: "auto",
};

const sheetTableStyle: React.CSSProperties = {
  width: "100%",
  minWidth: 760,
  borderCollapse: "collapse",
};

const thStyle: React.CSSProperties = {
  padding: "8px 10px",
  border: "1px solid #B6B6B6",
  background: "#D9D9D9",
  fontSize: 12,
  fontWeight: 800,
  color: "#1A1A1A",
  textAlign: "left",
  textTransform: "none",
};

const centeredThStyle: React.CSSProperties = {
  ...thStyle,
  textAlign: "center",
};

const tdStyle: React.CSSProperties = {
  padding: "7px 10px",
  border: "1px solid #D1D5DB",
  fontSize: 14,
  color: "#111111",
  background: "#FFFFFF",
};

const numberTdStyle: React.CSSProperties = {
  ...tdStyle,
  width: 74,
  textAlign: "right",
  fontWeight: 700,
  background: "#F7F7F7",
};

const nameTdStyle: React.CSSProperties = {
  ...tdStyle,
  minWidth: 220,
  fontWeight: 600,
};

const markTdStyle: React.CSSProperties = {
  ...tdStyle,
  width: 88,
  textAlign: "center",
  fontWeight: 900,
};

const emptyTdStyle: React.CSSProperties = {
  ...tdStyle,
  padding: "18px 12px",
  textAlign: "center",
  color: "#6B7280",
};

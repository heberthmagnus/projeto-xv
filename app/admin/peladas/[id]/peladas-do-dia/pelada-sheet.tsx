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
        <div style={sheetHeaderTopStyle}>
          <h3 style={sheetTitleStyle}>{title}</h3>
          <span style={sheetCountStyle}>{rows.length}</span>
        </div>
        {subtitle ? <p style={sheetSubtitleStyle}>{subtitle}</p> : null}
      </div>

      <div className="xv-table-scroll xv-dense-table" style={sheetWrapperStyle}>
        <table style={sheetTableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Ordem</th>
              <th style={thStyle}>Lista jogadores</th>
              <th style={thStyle}>Posição</th>
              <th style={thStyle}>Nível</th>
              {showSource ? <th style={thStyle}>Origem</th> : null}
              <th style={blackTeamThStyle}>Preto</th>
              <th style={yellowTeamThStyle}>Amarelo</th>
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
                <tr key={row.id} style={row.blackMark || row.yellowMark ? activeRowStyle : undefined}>
                  <td style={numberTdStyle}>{row.queueOrder}</td>
                  <td style={nameTdStyle}>{row.fullName}</td>
                  <td style={tdStyle}>{row.preferredPositionLabel}</td>
                  <td style={tdStyle}>{row.levelLabel}</td>
                  {showSource ? (
                    <td style={tdStyle}>
                      {row.sourceLabel ? (
                        <span
                          style={
                            row.sourceLabel === "Repescagem"
                              ? sourceRepescagemStyle
                              : sourceFilaStyle
                          }
                        >
                          {row.sourceLabel}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  ) : null}
                  <td style={row.blackMark ? blackMarkActiveTdStyle : markTdStyle}>
                    {row.blackMark || ""}
                  </td>
                  <td style={row.yellowMark ? yellowMarkActiveTdStyle : markTdStyle}>
                    {row.yellowMark || ""}
                  </td>
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
  padding: "9px 10px 8px",
  background: "#F5F5F5",
  borderBottom: "1px solid #B6B6B6",
};

const sheetHeaderTopStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
};

const sheetTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 16,
  fontWeight: 800,
  color: "#111111",
};

const sheetCountStyle: React.CSSProperties = {
  minWidth: 28,
  height: 28,
  padding: "0 8px",
  borderRadius: 999,
  display: "grid",
  placeItems: "center",
  background: "#FCF7E6",
  border: "1px solid #F1D68A",
  color: "#8B6914",
  fontWeight: 800,
  fontSize: 14,
};

const sheetSubtitleStyle: React.CSSProperties = {
  margin: "4px 0 0",
  fontSize: 12,
  color: "#5B6472",
  lineHeight: 1.45,
};

const sheetWrapperStyle: React.CSSProperties = {};

const sheetTableStyle: React.CSSProperties = {
  width: "100%",
  minWidth: 600,
  borderCollapse: "collapse",
};

const thStyle: React.CSSProperties = {
  padding: "7px 9px",
  border: "1px solid #B6B6B6",
  background: "#D9D9D9",
  fontSize: 11,
  fontWeight: 800,
  color: "#1A1A1A",
  textAlign: "left",
  textTransform: "none",
};

const centeredThStyle: React.CSSProperties = {
  ...thStyle,
  textAlign: "center",
};

const blackTeamThStyle: React.CSSProperties = {
  ...centeredThStyle,
  background: "#18181B",
  color: "#FFFFFF",
};

const yellowTeamThStyle: React.CSSProperties = {
  ...centeredThStyle,
  background: "#FCF7E6",
  color: "#8B6914",
};

const tdStyle: React.CSSProperties = {
  padding: "6px 8px",
  border: "1px solid #D1D5DB",
  fontSize: 12,
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
  minWidth: 200,
  fontWeight: 600,
};

const markTdStyle: React.CSSProperties = {
  ...tdStyle,
  width: 88,
  textAlign: "center",
  fontWeight: 900,
};

const blackMarkActiveTdStyle: React.CSSProperties = {
  ...markTdStyle,
  background: "#18181B",
  color: "#FFFFFF",
};

const yellowMarkActiveTdStyle: React.CSSProperties = {
  ...markTdStyle,
  background: "#FCF7E6",
  color: "#8B6914",
};

const emptyTdStyle: React.CSSProperties = {
  ...tdStyle,
  padding: "18px 12px",
  textAlign: "center",
  color: "#6B7280",
};

const activeRowStyle: React.CSSProperties = {
  background: "#FFFCF4",
};

const sourceBaseStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "2px 8px",
  borderRadius: 999,
  fontWeight: 700,
  fontSize: 11,
};

const sourceFilaStyle: React.CSSProperties = {
  ...sourceBaseStyle,
  background: "#F3F4F6",
  color: "#374151",
  border: "1px solid #E5E7EB",
};

const sourceRepescagemStyle: React.CSSProperties = {
  ...sourceBaseStyle,
  background: "#FFF7ED",
  color: "#9A3412",
  border: "1px solid #FDBA74",
};

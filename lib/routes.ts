export const ADMIN_CHAMPIONSHIP_BASE_PATH = "/admin/tio-hugo-2026";
export const ADMIN_REGISTRATIONS_PATH = "/admin/tio-hugo-2026/inscricoes";
export const ADMIN_SIMULATION_PATH = "/admin/tio-hugo-2026/times/simulacao";
export const ADMIN_ADVANCED_SIMULATION_PATH =
  "/admin/tio-hugo-2026/times/simulacao-avancada";
export const ADMIN_PELADAS_PATH = "/admin/peladas";

export function getAdminPeladaBasePath(peladaId: string) {
  return `${ADMIN_PELADAS_PATH}/${peladaId}`;
}

export function getAdminPeladaConfirmadosPath(peladaId: string) {
  return `${getAdminPeladaBasePath(peladaId)}/confirmados`;
}

export function getAdminPeladaChegadaPath(peladaId: string) {
  return `${getAdminPeladaBasePath(peladaId)}/chegada`;
}

export function getAdminPeladaPeladasDoDiaPath(peladaId: string) {
  return `${getAdminPeladaBasePath(peladaId)}/peladas-do-dia`;
}

export function getAdminPeladaResultadosPath(peladaId: string) {
  return `${getAdminPeladaBasePath(peladaId)}/resultados`;
}

export const CHAMPIONSHIPS_BASE_PATH = "/campeonatos";
export const ADMIN_CHAMPIONSHIPS_PATH = "/admin";
export const ADMIN_PELADAS_PATH = "/admin/peladas";
export const CALENDARIO_XV_PATH = "/calendario";

export function getChampionshipBasePath(slug: string) {
  return `${CHAMPIONSHIPS_BASE_PATH}/${slug}`;
}

export function getChampionshipRegistrationPath(slug: string) {
  return `${getChampionshipBasePath(slug)}/inscricao`;
}

export function getAdminChampionshipBasePath(slug: string) {
  return `${ADMIN_CHAMPIONSHIPS_PATH}/${slug}`;
}

export function getAdminChampionshipRegistrationsPath(slug: string) {
  return `${getAdminChampionshipBasePath(slug)}/inscricoes`;
}

export function getAdminChampionshipTeamsPath(slug: string) {
  return `${getAdminChampionshipBasePath(slug)}/times`;
}

export function getAdminChampionshipSimulationPath(slug: string) {
  return `${getAdminChampionshipBasePath(slug)}/times/simulacao`;
}

export function getAdminChampionshipAdvancedSimulationPath(slug: string) {
  return `${getAdminChampionshipBasePath(slug)}/times/simulacao-avancada`;
}

export const ADMIN_CHAMPIONSHIP_BASE_PATH =
  getAdminChampionshipBasePath("tio-hugo-2026");
export const ADMIN_REGISTRATIONS_PATH =
  getAdminChampionshipRegistrationsPath("tio-hugo-2026");
export const ADMIN_TEAMS_PATH =
  getAdminChampionshipTeamsPath("tio-hugo-2026");
export const ADMIN_SIMULATION_PATH =
  getAdminChampionshipSimulationPath("tio-hugo-2026");
export const ADMIN_ADVANCED_SIMULATION_PATH =
  getAdminChampionshipAdvancedSimulationPath("tio-hugo-2026");

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

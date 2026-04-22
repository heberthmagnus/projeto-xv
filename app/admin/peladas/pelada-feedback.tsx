import {
  ADMIN_PELADAS_PATH,
  getAdminPeladaChegadaPath,
  getAdminPeladaConfirmadosPath,
  getAdminPeladaPeladasDoDiaPath,
  getAdminPeladaResultadosPath,
} from "@/lib/routes";
import { PostActionFeedbackBanner } from "@/app/post-action-feedback-banner";

type PeladaFeedbackScope =
  | "admin-list"
  | "confirmados"
  | "chegada"
  | "peladas-do-dia"
  | "resultados";

export function PeladaFeedbackBanner({
  scope,
  peladaId,
  success,
  error,
  warning,
}: {
  scope: PeladaFeedbackScope;
  peladaId?: string;
  success?: string;
  error?: string;
  warning?: string;
}) {
  const pathname = getFeedbackPathname(scope, peladaId);

  return (
    <PostActionFeedbackBanner
      pathname={pathname}
      searchParams={{ success, error, warning }}
    />
  );
}

function getFeedbackPathname(scope: PeladaFeedbackScope, peladaId?: string) {
  if (scope === "admin-list") {
    return ADMIN_PELADAS_PATH;
  }

  if (!peladaId) {
    return ADMIN_PELADAS_PATH;
  }

  if (scope === "confirmados") {
    return getAdminPeladaConfirmadosPath(peladaId);
  }

  if (scope === "chegada") {
    return getAdminPeladaChegadaPath(peladaId);
  }

  if (scope === "peladas-do-dia") {
    return getAdminPeladaPeladasDoDiaPath(peladaId);
  }

  return getAdminPeladaResultadosPath(peladaId);
}

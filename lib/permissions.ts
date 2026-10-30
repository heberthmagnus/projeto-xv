import type { PlatformRole } from "@prisma/client";

export type Permission =
  | "sports.manage"
  | "player.manage"
  | "player.rating.manage"
  | "match.result.manage"
  | "member.account.approve"
  | "member.read"
  | "member.create"
  | "member.update"
  | "member.status.manage"
  | "member.player.link"
  | "championship.registration.read"
  | "pool.read"
  | "pool.participate"
  | "pool.manage"
  | "pool.recalculate"
  | "permission.manage"
  | "audit.read";

const grants: Record<Exclude<PlatformRole, "ROOT">, readonly Permission[]> = {
  DIRETORIA: ["sports.manage", "player.manage", "player.rating.manage", "match.result.manage", "championship.registration.read", "member.account.approve", "member.read", "member.status.manage", "pool.read", "pool.manage", "pool.recalculate"],
  SECRETARIA: ["member.read", "member.create", "member.update", "member.status.manage", "member.player.link", "player.manage", "championship.registration.read", "match.result.manage", "member.account.approve", "pool.read"],
  ASSOCIADO: ["pool.read", "pool.participate"],
};

export function hasPermission(roles: readonly PlatformRole[], permission: Permission) {
  return roles.includes("ROOT") || roles.some((role) => role !== "ROOT" && grants[role].includes(permission));
}

export function hasAdministrativeRole(roles: readonly PlatformRole[]) {
  return roles.some((role) => role === "ROOT" || role === "DIRETORIA" || role === "SECRETARIA");
}

import { strict as assert } from "node:assert";
import { test } from "node:test";
import { hasAdministrativeRole, hasPermission } from "../lib/permissions";

test("ROOT tem todas as permissões e papéis se somam", () => {
  assert.equal(hasPermission(["ROOT"], "audit.read"), true);
  assert.equal(hasPermission(["DIRETORIA", "SECRETARIA"], "sports.manage"), true);
  assert.equal(hasPermission(["DIRETORIA", "SECRETARIA"], "member.status.manage"), true);
});

test("diretoria, secretaria e associado mantêm limites distintos", () => {
  assert.equal(hasPermission(["DIRETORIA"], "sports.manage"), true);
  assert.equal(hasPermission(["DIRETORIA"], "member.account.approve"), true);
  assert.equal(hasPermission(["DIRETORIA"], "member.read"), true);
  assert.equal(hasPermission(["SECRETARIA"], "member.update"), true);
  assert.equal(hasPermission(["SECRETARIA"], "match.result.manage"), true);
  assert.equal(hasPermission(["SECRETARIA"], "member.account.approve"), true);
  assert.equal(hasPermission(["SECRETARIA"], "pool.read"), true);
  assert.equal(hasPermission(["SECRETARIA"], "pool.manage"), false);
  assert.equal(hasPermission(["DIRETORIA"], "pool.manage"), true);
  assert.equal(hasPermission(["ASSOCIADO"], "pool.participate"), true);
  assert.equal(hasPermission(["SECRETARIA"], "sports.manage"), false);
  assert.equal(hasPermission(["SECRETARIA"], "permission.manage"), false);
  assert.equal(hasAdministrativeRole(["ASSOCIADO"]), false);
  assert.equal(hasPermission(["ASSOCIADO"], "member.account.approve"), false);
  assert.equal(hasAdministrativeRole([]), false);
});

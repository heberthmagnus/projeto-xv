import { strict as assert } from "node:assert";
import { test } from "node:test";
import { formatBrazilPhone, isValidBrazilPhone } from "../lib/phone";

test("aceita celular brasileiro digitado somente com números e o normaliza", () => {
  assert.equal(formatBrazilPhone("27999991234"), "(27) 99999-1234");
  assert.equal(isValidBrazilPhone("27999991234"), true);
  assert.equal(isValidBrazilPhone("(27) 99999-1234"), true);
});

test("rejeita telefone incompleto ou com dígitos além do formato", () => {
  assert.equal(isValidBrazilPhone("2799991234"), false);
  assert.equal(isValidBrazilPhone("279999912345"), false);
});

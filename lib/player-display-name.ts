export function getPreferredPlayerName(
  nickname: string | null | undefined,
  fullName: string,
) {
  const displayName = nickname?.trim() || fullName;
  // "Jairinho" identifica quem convidou o atleta; não faz parte do nome do Moreno.
  return displayName === "Moreno (Jairinho)" ? "Moreno" : displayName;
}

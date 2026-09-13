export function getPreferredPlayerName(
  nickname: string | null | undefined,
  fullName: string,
) {
  return nickname?.trim() || fullName;
}

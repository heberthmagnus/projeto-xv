"use client";

import { useState } from "react";

type PlayerOption = {
  id: string;
  teamId: string;
  teamName: string;
  name: string;
};

export function TeamPlayerSelect({ players, defaultPlayerId }: { players: PlayerOption[]; defaultPlayerId?: string }) {
  const initialPlayer = players.find((player) => player.id === defaultPlayerId) ?? players[0];
  const [teamId, setTeamId] = useState(initialPlayer?.teamId ?? "");
  const teamPlayers = players.filter((player) => player.teamId === teamId);
  const [playerId, setPlayerId] = useState(initialPlayer?.id ?? "");
  const teams = [...new Map(players.map((player) => [player.teamId, player.teamName])).entries()];

  return <div className="grid gap-2 sm:grid-cols-2">
    <select aria-label="Time" value={teamId} onChange={(event) => { const nextTeamId = event.target.value; setTeamId(nextTeamId); setPlayerId(players.find((player) => player.teamId === nextTeamId)?.id ?? ""); }} className="rounded-lg border p-2">
      {teams.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
    </select>
    <select aria-label="Jogador" name="championshipPlayerId" value={playerId} onChange={(event) => setPlayerId(event.target.value)} required className="rounded-lg border p-2">
      {teamPlayers.map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}
    </select>
  </div>;
}

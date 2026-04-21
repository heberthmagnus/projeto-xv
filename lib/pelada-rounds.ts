type PeladaRoundPlayerSource = "FILA" | "REPESCAGEM";

type PeladaBase = {
  type: string;
  linePlayersCount: number;
  maxFirstGamePlayers: number | null;
};

type PeladaArrivalQueueItem = {
  id: string;
  arrivalOrder: number;
  availableForNextRound: boolean;
  outForDay: boolean;
  preferredPosition: string;
};

type PeladaLatestRound = {
  id: string;
  roundNumber: number;
  players: Array<{
    arrivalId: string;
    queueOrder: number;
  }>;
};

export function getPeladaRoundStatusLabel(status: string) {
  return status === "ATIVA" ? "Ativa" : "Finalizada";
}

export function getPeladaRoundPlayerSourceLabel(source: PeladaRoundPlayerSource) {
  return source === "FILA" ? "Fila" : "Repescagem";
}

export function getNextRoundPlayers(args: {
  pelada: PeladaBase;
  arrivals: PeladaArrivalQueueItem[];
  latestRound: PeladaLatestRound | null;
}) {
  const { pelada, arrivals, latestRound } = args;
  const limit = pelada.maxFirstGamePlayers ?? pelada.linePlayersCount * 2;
  const selected: Array<{
    arrivalId: string;
    source: PeladaRoundPlayerSource;
    queueOrder: number;
  }> = [];

  const lastRoundArrivalIds = new Set(
    latestRound?.players.map((player) => player.arrivalId) ?? [],
  );
  const lastRoundQueueOrderByArrivalId = new Map(
    latestRound?.players.map((player) => [player.arrivalId, player.queueOrder]) ?? [],
  );

  const queuePlayers = arrivals
    .filter(
      (arrival) =>
        arrival.preferredPosition !== "GOLEIRO" &&
        !arrival.outForDay &&
        !lastRoundArrivalIds.has(arrival.id),
    )
    .sort((a, b) => a.arrivalOrder - b.arrivalOrder);

  selected.push(
    ...queuePlayers.slice(0, limit).map((arrival, index) => ({
      arrivalId: arrival.id,
      source: "FILA" as PeladaRoundPlayerSource,
      queueOrder: index + 1,
    })),
  );

  if (selected.length < limit) {
    const selectedIds = new Set(selected.map((player) => player.arrivalId));

    const replayPriority = arrivals
      .filter(
        (arrival) =>
          arrival.preferredPosition !== "GOLEIRO" &&
          !arrival.outForDay &&
          lastRoundArrivalIds.has(arrival.id) &&
          arrival.availableForNextRound &&
          !selectedIds.has(arrival.id),
      )
      .sort((a, b) => {
        const leftQueueOrder =
          lastRoundQueueOrderByArrivalId.get(a.id) ?? Number.MAX_SAFE_INTEGER;
        const rightQueueOrder =
          lastRoundQueueOrderByArrivalId.get(b.id) ?? Number.MAX_SAFE_INTEGER;

        if (leftQueueOrder !== rightQueueOrder) {
          return leftQueueOrder - rightQueueOrder;
        }

        return a.arrivalOrder - b.arrivalOrder;
      });

    for (const arrival of replayPriority) {
      if (selected.length >= limit) {
        break;
      }

      selected.push({
        arrivalId: arrival.id,
        source: "REPESCAGEM",
        queueOrder: selected.length + 1,
      });
      selectedIds.add(arrival.id);
    }
  }

  return selected;
}

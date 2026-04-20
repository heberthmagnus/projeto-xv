import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_NOTE = "[DEMO-CODEX] Pelada fictícia para avaliação visual";

const players = [
  { name: "Renato Gracinha", pos: "LATERAL", age: 39, level: "C" },
  { name: "Cristiano Pão de Queijo", pos: "VOLANTE", age: 36, level: "D" },
  { name: "Gilbertinho", pos: "MEIA", age: 31, level: "A" },
  { name: "Edinho", pos: "MEIA", age: 34, level: "C" },
  { name: "Gabriel - Convidado Pepê", pos: "ZAGUEIRO", age: 25, level: "D", guestOf: "Pepê" },
  { name: "Ricardo Ri", pos: "ZAGUEIRO", age: 33, level: "C" },
  { name: "Fred", pos: "LATERAL", age: 32, level: "C" },
  { name: "Pepê", pos: "MEIA", age: 19, level: "A" },
  { name: "Lucas - Amigo do Pepê", pos: "LATERAL", age: 27, level: "C", guestOf: "Pepê" },
  { name: "Markim M8", pos: "MEIA", age: 29, level: "B" },
  { name: "Heberth", pos: "LATERAL", age: 34, level: "B" },
  { name: "Dada", pos: "ATACANTE", age: 30, level: "C" },
  { name: "Fabinho Farmácia", pos: "LATERAL", age: 43, level: "B" },
  { name: "Rick", pos: "MEIA", age: 28, level: "B" },
  { name: "Gustavo CVC", pos: "ZAGUEIRO", age: 35, level: "B" },
  { name: "Jairinho", pos: "ATACANTE", age: 41, level: "D" },
  { name: "Dany", pos: "VOLANTE", age: 37, level: "C" },
  { name: "Fabim F2", pos: "LATERAL", age: 30, level: "B" },
  { name: "Hulk", pos: "MEIA", age: 33, level: "B" },
  { name: "Lucca", pos: "MEIA", age: 26, level: "B" },
  { name: "Caio", pos: "ATACANTE", age: 24, level: "A" },
  { name: "David Filho Celinho", pos: "ATACANTE", age: 20, level: "C", guestOf: "Celinho" },
  { name: "Theuzin", pos: "LATERAL", age: 27, level: "C" },
  { name: "Pedrinho", pos: "LATERAL", age: 32, level: "B" },
  { name: "Vitim", pos: "VOLANTE", age: 29, level: "A" },
  { name: "Bocão", pos: "ATACANTE", age: 35, level: "B" },
  { name: "Zico", pos: "ATACANTE", age: 38, level: "E" },
  { name: "Henrique", pos: "LATERAL", age: 31, level: "E" },
  { name: "João Goleiro", pos: "GOLEIRO", age: 40, level: null, keeper: true },
  { name: "Goleiro Aplicativo 1", pos: "GOLEIRO", age: 27, level: null, keeper: true, appKeeper: true },
];

const hostConfirmations = [
  { name: "Pepê", pos: "MEIA", age: 19, level: "A", guests: 2, createdByAdmin: true },
  { name: "Heberth", pos: "LATERAL", age: 34, level: "B" },
  { name: "Fabinho Farmácia", pos: "LATERAL", age: 43, level: "B" },
  { name: "Dinho", pos: "ATACANTE", age: 44, level: "C" },
  { name: "Latini", pos: "ATACANTE", age: 52, level: "D" },
  { name: "Theuzin", pos: "LATERAL", age: 27, level: "C" },
  { name: "Edinho Juiz", pos: "MEIA", age: 36, level: "C" },
  { name: "Fabinho F2", pos: "LATERAL", age: 30, level: "B" },
  { name: "Hugo", pos: "VOLANTE", age: 33, level: "C" },
  { name: "Jairinho", pos: "ATACANTE", age: 41, level: "D" },
  { name: "Dany", pos: "VOLANTE", age: 37, level: "C" },
  { name: "Celinho", pos: "MEIA", age: 34, level: "B", guests: 1, createdByAdmin: true },
  { name: "Caio", pos: "ATACANTE", age: 24, level: "A" },
];

const roundsConfig = [
  {
    roundNumber: 1,
    status: "FINALIZADA",
    score: [3, 2],
    notes: "Pelada começou forte, pessoal chegou no horário e o campo estava seco.",
    lineup: [
      "Renato Gracinha",
      "Cristiano Pão de Queijo",
      "Gilbertinho",
      "Edinho",
      "Gabriel - Convidado Pepê",
      "Ricardo Ri",
      "Fred",
      "Pepê",
      "Lucas - Amigo do Pepê",
      "Markim M8",
      "Heberth",
      "Dada",
      "Fabinho Farmácia",
      "Rick",
      "Gustavo CVC",
      "Jairinho",
    ],
    teamBlack: [
      "Renato Gracinha",
      "Cristiano Pão de Queijo",
      "Gilbertinho",
      "Gabriel - Convidado Pepê",
      "Pepê",
      "Heberth",
      "Dada",
      "Jairinho",
    ],
    goals: [
      { scorer: "Pepê", minute: 6 },
      { scorer: "Gilbertinho", minute: 14 },
      { scorer: "Dada", minute: 22 },
      { scorer: "Rick", minute: 11 },
      { scorer: "Fabinho Farmácia", minute: 19 },
    ],
  },
  {
    roundNumber: 2,
    status: "FINALIZADA",
    score: [1, 4],
    notes: "Quem ficou de fora entrou primeiro e a repescagem completou a lista.",
    lineup: [
      "Dany",
      "Fabim F2",
      "Jairinho",
      "Hulk",
      "Celinho",
      "Lucca",
      "Caio",
      "David Filho Celinho",
      "Theuzin",
      "Pedrinho",
      "Vitim",
      "Bocão",
      "Zico",
      "Henrique",
      "Renato Gracinha",
      "Cristiano Pão de Queijo",
    ],
    teamBlack: [
      "Caio",
      "Fabim F2",
      "Hulk",
      "Lucca",
      "Theuzin",
      "David Filho Celinho",
      "Cristiano Pão de Queijo",
      "Henrique",
    ],
    goals: [
      { scorer: "Caio", minute: 4 },
      { scorer: "Hulk", minute: 9 },
      { scorer: "David Filho Celinho", minute: 15 },
      { scorer: "Caio", minute: 23 },
      { scorer: "Vitim", minute: 12 },
    ],
  },
  {
    roundNumber: 3,
    status: "FINALIZADA",
    score: [2, 2],
    notes: "Jogo mais equilibrado do dia, empatou no fim.",
    lineup: [
      "Gilbertinho",
      "Edinho",
      "Gabriel - Convidado Pepê",
      "Ricardo Ri",
      "Fred",
      "Pepê",
      "Lucas - Amigo do Pepê",
      "Markim M8",
      "Heberth",
      "Dada",
      "Fabinho Farmácia",
      "Rick",
      "Gustavo CVC",
      "Dany",
      "Fabim F2",
      "Hulk",
    ],
    teamBlack: [
      "Gilbertinho",
      "Ricardo Ri",
      "Pepê",
      "Markim M8",
      "Heberth",
      "Dany",
      "Fabim F2",
      "Hulk",
    ],
    goals: [
      { scorer: "Gilbertinho", minute: 7 },
      { scorer: "Pepê", minute: 17 },
      { scorer: "Dada", minute: 10 },
      { scorer: "Rick", minute: 25 },
    ],
  },
  {
    roundNumber: 4,
    status: "ATIVA",
    score: [0, 0],
    notes: null,
    lineup: [
      "Jairinho",
      "Hulk",
      "Celinho",
      "Lucca",
      "Caio",
      "David Filho Celinho",
      "Theuzin",
      "Pedrinho",
      "Vitim",
      "Bocão",
      "Zico",
      "Henrique",
      "Renato Gracinha",
      "Cristiano Pão de Queijo",
      "Gilbertinho",
      "Edinho",
    ],
    teamBlack: [
      "Caio",
      "Theuzin",
      "Vitim",
      "Renato Gracinha",
      "Cristiano Pão de Queijo",
      "Gilbertinho",
      "Hulk",
      "Jairinho",
    ],
    goals: [],
  },
];

const nextRoundAvailable = ["Pepê", "Fabinho Farmácia", "Dany", "Caio", "Vitim", "Hulk"];

function teamColorFor(name, teamBlack) {
  return teamBlack.includes(name) ? "PRETO" : "AMARELO";
}

function sourceForQueue(queueOrder, roundNumber) {
  if (roundNumber === 1) return "FILA";
  return queueOrder <= 12 ? "FILA" : "REPESCAGEM";
}

async function main() {
  const existingDemo = await prisma.pelada.findMany({
    where: { notes: DEMO_NOTE },
    select: { id: true },
  });

  if (existingDemo.length > 0) {
    await prisma.pelada.deleteMany({
      where: {
        id: { in: existingDemo.map((pelada) => pelada.id) },
      },
    });
  }

  const pelada = await prisma.pelada.create({
    data: {
      scheduledAt: new Date("2026-04-27T09:00:00-03:00"),
      type: "CAMPAO",
      firstGameRule: "ORDEM_DE_CHEGADA",
      arrivalCutoffTime: "09:00",
      maxFirstGamePlayers: 16,
      linePlayersCount: 8,
      status: "EM_ANDAMENTO",
      notes: DEMO_NOTE,
    },
  });

  const confirmationMap = new Map();

  for (const host of hostConfirmations) {
    const created = await prisma.peladaConfirmation.create({
      data: {
        peladaId: pelada.id,
        fullName: host.name,
        preferredPosition: host.pos,
        age: host.age,
        level: host.level,
        guestCount: host.guests || 0,
        createdByAdmin: host.createdByAdmin || false,
      },
    });

    confirmationMap.set(host.name, created);
  }

  const pe = confirmationMap.get("Pepê");
  await prisma.peladaConfirmation.create({
    data: {
      peladaId: pelada.id,
      parentConfirmationId: pe.id,
      fullName: "Gabriel - Convidado Pepê",
      preferredPosition: "ZAGUEIRO",
      age: 25,
      level: "D",
      guestOrder: 1,
      createdByAdmin: true,
    },
  });
  await prisma.peladaConfirmation.create({
    data: {
      peladaId: pelada.id,
      parentConfirmationId: pe.id,
      fullName: "Lucas - Amigo do Pepê",
      preferredPosition: "LATERAL",
      age: 27,
      level: "C",
      guestOrder: 2,
      createdByAdmin: true,
    },
  });

  const ce = confirmationMap.get("Celinho");
  await prisma.peladaConfirmation.create({
    data: {
      peladaId: pelada.id,
      parentConfirmationId: ce.id,
      fullName: "David Filho Celinho",
      preferredPosition: "ATACANTE",
      age: 20,
      level: "C",
      guestOrder: 1,
      createdByAdmin: true,
    },
  });

  const allConfirmations = await prisma.peladaConfirmation.findMany({
    where: { peladaId: pelada.id },
    select: {
      id: true,
      fullName: true,
      parentConfirmationId: true,
    },
  });
  const confirmationByName = new Map(allConfirmations.map((item) => [item.fullName, item]));

  const arrivals = [];
  let order = 1;
  for (const player of players) {
    const confirmation = confirmationByName.get(player.name);
    const arrival = await prisma.peladaArrival.create({
      data: {
        peladaId: pelada.id,
        confirmationId: confirmation?.id || null,
        fullName: player.name,
        isGuest: Boolean(player.guestOf),
        guestInvitedBy: player.guestOf || null,
        preferredPosition: player.pos,
        age: player.age,
        arrivalOrder: order,
        arrivedAt: new Date(`2026-04-27T08:${String(10 + order).padStart(2, "0")}:00-03:00`),
        playsFirstGame: order <= 16 && !player.keeper,
        playsSecondGame: order > 16 && order <= 28 && !player.keeper,
        availableForNextRound: nextRoundAvailable.includes(player.name),
        level: player.level,
      },
    });
    arrivals.push(arrival);
    order += 1;
  }

  const arrivalByName = new Map(arrivals.map((arrival) => [arrival.fullName, arrival]));

  for (const config of roundsConfig) {
    const round = await prisma.peladaRound.create({
      data: {
        peladaId: pelada.id,
        roundNumber: config.roundNumber,
        status: config.status,
        blackScore: config.score[0],
        yellowScore: config.score[1],
        notes: config.notes,
      },
    });

    const roundPlayers = [];
    for (const [index, playerName] of config.lineup.entries()) {
      const arrival = arrivalByName.get(playerName);
      if (!arrival) continue;

      const createdRoundPlayer = await prisma.peladaRoundPlayer.create({
        data: {
          roundId: round.id,
          arrivalId: arrival.id,
          queueOrder: index + 1,
          source: sourceForQueue(index + 1, config.roundNumber),
          teamColor: teamColorFor(playerName, config.teamBlack),
        },
      });

      roundPlayers.push({ playerName, id: createdRoundPlayer.id });
    }

    for (const goal of config.goals) {
      await prisma.peladaRoundGoal.create({
        data: {
          round: {
            connect: {
              id: round.id,
            },
          },
          scorerName: goal.scorer,
          teamColor: teamColorFor(goal.scorer, config.teamBlack),
          minute: goal.minute,
        },
      });
    }

    if (config.status === "ATIVA") {
      for (const [index, playerName] of config.lineup.entries()) {
        const arrival = arrivalByName.get(playerName);
        if (!arrival) continue;

        await prisma.peladaTeamAssignment.create({
          data: {
            peladaId: pelada.id,
            arrivalId: arrival.id,
            teamColor: teamColorFor(playerName, config.teamBlack),
            assignedPosition: arrival.preferredPosition,
            isFallback: false,
            displayOrder: index + 1,
          },
        });
      }
    }
  }

  console.log(
    JSON.stringify({
      ok: true,
      peladaId: pelada.id,
      adminConfirmados: `/admin/peladas/${pelada.id}/confirmados`,
      adminChegada: `/admin/peladas/${pelada.id}/chegada`,
      adminDia: `/admin/peladas/${pelada.id}/peladas-do-dia`,
      adminResultados: `/admin/peladas/${pelada.id}/resultados`,
      publico: `/peladas/${pelada.id}`,
    }),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

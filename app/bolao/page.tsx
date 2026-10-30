import { requireActiveMember } from "@/lib/auth";
import { awardedPoints, buildRanking, scorePrediction } from "@/lib/bolao";
import { prisma } from "@/lib/prisma";
import { BolaoDashboard } from "./bolao-dashboard";
import { MemberAreaShell } from "@/components/member/member-area-shell";

export default async function BolaoPage() {
  const user = await requireActiveMember();
  const memberId = user.member!.id;
  const now = new Date();
  const pools = await prisma.predictionPool.findMany({
    where: { active: true, championship: { slug: "interno-campao-2026" } },
    orderBy: { category: "asc" },
    include: {
      participants: { where: { memberId }, select: { id: true } },
      matches: {
        orderBy: [{ match: { round: "asc" } }, { match: { roundNumber: "asc" } }],
        include: {
          match: {
            select: {
              id: true,
              round: true,
              scheduledAt: true,
              status: true,
              homeScore: true,
              awayScore: true,
              homeTeam: { select: { shortName: true, name: true, icon: true } },
              awayTeam: { select: { shortName: true, name: true, icon: true } },
            },
          },
          predictions: {
            where: { participant: { memberId } },
            select: { homeGoals: true, awayGoals: true },
          },
          multipliers: {
            where: { participant: { memberId } },
            select: { lockedAt: true },
          },
        },
      },
    },
  });

  const rankingParticipants = await prisma.predictionPoolParticipant.findMany({
    where: { pool: { active: true, championship: { slug: "interno-campao-2026" } } },
    select: {
      id: true,
      poolId: true,
      member: { select: { fullName: true } },
      predictions: {
        where: {
          poolMatch: {
            eligible: true,
            match: {
              status: "FINALIZADO",
              homeScore: { not: null },
              awayScore: { not: null },
            },
          },
        },
        select: {
          homeGoals: true,
          awayGoals: true,
          poolMatchId: true,
        },
      },
      multipliers: { select: { poolMatchId: true } },
    },
  });

  const revealedPredictions = await prisma.prediction.findMany({
    where: {
      poolMatch: {
        pool: { active: true, championship: { slug: "interno-campao-2026" } },
        lockAt: { lte: now },
      },
    },
    select: {
      poolMatchId: true,
      homeGoals: true,
      awayGoals: true,
      participant: { select: { member: { select: { fullName: true } } } },
    },
  });
  const revealedByPoolMatch = new Map<string, typeof revealedPredictions>();
  for (const prediction of revealedPredictions) {
    const current = revealedByPoolMatch.get(prediction.poolMatchId) ?? [];
    current.push(prediction);
    revealedByPoolMatch.set(prediction.poolMatchId, current);
  }

  const serializedPools = pools.map((pool) => ({
    id: pool.id,
    category: pool.category,
    joined: pool.participants.length > 0,
    matches: pool.matches
      .filter((item) => item.match.scheduledAt)
      .map((item) => ({
        id: item.match.id,
        poolMatchId: item.id,
        round: item.match.round,
        scheduledAt: item.match.scheduledAt!.toISOString(),
        lockAt: item.lockAt.toISOString(),
        locked: Boolean(item.lockedAt) || item.lockAt <= now,
        status: item.match.status,
        officialScore: item.match.homeScore === null || item.match.awayScore === null
          ? null
          : { homeGoals: item.match.homeScore, awayGoals: item.match.awayScore },
        home: {
          name: item.match.homeTeam.shortName || item.match.homeTeam.name,
          icon: item.match.homeTeam.icon,
        },
        away: {
          name: item.match.awayTeam.shortName || item.match.awayTeam.name,
          icon: item.match.awayTeam.icon,
        },
        prediction: item.predictions[0] ?? null,
        multiplierSelected: item.multipliers.length > 0,
        multiplierLocked: Boolean(item.multipliers[0]?.lockedAt),
        revealedPredictions: item.lockAt <= now
          ? (revealedByPoolMatch.get(item.id) ?? []).map((prediction) => ({
            name: prediction.participant.member.fullName,
            homeGoals: prediction.homeGoals,
            awayGoals: prediction.awayGoals,
          }))
          : [],
      })),
    ranking: (() => {
      const participants = rankingParticipants.filter((participant) => participant.poolId === pool.id);
      const finalMatches = pool.matches.filter((item) => item.eligible
        && item.match.status === "FINALIZADO"
        && item.match.homeScore !== null
        && item.match.awayScore !== null);
      const totalRounds = new Set(pool.matches.map((item) => item.match.round)).size;
      const rows = participants.flatMap((participant) => finalMatches.map((item) => {
        const prediction = participant.predictions.find((value) => value.poolMatchId === item.id);
        const selectedMultiplier = participant.multipliers.some((value) => value.poolMatchId === item.id);
        const basePoints = prediction
          ? scorePrediction(prediction, { homeGoals: item.match.homeScore!, awayGoals: item.match.awayScore! }).basePoints
          : 0;
        return {
          participantId: participant.id,
          name: participant.member.fullName,
          basePoints,
          awardedPoints: awardedPoints(basePoints, selectedMultiplier),
          round: item.match.round,
          submitted: Boolean(prediction),
          maximumPoints: selectedMultiplier ? 20 : 10,
        };
      }));
      const rounds = [...new Set(pool.matches.map((item) => item.match.round))].sort((a, b) => a - b);
      return buildRanking(rows, totalRounds).map((entry) => ({
        position: entry.position,
        name: entry.name,
        points: entry.points,
        exact10: entry.exact10,
        tier8: entry.tier8,
        tier7: entry.tier7,
        tier5: entry.tier5,
        submittedErrors: entry.submittedErrors,
        roundsParticipated: entry.roundsParticipated,
        totalRounds: entry.totalRounds,
        efficiencyNumerator: entry.efficiencyNumerator,
        efficiencyDenominator: entry.efficiencyDenominator,
        efficiencyPercent: entry.efficiencyPercent,
        mine: entry.participantId === pool.participants[0]?.id,
        pointsByRound: rounds.map((round) => ({
          round,
          points: rows.filter((row) => row.participantId === entry.participantId && row.round === round).reduce((total, row) => total + row.awardedPoints, 0),
        })),
      }));
    })(),
    history: pool.matches
      .filter((item) => item.predictions[0])
      .map((item) => {
        const prediction = item.predictions[0];
        const officialScore = item.match.homeScore === null || item.match.awayScore === null
          ? null
          : { homeGoals: item.match.homeScore, awayGoals: item.match.awayScore };
        const selectedMultiplier = item.multipliers.length > 0;
        const score = officialScore ? scorePrediction(prediction, officialScore) : null;
        return {
          id: item.id,
          round: item.match.round,
          home: item.match.homeTeam.shortName || item.match.homeTeam.name,
          away: item.match.awayTeam.shortName || item.match.awayTeam.name,
          prediction,
          officialScore,
          points: score === null ? null : awardedPoints(score.basePoints, selectedMultiplier),
          multiplier: selectedMultiplier,
          tier: score?.tier ?? null,
        };
      }),
  }));

  return (
    <MemberAreaShell>
      <div className="xv-page-container">
        <BolaoDashboard pools={serializedPools} />
      </div>
    </MemberAreaShell>
  );
}

import { prisma } from "@/lib/prisma";
import { deriveStandings } from "@/lib/scoring";
import { calculateSettlement } from "@/lib/settlement";

export type ScoreScope =
  | { type: "ALL_TIME" }
  | { type: "SESSION"; sessionId: string };

export async function getStandings(scope: ScoreScope) {
  const [players, resultRows] = await Promise.all([
    prisma.player.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.matchPlayer.findMany({
      where:
        scope.type === "SESSION"
          ? { match: { gameSessionId: scope.sessionId } }
          : undefined,
      select: { matchId: true, playerId: true, result: true },
    }),
  ]);

  return deriveStandings(players, resultRows);
}

export async function getWaterData(scope: ScoreScope) {
  const standings = await getStandings(scope);
  const settlement = calculateSettlement(
    standings.map((standing) => ({
      playerId: standing.playerId,
      balance: standing.points,
    })),
  );
  const names = new Map(standings.map((standing) => [standing.playerId, standing.name]));

  return {
    standings,
    settlement: settlement.map((transaction) => ({
      ...transaction,
      fromName: names.get(transaction.from) ?? transaction.from,
      toName: names.get(transaction.to) ?? transaction.to,
    })),
  };
}

export async function getCurrentSession() {
  return prisma.gameSession.findFirst({
    where: { isCurrent: true },
    orderBy: { startedAt: "desc" },
  });
}

export async function getSession(sessionId: string) {
  return prisma.gameSession.findUnique({
    where: { id: sessionId },
    include: {
      matches: {
        orderBy: { sequence: "asc" },
        include: {
          matchPlayers: {
            include: { player: true },
            orderBy: [{ team: "asc" }, { player: { name: "asc" } }],
          },
        },
      },
    },
  });
}

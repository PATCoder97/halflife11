import { prisma } from "@/lib/prisma";
import { deriveStandings } from "@/lib/scoring";
import { calculateSettlement } from "@/lib/settlement";
import { applyWaterDebts, applyWaterPayments } from "@/lib/water-balance";

export type ScoreScope =
  | { type: "ALL_TIME" }
  | { type: "SESSION"; sessionId: string };

export async function getStandings(scope: ScoreScope) {
  const [players, resultRows] = await Promise.all([
    prisma.player.findMany({
      where: scope.type === "SESSION"
        ? { gameSessions: { some: { gameSessionId: scope.sessionId } } }
        : undefined,
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.matchPlayer.findMany({
      where: {
        result: { not: null },
        ...(scope.type === "SESSION"
          ? { match: { gameSessionId: scope.sessionId } }
          : {}),
      },
      select: { matchId: true, playerId: true, result: true },
    }),
  ]);

  return deriveStandings(players, resultRows);
}

export async function getWaterData(scope: ScoreScope) {
  const [matchStandings, debts, payments] = await Promise.all([
    getStandings(scope),
    scope.type === "ALL_TIME"
      ? prisma.waterDebt.findMany({
          orderBy: { createdAt: "desc" },
          include: { fromPlayer: true, toPlayer: true },
        })
      : Promise.resolve([]),
    scope.type === "ALL_TIME"
      ? prisma.waterPayment.findMany({
          orderBy: { createdAt: "desc" },
          include: { fromPlayer: true, toPlayer: true },
        })
      : Promise.resolve([]),
  ]);
  const standings = applyWaterPayments(
    applyWaterDebts(matchStandings, debts),
    payments,
  );
  const settlement = calculateSettlement(
    standings.map((standing) => ({
      playerId: standing.playerId,
      balance: standing.points,
    })),
  );
  const names = new Map(standings.map((standing) => [standing.playerId, standing.name]));

  return {
    matchStandings,
    standings,
    settlement: settlement.map((transaction) => ({
      ...transaction,
      fromName: names.get(transaction.from) ?? transaction.from,
      toName: names.get(transaction.to) ?? transaction.to,
    })),
    payments: payments.slice(0, 50).map((payment) => ({
      id: payment.id,
      fromName: payment.fromPlayer.name,
      toName: payment.toPlayer.name,
      amount: payment.amount,
      createdAt: payment.createdAt,
    })),
    debts: debts.slice(0, 50).map((debt) => ({
      id: debt.id,
      fromName: debt.fromPlayer.name,
      toName: debt.toPlayer.name,
      amount: debt.amount,
      note: debt.note,
      createdAt: debt.createdAt,
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
      players: { include: { player: true } },
      weapons: { include: { weapon: true } },
      matches: {
        orderBy: { sequence: "asc" },
        include: {
          weapon: true,
          matchPlayers: {
            include: { player: true },
            orderBy: [{ team: "asc" }, { player: { name: "asc" } }],
          },
        },
      },
    },
  });
}

"use server";

import { MatchResult, Team } from "@prisma/client";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

import { authOptions, isAdminEmail } from "@/lib/auth";
import { resultForTeam, validateDoublesMatch } from "@/lib/match-validation";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    throw new Error("Bạn không có quyền thực hiện thao tác này");
  }
}

function requiredString(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Thiếu dữ liệu: ${key}`);
  }
  return value.trim();
}

function revalidateScoreViews(sessionId?: string) {
  revalidatePath("/");
  revalidatePath("/leaderboard");
  revalidatePath("/water");
  revalidatePath("/admin");
  if (sessionId) revalidatePath(`/sessions/${sessionId}`);
}

export async function createPlayer(formData: FormData) {
  await requireAdmin();
  const name = requiredString(formData, "name");
  await prisma.player.create({ data: { name } });
  revalidateScoreViews();
}

export async function createGameSession(formData: FormData) {
  await requireAdmin();
  const name = requiredString(formData, "name");

  await prisma.$transaction([
    prisma.gameSession.updateMany({
      where: { isCurrent: true },
      data: { isCurrent: false, endedAt: new Date() },
    }),
    prisma.gameSession.create({ data: { name, isCurrent: true } }),
  ]);
  revalidateScoreViews();
}

export async function recordMatch(formData: FormData) {
  await requireAdmin();
  const gameSessionId = requiredString(formData, "gameSessionId");
  const winner = requiredString(formData, "winner") as Team;
  if (winner !== Team.A && winner !== Team.B) throw new Error("Đội thắng không hợp lệ");

  const teamA = [
    requiredString(formData, "teamA1"),
    requiredString(formData, "teamA2"),
  ];
  const teamB = [
    requiredString(formData, "teamB1"),
    requiredString(formData, "teamB2"),
  ];
  validateDoublesMatch(teamA, teamB);

  await prisma.$transaction(async (tx) => {
    const [session, playerCount, lastMatch] = await Promise.all([
      tx.gameSession.findUnique({ where: { id: gameSessionId }, select: { id: true } }),
      tx.player.count({ where: { id: { in: [...teamA, ...teamB] } } }),
      tx.match.findFirst({
        where: { gameSessionId },
        orderBy: { sequence: "desc" },
        select: { sequence: true },
      }),
    ]);

    if (!session) throw new Error("Không tìm thấy session");
    if (playerCount !== 4) throw new Error("Có người chơi không tồn tại");

    await tx.match.create({
      data: {
        gameSessionId,
        sequence: (lastMatch?.sequence ?? 0) + 1,
        matchPlayers: {
          create: [
            ...teamA.map((playerId) => ({
              playerId,
              team: Team.A,
              result: resultForTeam("A", winner) as MatchResult,
            })),
            ...teamB.map((playerId) => ({
              playerId,
              team: Team.B,
              result: resultForTeam("B", winner) as MatchResult,
            })),
          ],
        },
      },
    });
  });

  revalidateScoreViews(gameSessionId);
}

export async function updateMatchResult(formData: FormData) {
  await requireAdmin();
  const matchId = requiredString(formData, "matchId");
  const winner = requiredString(formData, "winner") as Team;
  if (winner !== Team.A && winner !== Team.B) throw new Error("Đội thắng không hợp lệ");

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: { gameSessionId: true, matchPlayers: { select: { id: true, team: true } } },
  });
  if (!match || match.matchPlayers.length !== 4) throw new Error("Trận không hợp lệ");

  await prisma.$transaction(
    match.matchPlayers.map((player) =>
      prisma.matchPlayer.update({
        where: { id: player.id },
        data: { result: resultForTeam(player.team, winner) },
      }),
    ),
  );

  revalidateScoreViews(match.gameSessionId);
}

export async function deleteMatch(formData: FormData) {
  await requireAdmin();
  const matchId = requiredString(formData, "matchId");
  const match = await prisma.match.delete({
    where: { id: matchId },
    select: { gameSessionId: true },
  });
  revalidateScoreViews(match.gameSessionId);
}

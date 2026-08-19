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

function optionalString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
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

export async function togglePlayerActive(formData: FormData) {
  await requireAdmin();
  const playerId = requiredString(formData, "playerId");
  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) throw new Error("Không tìm thấy người chơi");
  await prisma.player.update({ where: { id: playerId }, data: { active: !player.active } });
  revalidateScoreViews();
}

export async function createWeapon(formData: FormData) {
  await requireAdmin();
  const name = requiredString(formData, "name");
  await prisma.weapon.create({ data: { name } });
  revalidateScoreViews();
}

export async function toggleWeaponActive(formData: FormData) {
  await requireAdmin();
  const weaponId = requiredString(formData, "weaponId");
  const weapon = await prisma.weapon.findUnique({ where: { id: weaponId } });
  if (!weapon) throw new Error("Không tìm thấy súng");
  await prisma.weapon.update({ where: { id: weaponId }, data: { active: !weapon.active } });
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

export async function closeCurrentSession() {
  await requireAdmin();
  await prisma.gameSession.updateMany({
    where: { isCurrent: true },
    data: { isCurrent: false, endedAt: new Date() },
  });
  revalidateScoreViews();
}

export async function setCurrentSession(formData: FormData) {
  await requireAdmin();
  const gameSessionId = requiredString(formData, "gameSessionId");

  await prisma.$transaction(async (tx) => {
    const target = await tx.gameSession.findUnique({ where: { id: gameSessionId } });
    if (!target) throw new Error("Không tìm thấy session");
    await tx.gameSession.updateMany({
      where: { isCurrent: true },
      data: { isCurrent: false, endedAt: new Date() },
    });
    await tx.gameSession.update({
      where: { id: gameSessionId },
      data: { isCurrent: true, endedAt: null },
    });
  });
  revalidateScoreViews(gameSessionId);
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
  const weapons = [
    optionalString(formData, "weaponA1"),
    optionalString(formData, "weaponA2"),
    optionalString(formData, "weaponB1"),
    optionalString(formData, "weaponB2"),
  ];
  validateDoublesMatch(teamA, teamB);

  await prisma.$transaction(async (tx) => {
    const selectedWeaponIds = weapons.filter((id): id is string => Boolean(id));
    const [session, playerCount, weaponCount, lastMatch] = await Promise.all([
      tx.gameSession.findUnique({ where: { id: gameSessionId }, select: { id: true } }),
      tx.player.count({ where: { id: { in: [...teamA, ...teamB] } } }),
      tx.weapon.count({ where: { id: { in: selectedWeaponIds }, active: true } }),
      tx.match.findFirst({
        where: { gameSessionId },
        orderBy: { sequence: "desc" },
        select: { sequence: true },
      }),
    ]);

    if (!session) throw new Error("Không tìm thấy session");
    if (playerCount !== 4) throw new Error("Có người chơi không tồn tại");
    if (weaponCount !== new Set(selectedWeaponIds).size) throw new Error("Có súng không tồn tại hoặc đã bị khóa");

    await tx.match.create({
      data: {
        gameSessionId,
        sequence: (lastMatch?.sequence ?? 0) + 1,
        matchPlayers: {
          create: [
            ...teamA.map((playerId, index) => ({
              playerId,
              weaponId: weapons[index],
              team: Team.A,
              result: resultForTeam("A", winner) as MatchResult,
            })),
            ...teamB.map((playerId, index) => ({
              playerId,
              weaponId: weapons[index + 2],
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

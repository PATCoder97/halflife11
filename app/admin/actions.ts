"use server";

import { Team } from "@prisma/client";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

import { authOptions, isAdminEmail } from "@/lib/auth";
import { generateShootingSchedule } from "@/lib/match-generator";
import { resultForTeam } from "@/lib/match-validation";
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
  revalidatePath("/admin/sessions");
  revalidatePath("/admin/sessions/history");
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
  const matchCount = Number(requiredString(formData, "matchCount"));
  const playerIds = [...new Set(formData.getAll("playerIds").filter(
    (value): value is string => typeof value === "string" && Boolean(value),
  ))];
  const weaponIds = [...new Set(formData.getAll("weaponIds").filter(
    (value): value is string => typeof value === "string" && Boolean(value),
  ))];

  if (!Number.isInteger(matchCount) || matchCount < 1 || matchCount > 100) {
    throw new Error("Số trận phải từ 1 đến 100");
  }
  if (playerIds.length < 4) throw new Error("Phải chọn ít nhất 4 người chơi");
  if (weaponIds.length < 1) throw new Error("Phải chọn ít nhất 1 súng");

  const [validPlayers, validWeapons] = await Promise.all([
    prisma.player.findMany({
      where: { id: { in: playerIds }, active: true },
      select: { id: true },
    }),
    prisma.weapon.findMany({
      where: { id: { in: weaponIds }, active: true },
      select: { id: true },
    }),
  ]);
  if (validPlayers.length !== playerIds.length) {
    throw new Error("Có người chơi không tồn tại hoặc đã bị khóa");
  }
  if (validWeapons.length !== weaponIds.length) {
    throw new Error("Có súng không tồn tại hoặc đã bị khóa");
  }

  const schedule = generateShootingSchedule(playerIds, weaponIds, matchCount);
  await prisma.$transaction(async (tx) => {
    await tx.gameSession.updateMany({
      where: { isCurrent: true },
      data: { isCurrent: false, endedAt: new Date() },
    });
    await tx.gameSession.create({
      data: {
        name,
        isCurrent: true,
        plannedMatchCount: matchCount,
        players: { create: playerIds.map((playerId) => ({ playerId })) },
        weapons: { create: weaponIds.map((weaponId) => ({ weaponId })) },
        matches: {
          create: schedule.map((match, index) => ({
            sequence: index + 1,
            weaponId: match.weaponId,
            matchPlayers: {
              create: [
                ...match.teamA.map((playerId) => ({ playerId, team: Team.A })),
                ...match.teamB.map((playerId) => ({ playerId, team: Team.B })),
              ],
            },
          })),
        },
      },
    });
  });
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

import { describe, expect, it } from "vitest";

import {
  generateBalancedMatches,
  generateDoublesRotations,
  generateShootingSchedule,
} from "@/lib/match-generator";
import { deriveStandings, type ScoreRow } from "@/lib/scoring";
import { formatShootingPeriodName } from "@/lib/session-name";
import { calculateSettlement } from "@/lib/settlement";

const players = ["A", "B", "C", "D"].map((id) => ({ id, name: id }));

function resultRows(matchId: string, winners: string[], losers: string[]): ScoreRow[] {
  return [
    ...winners.map((playerId) => ({ matchId, playerId, result: "WIN" as const })),
    ...losers.map((playerId) => ({ matchId, playerId, result: "LOSS" as const })),
  ];
}

describe("derived scoring", () => {
  it("produces the required three-match acceptance balance and settlement", () => {
    const rows = [
      ...resultRows("m1", ["A", "B"], ["C", "D"]),
      ...resultRows("m2", ["A", "C"], ["B", "D"]),
      ...resultRows("m3", ["A", "D"], ["B", "C"]),
    ];
    const standings = deriveStandings(players, rows);
    const balances = Object.fromEntries(standings.map((item) => [item.playerId, item.points]));
    const settlement = calculateSettlement(
      standings.map((item) => ({ playerId: item.playerId, balance: item.points })),
    );

    expect(balances).toEqual({ A: 3, B: -1, C: -1, D: -1 });
    expect(settlement).toEqual([
      { from: "B", to: "A", amount: 1 },
      { from: "C", to: "A", amount: 1 },
      { from: "D", to: "A", amount: 1 },
    ]);
  });

  it("recomputes an edited match without double counting", () => {
    const originalRows = resultRows("m1", ["A", "B"], ["C", "D"]);
    const editedRows = resultRows("m1", ["C", "D"], ["A", "B"]);

    const before = deriveStandings(players, originalRows);
    const after = deriveStandings(players, editedRows);

    expect(Object.fromEntries(before.map((item) => [item.playerId, item.points]))).toEqual({ A: 1, B: 1, C: -1, D: -1 });
    expect(Object.fromEntries(after.map((item) => [item.playerId, item.points]))).toEqual({ C: 1, D: 1, A: -1, B: -1 });
    expect(after.every((item) => item.matches === 1)).toBe(true);
  });

  it("does not score generated matches that are still pending", () => {
    const standings = deriveStandings(players, [
      { matchId: "pending", playerId: "A", result: null },
      { matchId: "pending", playerId: "B", result: null },
      { matchId: "pending", playerId: "C", result: null },
      { matchId: "pending", playerId: "D", result: null },
    ]);

    expect(standings.every((item) => item.points === 0 && item.matches === 0)).toBe(true);
    expect(calculateSettlement(
      standings.map((item) => ({ playerId: item.playerId, balance: item.points })),
    )).toEqual([]);
  });

  it("generates the three unique doubles rotations", () => {
    expect(generateDoublesRotations(["A", "B", "C", "D"])).toEqual([
      { teamA: ["A", "B"], teamB: ["C", "D"] },
      { teamA: ["A", "C"], teamB: ["B", "D"] },
      { teamA: ["A", "D"], teamB: ["B", "C"] },
    ]);
  });
});

function seededRandom(seed = 123456) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

describe("shooting schedule generator", () => {
  it("creates the requested number of valid four-player matches", () => {
    const schedule = generateBalancedMatches(
      ["A", "B", "C", "D", "E", "F"],
      12,
      seededRandom(),
    );

    expect(schedule).toHaveLength(12);
    schedule.forEach((match) => {
      expect(new Set([...match.teamA, ...match.teamB]).size).toBe(4);
      expect(match.teamA).toHaveLength(2);
      expect(match.teamB).toHaveLength(2);
    });

    const appearances = new Map<string, number>();
    schedule.flatMap((match) => [...match.teamA, ...match.teamB]).forEach((playerId) => {
      appearances.set(playerId, (appearances.get(playerId) ?? 0) + 1);
    });
    const counts = [...appearances.values()];
    expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
  });

  it("locks one selected weapon per match and distributes weapons evenly", () => {
    const weapons = ["AK-47", "AWP", "M4A1"];
    const schedule = generateShootingSchedule(
      ["A", "B", "C", "D", "E", "F"],
      weapons,
      11,
      seededRandom(9),
    );

    expect(schedule).toHaveLength(11);
    expect(schedule.every((match) => weapons.includes(match.weaponId))).toBe(true);
    const usage = weapons.map((weaponId) => schedule.filter((match) => match.weaponId === weaponId).length);
    expect(Math.max(...usage) - Math.min(...usage)).toBeLessThanOrEqual(1);
  });

  it("uses all three team rotations before repeating with four players", () => {
    const schedule = generateBalancedMatches(["A", "B", "C", "D"], 3, seededRandom(42));
    const teammatePairs = schedule.flatMap((match) => [
      [...match.teamA].sort().join("+"),
      [...match.teamB].sort().join("+"),
    ]);

    expect(new Set(teammatePairs).size).toBe(6);
  });

  it("does not pin the first player to Alpha", () => {
    const schedule = generateBalancedMatches(["A", "B", "C", "D"], 6, seededRandom(42));
    const alphaCounts = Object.fromEntries(
      ["A", "B", "C", "D"].map((playerId) => [
        playerId,
        schedule.filter((match) => match.teamA.includes(playerId)).length,
      ]),
    );

    expect(alphaCounts).toEqual({ A: 3, B: 3, C: 3, D: 3 });
    expect(schedule.some((match) => match.teamB.includes("A"))).toBe(true);
  });

  it("rejects an empty weapon pool", () => {
    expect(() => generateShootingSchedule(["A", "B", "C", "D"], [], 1)).toThrow(
      "Shooting schedule requires at least one weapon",
    );
  });
});

describe("shooting period name", () => {
  it("uses Vietnamese weekday, date, hour and minute", () => {
    expect(formatShootingPeriodName(new Date("2026-08-19T07:05:00.000Z"))).toBe(
      "Thứ Tư 19/08/2026 - 14:05",
    );
  });
});

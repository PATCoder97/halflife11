import { describe, expect, it } from "vitest";

import { generateDoublesRotations } from "@/lib/match-generator";
import { deriveStandings, type ScoreRow } from "@/lib/scoring";
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

  it("generates the three unique doubles rotations", () => {
    expect(generateDoublesRotations(["A", "B", "C", "D"])).toEqual([
      { teamA: ["A", "B"], teamB: ["C", "D"] },
      { teamA: ["A", "C"], teamB: ["B", "D"] },
      { teamA: ["A", "D"], teamB: ["B", "C"] },
    ]);
  });
});

import { describe, expect, it } from "vitest";

import { applySettlement, calculateSettlement } from "@/lib/settlement";

describe("calculateSettlement", () => {
  it("settles A +3, B -2, C -1", () => {
    const balances = [
      { playerId: "A", balance: 3 },
      { playerId: "B", balance: -2 },
      { playerId: "C", balance: -1 },
    ];

    const result = calculateSettlement(balances);

    expect(result).toEqual([
      { from: "B", to: "A", amount: 2 },
      { from: "C", to: "A", amount: 1 },
    ]);
    expect(result.reduce((sum, item) => sum + item.amount, 0)).toBe(3);
  });

  it("settles multiple creditors and debtors to zero", () => {
    const balances = [
      { playerId: "A", balance: 5 },
      { playerId: "B", balance: 2 },
      { playerId: "C", balance: -3 },
      { playerId: "D", balance: -4 },
    ];

    const result = calculateSettlement(balances);
    const finalBalances = applySettlement(balances, result);

    expect([...finalBalances.values()]).toEqual([0, 0, 0, 0]);
    expect(result.reduce((sum, item) => sum + item.amount, 0)).toBe(7);
  });

  it("returns an empty list for zero balances", () => {
    expect(
      calculateSettlement([
        { playerId: "A", balance: 0 },
        { playerId: "B", balance: 0 },
        { playerId: "C", balance: 0 },
      ]),
    ).toEqual([]);
  });

  it("rejects balances whose sum is not zero", () => {
    expect(() =>
      calculateSettlement([
        { playerId: "A", balance: 3 },
        { playerId: "B", balance: -1 },
      ]),
    ).toThrow("Settlement balances must sum to zero");
  });
});

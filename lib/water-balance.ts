import type { Standing } from "@/lib/scoring";

export type WaterPaymentInput = {
  fromPlayerId: string;
  toPlayerId: string;
  amount: number;
};

export function applyWaterPayments(
  standings: Standing[],
  payments: WaterPaymentInput[],
) {
  const balances = new Map(
    standings.map((standing) => [standing.playerId, { ...standing }]),
  );

  for (const payment of payments) {
    if (!Number.isInteger(payment.amount) || payment.amount <= 0) {
      throw new Error("Số lượng nước đã trả phải là số nguyên dương");
    }
    if (payment.fromPlayerId === payment.toPlayerId) {
      throw new Error("Người trả và người nhận phải khác nhau");
    }
    const from = balances.get(payment.fromPlayerId);
    const to = balances.get(payment.toPlayerId);
    if (!from || !to) throw new Error("Giao dịch có người chơi không tồn tại");

    // Paying water reduces both the debtor's debt and the creditor's receivable.
    from.points += payment.amount;
    to.points -= payment.amount;
  }

  return [...balances.values()].sort(
    (a, b) => b.points - a.points || a.name.localeCompare(b.name, "vi"),
  );
}

export function validateWaterPayment(
  standings: Standing[],
  payment: WaterPaymentInput,
) {
  if (!Number.isInteger(payment.amount) || payment.amount <= 0) {
    throw new Error("Số chai phải là số nguyên dương");
  }
  if (payment.fromPlayerId === payment.toPlayerId) {
    throw new Error("Người trả và người nhận phải khác nhau");
  }

  const from = standings.find((item) => item.playerId === payment.fromPlayerId);
  const to = standings.find((item) => item.playerId === payment.toPlayerId);
  if (!from || !to) throw new Error("Không tìm thấy người chơi");
  if (from.points >= 0) throw new Error("Người trả hiện không nợ nước");
  if (to.points <= 0) throw new Error("Người nhận hiện không có khoản được nhận");

  const maximum = Math.min(Math.abs(from.points), to.points);
  if (payment.amount > maximum) {
    throw new Error(`Chỉ có thể trả tối đa ${maximum} chai nước`);
  }
}

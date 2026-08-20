import type { Standing } from "@/lib/scoring";

export type WaterPaymentInput = {
  fromPlayerId: string;
  toPlayerId: string;
  amount: number;
};

export type WaterDebtInput = WaterPaymentInput;

function cloneBalances(standings: Standing[]) {
  return new Map(
    standings.map((standing) => [standing.playerId, { ...standing }]),
  );
}

function validateTransfer(
  balances: Map<string, Standing>,
  transfer: WaterPaymentInput,
  label: string,
) {
  if (!Number.isInteger(transfer.amount) || transfer.amount <= 0) {
    throw new Error(`${label} phải là số nguyên dương`);
  }
  if (transfer.fromPlayerId === transfer.toPlayerId) {
    throw new Error("Người nợ và người được nhận phải khác nhau");
  }

  const from = balances.get(transfer.fromPlayerId);
  const to = balances.get(transfer.toPlayerId);
  if (!from || !to) throw new Error("Giao dịch có người chơi không tồn tại");
  return { from, to };
}

function sortedBalances(balances: Map<string, Standing>) {
  return [...balances.values()].sort(
    (a, b) => b.points - a.points || a.name.localeCompare(b.name, "vi"),
  );
}

export function applyWaterDebts(
  standings: Standing[],
  debts: WaterDebtInput[],
) {
  const balances = cloneBalances(standings);

  for (const debt of debts) {
    const { from, to } = validateTransfer(balances, debt, "Số chai nợ");

    // A direct debt is an external result: the debtor owes more and the creditor receives more.
    from.points -= debt.amount;
    to.points += debt.amount;
  }

  return sortedBalances(balances);
}

export function applyWaterPayments(
  standings: Standing[],
  payments: WaterPaymentInput[],
) {
  const balances = cloneBalances(standings);

  for (const payment of payments) {
    const { from, to } = validateTransfer(balances, payment, "Số lượng nước đã trả");

    // Paying water reduces both the debtor's debt and the creditor's receivable.
    from.points += payment.amount;
    to.points -= payment.amount;
  }

  return sortedBalances(balances);
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

export type SettlementBalance = {
  playerId: string;
  balance: number;
};

export type SettlementTransaction = {
  from: string;
  to: string;
  amount: number;
};

type IndexedBalance = SettlementBalance & { index: number };

/**
 * Builds a deterministic, near-minimal settlement by matching the largest
 * debtors and creditors first. Input balances are never mutated.
 */
export function calculateSettlement(
  balances: SettlementBalance[],
): SettlementTransaction[] {
  for (const item of balances) {
    if (!Number.isSafeInteger(item.balance)) {
      throw new Error("Settlement balances must be safe integers");
    }
  }

  const total = balances.reduce((sum, item) => sum + item.balance, 0);
  if (total !== 0) {
    throw new Error("Settlement balances must sum to zero");
  }

  const byMagnitudeThenInput = (a: IndexedBalance, b: IndexedBalance) =>
    Math.abs(b.balance) - Math.abs(a.balance) || a.index - b.index;

  const debtors = balances
    .map((item, index) => ({ ...item, index }))
    .filter((item) => item.balance < 0)
    .sort(byMagnitudeThenInput)
    .map((item) => ({ ...item, remaining: -item.balance }));

  const creditors = balances
    .map((item, index) => ({ ...item, index }))
    .filter((item) => item.balance > 0)
    .sort(byMagnitudeThenInput)
    .map((item) => ({ ...item, remaining: item.balance }));

  const transactions: SettlementTransaction[] = [];
  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    const amount = Math.min(debtor.remaining, creditor.remaining);

    if (amount > 0) {
      transactions.push({
        from: debtor.playerId,
        to: creditor.playerId,
        amount,
      });
    }

    debtor.remaining -= amount;
    creditor.remaining -= amount;

    if (debtor.remaining === 0) debtorIndex += 1;
    if (creditor.remaining === 0) creditorIndex += 1;
  }

  if (debtorIndex !== debtors.length || creditorIndex !== creditors.length) {
    throw new Error("Settlement could not resolve all balances");
  }

  return transactions;
}

export function applySettlement(
  balances: SettlementBalance[],
  transactions: SettlementTransaction[],
) {
  const result = new Map(balances.map((item) => [item.playerId, item.balance]));

  for (const transaction of transactions) {
    result.set(transaction.from, (result.get(transaction.from) ?? 0) + transaction.amount);
    result.set(transaction.to, (result.get(transaction.to) ?? 0) - transaction.amount);
  }

  return result;
}

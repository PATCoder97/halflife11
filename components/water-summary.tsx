import { ArrowRight, CheckCircle2, Droplets } from "lucide-react";

import type { Standing } from "@/lib/scoring";
import type { SettlementTransaction } from "@/lib/settlement";
import { settlementSettings } from "@/lib/settings";
import { Card } from "@/components/ui/card";

type NamedTransaction = SettlementTransaction & {
  fromName: string;
  toName: string;
};

function signed(points: number) {
  return points > 0 ? `+${points}` : String(points);
}

export function WaterSummary({
  standings,
  settlement,
  compact = false,
}: {
  standings: Standing[];
  settlement: NamedTransaction[];
  compact?: boolean;
}) {
  const unitName = settlementSettings.unitName;
  const creditors = standings.filter((item) => item.points > 0);
  const debtors = standings.filter((item) => item.points < 0);
  const total = settlement.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="space-y-6">
      {!compact && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-leaf/50 bg-leaf/10 text-cream shadow-glow">
            <p className="mb-5 text-xs font-extrabold uppercase tracking-[0.18em] text-lime">Người được nhận</p>
            <div className="space-y-3">
              {creditors.map((item) => (
                <div key={item.playerId} className="flex items-center justify-between border-b border-leaf/20 pb-3 last:border-0">
                  <span className="font-bold">{item.name}</span>
                  <span className="font-serif text-2xl font-black">+{item.points} {unitName}</span>
                </div>
              ))}
              {creditors.length === 0 && <p className="text-concrete">Không có khoản phải nhận.</p>}
            </div>
          </Card>
          <Card className="border-rust/50 bg-rust/10 text-cream">
            <p className="mb-5 text-xs font-extrabold uppercase tracking-[0.18em] text-cream">Người đang nợ</p>
            <div className="space-y-3">
              {debtors.map((item) => (
                <div key={item.playerId} className="flex items-center justify-between border-b border-rust/20 pb-3 last:border-0">
                  <span className="font-bold">{item.name}</span>
                  <span className="font-serif text-2xl font-black">{signed(item.points)} {unitName}</span>
                </div>
              ))}
              {debtors.length === 0 && <p className="text-concrete">Không có khoản phải trả.</p>}
            </div>
          </Card>
        </div>
      )}

      <Card className={compact ? "shadow-none" : ""}>
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-leaf">Cần thanh toán</p>
            <h2 className="mt-1 font-serif text-2xl font-black">Ai trả ai?</h2>
          </div>
          <div className="hud-corners flex items-center gap-2 border border-leaf/30 bg-leaf/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-leaf">
            <Droplets className="h-4 w-4 text-leaf" /> Tổng {total} {unitName}
          </div>
        </div>
        <div className="overflow-x-auto">
          {settlement.length > 0 && (
            <div className="min-w-[540px]">
              <div className="grid grid-cols-[1fr_12rem_1fr] border-b border-leaf/40 text-[10px] font-bold uppercase tracking-[0.18em] text-concrete">
                <span className="px-3 py-4">Người trả</span>
                <span className="px-3 py-4 text-center">Số lượng</span>
                <span className="px-3 py-4 text-right">Người nhận</span>
              </div>
              {settlement.map((item, index) => (
                <div
                  key={`${item.from}-${item.to}-${index}`}
                  className="grid grid-cols-[1fr_12rem_1fr] items-center border-b border-cream/10 transition last:border-0 hover:bg-leaf/5"
                >
                  <span className="px-3 py-4 font-bold text-rust">{item.fromName}</span>
                  <span className="flex items-center justify-center gap-2 px-3 py-4 text-sm font-bold text-concrete">
                    {item.amount} {unitName} <ArrowRight className="h-4 w-4" />
                  </span>
                  <span className="px-3 py-4 text-right font-bold text-leaf">{item.toName}</span>
                </div>
              ))}
            </div>
          )}
          {settlement.length === 0 && (
            <div className="hud-corners flex items-center gap-3 border border-leaf/30 bg-leaf/10 p-5 font-bold text-leaf">
              <CheckCircle2 className="h-5 w-5" /> Tất cả đã cân bằng.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

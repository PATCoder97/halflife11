import { Droplets, History } from "lucide-react";
import { getServerSession } from "next-auth";

import { BalanceTable } from "@/components/balance-table";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { WaterSummary } from "@/components/water-summary";
import { WaterPaymentForm } from "@/components/water-payment-form";
import { authOptions, isAdminEmail } from "@/lib/auth";
import { getWaterData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const [water, authSession] = await Promise.all([
    getWaterData({ type: "ALL_TIME" }),
    getServerSession(authOptions),
  ]);
  const isAdmin = isAdminEmail(authSession?.user?.email);
  const debtors = water.standings.filter((item) => item.points < 0);
  const creditors = water.standings.filter((item) => item.points > 0);

  return (
    <div className="space-y-10">
      <div>
        <Badge>All-time</Badge>
        <h1 className="mt-4 font-serif text-5xl font-black">Xếp hạng & tiền nước</h1>
        <p className="mt-2 text-concrete">Điểm, thắng thua và nghĩa vụ tiền nước trong toàn bộ lịch sử.</p>
      </div>

      <section>
        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-leaf">Combat ranking</p>
        <h2 className="mb-4 font-serif text-3xl font-black">Bảng xếp hạng</h2>
        <Card><LeaderboardTable standings={water.matchStandings} /></Card>
      </section>

      <section id="water" className="scroll-mt-28">
        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-leaf">1 điểm = 1 chai nước // all-time</p>
        <h2 className="mb-4 font-serif text-3xl font-black">Tiền nước</h2>
        <div className="space-y-5">
          <Card>
            <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.18em] text-leaf">Tổng điểm</p>
            <h3 className="mb-5 font-serif text-2xl font-black">Toàn bộ lịch sử</h3>
            <BalanceTable standings={water.standings} />
          </Card>
          {isAdmin && (
            <Card className="border-leaf/30 bg-leaf/5">
              <div className="flex items-center gap-3">
                <Droplets className="h-6 w-6 text-leaf" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-leaf">Admin payment terminal</p>
                  <h3 className="font-serif text-2xl font-black">Ghi nhận đã trả nước</h3>
                </div>
              </div>
              {debtors.length > 0 && creditors.length > 0 ? (
                <WaterPaymentForm debtors={debtors} creditors={creditors} />
              ) : (
                <p className="mt-4 text-sm text-concrete">Không có khoản nợ phù hợp để ghi nhận thanh toán.</p>
              )}
            </Card>
          )}
          <WaterSummary standings={water.standings} settlement={water.settlement} compact />
          {water.payments.length > 0 && (
            <Card>
              <div className="mb-5 flex items-center gap-3">
                <History className="h-5 w-5 text-leaf" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-leaf">Payment ledger</p>
                  <h3 className="font-serif text-2xl font-black">Lịch sử trả nước</h3>
                </div>
              </div>
              <div className="divide-y divide-cream/10">
                {water.payments.map((payment) => (
                  <div key={payment.id} className="grid gap-2 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
                    <p className="font-bold">
                      <span className="text-rust">{payment.fromName}</span>
                      <span className="mx-2 text-concrete">đã trả</span>
                      <span className="text-leaf">{payment.toName}</span>
                      <span className="ml-2">{payment.amount} chai nước</span>
                    </p>
                    <time className="text-[9px] font-bold uppercase tracking-wider text-concrete">
                      {new Intl.DateTimeFormat("vi-VN", {
                        dateStyle: "short",
                        timeStyle: "short",
                        timeZone: "Asia/Ho_Chi_Minh",
                      }).format(payment.createdAt)}
                    </time>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}

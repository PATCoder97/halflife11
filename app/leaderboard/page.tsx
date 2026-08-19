import { BalanceTable } from "@/components/balance-table";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { WaterSummary } from "@/components/water-summary";
import { getWaterData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const water = await getWaterData({ type: "ALL_TIME" });

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
        <Card><LeaderboardTable standings={water.standings} /></Card>
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
          <WaterSummary standings={water.standings} settlement={water.settlement} compact />
        </div>
      </section>
    </div>
  );
}

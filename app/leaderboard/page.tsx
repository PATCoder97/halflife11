import { LeaderboardTable } from "@/components/leaderboard-table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getStandings } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const standings = await getStandings({ type: "ALL_TIME" });

  return (
    <div className="space-y-7">
      <div>
        <Badge>All-time</Badge>
        <h1 className="mt-4 font-serif text-5xl font-black">Bảng xếp hạng</h1>
        <p className="mt-2 text-ink/65">Điểm, thắng thua và tỷ lệ thắng trong toàn bộ lịch sử.</p>
      </div>
      <Card><LeaderboardTable standings={standings} /></Card>
    </div>
  );
}

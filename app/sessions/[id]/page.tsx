import { notFound } from "next/navigation";

import { LeaderboardTable } from "@/components/leaderboard-table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { WaterSummary } from "@/components/water-summary";
import { getSession, getStandings, getWaterData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [session, standings, water] = await Promise.all([
    getSession(id),
    getStandings({ type: "SESSION", sessionId: id }),
    getWaterData({ type: "SESSION", sessionId: id }),
  ]);
  if (!session) notFound();

  return (
    <div className="space-y-9">
      <div>
        <Badge>{session.isCurrent ? "Current session" : "Session"}</Badge>
        <h1 className="mt-4 font-serif text-5xl font-black">{session.name}</h1>
        <p className="mt-2 text-ink/60">{session.matches.length} trận đã ghi nhận</p>
      </div>

      <section>
        <h2 className="mb-4 font-serif text-3xl font-black">Bảng điểm</h2>
        <Card><LeaderboardTable standings={standings} /></Card>
      </section>

      <section>
        <h2 className="mb-4 font-serif text-3xl font-black">Tiền nước hiện tại</h2>
        <WaterSummary standings={water.standings} settlement={water.settlement} compact />
      </section>

      <section>
        <h2 className="mb-4 font-serif text-3xl font-black">Lịch sử trận</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {session.matches.map((match) => {
            const teamA = match.matchPlayers.filter((item) => item.team === "A");
            const teamB = match.matchPlayers.filter((item) => item.team === "B");
            return (
              <Card key={match.id} className="shadow-none">
                <p className="mb-4 text-xs font-black uppercase tracking-[0.16em] text-ink/45">Kèo {match.sequence}</p>
                <div className={`rounded-2xl p-4 ${teamA[0]?.result === "WIN" ? "bg-leaf text-white" : "bg-cream"}`}>
                  <span className="font-black">{teamA.map((item) => item.player.name).join(" + ")}</span>
                  <span className="float-right text-xs font-black">{teamA[0]?.result === "WIN" ? "WIN" : "LOSS"}</span>
                </div>
                <p className="py-2 text-center text-xs font-black text-ink/35">VS</p>
                <div className={`rounded-2xl p-4 ${teamB[0]?.result === "WIN" ? "bg-leaf text-white" : "bg-cream"}`}>
                  <span className="font-black">{teamB.map((item) => item.player.name).join(" + ")}</span>
                  <span className="float-right text-xs font-black">{teamB[0]?.result === "WIN" ? "WIN" : "LOSS"}</span>
                </div>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}

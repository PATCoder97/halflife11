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
        <p className="mt-2 text-concrete">
          {session.plannedMatchCount} trận // {session.players.length} người // {session.weapons.length} súng
        </p>
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
            const pending = match.matchPlayers.some((item) => item.result === null);
            return (
              <Card key={match.id} className="shadow-none">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-concrete">Encounter // {String(match.sequence).padStart(2, "0")}</p>
                  <p className="text-xs font-black uppercase tracking-wider text-leaf">{match.weapon?.name ?? "Chưa gán súng"}</p>
                </div>
                <div className={`hud-corners border border-l-2 p-4 ${teamA[0]?.result === "WIN" ? "border-leaf/20 border-l-leaf bg-leaf/15 text-leaf" : "border-cream/10 border-l-cream/20 bg-black/30 text-concrete"}`}>
                  <span className="font-black">{teamA.map((item) => item.player.name).join(" + ")}</span>
                  <span className="float-right text-xs font-black">{pending ? "PENDING" : teamA[0]?.result}</span>
                </div>
                <p className="py-2 text-center text-[10px] font-black tracking-[0.25em] text-rust">VERSUS</p>
                <div className={`hud-corners border border-l-2 p-4 ${teamB[0]?.result === "WIN" ? "border-leaf/20 border-l-leaf bg-leaf/15 text-leaf" : "border-cream/10 border-l-cream/20 bg-black/30 text-concrete"}`}>
                  <span className="font-black">{teamB.map((item) => item.player.name).join(" + ")}</span>
                  <span className="float-right text-xs font-black">{pending ? "PENDING" : teamB[0]?.result}</span>
                </div>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}

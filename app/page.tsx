import { ArrowRight, Crosshair, Radio } from "lucide-react";
import Link from "next/link";

import { BalanceTable } from "@/components/balance-table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { WaterSummary } from "@/components/water-summary";
import { getCurrentSession, getSession, getWaterData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const current = await getCurrentSession();

  if (!current) {
    return (
      <Card className="mx-auto max-w-2xl py-16 text-center">
        <Badge>Chưa bắt đầu</Badge>
        <h1 className="mt-5 font-serif text-4xl font-black">Chưa có buổi đấu nào</h1>
        <p className="mx-auto mt-3 max-w-md text-concrete">
          Admin đăng nhập để tạo người chơi, mở kỳ bắn và sinh lịch trận đầu tiên.
        </p>
        <Link href="/admin/sessions" className="mt-7 inline-flex items-center gap-2 font-black text-leaf">
          Tạo kỳ bắn <ArrowRight className="h-4 w-4" />
        </Link>
      </Card>
    );
  }

  const [session, water] = await Promise.all([
    getSession(current.id),
    getWaterData({ type: "SESSION", sessionId: current.id }),
  ]);
  if (!session) return null;

  const completedMatches = session.matches.filter(
    (match) => match.matchPlayers.length === 4 && match.matchPlayers.every((item) => item.result !== null),
  ).length;

  return (
    <div className="space-y-8">
      <header className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <Badge><Radio className="mr-2 inline h-3 w-3" /> Kỳ hiện tại</Badge>
          <h1 className="mt-3 font-serif text-5xl font-bold uppercase leading-none sm:text-6xl">{session.name}</h1>
        </div>
        <div className="hud-corners grid grid-cols-3 border border-cream/10 bg-panel text-center">
          {[
            ["Tiến độ", `${completedMatches}/${session.plannedMatchCount}`],
            ["Người", String(session.players.length)],
            ["Súng", String(session.weapons.length)],
          ].map(([label, value]) => (
            <div key={label} className="border-r border-cream/10 px-5 py-3 last:border-0">
              <p className="font-serif text-2xl font-bold text-leaf">{value}</p>
              <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-concrete">{label}</p>
            </div>
          ))}
        </div>
      </header>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-leaf">Generated match terminal</p>
            <h2 className="mt-1 font-serif text-3xl font-black">Các trận bắn</h2>
          </div>
          <span className="text-[9px] font-bold uppercase tracking-wider text-concrete">Ưu tiên theo thứ tự trận</span>
        </div>

        <Card className="p-3 sm:p-4">
          <div className="space-y-2">
            {session.matches.map((match) => {
              const teamA = match.matchPlayers.filter((item) => item.team === "A");
              const teamB = match.matchPlayers.filter((item) => item.team === "B");
              const pending = match.matchPlayers.some((item) => item.result === null);
              const winner = pending ? null : teamA[0]?.result === "WIN" ? "A" : "B";

              return (
                <article
                  key={match.id}
                  className={`hud-corners grid gap-3 border p-3 md:grid-cols-[7rem_1fr_8rem] md:items-center ${pending ? "border-leaf/30 bg-leaf/5" : "border-cream/10 bg-black/20"}`}
                >
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-[0.18em] text-concrete">Trận {String(match.sequence).padStart(2, "0")}</p>
                    <p className="mt-1 flex items-center gap-2 text-sm font-black text-leaf">
                      <Crosshair className="h-4 w-4" /> {match.weapon?.name ?? "Chưa gán súng"}
                    </p>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                    <div className={`hud-corners border px-3 py-2 ${winner === "A" ? "border-leaf/40 bg-leaf/10 text-leaf" : "border-cream/10 bg-black/20"}`}>
                      <span className="text-[8px] font-black uppercase tracking-wider text-concrete">Alpha</span>
                      <p className="font-bold">{teamA.map((item) => item.player.name).join(" + ")}</p>
                    </div>
                    <span className="text-center font-serif font-black text-rust">VS</span>
                    <div className={`hud-corners border px-3 py-2 ${winner === "B" ? "border-leaf/40 bg-leaf/10 text-leaf" : "border-cream/10 bg-black/20"}`}>
                      <span className="text-[8px] font-black uppercase tracking-wider text-concrete">Bravo</span>
                      <p className="font-bold">{teamB.map((item) => item.player.name).join(" + ")}</p>
                    </div>
                  </div>

                  <p className={`text-right text-[9px] font-black uppercase tracking-[0.16em] ${pending ? "text-rust" : "text-leaf"}`}>
                    {pending ? "Chờ kết quả" : `${winner === "A" ? "Alpha" : "Bravo"} thắng`}
                  </p>
                </article>
              );
            })}
            {session.matches.length === 0 && (
              <p className="hud-corners border border-rust/20 bg-rust/5 p-5 text-center text-concrete">Kỳ bắn chưa có trận nào.</p>
            )}
          </div>
        </Card>
      </section>

      <section className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
        <Card>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-leaf">Current score</p>
          <h2 className="mb-4 mt-1 font-serif text-3xl font-black">Bảng điểm</h2>
          <BalanceTable standings={water.standings} />
        </Card>
        <WaterSummary standings={water.standings} settlement={water.settlement} compact />
      </section>
    </div>
  );
}

import Link from "next/link";

import { BalanceTable } from "@/components/balance-table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { WaterSummary } from "@/components/water-summary";
import { getCurrentSession, getWaterData } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ scope?: string; sessionId?: string }> };

export default async function WaterPage({ searchParams }: Props) {
  const params = await searchParams;
  const sessions = await prisma.gameSession.findMany({ orderBy: { startedAt: "desc" } });
  const current = await getCurrentSession();
  const selectedSessionId = params.sessionId ?? current?.id ?? sessions[0]?.id;
  const allTime = params.scope === "all" || !selectedSessionId;
  const scope = allTime
    ? ({ type: "ALL_TIME" } as const)
    : ({ type: "SESSION", sessionId: selectedSessionId } as const);
  const water = await getWaterData(scope);
  const selectedSession = sessions.find((session) => session.id === selectedSessionId);

  return (
    <div className="space-y-8">
      <div>
        <Badge>1 điểm = 1 chai</Badge>
        <h1 className="mt-4 font-serif text-5xl font-black">Tiền nước</h1>
        <p className="mt-2 max-w-2xl text-concrete">
          Balance được tính trực tiếp từ kết quả trận. Không có cột điểm hay nợ nước chỉnh tay.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href={selectedSessionId ? `/water?sessionId=${selectedSessionId}` : "/water"}
          className={cn("hud-corners border px-5 py-2.5 text-xs font-black uppercase tracking-wider", !allTime ? "border-leaf bg-leaf text-ink" : "border-cream/15 bg-panel text-concrete")}
        >
          Current session
        </Link>
        <Link
          href="/water?scope=all"
          className={cn("hud-corners border px-5 py-2.5 text-xs font-black uppercase tracking-wider", allTime ? "border-leaf bg-leaf text-ink" : "border-cream/15 bg-panel text-concrete")}
        >
          All-time
        </Link>
        {!allTime && sessions.length > 1 && (
          <details className="relative">
            <summary className="hud-corners cursor-pointer list-none border border-cream/15 bg-panel px-5 py-2.5 text-xs font-black uppercase tracking-wider text-concrete">
              {selectedSession?.name ?? "Chọn session"}
            </summary>
            <div className="hud-corners absolute left-0 top-12 z-20 min-w-64 border border-leaf/30 bg-panel p-2 shadow-card">
              {sessions.map((session) => (
                <Link key={session.id} href={`/water?sessionId=${session.id}`} className="block border-b border-cream/10 px-4 py-3 text-xs font-bold uppercase tracking-wider hover:bg-leaf hover:text-ink">
                  {session.name}
                </Link>
              ))}
            </div>
          </details>
        )}
      </div>

      <Card>
        <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.18em] text-leaf">Tổng điểm</p>
        <h2 className="mb-5 font-serif text-2xl font-black">{allTime ? "Toàn bộ lịch sử" : selectedSession?.name}</h2>
        <BalanceTable standings={water.standings} />
      </Card>

      <WaterSummary standings={water.standings} settlement={water.settlement} />
    </div>
  );
}

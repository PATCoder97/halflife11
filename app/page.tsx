import { ArrowRight, CalendarDays } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { WaterSummary } from "@/components/water-summary";
import { getCurrentSession, getWaterData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const currentSession = await getCurrentSession();

  if (!currentSession) {
    return (
      <Card className="mx-auto max-w-2xl py-16 text-center">
        <Badge>Chưa bắt đầu</Badge>
        <h1 className="mt-5 font-serif text-4xl font-black">Chưa có buổi đấu nào</h1>
        <p className="mx-auto mt-3 max-w-md text-concrete">
          Admin đăng nhập để tạo người chơi, mở session và nhập kết quả trận đầu tiên.
        </p>
        <Link href="/admin" className="mt-7 inline-flex items-center gap-2 font-black text-leaf">
          Đi tới quản trị <ArrowRight className="h-4 w-4" />
        </Link>
      </Card>
    );
  }

  const water = await getWaterData({ type: "SESSION", sessionId: currentSession.id });

  return (
    <div className="space-y-8">
      <section className="grid items-end gap-6 lg:grid-cols-[1.3fr_.7fr]">
        <div>
          <Badge>Current session</Badge>
          <h1 className="mt-4 max-w-3xl font-serif text-6xl font-bold uppercase leading-[0.86] tracking-[0.01em] sm:text-8xl">
            Điểm số<br /><span className="text-leaf">không biết nói dối.</span>
          </h1>
        </div>
        <Card className="border-leaf/40 bg-panel text-cream shadow-glow">
          <CalendarDays className="mb-5 h-8 w-8 text-lime" />
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-concrete">Active operation</p>
          <h2 className="mt-2 font-serif text-3xl font-black">{currentSession.name}</h2>
          <p className="mt-3 text-concrete">
            {new Intl.DateTimeFormat("vi-VN", { dateStyle: "full" }).format(currentSession.startedAt)}
          </p>
          <Link href={`/sessions/${currentSession.id}`} className="mt-6 inline-flex items-center gap-2 font-black text-lime">
            Xem toàn bộ session <ArrowRight className="h-4 w-4" />
          </Link>
        </Card>
      </section>

      <WaterSummary standings={water.standings} settlement={water.settlement} compact />
    </div>
  );
}

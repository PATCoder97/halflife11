import { CalendarDays, Crosshair, History, UsersRound } from "lucide-react";
import { getServerSession } from "next-auth";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { authOptions, isAdminEmail } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { setCurrentSession } from "../../actions";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

export default async function SessionHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const authSession = await getServerSession(authOptions);
  if (!isAdminEmail(authSession?.user?.email)) {
    return (
      <Card className="mx-auto max-w-xl py-14 text-center">
        <Badge>Restricted</Badge>
        <h1 className="mt-4 font-serif text-4xl font-black">Khu vực quản trị</h1>
        <p className="mt-3 text-concrete">Chỉ quản trị viên được xem lịch sử kỳ bắn.</p>
        <Link href="/login" className="hud-corners mt-7 inline-flex border border-leaf bg-leaf px-6 py-3 text-xs font-black uppercase tracking-wider text-ink">Đăng nhập</Link>
      </Card>
    );
  }

  const requestedPage = Number((await searchParams).page ?? "1");
  const totalSessions = await prisma.gameSession.count();
  const totalPages = Math.max(1, Math.ceil(totalSessions / PAGE_SIZE));
  const page = Math.min(
    totalPages,
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1,
  );
  const sessions = await prisma.gameSession.findMany({
    orderBy: { startedAt: "desc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    include: {
      _count: { select: { matches: true, players: true, weapons: true } },
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <Badge>Session archive</Badge>
          <h1 className="mt-4 font-serif text-6xl font-bold uppercase leading-none">Lịch sử</h1>
          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-concrete">{totalSessions} kỳ bắn đã lưu // trang {page}/{totalPages}</p>
        </div>
        <Link href="/admin/sessions" className="hud-corners border border-leaf/40 px-5 py-3 text-[10px] font-black uppercase tracking-wider text-leaf hover:bg-leaf hover:text-ink">Tạo kỳ bắn mới</Link>
      </div>

      <Card>
        <div className="flex items-center gap-3">
          <History className="h-6 w-6 text-leaf" />
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.24em] text-leaf">Persistent archive</p>
            <h2 className="font-serif text-3xl font-bold uppercase">Danh sách kỳ bắn</h2>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {sessions.map((session) => (
            <article key={session.id} className={`hud-corners grid gap-4 border p-4 md:grid-cols-[1fr_auto] md:items-center ${session.isCurrent ? "border-leaf/50 bg-leaf/5" : "border-cream/10 bg-black/20"}`}>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <Link href={`/sessions/${session.id}`} className="truncate font-serif text-2xl font-bold uppercase hover:text-leaf">{session.name}</Link>
                  <span className={`text-[8px] font-black uppercase tracking-[0.18em] ${session.isCurrent ? "text-leaf" : session.endedAt ? "text-concrete" : "text-rust"}`}>
                    {session.isCurrent ? "● đang hoạt động" : session.endedAt ? "đã đóng" : "chờ"}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[9px] font-bold uppercase tracking-wider text-concrete">
                  <span className="flex items-center gap-2"><CalendarDays className="h-3.5 w-3.5 text-leaf" />{formatDate(session.startedAt)}</span>
                  <span className="flex items-center gap-2"><UsersRound className="h-3.5 w-3.5 text-leaf" />{session._count.players} người</span>
                  <span className="flex items-center gap-2"><Crosshair className="h-3.5 w-3.5 text-leaf" />{session._count.weapons} súng</span>
                  <span>{session._count.matches}/{session.plannedMatchCount || session._count.matches} trận</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 md:justify-end">
                <Link href={`/sessions/${session.id}`} className="hud-corners border border-cream/15 px-4 py-2 text-[9px] font-black uppercase tracking-wider text-concrete hover:border-leaf hover:text-leaf">Xem</Link>
                {!session.isCurrent && (
                  <form action={setCurrentSession}>
                    <input type="hidden" name="gameSessionId" value={session.id} />
                    <Button className="min-h-8 border-cream/15 bg-transparent px-4 py-2 text-[9px] text-concrete shadow-none hover:border-leaf hover:bg-leaf/10 hover:text-leaf">Kích hoạt</Button>
                  </form>
                )}
              </div>
            </article>
          ))}
          {sessions.length === 0 && (
            <div className="hud-corners border border-rust/20 bg-rust/5 p-8 text-center text-concrete">Chưa có kỳ bắn nào được lưu.</div>
          )}
        </div>

        {totalPages > 1 && (
          <nav className="mt-6 flex items-center justify-between border-t border-cream/10 pt-5">
            {page > 1 ? (
              <Link href={`/admin/sessions/history?page=${page - 1}`} className="hud-corners border border-cream/15 px-4 py-2 text-[9px] font-black uppercase tracking-wider text-concrete hover:border-leaf hover:text-leaf">← Trang trước</Link>
            ) : <span />}
            <span className="text-[9px] font-black uppercase tracking-[0.18em] text-concrete">{page} / {totalPages}</span>
            {page < totalPages ? (
              <Link href={`/admin/sessions/history?page=${page + 1}`} className="hud-corners border border-cream/15 px-4 py-2 text-[9px] font-black uppercase tracking-wider text-concrete hover:border-leaf hover:text-leaf">Trang sau →</Link>
            ) : <span />}
          </nav>
        )}
      </Card>
    </div>
  );
}

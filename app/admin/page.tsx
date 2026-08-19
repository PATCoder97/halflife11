import { getServerSession } from "next-auth";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { authOptions, isAdminEmail } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import {
  createGameSession,
  createPlayer,
  deleteMatch,
  recordMatch,
  updateMatchResult,
} from "./actions";

export const dynamic = "force-dynamic";

const inputClass =
  "min-h-11 w-full rounded-xl border border-ink/15 bg-cream/55 px-4 outline-none transition focus:border-leaf focus:ring-2 focus:ring-leaf/15";

export default async function AdminPage() {
  const authSession = await getServerSession(authOptions);
  if (!isAdminEmail(authSession?.user?.email)) {
    return (
      <Card className="mx-auto max-w-xl py-14 text-center">
        <Badge>Restricted</Badge>
        <h1 className="mt-4 font-serif text-4xl font-black">Khu vực quản trị</h1>
        <p className="mt-3 text-ink/60">Đăng nhập bằng Google với email admin để nhập hoặc sửa kết quả.</p>
        <Link href="/login" className="mt-7 inline-flex rounded-full bg-ink px-6 py-3 font-black text-cream">Đăng nhập</Link>
      </Card>
    );
  }

  const [players, currentSession, sessions] = await Promise.all([
    prisma.player.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.gameSession.findFirst({
      where: { isCurrent: true },
      include: {
        matches: {
          orderBy: { sequence: "desc" },
          include: { matchPlayers: { include: { player: true } } },
        },
      },
    }),
    prisma.gameSession.findMany({ orderBy: { startedAt: "desc" }, take: 10 }),
  ]);

  const playerSelect = (name: string) => (
    <select name={name} className={inputClass} required defaultValue="">
      <option value="" disabled>Chọn người chơi</option>
      {players.map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}
    </select>
  );

  return (
    <div className="space-y-8">
      <div>
        <Badge>Admin</Badge>
        <h1 className="mt-4 font-serif text-5xl font-black">Bàn điều khiển</h1>
        <p className="mt-2 text-ink/60">Đang đăng nhập: {authSession?.user?.email}</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="font-serif text-2xl font-black">Thêm người chơi</h2>
          <form action={createPlayer} className="mt-5 flex gap-3">
            <input name="name" placeholder="Tên người chơi" className={inputClass} required />
            <Button type="submit" className="shrink-0">Thêm</Button>
          </form>
        </Card>

        <Card>
          <h2 className="font-serif text-2xl font-black">Mở session mới</h2>
          <p className="mt-1 text-sm text-ink/55">Session hiện tại sẽ tự đóng.</p>
          <form action={createGameSession} className="mt-5 flex gap-3">
            <input name="name" placeholder="HL tối thứ 7" className={inputClass} required />
            <Button type="submit" className="shrink-0">Mở</Button>
          </form>
        </Card>
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-leaf">Nhập kết quả</p>
            <h2 className="mt-1 font-serif text-3xl font-black">{currentSession?.name ?? "Chưa có session hiện tại"}</h2>
          </div>
          {currentSession && <Link className="font-black text-leaf" href={`/sessions/${currentSession.id}`}>Xem public page</Link>}
        </div>

        {currentSession ? (
          <form action={recordMatch} className="mt-7 space-y-5">
            <input type="hidden" name="gameSessionId" value={currentSession.id} />
            <div className="grid gap-5 md:grid-cols-[1fr_auto_1fr] md:items-center">
              <fieldset className="space-y-3 rounded-2xl bg-lime/25 p-5">
                <legend className="px-2 font-black">Đội A</legend>
                {playerSelect("teamA1")}
                {playerSelect("teamA2")}
              </fieldset>
              <span className="text-center font-serif text-xl font-black text-ink/35">VS</span>
              <fieldset className="space-y-3 rounded-2xl bg-rust/10 p-5">
                <legend className="px-2 font-black">Đội B</legend>
                {playerSelect("teamB1")}
                {playerSelect("teamB2")}
              </fieldset>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <label className="font-bold">Đội thắng</label>
              <label className="flex items-center gap-2"><input type="radio" name="winner" value="A" defaultChecked /> Đội A</label>
              <label className="flex items-center gap-2"><input type="radio" name="winner" value="B" /> Đội B</label>
              <Button type="submit" className="sm:ml-auto">Lưu kết quả</Button>
            </div>
          </form>
        ) : (
          <p className="mt-6 rounded-2xl bg-cream p-5 font-bold text-ink/60">Tạo session trước khi nhập kết quả.</p>
        )}
      </Card>

      {currentSession && currentSession.matches.length > 0 && (
        <Card>
          <h2 className="font-serif text-3xl font-black">Sửa kết quả gần đây</h2>
          <div className="mt-5 space-y-3">
            {currentSession.matches.map((match) => {
              const teamA = match.matchPlayers.filter((item) => item.team === "A");
              const teamB = match.matchPlayers.filter((item) => item.team === "B");
              const winner = teamA[0]?.result === "WIN" ? "A" : "B";
              return (
                <div key={match.id} className="flex flex-col gap-3 rounded-2xl border border-ink/10 p-4 md:flex-row md:items-center">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-ink/40">Kèo {match.sequence}</p>
                    <p className="mt-1 font-bold">
                      {teamA.map((item) => item.player.name).join(" + ")} <span className="text-ink/35">vs</span> {teamB.map((item) => item.player.name).join(" + ")}
                    </p>
                  </div>
                  <form action={updateMatchResult} className="flex items-center gap-2">
                    <input type="hidden" name="matchId" value={match.id} />
                    <select name="winner" className={inputClass} defaultValue={winner}>
                      <option value="A">Đội A thắng</option>
                      <option value="B">Đội B thắng</option>
                    </select>
                    <Button type="submit">Cập nhật</Button>
                  </form>
                  <form action={deleteMatch}>
                    <input type="hidden" name="matchId" value={match.id} />
                    <Button type="submit" className="bg-rust hover:bg-rust/85">Xóa</Button>
                  </form>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Card>
        <h2 className="font-serif text-2xl font-black">Các session gần đây</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {sessions.map((session) => (
            <Link key={session.id} href={`/sessions/${session.id}`} className="rounded-full bg-cream px-4 py-2 font-bold">
              {session.name}{session.isCurrent ? " · current" : ""}
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}

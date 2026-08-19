import { Crosshair, Radio, Swords } from "lucide-react";
import { getServerSession } from "next-auth";
import Link from "next/link";

import { PerfectScroll } from "@/components/perfect-scroll";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { authOptions, isAdminEmail } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import {
  closeCurrentSession,
  createGameSession,
  updateMatchResult,
} from "../actions";

export const dynamic = "force-dynamic";

const inputClass =
  "hud-corners min-h-11 w-full border border-cream/15 bg-black/35 px-4 text-sm text-cream outline-none transition placeholder:text-concrete/50 focus:border-leaf focus:ring-1 focus:ring-leaf/30";

const tinyButton =
  "min-h-8 border-cream/15 bg-transparent px-3 py-1 text-[9px] text-concrete shadow-none hover:border-leaf hover:bg-leaf/10 hover:text-leaf";

export default async function SessionManagementPage() {
  const authSession = await getServerSession(authOptions);
  if (!isAdminEmail(authSession?.user?.email)) {
    return (
      <Card className="mx-auto max-w-xl py-14 text-center">
        <Badge>Restricted</Badge>
        <h1 className="mt-4 font-serif text-4xl font-black">Khu vực quản trị</h1>
        <p className="mt-3 text-concrete">Chỉ quản trị viên được quản lý kỳ bắn.</p>
        <Link href="/login" className="hud-corners mt-7 inline-flex border border-leaf bg-leaf px-6 py-3 text-xs font-black uppercase tracking-wider text-ink">Đăng nhập</Link>
      </Card>
    );
  }

  const [players, weapons, currentSession] = await Promise.all([
    prisma.player.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.weapon.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.gameSession.findFirst({
      where: { isCurrent: true },
      include: {
        players: { include: { player: true } },
        weapons: { include: { weapon: true } },
        matches: {
          orderBy: { sequence: "asc" },
          include: {
            weapon: true,
            matchPlayers: {
              include: { player: true },
              orderBy: [{ team: "asc" }, { player: { name: "asc" } }],
            },
          },
        },
      },
    }),
  ]);
  const completedMatches = currentSession?.matches.filter(
    (match) => match.matchPlayers.length === 4 && match.matchPlayers.every((item) => item.result !== null),
  ).length ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <Badge>Shooting period control</Badge>
        <h1 className="mt-4 font-serif text-6xl font-bold uppercase leading-none">Kỳ bắn</h1>
        <p className="mt-2 text-xs uppercase tracking-[0.18em] text-concrete">Tạo lịch // khóa đội hình // nhập kết quả</p>
      </div>

      <Card className={currentSession ? "border-leaf/40" : "border-rust/30"}>
        <div className="flex items-center gap-3">
          <Radio className={`h-6 w-6 ${currentSession ? "animate-pulse text-leaf" : "text-rust"}`} />
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-leaf">Mission setup</p>
            <h2 className="font-serif text-3xl font-bold uppercase">Tạo kỳ bắn mới</h2>
          </div>
        </div>

        <div className="mt-6 grid gap-7 xl:grid-cols-[1.2fr_.8fr]">
          <form action={createGameSession} className="hud-corners space-y-5 border border-cream/10 bg-black/20 p-5">
            <p className="text-sm text-concrete">Chọn người, số trận và kho súng một lần. Hệ thống tự sinh đội hình cân bằng và khóa súng của từng trận.</p>
            <div className="grid gap-3 sm:grid-cols-[1fr_10rem] sm:items-end">
              <div className="hud-corners border border-leaf/20 bg-leaf/5 px-4 py-3">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-leaf">Tên kỳ bắn tự động</p>
                <p className="mt-1 text-sm text-concrete">Thứ, ngày tháng và giờ phút lúc tạo kỳ.</p>
              </div>
              <label className="space-y-2 text-[10px] font-bold uppercase tracking-wider text-concrete">
                Số trận
                <input name="matchCount" type="number" min="1" max="100" defaultValue="6" className={inputClass} required />
              </label>
            </div>
            <fieldset>
              <legend className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-leaf">Người tham gia // chọn ít nhất 4</legend>
              <PerfectScroll className="max-h-56">
                <div className="grid grid-cols-2 gap-2 pr-3 sm:grid-cols-3">
                  {players.map((player) => (
                    <label key={player.id} className="hud-corners flex cursor-pointer items-center gap-3 border border-cream/10 bg-panel px-3 py-3 text-sm font-bold hover:border-leaf/50">
                      <input type="checkbox" name="playerIds" value={player.id} className="accent-[#ff6a00]" />
                      <span className="truncate">{player.name}</span>
                    </label>
                  ))}
                </div>
              </PerfectScroll>
              {players.length < 4 && <p className="mt-2 text-xs text-rust">Cần ít nhất 4 người đang hoạt động.</p>}
            </fieldset>
            <fieldset>
              <legend className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-leaf">Súng được phép // mỗi trận đúng 1 súng</legend>
              <PerfectScroll className="max-h-44">
                <div className="grid grid-cols-2 gap-2 pr-3 sm:grid-cols-3">
                  {weapons.map((weapon) => (
                    <label key={weapon.id} className="hud-corners flex cursor-pointer items-center gap-3 border border-cream/10 bg-panel px-3 py-3 text-sm font-bold hover:border-leaf/50">
                      <input type="checkbox" name="weaponIds" value={weapon.id} className="accent-[#ff6a00]" />
                      <Crosshair className="h-4 w-4 shrink-0 text-leaf" />
                      <span className="truncate">{weapon.name}</span>
                    </label>
                  ))}
                </div>
              </PerfectScroll>
            </fieldset>
            <Button type="submit" className="w-full" disabled={players.length < 4 || weapons.length < 1}>Sinh lịch kỳ bắn</Button>
          </form>

          <div className="space-y-5">
            {currentSession ? (
              <div className="hud-corners border border-leaf/20 border-l-2 border-l-leaf bg-leaf/5 p-5">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-leaf">Active now</p>
                <p className="mt-1 font-serif text-3xl font-bold">{currentSession.name}</p>
                <div className="mt-4 grid grid-cols-2 gap-px bg-cream/10">
                  {[
                    ["Tiến độ", `${completedMatches}/${currentSession.plannedMatchCount}`],
                    ["Người", String(currentSession.players.length)],
                    ["Súng", String(currentSession.weapons.length)],
                    ["Trạng thái", completedMatches === currentSession.plannedMatchCount ? "Hoàn tất" : "Đang bắn"],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-panel p-3">
                      <p className="text-[8px] uppercase tracking-wider text-concrete">{label}</p>
                      <p className="mt-1 font-bold text-leaf">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={`/sessions/${currentSession.id}`} className="hud-corners border border-leaf/40 px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-leaf">Public view</Link>
                  <Link href="/history" className="hud-corners border border-cream/15 px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-concrete">Lịch sử</Link>
                  <form action={closeCurrentSession}>
                    <Button className="min-h-8 border-rust bg-rust px-3 py-1 text-[9px]">Đóng kỳ bắn</Button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="hud-corners border border-rust/20 border-l-2 border-l-rust bg-rust/5 p-5 text-sm text-concrete">Không có kỳ bắn đang hoạt động.</div>
            )}
            <Card className="bg-black/20 p-5 sm:p-5">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-leaf">Kho tài nguyên hiện tại</p>
              <p className="mt-3 font-serif text-4xl font-bold">{players.length} <span className="text-lg text-concrete">người</span></p>
              <p className="mt-1 font-serif text-4xl font-bold">{weapons.length} <span className="text-lg text-concrete">súng</span></p>
              <Link href="/admin" className="mt-4 inline-block text-[9px] font-black uppercase tracking-wider text-leaf hover:text-cream">Quản lý người và súng →</Link>
            </Card>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex items-center gap-3">
            <Swords className="h-6 w-6 text-leaf" />
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.24em] text-leaf">Generated match terminal</p>
              <h2 className="font-serif text-3xl font-bold uppercase">{currentSession?.name ?? "No active period"}</h2>
            </div>
          </div>
          {currentSession && <span className="text-[10px] font-bold uppercase tracking-wider text-concrete">{completedMatches}/{currentSession.plannedMatchCount} trận đã chốt</span>}
        </div>

        {currentSession ? (
          <div className="mt-6 space-y-3">
            {currentSession.matches.map((match) => {
              const teamA = match.matchPlayers.filter((item) => item.team === "A");
              const teamB = match.matchPlayers.filter((item) => item.team === "B");
              const winner = teamA[0]?.result === "WIN" ? "A" : teamB[0]?.result === "WIN" ? "B" : null;
              return (
                <div key={match.id} className={`hud-corners grid gap-4 border p-4 lg:grid-cols-[8rem_1fr_auto] lg:items-center ${winner ? "border-cream/10 bg-black/20" : "border-leaf/30 bg-leaf/5"}`}>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-concrete">Encounter {String(match.sequence).padStart(2, "0")}</p>
                    <p className="mt-1 flex items-center gap-2 font-bold text-leaf"><Crosshair className="h-4 w-4" />{match.weapon?.name ?? "Chưa gán súng"}</p>
                    <p className={`mt-1 text-[8px] font-black uppercase tracking-widest ${winner ? "text-concrete" : "text-rust"}`}>{winner ? `Đội ${winner} thắng` : "Chờ kết quả"}</p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                    <div className={`hud-corners border border-l-2 p-3 ${winner === "A" ? "border-leaf/20 border-l-leaf bg-leaf/10 text-leaf" : "border-cream/10 border-l-cream/20 bg-black/20"}`}>
                      <p className="text-[8px] font-black uppercase tracking-wider text-concrete">Alpha</p>
                      <p className="mt-1 font-bold">{teamA.map((item) => item.player.name).join(" + ")}</p>
                    </div>
                    <span className="text-center font-serif font-black text-rust">VS</span>
                    <div className={`hud-corners border border-l-2 p-3 ${winner === "B" ? "border-leaf/20 border-l-leaf bg-leaf/10 text-leaf" : "border-cream/10 border-l-cream/20 bg-black/20"}`}>
                      <p className="text-[8px] font-black uppercase tracking-wider text-concrete">Bravo</p>
                      <p className="mt-1 font-bold">{teamB.map((item) => item.player.name).join(" + ")}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 lg:flex-col">
                    {(["A", "B"] as const).map((team) => (
                      <form key={team} action={updateMatchResult}>
                        <input type="hidden" name="matchId" value={match.id} />
                        <input type="hidden" name="winner" value={team} />
                        <Button className={winner === team ? "min-h-8 w-28 bg-leaf px-3 py-1 text-[9px]" : `${tinyButton} w-28`}>
                          {team === "A" ? "Alpha thắng" : "Bravo thắng"}
                        </Button>
                      </form>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="hud-corners mt-6 border border-rust/20 border-l-2 border-l-rust bg-rust/5 p-5 font-bold text-concrete">Tạo hoặc kích hoạt một kỳ bắn để xem lịch đấu.</p>
        )}
      </Card>
    </div>
  );
}

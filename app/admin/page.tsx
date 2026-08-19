import { Crosshair, Radio, Swords, UserRound } from "lucide-react";
import { getServerSession } from "next-auth";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { authOptions, isAdminEmail } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import {
  closeCurrentSession,
  createGameSession,
  createPlayer,
  createWeapon,
  deleteMatch,
  recordMatch,
  setCurrentSession,
  togglePlayerActive,
  toggleWeaponActive,
  updateMatchResult,
} from "./actions";

export const dynamic = "force-dynamic";

const inputClass =
  "min-h-11 w-full border border-cream/15 bg-black/35 px-4 text-sm text-cream outline-none transition placeholder:text-concrete/50 focus:border-leaf focus:ring-1 focus:ring-leaf/30";

const tinyButton =
  "min-h-8 border-cream/15 bg-transparent px-3 py-1 text-[9px] text-concrete shadow-none hover:border-leaf hover:bg-leaf/10 hover:text-leaf";

export default async function AdminPage() {
  const authSession = await getServerSession(authOptions);
  if (!isAdminEmail(authSession?.user?.email)) {
    return (
      <Card className="mx-auto max-w-xl py-14 text-center">
        <Badge>Restricted</Badge>
        <h1 className="mt-4 font-serif text-4xl font-black">Khu vực quản trị</h1>
        <p className="mt-3 text-concrete">Đăng nhập bằng Google với email admin để nhập hoặc sửa kết quả.</p>
        <Link href="/login" className="hud-corners mt-7 inline-flex border border-leaf bg-leaf px-6 py-3 text-xs font-black uppercase tracking-wider text-ink">Đăng nhập</Link>
      </Card>
    );
  }

  const [players, weapons, currentSession, sessions] = await Promise.all([
    prisma.player.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }] }),
    prisma.weapon.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }] }),
    prisma.gameSession.findFirst({
      where: { isCurrent: true },
      include: {
        matches: {
          orderBy: { sequence: "desc" },
          include: { matchPlayers: { include: { player: true, weapon: true } } },
        },
      },
    }),
    prisma.gameSession.findMany({
      orderBy: { startedAt: "desc" },
      take: 12,
      include: { _count: { select: { matches: true } } },
    }),
  ]);

  const activePlayers = players.filter((player) => player.active);
  const activeWeapons = weapons.filter((weapon) => weapon.active);

  const playerSelect = (name: string) => (
    <select name={name} className={inputClass} required defaultValue="">
      <option value="" disabled>Chọn người chơi</option>
      {activePlayers.map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}
    </select>
  );

  const weaponSelect = (name: string) => (
    <select name={name} className={inputClass} defaultValue="">
      <option value="">Không chọn súng</option>
      {activeWeapons.map((weapon) => <option key={weapon.id} value={weapon.id}>{weapon.name}</option>)}
    </select>
  );

  const loadout = (playerName: string, weaponName: string) => (
    <div className="grid gap-2 sm:grid-cols-[1.1fr_.9fr]">
      {playerSelect(playerName)}
      {weaponSelect(weaponName)}
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <Badge>Admin control room</Badge>
          <h1 className="mt-4 font-serif text-6xl font-bold uppercase leading-none">Operations</h1>
          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-concrete">Operator // {authSession?.user?.email}</p>
        </div>
        <div className="grid grid-cols-3 border border-cream/10 bg-panel">
          {[
            ["Roster", `${activePlayers.length}/${players.length}`],
            ["Arsenal", `${activeWeapons.length}/${weapons.length}`],
            ["Sessions", String(sessions.length)],
          ].map(([label, value]) => (
            <div key={label} className="border-r border-cream/10 px-5 py-3 text-center last:border-0">
              <p className="font-serif text-3xl font-bold text-leaf">{value}</p>
              <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-concrete">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <div className="flex items-center gap-3">
            <UserRound className="h-6 w-6 text-leaf" />
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-leaf">Roster management</p>
              <h2 className="font-serif text-3xl font-bold uppercase">Người chơi</h2>
            </div>
          </div>
          <form action={createPlayer} className="mt-5 flex gap-2">
            <input name="name" placeholder="Tên người chơi" className={inputClass} required />
            <Button type="submit" className="shrink-0">Thêm</Button>
          </form>
          <div className="mt-5 max-h-72 divide-y divide-cream/10 overflow-y-auto border border-cream/10">
            {players.map((player, index) => (
              <div key={player.id} className="flex items-center gap-3 bg-black/20 px-4 py-3">
                <span className="w-7 text-[10px] font-bold text-concrete">{String(index + 1).padStart(2, "0")}</span>
                <span className={`h-2 w-2 ${player.active ? "bg-leaf shadow-[0_0_10px_#ff6a00]" : "bg-concrete/30"}`} />
                <span className={`min-w-0 flex-1 font-bold ${player.active ? "text-cream" : "text-concrete line-through"}`}>{player.name}</span>
                <form action={togglePlayerActive}>
                  <input type="hidden" name="playerId" value={player.id} />
                  <Button className={tinyButton}>{player.active ? "Khóa" : "Mở"}</Button>
                </form>
              </div>
            ))}
            {players.length === 0 && <p className="p-5 text-sm text-concrete">Chưa có người chơi.</p>}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <Crosshair className="h-6 w-6 text-leaf" />
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-leaf">Loadout registry</p>
              <h2 className="font-serif text-3xl font-bold uppercase">Kho súng</h2>
            </div>
          </div>
          <form action={createWeapon} className="mt-5 flex gap-2">
            <input name="name" placeholder="Tên súng: AK-47, AWP..." className={inputClass} required />
            <Button type="submit" className="shrink-0">Thêm</Button>
          </form>
          <div className="mt-5 max-h-72 divide-y divide-cream/10 overflow-y-auto border border-cream/10">
            {weapons.map((weapon, index) => (
              <div key={weapon.id} className="flex items-center gap-3 bg-black/20 px-4 py-3">
                <span className="w-7 text-[10px] font-bold text-concrete">W{String(index + 1).padStart(2, "0")}</span>
                <Crosshair className={`h-4 w-4 ${weapon.active ? "text-leaf" : "text-concrete/30"}`} />
                <span className={`min-w-0 flex-1 font-bold ${weapon.active ? "text-cream" : "text-concrete line-through"}`}>{weapon.name}</span>
                <form action={toggleWeaponActive}>
                  <input type="hidden" name="weaponId" value={weapon.id} />
                  <Button className={tinyButton}>{weapon.active ? "Khóa" : "Mở"}</Button>
                </form>
              </div>
            ))}
            {weapons.length === 0 && <p className="p-5 text-sm text-concrete">Chưa có súng. Có thể nhập trận mà không chọn súng.</p>}
          </div>
        </Card>
      </div>

      <Card className={currentSession ? "border-leaf/40" : "border-rust/30"}>
        <div className="grid gap-6 lg:grid-cols-[.75fr_1.25fr]">
          <div>
            <div className="flex items-center gap-3">
              <Radio className={`h-6 w-6 ${currentSession ? "animate-pulse text-leaf" : "text-rust"}`} />
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-leaf">Session control</p>
                <h2 className="font-serif text-3xl font-bold uppercase">Buổi đấu</h2>
              </div>
            </div>

            {currentSession ? (
              <div className="mt-5 border-l-2 border-leaf bg-leaf/5 p-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-leaf">Active now</p>
                <p className="mt-1 font-serif text-3xl font-bold">{currentSession.name}</p>
                <p className="mt-1 text-xs text-concrete">{currentSession.matches.length} trận đã ghi nhận</p>
                <div className="mt-4 flex gap-2">
                  <Link href={`/sessions/${currentSession.id}`} className="border border-leaf/40 px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-leaf">Public view</Link>
                  <form action={closeCurrentSession}>
                    <Button className="min-h-8 border-rust bg-rust px-3 py-1 text-[9px]">Đóng session</Button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="mt-5 border-l-2 border-rust bg-rust/5 p-4 text-sm text-concrete">Không có session đang hoạt động.</div>
            )}

            <form action={createGameSession} className="mt-5 space-y-2">
              <input name="name" placeholder="HL tối thứ 7" className={inputClass} required />
              <Button type="submit" className="w-full">Mở session mới</Button>
            </form>
          </div>

          <div className="border border-cream/10">
            <div className="grid grid-cols-[1fr_auto_auto] border-b border-leaf/30 px-4 py-3 text-[9px] font-bold uppercase tracking-[0.2em] text-concrete">
              <span>Session history</span><span>Matches</span><span className="w-24" />
            </div>
            <div className="max-h-80 divide-y divide-cream/10 overflow-y-auto">
              {sessions.map((session) => (
                <div key={session.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 bg-black/20 px-4 py-3">
                  <Link href={`/sessions/${session.id}`} className="min-w-0 font-bold hover:text-leaf">
                    <span className="block truncate">{session.name}</span>
                    <span className={`mt-1 block text-[8px] uppercase tracking-wider ${session.isCurrent ? "text-leaf" : "text-concrete"}`}>
                      {session.isCurrent ? "● active" : session.endedAt ? "closed" : "standby"}
                    </span>
                  </Link>
                  <span className="font-serif text-xl font-bold text-concrete">{session._count.matches}</span>
                  {session.isCurrent ? (
                    <span className="w-24 text-center text-[9px] font-bold uppercase text-leaf">Current</span>
                  ) : (
                    <form action={setCurrentSession}>
                      <input type="hidden" name="gameSessionId" value={session.id} />
                      <Button className={`${tinyButton} w-24`}>Kích hoạt</Button>
                    </form>
                  )}
                </div>
              ))}
              {sessions.length === 0 && <p className="p-5 text-sm text-concrete">Chưa có session.</p>}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Swords className="h-6 w-6 text-leaf" />
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.24em] text-leaf">Match terminal</p>
              <h2 className="font-serif text-3xl font-bold uppercase">{currentSession?.name ?? "No active session"}</h2>
            </div>
          </div>
          {currentSession && <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-concrete">4 operators // 2 squads</span>}
        </div>

        {currentSession ? (
          <form action={recordMatch} className="mt-7 space-y-5">
            <input type="hidden" name="gameSessionId" value={currentSession.id} />
            <div className="grid gap-5 md:grid-cols-[1fr_auto_1fr] md:items-center">
              <fieldset className="space-y-3 border border-leaf/30 bg-leaf/5 p-5">
                <legend className="px-2 text-xs font-black uppercase tracking-[0.18em] text-leaf">Squad Alpha</legend>
                {loadout("teamA1", "weaponA1")}
                {loadout("teamA2", "weaponA2")}
              </fieldset>
              <span className="text-center font-serif text-2xl font-black text-rust">VS</span>
              <fieldset className="space-y-3 border border-rust/30 bg-rust/5 p-5">
                <legend className="px-2 text-xs font-black uppercase tracking-[0.18em] text-rust">Squad Bravo</legend>
                {loadout("teamB1", "weaponB1")}
                {loadout("teamB2", "weaponB2")}
              </fieldset>
            </div>
            <div className="flex flex-wrap items-center gap-4 border-t border-cream/10 pt-5">
              <label className="text-xs font-bold uppercase tracking-wider text-concrete">Đội thắng</label>
              <label className="flex items-center gap-2 text-sm"><input type="radio" name="winner" value="A" defaultChecked /> Alpha</label>
              <label className="flex items-center gap-2 text-sm"><input type="radio" name="winner" value="B" /> Bravo</label>
              <Button type="submit" className="sm:ml-auto">Commit result</Button>
            </div>
          </form>
        ) : (
          <p className="mt-6 border-l-2 border-rust bg-rust/5 p-5 font-bold text-concrete">Kích hoạt hoặc mở một session trước khi nhập kết quả.</p>
        )}
      </Card>

      {currentSession && currentSession.matches.length > 0 && (
        <Card>
          <h2 className="font-serif text-3xl font-bold uppercase">Recent encounters</h2>
          <div className="mt-5 space-y-3">
            {currentSession.matches.map((match) => {
              const teamA = match.matchPlayers.filter((item) => item.team === "A");
              const teamB = match.matchPlayers.filter((item) => item.team === "B");
              const winner = teamA[0]?.result === "WIN" ? "A" : "B";
              const describe = (items: typeof teamA) => items.map((item) => `${item.player.name}${item.weapon ? ` [${item.weapon.name}]` : ""}`).join(" + ");
              return (
                <div key={match.id} className="flex flex-col gap-3 border border-cream/10 bg-black/20 p-4 md:flex-row md:items-center">
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-leaf">Encounter {String(match.sequence).padStart(2, "0")}</p>
                    <p className="mt-1 text-sm font-bold">{describe(teamA)} <span className="text-rust">vs</span> {describe(teamB)}</p>
                  </div>
                  <form action={updateMatchResult} className="flex items-center gap-2">
                    <input type="hidden" name="matchId" value={match.id} />
                    <select name="winner" className={inputClass} defaultValue={winner}>
                      <option value="A">Alpha thắng</option>
                      <option value="B">Bravo thắng</option>
                    </select>
                    <Button type="submit">Cập nhật</Button>
                  </form>
                  <form action={deleteMatch}>
                    <input type="hidden" name="matchId" value={match.id} />
                    <Button type="submit" className="border-rust bg-rust hover:bg-rust/80">Xóa</Button>
                  </form>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

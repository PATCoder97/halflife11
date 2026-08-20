import { Crosshair, UserRound } from "lucide-react";
import { getServerSession } from "next-auth";
import Link from "next/link";

import { PerfectScroll } from "@/components/perfect-scroll";
import { AdminEditProvider, EditableResourceName } from "@/components/admin-editable-resource";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { authOptions, isAdminEmail } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import {
  createPlayer,
  createWeapon,
  togglePlayerActive,
  toggleWeaponActive,
  updatePlayerName,
  updateWeaponName,
} from "./actions";

export const dynamic = "force-dynamic";

const inputClass =
  "hud-corners min-h-11 w-full border border-cream/15 bg-black/35 px-4 text-sm text-cream outline-none transition placeholder:text-concrete/50 focus:border-leaf focus:ring-1 focus:ring-leaf/30";

const tinyButton =
  "min-h-8 border-cream/15 bg-transparent px-3 py-1 text-[9px] text-concrete shadow-none hover:border-leaf hover:bg-leaf/10 hover:text-leaf";

export default async function AdminPage() {
  const authSession = await getServerSession(authOptions);
  if (!isAdminEmail(authSession?.user?.email)) {
    return (
      <Card className="mx-auto max-w-xl py-14 text-center">
        <Badge>Restricted</Badge>
        <h1 className="mt-4 font-serif text-4xl font-black">Khu vực quản trị</h1>
        <p className="mt-3 text-concrete">Đăng nhập bằng Google với email admin để quản lý hệ thống.</p>
        <Link href="/login" className="hud-corners mt-7 inline-flex border border-leaf bg-leaf px-6 py-3 text-xs font-black uppercase tracking-wider text-ink">Đăng nhập</Link>
      </Card>
    );
  }

  const [players, weapons, sessionCount] = await Promise.all([
    prisma.player.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }] }),
    prisma.weapon.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }] }),
    prisma.gameSession.count(),
  ]);
  const activePlayers = players.filter((player) => player.active);
  const activeWeapons = weapons.filter((weapon) => weapon.active);

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <Badge>Admin control room</Badge>
          <h1 className="mt-4 font-serif text-6xl font-bold uppercase leading-none">Resources</h1>
          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-concrete">Operator // {authSession?.user?.email}</p>
        </div>
        <div className="hud-corners grid grid-cols-3 border border-cream/10 bg-panel">
          {[
            ["Roster", `${activePlayers.length}/${players.length}`],
            ["Arsenal", `${activeWeapons.length}/${weapons.length}`],
            ["Sessions", String(sessionCount)],
          ].map(([label, value]) => (
            <div key={label} className="border-r border-cream/10 px-5 py-3 text-center last:border-0">
              <p className="font-serif text-3xl font-bold text-leaf">{value}</p>
              <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-concrete">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <AdminEditProvider>
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
          <PerfectScroll className="hud-corners mt-5 max-h-[32rem] border border-cream/10">
            <div className="divide-y divide-cream/10">
              {players.map((player, index) => (
                <div key={player.id} className="flex items-center gap-3 bg-black/20 px-4 py-3">
                  <span className="w-7 text-[10px] font-bold text-concrete">{String(index + 1).padStart(2, "0")}</span>
                  <span className={`h-2 w-2 ${player.active ? "bg-leaf shadow-[0_0_10px_#ff6a00]" : "bg-concrete/30"}`} />
                  <EditableResourceName
                    resourceType="player"
                    resourceId={player.id}
                    name={player.name}
                    active={player.active}
                    updateAction={updatePlayerName}
                  />
                  <form action={togglePlayerActive}>
                    <input type="hidden" name="playerId" value={player.id} />
                    <Button type="submit" className={tinyButton}>{player.active ? "Khóa" : "Mở"}</Button>
                  </form>
                </div>
              ))}
              {players.length === 0 && <p className="p-5 text-sm text-concrete">Chưa có người chơi.</p>}
            </div>
          </PerfectScroll>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <Crosshair className="h-6 w-6 text-leaf" />
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-leaf">Weapon registry</p>
              <h2 className="font-serif text-3xl font-bold uppercase">Kho súng</h2>
            </div>
          </div>
          <form action={createWeapon} className="mt-5 flex gap-2">
            <input name="name" placeholder="Tên súng: AK-47, AWP..." className={inputClass} required />
            <Button type="submit" className="shrink-0">Thêm</Button>
          </form>
          <PerfectScroll className="hud-corners mt-5 max-h-[32rem] border border-cream/10">
            <div className="divide-y divide-cream/10">
              {weapons.map((weapon, index) => (
                <div key={weapon.id} className="flex items-center gap-3 bg-black/20 px-4 py-3">
                  <span className="w-7 text-[10px] font-bold text-concrete">W{String(index + 1).padStart(2, "0")}</span>
                  <Crosshair className={`h-4 w-4 ${weapon.active ? "text-leaf" : "text-concrete/30"}`} />
                  <EditableResourceName
                    resourceType="weapon"
                    resourceId={weapon.id}
                    name={weapon.name}
                    active={weapon.active}
                    updateAction={updateWeaponName}
                  />
                  <form action={toggleWeaponActive}>
                    <input type="hidden" name="weaponId" value={weapon.id} />
                    <Button type="submit" className={tinyButton}>{weapon.active ? "Khóa" : "Mở"}</Button>
                  </form>
                </div>
              ))}
              {weapons.length === 0 && <p className="p-5 text-sm text-concrete">Thêm ít nhất một súng để tạo kỳ bắn.</p>}
            </div>
          </PerfectScroll>
        </Card>
      </div>
      </AdminEditProvider>
    </div>
  );
}

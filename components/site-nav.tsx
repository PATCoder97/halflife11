"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const publicLinks = [
  ["/", "Buổi hiện tại"],
  ["/leaderboard", "Xếp hạng & nước"],
  ["/history", "Lịch sử"],
];

const adminLinks = [
  ["/admin", "Người & súng"],
  ["/admin/sessions", "Kỳ bắn"],
];

export function SiteNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const links = isAdmin
    ? [...publicLinks, ...adminLinks]
    : [...publicLinks, ["/login", "Đăng nhập"]];
  const activeHref = [...links]
    .filter(([href]) => pathname === href || (href !== "/" && pathname.startsWith(`${href}/`)))
    .sort(([left], [right]) => right.length - left.length)[0]?.[0];

  return (
    <nav className="hud-corners flex gap-0 overflow-x-auto border border-cream/10 bg-panel pb-0">
      {links.map(([href, label]) => (
        <Link
          key={href}
          href={href}
          aria-current={activeHref === href ? "page" : undefined}
          className={cn(
            "whitespace-nowrap border-r border-cream/10 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.15em] transition last:border-r-0 hover:bg-leaf hover:text-ink",
            activeHref === href
              ? "bg-leaf text-ink shadow-[inset_0_-2px_0_#ffb000]"
              : "text-concrete",
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}

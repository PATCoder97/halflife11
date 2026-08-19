import Link from "next/link";

const links = [
  ["/", "Buổi hiện tại"],
  ["/leaderboard", "Xếp hạng"],
  ["/water", "Tiền nước"],
  ["/admin", "Quản trị"],
];

export function SiteHeader() {
  return (
    <header className="relative z-10 border-b border-ink/10 bg-cream/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-serif text-3xl font-black tracking-tight">HalfLife</span>
          <span className="text-xs font-black uppercase tracking-[0.24em] text-leaf">Water Ledger</span>
        </Link>
        <nav className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
          {links.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold text-ink/70 transition hover:bg-white hover:text-ink"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

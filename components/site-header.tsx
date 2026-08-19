import Link from "next/link";

const links = [
  ["/", "Buổi hiện tại"],
  ["/leaderboard", "Xếp hạng"],
  ["/water", "Tiền nước"],
  ["/admin", "Quản trị"],
];

export function SiteHeader() {
  return (
    <header className="relative z-40 border-b border-leaf/30 bg-ink/95 backdrop-blur-xl">
      <div className="hazard-stripe h-1 w-full opacity-90" />
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="group flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center border border-leaf/50 bg-leaf/10 font-serif text-4xl font-bold leading-none text-leaf transition group-hover:bg-leaf group-hover:text-ink">λ</span>
          <span>
            <span className="block font-serif text-2xl font-bold uppercase leading-none tracking-[0.12em] text-cream">HalfLife 11</span>
            <span className="mt-1 block text-[9px] font-bold uppercase tracking-[0.32em] text-concrete">Water settlement system</span>
          </span>
        </Link>
        <nav className="flex gap-0 overflow-x-auto border border-cream/10 bg-panel pb-0">
          {links.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="whitespace-nowrap border-r border-cream/10 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-concrete transition last:border-r-0 hover:bg-leaf hover:text-ink"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

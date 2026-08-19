import { getServerSession } from "next-auth";
import Image from "next/image";
import Link from "next/link";

import { SiteNav } from "@/components/site-nav";
import { authOptions, isAdminEmail } from "@/lib/auth";

export async function SiteHeader() {
  const session = await getServerSession(authOptions);
  const isAdmin = isAdminEmail(session?.user?.email);

  return (
    <header className="relative z-40 border-b border-leaf/30 bg-ink/95 backdrop-blur-xl">
      <div className="hazard-stripe h-1 w-full opacity-90" />
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="group flex items-center gap-3">
          <Image
            src="/icon.png"
            alt="HalfLife 11"
            width={44}
            height={44}
            priority
            className="hud-corners h-11 w-11 border border-leaf/40 object-cover transition group-hover:border-leaf group-hover:brightness-125"
          />
          <span>
            <span className="block font-serif text-2xl font-bold uppercase leading-none tracking-[0.12em] text-cream">HalfLife 11</span>
            <span className="mt-1 block text-[9px] font-bold uppercase tracking-[0.32em] text-concrete">Water settlement system</span>
          </span>
        </Link>
        <SiteNav isAdmin={isAdmin} />
      </div>
    </header>
  );
}

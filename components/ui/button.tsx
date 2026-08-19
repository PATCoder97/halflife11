import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Button({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "hud-corners inline-flex min-h-11 items-center justify-center border border-leaf bg-leaf px-5 py-2.5 text-xs font-bold uppercase tracking-[0.16em] text-ink shadow-glow transition hover:bg-lime disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

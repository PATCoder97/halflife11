import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-lime/60 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.14em] text-ink",
        className,
      )}
      {...props}
    />
  );
}

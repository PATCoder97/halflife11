import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[1.75rem] border border-ink/10 bg-white/80 p-5 shadow-card backdrop-blur sm:p-7",
        className,
      )}
      {...props}
    />
  );
}

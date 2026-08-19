import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "hud-corners relative border border-cream/10 bg-panel/95 p-5 shadow-card before:absolute before:left-0 before:top-0 before:h-px before:w-20 before:bg-leaf sm:p-7",
        className,
      )}
      {...props}
    />
  );
}

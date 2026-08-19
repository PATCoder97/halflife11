import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center border-l-2 border-leaf bg-leaf/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.24em] text-leaf",
        className,
      )}
      {...props}
    />
  );
}

import Image from "next/image";

import { cn } from "@/lib/utils";

export function VersusBadge({ className }: { className?: string }) {
  return (
    <div className={cn("versus-badge", className)} role="separator" aria-label="Đối đầu">
      <Image
        src="/vs-brush.png"
        alt=""
        width={768}
        height={638}
        className="versus-badge__image"
        draggable={false}
      />
    </div>
  );
}

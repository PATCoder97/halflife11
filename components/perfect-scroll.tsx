"use client";

import PerfectScrollbar from "perfect-scrollbar";
import { type ReactNode, useEffect, useRef } from "react";

type PerfectScrollProps = {
  children: ReactNode;
  className?: string;
};

export function PerfectScroll({ children, className = "" }: PerfectScrollProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const scrollbarRef = useRef<PerfectScrollbar | null>(null);

  useEffect(() => {
    if (!elementRef.current) return;

    scrollbarRef.current = new PerfectScrollbar(elementRef.current, {
      suppressScrollX: true,
      wheelPropagation: false,
    });

    return () => {
      scrollbarRef.current?.destroy();
      scrollbarRef.current = null;
    };
  }, []);

  useEffect(() => {
    scrollbarRef.current?.update();
  });

  return (
    <div ref={elementRef} className={`perfect-scroll relative overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

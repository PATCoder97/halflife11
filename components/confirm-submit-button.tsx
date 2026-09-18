"use client";

import type { ButtonHTMLAttributes } from "react";

import { Button } from "@/components/ui/button";

type ConfirmSubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  message: string;
};

export function ConfirmSubmitButton({ message, onClick, ...props }: ConfirmSubmitButtonProps) {
  return (
    <Button
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented && !window.confirm(message)) event.preventDefault();
      }}
    />
  );
}

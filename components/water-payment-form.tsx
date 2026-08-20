"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";

import {
  recordWaterPayment,
  type WaterPaymentActionState,
} from "@/app/admin/actions";
import { PerfectScroll } from "@/components/perfect-scroll";

type PaymentPlayer = {
  playerId: string;
  name: string;
  points: number;
};

const initialState: WaterPaymentActionState = {};
const inputClass = "hud-corners min-h-11 w-full border border-cream/15 bg-black/35 px-4 text-sm text-cream outline-none focus:border-leaf";

type ComboboxOption = {
  value: string;
  label: string;
};

export function HudCombobox({
  name,
  value,
  placeholder,
  options,
  onChange,
}: {
  name: string;
  value: string;
  placeholder: string;
  options: ComboboxOption[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    const closeWhenOutside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", closeWhenOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeWhenOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative mt-2">
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={`hud-corners flex min-h-11 w-full items-center justify-between gap-3 border bg-black/45 px-4 text-left text-sm font-bold outline-none transition ${open ? "border-leaf text-cream shadow-[0_0_0_1px_rgba(255,106,0,.18)]" : "border-cream/15 text-concrete hover:border-leaf/50"}`}
      >
        <span className="truncate">{selected?.label ?? placeholder}</span>
        <ChevronsUpDown className={`h-4 w-4 shrink-0 ${open ? "text-leaf" : "text-concrete"}`} />
      </button>
      {open && (
        <div className="hud-corners absolute left-0 right-0 top-[calc(100%+4px)] z-50 border border-leaf/50 bg-[#0b0f0b] p-1 shadow-card">
          <PerfectScroll className="max-h-56">
            <div role="listbox" className="space-y-1 pr-2">
              {options.map((option) => {
                const active = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    className={`hud-corners flex w-full items-center justify-between gap-3 border px-3 py-3 text-left text-sm font-bold transition ${active ? "border-leaf/50 bg-leaf text-ink" : "border-transparent text-cream hover:border-leaf/30 hover:bg-leaf/10 hover:text-leaf"}`}
                  >
                    <span className="truncate">{option.label}</span>
                    {active && <Check className="h-4 w-4 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </PerfectScroll>
        </div>
      )}
    </div>
  );
}

export function WaterPaymentForm({
  debtors,
  creditors,
}: {
  debtors: PaymentPlayer[];
  creditors: PaymentPlayer[];
}) {
  const [state, formAction, pending] = useActionState(recordWaterPayment, initialState);
  const [fromPlayerId, setFromPlayerId] = useState("");
  const [toPlayerId, setToPlayerId] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const maximum = useMemo(() => {
    const debtor = debtors.find((player) => player.playerId === fromPlayerId);
    const creditor = creditors.find((player) => player.playerId === toPlayerId);
    return debtor && creditor
      ? Math.min(Math.abs(debtor.points), creditor.points)
      : 0;
  }, [creditors, debtors, fromPlayerId, toPlayerId]);

  useEffect(() => {
    if (!state.success) return;
    formRef.current?.reset();
    setFromPlayerId("");
    setToPlayerId("");
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="mt-5">
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_9rem_auto] md:items-end">
        <label className="block text-[9px] font-black uppercase tracking-wider text-concrete">
          Người trả
          <HudCombobox
            name="fromPlayerId"
            value={fromPlayerId}
            placeholder="Chọn người đang nợ"
            onChange={setFromPlayerId}
            options={debtors.map((player) => ({
              value: player.playerId,
              label: `${player.name} — nợ ${Math.abs(player.points)} chai`,
            }))}
          />
        </label>
        <label className="block text-[9px] font-black uppercase tracking-wider text-concrete">
          Người nhận
          <HudCombobox
            name="toPlayerId"
            value={toPlayerId}
            placeholder="Chọn người được nhận"
            onChange={setToPlayerId}
            options={creditors.map((player) => ({
              value: player.playerId,
              label: `${player.name} — nhận ${player.points} chai`,
            }))}
          />
        </label>
        <label className="space-y-2 text-[9px] font-black uppercase tracking-wider text-concrete">
          Số chai
          <input
            name="amount"
            type="number"
            min="1"
            max={maximum || undefined}
            step="1"
            className={inputClass}
            disabled={!maximum || pending}
            required
          />
        </label>
        <button
          disabled={!maximum || pending}
          className="hud-corners min-h-11 border border-leaf bg-leaf px-5 text-xs font-black uppercase tracking-wider text-ink hover:bg-lime disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Đang lưu..." : "Xác nhận"}
        </button>
      </div>
      {state.error && (
        <p role="alert" className="hud-corners mt-3 border border-rust/40 bg-rust/10 px-4 py-3 text-sm font-bold text-rust">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="hud-corners mt-3 border border-leaf/40 bg-leaf/10 px-4 py-3 text-sm font-bold text-leaf">
          {state.success}
        </p>
      )}
    </form>
  );
}

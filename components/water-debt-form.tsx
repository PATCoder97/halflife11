"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import {
  recordWaterDebt,
  type WaterDebtActionState,
} from "@/app/admin/actions";
import { HudCombobox } from "@/components/water-payment-form";

type Player = {
  playerId: string;
  name: string;
};

const initialState: WaterDebtActionState = {};
const inputClass = "hud-corners min-h-11 w-full border border-cream/15 bg-black/35 px-4 text-sm text-cream outline-none focus:border-leaf";

export function WaterDebtForm({ players }: { players: Player[] }) {
  const [state, formAction, pending] = useActionState(recordWaterDebt, initialState);
  const [fromPlayerId, setFromPlayerId] = useState("");
  const [toPlayerId, setToPlayerId] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const canSubmit = Boolean(
    fromPlayerId && toPlayerId && fromPlayerId !== toPlayerId && players.length >= 2,
  );

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
          Người nợ
          <HudCombobox
            name="fromPlayerId"
            value={fromPlayerId}
            placeholder="Chọn người nợ"
            onChange={setFromPlayerId}
            options={players.map((player) => ({ value: player.playerId, label: player.name }))}
          />
        </label>
        <label className="block text-[9px] font-black uppercase tracking-wider text-concrete">
          Người được nhận
          <HudCombobox
            name="toPlayerId"
            value={toPlayerId}
            placeholder="Chọn người được nhận"
            onChange={setToPlayerId}
            options={players.map((player) => ({ value: player.playerId, label: player.name }))}
          />
        </label>
        <label className="space-y-2 text-[9px] font-black uppercase tracking-wider text-concrete">
          Số chai
          <input name="amount" type="number" min="1" step="1" className={inputClass} disabled={!canSubmit || pending} required />
        </label>
        <button
          disabled={!canSubmit || pending}
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

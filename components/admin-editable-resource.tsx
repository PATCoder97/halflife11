"use client";

import {
  createContext,
  type Dispatch,
  type FormEvent,
  type ReactNode,
  type SetStateAction,
  useContext,
  useState,
  useTransition,
} from "react";

import { Button } from "@/components/ui/button";

type UpdateNameResult = {
  error?: string;
  success?: string;
};

type EditContextValue = {
  editingKey: string | null;
  setEditingKey: Dispatch<SetStateAction<string | null>>;
};

const EditContext = createContext<EditContextValue | null>(null);

function useEditContext() {
  const context = useContext(EditContext);
  if (!context) throw new Error("EditableResourceName phải nằm trong AdminEditProvider");
  return context;
}

const inputClass =
  "hud-corners min-h-8 min-w-0 w-full border border-cream/15 bg-black/35 px-3 py-1 text-sm text-cream outline-none transition placeholder:text-concrete/50 focus:border-leaf focus:ring-1 focus:ring-leaf/30";

const tinyButton =
  "min-h-8 shrink-0 border-cream/15 bg-transparent px-3 py-1 text-[9px] text-concrete shadow-none hover:border-leaf hover:bg-leaf/10 hover:text-leaf";

export function AdminEditProvider({ children }: { children: ReactNode }) {
  const [editingKey, setEditingKey] = useState<string | null>(null);

  return (
    <EditContext.Provider value={{ editingKey, setEditingKey }}>
      {children}
    </EditContext.Provider>
  );
}

export function EditableResourceName({
  resourceType,
  resourceId,
  name,
  active,
  updateAction,
}: {
  resourceType: "player" | "weapon";
  resourceId: string;
  name: string;
  active: boolean;
  updateAction: (formData: FormData) => Promise<UpdateNameResult>;
}) {
  const context = useEditContext();

  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const editKey = `${resourceType}:${resourceId}`;
  const isEditing = context.editingKey === editKey;
  const idField = resourceType === "player" ? "playerId" : "weaponId";
  const resourceLabel = resourceType === "player" ? "người chơi" : "súng";

  function startEditing() {
    setError(undefined);
    context.setEditingKey(editKey);
  }

  function cancelEditing() {
    setError(undefined);
    context.setEditingKey(null);
  }

  function submitName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(undefined);

    startTransition(async () => {
      const result = await updateAction(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      context.setEditingKey((currentKey) => currentKey === editKey ? null : currentKey);
    });
  }

  if (!isEditing) {
    return (
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className={`min-w-0 flex-1 truncate font-bold ${active ? "text-cream" : "text-concrete line-through"}`}>
          {name}
        </span>
        <Button type="button" className={tinyButton} onClick={startEditing}>Sửa</Button>
      </div>
    );
  }

  return (
    <div className="min-w-0 flex-1">
      <form onSubmit={submitName} className="flex min-w-0 items-center gap-2">
        <input type="hidden" name={idField} value={resourceId} />
        <input
          name="name"
          defaultValue={name}
          aria-label={`Tên mới cho ${resourceLabel} ${name}`}
          className={inputClass}
          autoFocus
          required
        />
        <Button type="submit" className={tinyButton} disabled={isPending}>Lưu</Button>
        <Button type="button" className={tinyButton} onClick={cancelEditing} disabled={isPending}>Hủy</Button>
      </form>
      {error && <p className="mt-1 text-[10px] text-rust">{error}</p>}
    </div>
  );
}

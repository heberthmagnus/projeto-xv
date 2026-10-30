"use client";

import { useActionState } from "react";
import { reprocessPool, type ReprocessPoolState } from "./actions";

const initialState: ReprocessPoolState = {};

export function ReprocessPoolForm({ poolId }: { poolId: string }) {
  const [state, action, pending] = useActionState(reprocessPool, initialState);

  return (
    <form action={action} className="mt-3 flex flex-wrap items-center gap-2">
      <input type="hidden" name="poolId" value={poolId} />
      <button disabled={pending} className="rounded-xl bg-[#101010] px-3 py-2 text-sm font-bold text-white disabled:opacity-60">
        {pending ? "Reprocessando..." : "Reprocessar resultados"}
      </button>
      {state.error ? <p role="alert" className="text-sm font-semibold text-[#B42318]">{state.error}</p> : null}
      {state.success ? <p role="status" className="text-sm font-semibold text-[#166534]">{state.success}</p> : null}
    </form>
  );
}

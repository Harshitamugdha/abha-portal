"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { dispensePrescription } from "@/app/actions/pharmacy";
import { formatIST } from "@/contracts/format";

type DispenseFormProps = {
  recordId: string;
  dispensedAt: string | null;
};

export function DispenseForm({ recordId, dispensedAt }: DispenseFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successDate, setSuccessDate] = useState<string | null>(dispensedAt);

  if (successDate) {
    return (
      <div className="form-card success-card" role="status">
        <h2>Dispensed</h2>
        <p>This prescription was dispensed on {formatIST(successDate)}. It cannot be dispensed again.</p>
      </div>
    );
  }

  function handleDispense() {
    setErrorMsg(null);
    startTransition(async () => {
      const res = await dispensePrescription({ recordId });
      if (res.ok) {
        setSuccessDate(res.data.dispensedAt);
        router.refresh();
      } else {
        setErrorMsg(res.error.message || "Could not mark this prescription as dispensed.");
      }
    });
  }

  return (
    <div className="help-panel">
      <h2>Ready to dispense</h2>
      <p>Mark it as dispensed only after you have handed over the medicines. This cannot be undone.</p>
      {errorMsg && (
        <p className="error tile-status" role="alert">
          {errorMsg}
        </p>
      )}
      <div className="form-actions tile-status">
        <button type="button" onClick={handleDispense} disabled={isPending} className="btn btn-accent btn-large">
          {isPending ? "Saving…" : "Mark as dispensed"}
        </button>
      </div>
    </div>
  );
}

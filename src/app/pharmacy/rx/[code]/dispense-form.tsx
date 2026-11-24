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
      <div className="card" style={{ borderLeft: "4px solid #15803d" }}>
        <p className="success" style={{ fontWeight: 600 }}>
          Already dispensed at {formatIST(successDate)}
        </p>
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
        setErrorMsg(res.error.message || "Failed to dispense");
      }
    });
  }

  return (
    <div className="card">
      {errorMsg && (
        <p className="error" style={{ marginBottom: "12px" }}>
          {errorMsg}
        </p>
      )}
      <button
        type="button"
        onClick={handleDispense}
        disabled={isPending}
        className="btn"
        style={{ width: "100%", padding: "12px" }}
      >
        {isPending ? "Dispensing..." : "Confirm & Dispense Medication"}
      </button>
    </div>
  );
}

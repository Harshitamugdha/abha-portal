"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { verifyStaff } from "@/app/actions/admin";

type VerifyButtonProps = {
  userId: string;
  name: string;
};

export function VerifyButton({ userId, name }: VerifyButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function handleVerify() {
    setErrorMsg(null);
    startTransition(async () => {
      const res = await verifyStaff({ userId });
      if (res.ok) {
        router.refresh();
      } else {
        setErrorMsg(res.error.message || "Failed to verify staff");
      }
    });
  }

  return (
    <div>
      {errorMsg && <p className="error" style={{ marginBottom: "4px" }}>{errorMsg}</p>}
      <button
        type="button"
        onClick={handleVerify}
        disabled={isPending}
        className="btn"
        style={{ padding: "6px 12px", fontSize: "0.85rem" }}
      >
        {isPending ? "Verifying..." : `Verify ${name}`}
      </button>
    </div>
  );
}

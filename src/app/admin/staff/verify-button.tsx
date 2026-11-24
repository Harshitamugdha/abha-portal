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
        setErrorMsg(res.error.message || "Could not verify this account.");
      }
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleVerify}
        disabled={isPending}
        className="btn btn-accent btn-small"
        aria-label={"Verify " + name}
      >
        {isPending ? "Verifying…" : "Verify"}
      </button>
      {errorMsg && (
        <p className="error" role="alert">
          {errorMsg}
        </p>
      )}
    </div>
  );
}

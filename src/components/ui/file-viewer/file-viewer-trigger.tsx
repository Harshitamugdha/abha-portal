"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { RecordDTO } from "@/contracts/records";
import { canViewFile } from "./can-view-file";

const DynamicFileViewer = dynamic(() => import("./file-viewer"), {
  ssr: false,
  loading: () => (
    <div className="p-3 my-2 bg-slate-100 rounded text-center text-xs text-slate-600 animate-pulse border border-slate-200">
      Loading document viewer…
    </div>
  ),
});

export function FileViewerTrigger({
  record,
  buttonLabel = "View file",
}: {
  record: Partial<RecordDTO>;
  buttonLabel?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  if (!canViewFile(record) || !record.fileId) {
    return null;
  }

  return (
    <div className="mt-2">
      <div className="row" style={{ gap: "8px", alignItems: "center" }}>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="btn btn-secondary btn-small text-xs py-1 px-3"
        >
          {isOpen ? "Hide file" : buttonLabel}
        </button>
      </div>

      {isOpen && (
        <DynamicFileViewer
          fileId={record.fileId}
          title={record.title || "Medical document"}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

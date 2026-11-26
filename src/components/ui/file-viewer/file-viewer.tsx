"use client";

type FileViewerProps = {
  fileId: string;
  title?: string;
  onClose?: () => void;
};

export default function FileViewer({
  fileId,
  title = "Medical document",
  onClose,
}: FileViewerProps) {
  const fileUrl = `/api/v1/files/${encodeURIComponent(fileId)}`;

  return (
    <div className="mt-3 p-3 bg-slate-50 border border-slate-300 rounded shadow-sm">
      <div
        className="row mb-2"
        style={{
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <div className="row" style={{ gap: "6px", alignItems: "center" }}>
          <span className="font-semibold text-xs text-slate-800">{title}</span>
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-700 hover:underline ml-1"
          >
            Open in new tab ↗
          </a>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary btn-small text-xs py-0.5 px-2"
            aria-label="Close file viewer"
          >
            ✕ Close
          </button>
        )}
      </div>

      <div
        className="w-full bg-white border border-slate-200 rounded overflow-hidden"
        style={{ height: "480px" }}
      >
        <iframe
          src={fileUrl}
          title={title}
          className="w-full h-full border-0"
          style={{ width: "100%", height: "100%" }}
        />
      </div>
    </div>
  );
}

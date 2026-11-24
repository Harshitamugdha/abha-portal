import type { RecordDTO } from "@/contracts/records";
import { formatIST } from "@/contracts/format";
import { Badge } from "./badge";
import { RECORD_TYPE_LABELS } from "./record-labels";

export function RecordCard({ record }: { record: RecordDTO }) {
  const isPrescription = record.type === "PRESCRIPTION" && record.prescription;

  return (
    <article className="card">
      <div className="row" style={{ justifyContent: "space-between", marginBottom: "8px" }}>
        <span className="row" style={{ gap: "8px" }}>
          <Badge>{RECORD_TYPE_LABELS[record.type]}</Badge>
          <span className="text-xs font-medium px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
            {record.institutionName}
          </span>
        </span>
        <span className="text-xs text-gray-500">{formatIST(record.occurredAt)}</span>
      </div>

      <h3 className="font-semibold text-base mb-1">{record.title}</h3>

      {record.authorName && (
        <p className="text-xs text-gray-600 mb-2">
          By <span className="font-medium">{record.authorName}</span>
        </p>
      )}

      {record.summary && <p className="text-sm text-gray-700 mb-2">{record.summary}</p>}

      {isPrescription && record.prescription && (
        <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-600">
          <p className="font-medium text-gray-700 mb-1">
            Prescription ({record.prescription.items.length} {record.prescription.items.length === 1 ? "item" : "items"}):
          </p>
          <ul className="list-disc list-inside space-y-0.5 mb-2">
            {record.prescription.items.map((item, idx) => (
              <li key={idx}>
                {item.drug} - {item.dose} ({item.frequency}, {item.durationDays} days)
              </li>
            ))}
          </ul>
          <p className="font-mono text-xs bg-gray-50 p-1 rounded inline-block">
            Share code: <span className="font-semibold text-teal-900">{record.prescription.shareCode}</span>
          </p>
        </div>
      )}

      {record.fileId && (
        <div className="mt-2 text-xs text-teal-700 font-medium">
          📎 Attached document
        </div>
      )}
    </article>
  );
}

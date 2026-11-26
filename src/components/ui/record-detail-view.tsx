import { Badge } from "@/components/ui/badge";
import { RECORD_TYPE_LABELS } from "@/components/ui/record-labels";
import { FileViewerTrigger } from "@/components/ui/file-viewer";
import { formatIST } from "@/contracts/format";
import type { RecordDTO } from "@/contracts/records";

export function RecordDetailView({ record }: { record: RecordDTO }) {
  const isPrescription = record.type === "PRESCRIPTION" && record.prescription;

  return (
    <div className="space-y-6">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <div className="row" style={{ gap: "8px" }}>
          <Badge>{RECORD_TYPE_LABELS[record.type]}</Badge>
          <span className="text-xs font-medium px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
            {record.institutionName}
          </span>
        </div>
        <span className="text-sm text-gray-500">
          Occurred: {formatIST(record.occurredAt)}
        </span>
      </div>

      {record.authorName && (
        <div>
          <p className="text-sm text-gray-500">Author</p>
          <p className="text-base font-medium text-gray-900">{record.authorName}</p>
        </div>
      )}

      {record.summary && (
        <div>
          <p className="text-sm text-gray-500 mb-1">Clinical Summary</p>
          <p className="text-base text-gray-800 whitespace-pre-wrap">{record.summary}</p>
        </div>
      )}

      {isPrescription && record.prescription && (
        <div className="border-t border-gray-100 pt-4">
          <h3 className="font-semibold text-base mb-3">Prescription Items</h3>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Medication</th>
                  <th>Dosage</th>
                  <th>Frequency</th>
                  <th>Duration</th>
                  <th>Instructions</th>
                </tr>
              </thead>
              <tbody>
                {record.prescription.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="font-medium">{item.drug}</td>
                    <td>{item.dose}</td>
                    <td>{item.frequency}</td>
                    <td>{item.durationDays} days</td>
                    <td>{item.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="row mt-4" style={{ gap: "20px", flexWrap: "wrap", alignItems: "center" }}>
            <div className="p-3 bg-gray-50 rounded border border-gray-200">
              <span className="text-xs text-gray-500 block">Pharmacy Share Code</span>
              <span className="font-mono text-lg font-bold text-teal-900">
                {record.prescription.shareCode}
              </span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block">Valid Until</span>
              <span className="text-sm text-gray-700">
                {formatIST(record.prescription.expiresAt)}
              </span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block">Dispense Status</span>
              {record.prescription.dispensedAt ? (
                <span className="badge badge-green">
                  Dispensed on {formatIST(record.prescription.dispensedAt)}
                </span>
              ) : (
                <span className="badge badge-amber">Undispensed</span>
              )}
            </div>
          </div>
        </div>
      )}

      {record.fileId && (
        <div className="border-t border-gray-100 pt-4">
          <p className="text-sm text-gray-500 mb-2">Attached Document</p>
          <div
            className="p-4 bg-slate-50 border border-slate-200 rounded row mb-3"
            style={{ justifyContent: "space-between", alignItems: "center" }}
          >
            <div className="row" style={{ gap: "8px", alignItems: "center" }}>
              <span className="text-xl">📎</span>
              <div>
                <p className="text-sm font-medium text-slate-800">Attached medical file</p>
                <p className="text-xs text-slate-500">Authorized access only (opens inline or in new tab)</p>
              </div>
            </div>
            <div className="row" style={{ gap: "8px" }}>
              <a
                href={`/api/v1/files/${record.fileId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline"
              >
                Open file ↗
              </a>
            </div>
          </div>
          <FileViewerTrigger record={record} buttonLabel="View file inline" />
        </div>
      )}

      <div className="border-t border-gray-100 pt-4 text-xs text-gray-400 row" style={{ justifyContent: "space-between" }}>
        <span>Record ID: {record.id}</span>
        <span>Created: {formatIST(record.createdAt)}</span>
      </div>
    </div>
  );
}

import type { RecordDTO } from "@/contracts/records";
import { EmptyState } from "./empty-state";
import { groupRecordsByInstitution } from "./group-by-institution";
import { RecordCard } from "./record-card";

export function InstitutionGroup({ records }: { records: RecordDTO[] }) {
  if (records.length === 0) {
    return <EmptyState message="No records in the scopes you have access to." />;
  }

  const groups = groupRecordsByInstitution(records);

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group.institutionId} className="institution-block">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
            <span className="text-xl" aria-hidden="true">
              🏥
            </span>
            <h2 className="text-lg font-bold text-gray-900">{group.institutionName}</h2>
            <span className="text-xs text-gray-500 font-medium ml-auto">
              {group.records.length} {group.records.length === 1 ? "record" : "records"}
            </span>
          </div>
          <div className="space-y-3">
            {group.records.map((record) => (
              <RecordCard key={record.id} record={record} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

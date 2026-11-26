import type { RecordDTO } from "@/contracts/records";
import { EmptyState } from "./empty-state";
import { groupRecordsByMonth } from "./group-by-month";
import { RecordCard } from "./record-card";

export function RecordTimeline({ records }: { records: RecordDTO[] }) {
  if (records.length === 0) {
    return <EmptyState message="No health records found." />;
  }

  const groups = groupRecordsByMonth(records);

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <section key={group.key}>
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
            {group.label}
          </h2>
          <div className="space-y-3">
            {group.records.map((record) => (
              <RecordCard
                key={record.id}
                record={record}
                href={`/patient/records/${record.id}`}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

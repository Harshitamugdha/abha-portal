import type { RecordDTO } from "@/contracts/records";

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function getMonthYearIST(value: string | Date): { key: string; label: string; monthName: string; year: number } {
  const utc = new Date(value);
  const ist = new Date(utc.getTime() + IST_OFFSET_MS);
  const month = ist.getUTCMonth();
  const year = ist.getUTCFullYear();
  const monthName = MONTH_NAMES[month];
  const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;

  return {
    key: monthKey,
    label: `${monthName} ${year}`,
    monthName,
    year,
  };
}

export type MonthGroup = {
  key: string;
  label: string;
  records: RecordDTO[];
};

export function groupRecordsByMonth(records: RecordDTO[]): MonthGroup[] {
  const map = new Map<string, MonthGroup>();

  for (const record of records) {
    const { key, label } = getMonthYearIST(record.occurredAt);
    let group = map.get(key);
    if (!group) {
      group = { key, label, records: [] };
      map.set(key, group);
    }
    group.records.push(record);
  }

  const sortedKeys = Array.from(map.keys()).sort().reverse();
  const result: MonthGroup[] = [];

  for (const k of sortedKeys) {
    const g = map.get(k);
    if (g) {
      g.records.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
      result.push(g);
    }
  }

  return result;
}

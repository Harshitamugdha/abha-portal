const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatIST(value: string | Date): string {
  const utc = new Date(value);
  if (isNaN(utc.getTime())) {
    return "";
  }

  const ist = new Date(utc.getTime() + IST_OFFSET_MS);

  const day = ist.getUTCDate();
  const month = MONTHS[ist.getUTCMonth()];
  const year = ist.getUTCFullYear();
  const minutes = String(ist.getUTCMinutes()).padStart(2, "0");

  let hours = ist.getUTCHours();
  let amPm = "AM";
  if (hours >= 12) {
    amPm = "PM";
  }
  hours = hours % 12;
  if (hours === 0) {
    hours = 12;
  }

  return `${day} ${month} ${year}, ${hours}:${minutes} ${amPm}`;
}

function isAbhaNumber(text: string) {
  return /^\d{14}$/.test(text);
}

export function formatAbha(abhaNumber: string): string {
  if (!isAbhaNumber(abhaNumber)) {
    return abhaNumber;
  }
  const a = abhaNumber.slice(0, 2);
  const b = abhaNumber.slice(2, 6);
  const c = abhaNumber.slice(6, 10);
  const d = abhaNumber.slice(10, 14);
  return `${a}-${b}-${c}-${d}`;
}

export function maskAbha(abhaNumber: string): string {
  if (!isAbhaNumber(abhaNumber)) {
    return "XX-XXXX-XXXX-XXXX";
  }
  return `XX-XXXX-XXXX-${abhaNumber.slice(10, 14)}`;
}

export type AbhaInput = {
  kind: "number" | "address";
  value: string;
};

export function parseAbhaInput(input: string): AbhaInput | null {
  const text = input.trim();

  if (text.includes("@")) {
    const address = text.toLowerCase();
    if (/^[a-z0-9._]+@abdm$/.test(address)) {
      return { kind: "address", value: address };
    }
    return null;
  }

  const digits = text.replace(/[-\s]/g, "");
  if (isAbhaNumber(digits)) {
    return { kind: "number", value: digits };
  }
  return null;
}

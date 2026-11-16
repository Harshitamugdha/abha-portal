// Small display helpers used by server and browser code (Master Part 5, rules 3 and 4).
// Plain functions, no libraries, so they give the same result everywhere.

// ---------- Time ----------

// India Standard Time is always UTC + 5 hours 30 minutes. India has no daylight saving,
// so a fixed offset is correct all year.
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function twoDigits(n: number) {
  return String(n).padStart(2, "0");
}

// "2026-09-17T18:45:00.000Z" -> "18 Sep 2026, 12:15 AM"   (note: the next day in India)
// Accepts the ISO string from the API or a Date.
export function formatIST(value: string | Date): string {
  const utc = new Date(value);
  if (Number.isNaN(utc.getTime())) {
    return "";
  }

  // Shift the moment by +5:30, then read it with the UTC getters.
  // That gives the clock time in India, whatever timezone this computer is in.
  const ist = new Date(utc.getTime() + IST_OFFSET_MS);

  const day = ist.getUTCDate();
  const month = MONTHS[ist.getUTCMonth()];
  const year = ist.getUTCFullYear();

  let hours = ist.getUTCHours();
  const minutes = twoDigits(ist.getUTCMinutes());
  const amPm = hours < 12 ? "AM" : "PM";
  hours = hours % 12;
  if (hours === 0) {
    hours = 12; // midnight is 12 AM, noon is 12 PM
  }

  return `${day} ${month} ${year}, ${hours}:${minutes} ${amPm}`;
}

// ---------- ABHA number ----------
// Stored and sent as 14 digits with no hyphens: "91100000000001".

// "91100000000001" -> "91-1000-0000-0001"
export function formatAbha(abhaNumber: string): string {
  if (!/^\d{14}$/.test(abhaNumber)) {
    return abhaNumber; // not a valid ABHA number; show it as it is
  }
  const part1 = abhaNumber.slice(0, 2);
  const part2 = abhaNumber.slice(2, 6);
  const part3 = abhaNumber.slice(6, 10);
  const part4 = abhaNumber.slice(10, 14);
  return `${part1}-${part2}-${part3}-${part4}`;
}

// "91100000000001" -> "XX-XXXX-XXXX-0001"
// Used where someone may confirm WHO a patient is but must not see the full number
// (doctor's patient search, Vivek's lookup).
export function maskAbha(abhaNumber: string): string {
  if (!/^\d{14}$/.test(abhaNumber)) {
    return "XX-XXXX-XXXX-XXXX";
  }
  const lastFour = abhaNumber.slice(10, 14);
  return `XX-XXXX-XXXX-${lastFour}`;
}

// ---------- What the user typed in the ABHA box ----------

export type AbhaInput =
  | { kind: "number"; value: string } // 14 digits, no hyphens
  | { kind: "address"; value: string }; // lowercase, name@abdm

// Accepts the three ways people type an ABHA:
//   "91-1000-0000-0001"   -> { kind: "number",  value: "91100000000001" }
//   "91100000000001"      -> { kind: "number",  value: "91100000000001" }
//   "Asha.Verma@abdm"     -> { kind: "address", value: "asha.verma@abdm" }
// Returns null if it's neither.
export function parseAbhaInput(input: string): AbhaInput | null {
  const text = input.trim();

  if (text.includes("@")) {
    const address = text.toLowerCase();
    if (/^[a-z0-9._]+@abdm$/.test(address)) {
      return { kind: "address", value: address };
    }
    return null;
  }

  // Allow hyphens and spaces between the digit groups, then remove them.
  const digits = text.replace(/[-\s]/g, "");
  if (/^\d{14}$/.test(digits)) {
    return { kind: "number", value: digits };
  }
  return null;
}

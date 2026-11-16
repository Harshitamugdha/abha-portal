import "server-only";
import type { AbhaProfileDTO } from "@/contracts/auth";
import { parseAbhaInput, type AbhaInput } from "@/contracts/format";
import { ApiError } from "@/server/http";
import type { AbhaProvider } from "./types";

// A pretend version of India's ABHA login service (D1). No SMS is sent: the OTP is always the
// fixed demo OTP (123456 by default), and in development we also return it as a hint.
//
// Rules (Harshita's brief, Phase 1):
// - An OTP "transaction" lasts 5 minutes.
// - 3 wrong OTPs and the transaction is deleted; the user must ask for a new OTP.
// - At most 3 OTP requests per ABHA in 10 minutes, then RATE_LIMITED.
// - An ABHA that doesn't exist gets a reply that LOOKS THE SAME as a real one, but its OTP never
//   works. Otherwise anyone could type numbers in and learn which ABHAs are real.

const TXN_LIFETIME_MS = 5 * 60 * 1000;
const MAX_WRONG_ATTEMPTS = 3;
const MAX_REQUESTS = 3;
const REQUEST_WINDOW_MS = 10 * 60 * 1000;

// One person in the pretend ABHA directory.
export type AbhaDirectoryEntry = {
  abhaNumber: string;
  abhaAddress: string;
  name: string;
  mobileLast4: string;
  dob: Date;
  gender: string;
};

// How the mock finds a person. In the app this reads the seeded AbhaProfile table (see index.ts);
// in tests we pass a small fake list, so the tests don't need a database.
export type FindInDirectory = (input: AbhaInput) => Promise<AbhaDirectoryEntry | null>;

// One OTP login in progress.
type Transaction = {
  abhaNumber: string | null; // null when the ABHA doesn't exist
  otp: string;
  expiresAt: number; // milliseconds, like Date.now()
  wrongAttempts: number;
};

export class MockAbhaProvider implements AbhaProvider {
  private findInDirectory: FindInDirectory;
  private transactions = new Map<string, Transaction>(); // txnId -> transaction
  private recentRequests = new Map<string, number[]>(); // ABHA -> times of recent OTP requests

  constructor(findInDirectory: FindInDirectory) {
    this.findInDirectory = findInDirectory;
  }

  async requestOtp(abha: string) {
    const input = parseAbhaInput(abha);
    if (!input) {
      throw new ApiError("VALIDATION_FAILED", "Enter a 14-digit ABHA number or an ABHA address like name@abdm.");
    }

    const person = await this.findInDirectory(input);

    // Count requests per person, so switching between number and address doesn't get around the limit.
    let rateLimitKey = input.value;
    if (person) {
      rateLimitKey = person.abhaNumber;
    }
    this.checkRateLimit(rateLimitKey);

    const otp = process.env.ABHA_DEV_OTP || "123456";
    const txnId = crypto.randomUUID(); // random, so nobody can guess another person's txnId

    let abhaNumber: string | null = null;
    let mobileLast4 = fakeLast4(input.value); // unknown ABHA: plausible-looking digits
    if (person) {
      abhaNumber = person.abhaNumber;
      mobileLast4 = person.mobileLast4;
    }

    this.transactions.set(txnId, {
      abhaNumber: abhaNumber,
      otp: otp,
      expiresAt: Date.now() + TXN_LIFETIME_MS,
      wrongAttempts: 0,
    });

    const reply: { txnId: string; maskedMobile: string; devOtp?: string } = {
      txnId: txnId,
      maskedMobile: `******${mobileLast4}`,
    };
    if (process.env.NODE_ENV === "development") {
      reply.devOtp = otp; // the OTP screen shows "Dev OTP: 123456"
    }
    return reply;
  }

  async verifyOtp(txnId: string, otp: string) {
    const txn = this.transactions.get(txnId);
    if (!txn) {
      throw new ApiError("OTP_INVALID");
    }

    // Expired at exactly 5:00, not 5:01.
    if (Date.now() >= txn.expiresAt) {
      this.transactions.delete(txnId);
      throw new ApiError("OTP_INVALID");
    }

    // Unknown ABHA: never succeeds. Count the attempt the same way, so it behaves the same.
    if (txn.abhaNumber === null || otp !== txn.otp) {
      txn.wrongAttempts = txn.wrongAttempts + 1;
      if (txn.wrongAttempts >= MAX_WRONG_ATTEMPTS) {
        this.transactions.delete(txnId);
      }
      throw new ApiError("OTP_INVALID");
    }

    // Right OTP. Delete the transaction so the same OTP can't be used twice.
    this.transactions.delete(txnId);
    return { abhaNumber: txn.abhaNumber };
  }

  async getProfile(abhaNumber: string): Promise<AbhaProfileDTO> {
    const person = await this.findInDirectory({ kind: "number", value: abhaNumber });
    if (!person) {
      throw new ApiError("NOT_FOUND");
    }

    // Field by field (TRAPS §17). mobileLast4 stays inside the provider.
    return {
      abhaNumber: person.abhaNumber,
      abhaAddress: person.abhaAddress,
      name: person.name,
      dob: person.dob.toISOString().slice(0, 10), // "1990-04-12"
      gender: person.gender,
    };
  }

  // Throws RATE_LIMITED if this ABHA already asked 3 times in the last 10 minutes.
  // Otherwise records this request.
  private checkRateLimit(key: string) {
    const now = Date.now();
    const earlier = this.recentRequests.get(key) || [];

    // Keep only the requests from the last 10 minutes.
    const stillRecent = earlier.filter((time) => now - time < REQUEST_WINDOW_MS);

    if (stillRecent.length >= MAX_REQUESTS) {
      this.recentRequests.set(key, stillRecent);
      throw new ApiError("RATE_LIMITED");
    }

    stillRecent.push(now);
    this.recentRequests.set(key, stillRecent);
  }
}

// Four digits made from the typed ABHA, so an unknown ABHA always shows the same "mobile",
// just like a real one would.
function fakeLast4(text: string): string {
  let total = 0;
  for (const char of text) {
    total = total + char.charCodeAt(0);
  }
  return String(total % 10000).padStart(4, "0");
}

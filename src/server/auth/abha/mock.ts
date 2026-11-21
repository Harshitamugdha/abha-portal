import "server-only";
import type { AbhaOtpResponse, AbhaProfileDTO } from "@/contracts/auth";
import { parseAbhaInput, type AbhaInput } from "@/contracts/format";
import { ApiError } from "@/server/http";
import type { AbhaProvider } from "./types";

const TXN_LIFETIME_MS = 5 * 60 * 1000;
const MAX_WRONG_ATTEMPTS = 3;
const MAX_REQUESTS = 3;
const REQUEST_WINDOW_MS = 10 * 60 * 1000;

export type AbhaDirectoryEntry = {
  abhaNumber: string;
  abhaAddress: string;
  name: string;
  mobileLast4: string;
  dob: Date;
  gender: string;
};

export type FindInDirectory = (input: AbhaInput) => Promise<AbhaDirectoryEntry | null>;

type Transaction = {
  abhaNumber: string | null;
  otp: string;
  expiresAt: number;
  wrongAttempts: number;
};

export class MockAbhaProvider implements AbhaProvider {
  findInDirectory: FindInDirectory;
  transactions = new Map<string, Transaction>();
  recentRequests = new Map<string, number[]>();

  constructor(findInDirectory: FindInDirectory) {
    this.findInDirectory = findInDirectory;
  }

  async requestOtp(abha: string): Promise<AbhaOtpResponse> {
    const input = parseAbhaInput(abha);
    if (!input) {
      throw new ApiError("VALIDATION_FAILED", "Enter a 14-digit ABHA number or an ABHA address like name@abdm.");
    }

    const person = await this.findInDirectory(input);

    let abhaNumber = null;
    let mobileLast4 = fakeLast4(input.value);
    let rateLimitKey = input.value;
    if (person) {
      abhaNumber = person.abhaNumber;
      mobileLast4 = person.mobileLast4;
      rateLimitKey = person.abhaNumber;
    }

    this.checkRateLimit(rateLimitKey);

    const otp = process.env.ABHA_DEV_OTP || "123456";
    const txnId = crypto.randomUUID();

    this.transactions.set(txnId, {
      abhaNumber: abhaNumber,
      otp: otp,
      expiresAt: Date.now() + TXN_LIFETIME_MS,
      wrongAttempts: 0,
    });

    const reply: AbhaOtpResponse = {
      txnId: txnId,
      maskedMobile: "******" + mobileLast4,
    };
    if (process.env.NODE_ENV === "development") {
      reply.devOtp = otp;
    }
    return reply;
  }

  async verifyOtp(txnId: string, otp: string) {
    const txn = this.transactions.get(txnId);
    if (!txn) {
      throw new ApiError("OTP_INVALID");
    }

    if (Date.now() >= txn.expiresAt) {
      this.transactions.delete(txnId);
      throw new ApiError("OTP_INVALID");
    }

    if (txn.abhaNumber === null || otp !== txn.otp) {
      txn.wrongAttempts = txn.wrongAttempts + 1;
      if (txn.wrongAttempts >= MAX_WRONG_ATTEMPTS) {
        this.transactions.delete(txnId);
      }
      throw new ApiError("OTP_INVALID");
    }

    this.transactions.delete(txnId);
    return { abhaNumber: txn.abhaNumber };
  }

  async getProfile(abhaNumber: string): Promise<AbhaProfileDTO> {
    const person = await this.findInDirectory({ kind: "number", value: abhaNumber });
    if (!person) {
      throw new ApiError("NOT_FOUND");
    }

    return {
      abhaNumber: person.abhaNumber,
      abhaAddress: person.abhaAddress,
      name: person.name,
      dob: person.dob.toISOString().slice(0, 10),
      gender: person.gender,
    };
  }

  checkRateLimit(key: string) {
    const now = Date.now();
    const earlier = this.recentRequests.get(key) || [];

    const recent: number[] = [];
    for (const time of earlier) {
      if (now - time < REQUEST_WINDOW_MS) {
        recent.push(time);
      }
    }

    if (recent.length >= MAX_REQUESTS) {
      this.recentRequests.set(key, recent);
      throw new ApiError("RATE_LIMITED");
    }

    recent.push(now);
    this.recentRequests.set(key, recent);
  }
}

function fakeLast4(text: string) {
  let total = 0;
  for (const char of text) {
    total = total + char.charCodeAt(0);
  }
  return String(total % 10000).padStart(4, "0");
}

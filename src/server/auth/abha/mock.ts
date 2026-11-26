import "server-only";
import { createHash, randomInt, randomUUID, timingSafeEqual } from "crypto";
import type { AbhaOtpResponse, AbhaProfileDTO } from "@/contracts/auth";
import { parseAbhaInput, type AbhaInput } from "@/contracts/format";
import { ApiError } from "@/server/http";
import type { AbhaProvider, OtpSender, OtpStore } from "./types";

const TXN_LIFETIME_MS = 5 * 60 * 1000;
const MAX_WRONG_ATTEMPTS = 3;
const MAX_REQUESTS = 3;
const REQUEST_WINDOW_MS = 10 * 60 * 1000;

export type AbhaDirectoryEntry = {
  abhaNumber: string;
  abhaAddress: string;
  name: string;
  mobileLast4: string;
  email: string | null;
  dob: Date;
  gender: string;
};

export type FindInDirectory = (input: AbhaInput) => Promise<AbhaDirectoryEntry | null>;

export type ProviderParts = {
  findInDirectory: FindInDirectory;
  store: OtpStore;
  sender: OtpSender;
  makeOtp: () => string;
};

export function randomOtp() {
  return String(randomInt(0, 1000000)).padStart(6, "0");
}

function demoOtp() {
  return process.env.ABHA_DEV_OTP || "123456";
}

function hashOtp(txnId: string, otp: string) {
  return createHash("sha256")
    .update(txnId + ":" + otp)
    .digest("hex");
}

function sameHash(a: string, b: string) {
  const first = Buffer.from(a);
  const second = Buffer.from(b);
  if (first.length !== second.length) {
    return false;
  }
  return timingSafeEqual(first, second);
}

export class MockAbhaProvider implements AbhaProvider {
  parts: ProviderParts;

  constructor(parts: ProviderParts) {
    this.parts = parts;
  }

  async requestOtp(abha: string): Promise<AbhaOtpResponse> {
    const input = parseAbhaInput(abha);
    if (!input) {
      throw new ApiError("VALIDATION_FAILED", "Enter a 14-digit ABHA number or an ABHA address like name@abdm.");
    }

    const person = await this.parts.findInDirectory(input);

    let abhaNumber = null;
    let mobileLast4 = fakeLast4(input.value);
    let rateKey = input.value;
    if (person) {
      abhaNumber = person.abhaNumber;
      mobileLast4 = person.mobileLast4;
      rateKey = person.abhaNumber;
    }

    const now = new Date();
    await this.checkRateLimit(rateKey, now);

    let otp = demoOtp();
    let emailed = false;
    if (person && person.email && this.parts.sender.isConfigured()) {
      otp = this.parts.makeOtp();
      await this.parts.sender.send(person.email, otp);
      emailed = true;
    }

    const txnId = randomUUID();
    await this.parts.store.create({
      id: txnId,
      rateKey: rateKey,
      abhaNumber: abhaNumber,
      otpHash: hashOtp(txnId, otp),
      expiresAt: new Date(now.getTime() + TXN_LIFETIME_MS),
      wrongAttempts: 0,
      usedAt: null,
      createdAt: now,
    });

    const reply: AbhaOtpResponse = {
      txnId: txnId,
      maskedMobile: "******" + mobileLast4,
    };
    if (process.env.NODE_ENV === "development" && !emailed) {
      reply.devOtp = otp;
    }
    return reply;
  }

  async verifyOtp(txnId: string, otp: string) {
    const txn = await this.parts.store.find(txnId);
    if (!txn) {
      throw new ApiError("OTP_INVALID");
    }

    const now = new Date();
    if (txn.usedAt || txn.wrongAttempts >= MAX_WRONG_ATTEMPTS || now >= txn.expiresAt) {
      throw new ApiError("OTP_INVALID");
    }

    if (txn.abhaNumber === null || !sameHash(hashOtp(txnId, otp), txn.otpHash)) {
      await this.parts.store.addWrongAttempt(txnId);
      throw new ApiError("OTP_INVALID");
    }

    const marked = await this.parts.store.markUsed(txnId, now);
    if (!marked) {
      throw new ApiError("OTP_INVALID");
    }
    return { abhaNumber: txn.abhaNumber };
  }

  async getProfile(abhaNumber: string): Promise<AbhaProfileDTO> {
    const person = await this.parts.findInDirectory({ kind: "number", value: abhaNumber });
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

  async checkRateLimit(rateKey: string, now: Date) {
    const since = new Date(now.getTime() - REQUEST_WINDOW_MS);
    const recent = await this.parts.store.countSince(rateKey, since);
    if (recent >= MAX_REQUESTS) {
      throw new ApiError("RATE_LIMITED");
    }
  }
}

function fakeLast4(text: string) {
  let total = 0;
  for (const char of text) {
    total = total + char.charCodeAt(0);
  }
  return String(total % 10000).padStart(4, "0");
}

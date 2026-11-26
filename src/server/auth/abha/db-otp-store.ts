import "server-only";
import { db } from "@/server/db";
import type { OtpStore, OtpTxn } from "./types";

export const dbOtpStore: OtpStore = {
  async create(txn: OtpTxn) {
    await db.otpTransaction.create({ data: txn });
  },

  async find(id: string) {
    return db.otpTransaction.findUnique({ where: { id: id } });
  },

  async addWrongAttempt(id: string) {
    await db.otpTransaction.update({
      where: { id: id },
      data: { wrongAttempts: { increment: 1 } },
    });
  },

  async markUsed(id: string, at: Date) {
    const result = await db.otpTransaction.updateMany({
      where: { id: id, usedAt: null },
      data: { usedAt: at },
    });
    return result.count === 1;
  },

  async countSince(rateKey: string, since: Date) {
    return db.otpTransaction.count({
      where: { rateKey: rateKey, createdAt: { gte: since } },
    });
  },
};

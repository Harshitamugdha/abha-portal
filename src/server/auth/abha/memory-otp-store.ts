import type { OtpStore, OtpTxn } from "./types";

export class MemoryOtpStore implements OtpStore {
  rows = new Map<string, OtpTxn>();

  async create(txn: OtpTxn) {
    this.rows.set(txn.id, { ...txn });
  }

  async find(id: string) {
    return this.rows.get(id) || null;
  }

  async addWrongAttempt(id: string) {
    const row = this.rows.get(id);
    if (row) {
      row.wrongAttempts = row.wrongAttempts + 1;
    }
  }

  async markUsed(id: string, at: Date) {
    const row = this.rows.get(id);
    if (!row || row.usedAt) {
      return false;
    }
    row.usedAt = at;
    return true;
  }

  async countSince(rateKey: string, since: Date) {
    let count = 0;
    for (const row of this.rows.values()) {
      if (row.rateKey === rateKey && row.createdAt >= since) {
        count = count + 1;
      }
    }
    return count;
  }
}

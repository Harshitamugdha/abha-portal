import { z } from "zod";
import { AuditOutcome, Id, IsoDateTime, PageQuery, Role } from "./shared";

export const AccessLogQuery = PageQuery;
export type AccessLogQuery = z.infer<typeof AccessLogQuery>;

export const AccessLogEntryDTO = z.object({
  id: Id,
  at: IsoDateTime,
  actorName: z.string(),
  actorRole: Role,
  action: z.string(),
  outcome: AuditOutcome,
  reason: z.string().nullable(),
  consentPurpose: z.string().nullable(),
});
export type AccessLogEntryDTO = z.infer<typeof AccessLogEntryDTO>;

import { z } from "zod";
import { PrescriptionItem, ShareCode } from "./clinical";
import { Id, IsoDateTime, PageQuery, RecordType } from "./shared";

export const PrescriptionDetail = z.object({
  items: z.array(PrescriptionItem).min(1).max(10),
  shareCode: ShareCode,
  dispensedAt: IsoDateTime.nullable(),
  expiresAt: IsoDateTime,
});
export type PrescriptionDetail = z.infer<typeof PrescriptionDetail>;

export const RecordDTO = z.object({
  id: Id,
  patientId: Id,
  institutionId: Id,
  institutionName: z.string().min(1),
  authorId: Id.nullable(),
  authorName: z.string().nullable(),
  type: RecordType,
  title: z.string().min(1).max(200),
  summary: z.string().nullable(),
  occurredAt: IsoDateTime,
  fileId: Id.nullable(),
  createdAt: IsoDateTime,
  prescription: PrescriptionDetail.nullable().optional(),
});
export type RecordDTO = z.infer<typeof RecordDTO>;

export const RecordListQuery = PageQuery.extend({
  patientId: Id,
  type: RecordType.optional(),
  types: z.array(RecordType).optional(),
  institutionId: Id.optional(),
  from: IsoDateTime.optional(),
  to: IsoDateTime.optional(),
});
export type RecordListQuery = z.infer<typeof RecordListQuery>;

export const DocumentUpload = z.object({
  title: z.string().trim().min(1).max(200),
  occurredAt: IsoDateTime,
  institutionId: Id,
});
export type DocumentUpload = z.infer<typeof DocumentUpload>;

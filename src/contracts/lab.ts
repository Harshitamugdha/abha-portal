import { z } from "zod";
import { Id, IsoDateTime, LabOrderStatus, PageQuery } from "./shared";

export const LabOrderDTO = z.object({
  id: Id,
  patientId: Id,
  patientName: z.string().min(1),
  orderedById: Id,
  orderedByName: z.string().min(1),
  labInstitutionId: Id,
  labInstitutionName: z.string().min(1),
  tests: z.array(z.string().min(1)).min(1).max(10),
  status: LabOrderStatus,
  resultRecordId: Id.nullable(),
  createdAt: IsoDateTime,
});
export type LabOrderDTO = z.infer<typeof LabOrderDTO>;

export const LabOrderListQuery = PageQuery.extend({
  status: LabOrderStatus.optional(),
});
export type LabOrderListQuery = z.infer<typeof LabOrderListQuery>;

export const LabResultUpload = z.object({
  orderId: Id.optional(),
  summary: z.string().trim().min(1).max(2000),
});
export type LabResultUpload = z.infer<typeof LabResultUpload>;

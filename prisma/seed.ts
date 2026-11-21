import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const DAY = 24 * 60 * 60 * 1000;

function daysAgo(days: number) {
  return new Date(Date.now() - days * DAY);
}

function daysFromNow(days: number) {
  return new Date(Date.now() + days * DAY);
}

async function clearDatabase() {
  await db.auditLog.deleteMany();
  await db.consentGrant.deleteMany();
  await db.labOrder.deleteMany();
  await db.prescription.deleteMany();
  await db.healthRecord.deleteMany();
  await db.fileObject.deleteMany();
  await db.membership.deleteMany();
  await db.abhaProfile.deleteMany();
  await db.user.deleteMany();
  await db.institution.deleteMany();
}

async function createInstitutions() {
  await db.institution.createMany({
    data: [
      { id: "inst-citygen", name: "City General Hospital", type: "HOSPITAL", city: "Bengaluru" },
      { id: "inst-sunrise", name: "Sunrise Multispeciality", type: "HOSPITAL", city: "Bengaluru" },
      { id: "inst-lakeside", name: "Lakeside Community Health Centre", type: "HOSPITAL", city: "Mysuru" },
      { id: "inst-greencross", name: "Green Cross Pharmacy", type: "PHARMACY", city: "Bengaluru" },
      { id: "inst-precision", name: "Precision Diagnostics Lab", type: "LAB", city: "Bengaluru" },
    ],
  });
}

type PatientSeed = {
  id: string;
  name: string;
  abhaNumber: string;
  abhaAddress: string;
  mobileLast4: string;
  dob: string;
  gender: string;
};

async function createPatient(p: PatientSeed) {
  await db.user.create({
    data: {
      id: p.id,
      role: "PATIENT",
      name: p.name,
      verified: true,
      abha: {
        create: {
          abhaNumber: p.abhaNumber,
          abhaAddress: p.abhaAddress,
          mobileLast4: p.mobileLast4,
          dob: new Date(p.dob),
          gender: p.gender,
        },
      },
    },
  });
}

type StaffSeed = {
  id: string;
  role: "DOCTOR" | "PHARMACY" | "LAB" | "ADMIN";
  name: string;
  email: string;
  verified: boolean;
  hprId?: string;
  institutionId?: string;
};

async function createStaff(s: StaffSeed, passwordHash: string) {
  await db.user.create({
    data: {
      id: s.id,
      role: s.role,
      name: s.name,
      email: s.email,
      passwordHash: passwordHash,
      verified: s.verified,
      hprId: s.hprId,
    },
  });

  if (s.institutionId) {
    await db.membership.create({
      data: { userId: s.id, institutionId: s.institutionId },
    });
  }
}

async function main() {
  await clearDatabase();
  await createInstitutions();

  await createPatient({
    id: "user-asha",
    name: "Asha Verma",
    abhaNumber: "91100000000001",
    abhaAddress: "asha.verma@abdm",
    mobileLast4: "4821",
    dob: "1990-04-12",
    gender: "F",
  });
  await createPatient({
    id: "user-rohan",
    name: "Rohan Mehta",
    abhaNumber: "91100000000002",
    abhaAddress: "rohan.mehta@abdm",
    mobileLast4: "7310",
    dob: "1985-09-03",
    gender: "M",
  });
  await createPatient({
    id: "user-meera",
    name: "Meera Pillai",
    abhaNumber: "91100000000003",
    abhaAddress: "meera.pillai@abdm",
    mobileLast4: "5562",
    dob: "1978-01-25",
    gender: "F",
  });

  const passwordHash = await bcrypt.hash("Demo@1234", 10);

  await createStaff(
    { id: "user-kavya", role: "DOCTOR", name: "Dr Kavya Iyer", email: "kavya@citygen.test",
      verified: true, hprId: "HPR-DEMO-0001", institutionId: "inst-citygen" },
    passwordHash,
  );
  await createStaff(
    { id: "user-arjun", role: "DOCTOR", name: "Dr Arjun Rao", email: "arjun@sunrise.test",
      verified: true, hprId: "HPR-DEMO-0002", institutionId: "inst-sunrise" },
    passwordHash,
  );
  await createStaff(
    { id: "user-neel", role: "DOCTOR", name: "Dr Neel Shah", email: "neel@lakeside.test",
      verified: false, hprId: "HPR-DEMO-0003", institutionId: "inst-lakeside" },
    passwordHash,
  );
  await createStaff(
    { id: "user-pharmacy", role: "PHARMACY", name: "Green Cross staff", email: "counter@greencross.test",
      verified: true, institutionId: "inst-greencross" },
    passwordHash,
  );
  await createStaff(
    { id: "user-lab", role: "LAB", name: "Precision staff", email: "desk@precision.test",
      verified: true, institutionId: "inst-precision" },
    passwordHash,
  );
  await createStaff(
    { id: "user-admin", role: "ADMIN", name: "Admin", email: "admin@portal.test", verified: true },
    passwordHash,
  );

  await db.healthRecord.createMany({
    data: [
      { id: "rec-asha-opd", patientId: "user-asha", institutionId: "inst-citygen", type: "ENCOUNTER",
        title: "OPD visit: fever and body ache", summary: "Viral fever. Rest and fluids advised.",
        occurredAt: new Date("2026-09-15T04:30:00Z"), createdAt: new Date("2026-09-15T04:30:00Z") },
      { id: "rec-asha-cbc", patientId: "user-asha", institutionId: "inst-citygen", type: "LAB_REPORT",
        title: "Complete blood count", summary: "All values within normal range.",
        occurredAt: new Date("2026-09-17T06:00:00Z"), createdAt: new Date("2026-09-17T06:00:00Z") },
      { id: "rec-asha-cardio", patientId: "user-asha", institutionId: "inst-sunrise", type: "ENCOUNTER",
        title: "Cardiology consultation", summary: "Mild hypertension. Lifestyle changes, review in 3 months.",
        occurredAt: new Date("2026-10-22T05:00:00Z"), createdAt: new Date("2026-10-22T05:00:00Z") },
      { id: "rec-asha-lipid", patientId: "user-asha", institutionId: "inst-sunrise", type: "LAB_REPORT",
        title: "Lipid profile", summary: "LDL slightly raised.",
        occurredAt: new Date("2026-10-23T03:30:00Z"), createdAt: new Date("2026-10-23T03:30:00Z") },
      { id: "rec-asha-discharge", patientId: "user-asha", institutionId: "inst-sunrise", type: "DOCUMENT",
        title: "Discharge summary (uploaded)", summary: "Scanned copy of a 2024 discharge summary.",
        occurredAt: new Date("2026-10-28T12:00:00Z"), createdAt: new Date("2026-10-28T12:00:00Z") },
    ],
  });

  await db.healthRecord.create({
    data: {
      id: "rec-asha-rx-fever",
      patientId: "user-asha",
      institutionId: "inst-citygen",
      type: "PRESCRIPTION",
      title: "Prescription: fever",
      occurredAt: new Date("2026-09-15T04:45:00Z"),
      createdAt: new Date("2026-09-15T04:45:00Z"),
      prescription: {
        create: {
          shareCode: "CGEN52",
          items: [
            { drug: "Paracetamol 500 mg", dose: "1 tablet", frequency: "Three times a day", durationDays: 5 },
          ],
          dispensedAt: new Date("2026-09-15T09:00:00Z"),
          dispensedBy: "user-pharmacy",
          expiresAt: new Date("2026-10-15T04:45:00Z"),
        },
      },
    },
  });

  await db.healthRecord.create({
    data: {
      id: "rec-asha-rx-bp",
      patientId: "user-asha",
      institutionId: "inst-sunrise",
      type: "PRESCRIPTION",
      title: "Prescription: blood pressure",
      occurredAt: daysAgo(3),
      createdAt: daysAgo(3),
      prescription: {
        create: {
          shareCode: "ASHA7K",
          items: [
            { drug: "Amlodipine 5 mg", dose: "1 tablet", frequency: "Once a day", durationDays: 30 },
            { drug: "Atorvastatin 10 mg", dose: "1 tablet", frequency: "At night", durationDays: 30,
              notes: "Recheck lipid profile after 6 weeks" },
          ],
          expiresAt: daysFromNow(27),
        },
      },
    },
  });

  await db.healthRecord.createMany({
    data: [
      { id: "rec-rohan-checkup", patientId: "user-rohan", institutionId: "inst-lakeside", type: "ENCOUNTER",
        title: "General check-up", summary: "No complaints.",
        occurredAt: new Date("2026-10-05T05:30:00Z"), createdAt: new Date("2026-10-05T05:30:00Z") },
      { id: "rec-rohan-sugar", patientId: "user-rohan", institutionId: "inst-lakeside", type: "LAB_REPORT",
        title: "Fasting blood sugar", summary: "Normal.",
        occurredAt: new Date("2026-10-06T03:00:00Z"), createdAt: new Date("2026-10-06T03:00:00Z") },
    ],
  });

  await db.healthRecord.createMany({
    data: [
      { id: "rec-meera-review", patientId: "user-meera", institutionId: "inst-citygen", type: "ENCOUNTER",
        title: "Diabetes review", summary: "Sugar control fair. Continue current plan.",
        occurredAt: new Date("2026-11-02T05:00:00Z"), createdAt: new Date("2026-11-02T05:00:00Z") },
      { id: "rec-meera-hba1c", patientId: "user-meera", institutionId: "inst-citygen", type: "LAB_REPORT",
        title: "HbA1c", summary: "7.4%",
        occurredAt: new Date("2026-11-02T06:00:00Z"), createdAt: new Date("2026-11-02T06:00:00Z") },
    ],
  });

  await db.consentGrant.create({
    data: {
      id: "consent-meera-kavya",
      patientId: "user-meera",
      doctorId: "user-kavya",
      institutionId: "inst-citygen",
      scopes: ["ENCOUNTER", "PRESCRIPTION", "LAB_REPORT", "DOCUMENT"],
      purpose: "Diabetes follow-up",
      status: "GRANTED",
      requestedAt: daysAgo(9),
      decidedAt: daysAgo(8),
      validFrom: daysAgo(8),
      validTo: daysAgo(1),
    },
  });

  await db.labOrder.create({
    data: {
      id: "laborder-asha-1",
      patientId: "user-asha",
      orderedById: "user-arjun",
      labInstitutionId: "inst-precision",
      tests: ["HbA1c", "Thyroid profile (T3, T4, TSH)"],
      status: "PENDING",
      createdAt: daysAgo(2),
    },
  });

  const institutions = await db.institution.count();
  const patients = await db.user.count({ where: { role: "PATIENT" } });
  const staff = await db.user.count({ where: { role: { not: "PATIENT" } } });
  const records = await db.healthRecord.count();
  const pendingLabOrders = await db.labOrder.count({ where: { status: "PENDING" } });
  const prescriptions = await db.prescription.count();

  console.log(
    `Seeded ${institutions} institutions, ${patients} patients, ${staff} staff, ${records} records, ` +
      `${pendingLabOrders} pending lab order, ${prescriptions} prescriptions (ASHA7K undispensed), ` +
      `1 expired consent (Meera)`,
  );
}

async function run() {
  try {
    await main();
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    await db.$disconnect();
  }
}

run();

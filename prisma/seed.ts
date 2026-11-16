// Seed data from Master Plan Part 3. All fictional.
// Run with `npm run db:reset` (drop + migrate + seed) or `npm run db:seed`.
// Every run produces the same data, from nothing.
//
// Important for the demo:
// - Asha has NO consent with anyone, so Dr Kavya sees "Consent required" (demo step 2).
// - Seeded hospital history has authorId = null (imported from the hospital's own system).
//   If Kavya were the author, she could read those records without consent (author access, D5),
//   and step 2 would not show "Consent required".
// - Meera's consent to Kavya ended yesterday, to test expiry (D9).
// - ASHA7K is an undispensed prescription for the pharmacy screens.
// - One pending lab order at Precision for the lab screens.

import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

// The seed runs outside Next.js, so it makes its own client instead of importing src/server/db.ts.
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

// Delete children before parents so foreign keys don't block us.
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
  name: string;
  abhaNumber: string;
  abhaAddress: string;
  mobileLast4: string;
  dob: string;
  gender: string;
};

async function createPatient(p: PatientSeed) {
  return db.user.create({
    data: {
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
  role: "DOCTOR" | "PHARMACY" | "LAB" | "ADMIN";
  name: string;
  email: string;
  verified: boolean;
  hprId?: string;
  institutionId?: string; // admin works for the portal, not an institution
};

async function createStaff(s: StaffSeed, passwordHash: string) {
  const user = await db.user.create({
    data: {
      role: s.role,
      name: s.name,
      email: s.email,
      passwordHash: passwordHash,
      verified: s.verified,
      hprId: s.hprId,
    },
  });

  // Link the staff member to their institution. Admin has none, so we skip it.
  if (s.institutionId) {
    await db.membership.create({
      data: { userId: user.id, institutionId: s.institutionId },
    });
  }

  return user;
}

async function main() {
  await clearDatabase();
  await createInstitutions();

  // ---------- Patients (dev OTP 123456 for all) ----------
  const asha = await createPatient({
    name: "Asha Verma",
    abhaNumber: "91100000000001",
    abhaAddress: "asha.verma@abdm",
    mobileLast4: "4821",
    dob: "1990-04-12",
    gender: "F",
  });
  const rohan = await createPatient({
    name: "Rohan Mehta",
    abhaNumber: "91100000000002",
    abhaAddress: "rohan.mehta@abdm",
    mobileLast4: "7310",
    dob: "1985-09-03",
    gender: "M",
  });
  const meera = await createPatient({
    name: "Meera Pillai",
    abhaNumber: "91100000000003",
    abhaAddress: "meera.pillai@abdm",
    mobileLast4: "5562",
    dob: "1978-01-25",
    gender: "F",
  });

  // ---------- Staff (password Demo@1234 for all) ----------
  const passwordHash = await bcrypt.hash("Demo@1234", 10);

  const kavya = await createStaff(
    { role: "DOCTOR", name: "Dr Kavya Iyer", email: "kavya@citygen.test", verified: true,
      hprId: "HPR-DEMO-0001", institutionId: "inst-citygen" },
    passwordHash,
  );
  const arjun = await createStaff(
    { role: "DOCTOR", name: "Dr Arjun Rao", email: "arjun@sunrise.test", verified: true,
      hprId: "HPR-DEMO-0002", institutionId: "inst-sunrise" },
    passwordHash,
  );
  await createStaff(
    { role: "DOCTOR", name: "Dr Neel Shah", email: "neel@lakeside.test", verified: false,
      hprId: "HPR-DEMO-0003", institutionId: "inst-lakeside" },
    passwordHash,
  );
  const pharmacist = await createStaff(
    { role: "PHARMACY", name: "Green Cross staff", email: "counter@greencross.test", verified: true,
      institutionId: "inst-greencross" },
    passwordHash,
  );
  await createStaff(
    { role: "LAB", name: "Precision staff", email: "desk@precision.test", verified: true,
      institutionId: "inst-precision" },
    passwordHash,
  );
  await createStaff(
    { role: "ADMIN", name: "Admin", email: "admin@portal.test", verified: true },
    passwordHash,
  );

  // ---------- Asha's records: two hospitals, every type (so scope filtering is visible) ----------
  await db.healthRecord.createMany({
    data: [
      { patientId: asha.id, institutionId: "inst-citygen", type: "ENCOUNTER",
        title: "OPD visit: fever and body ache", summary: "Viral fever. Rest and fluids advised.",
        occurredAt: daysAgo(60), createdAt: daysAgo(60) },
      { patientId: asha.id, institutionId: "inst-citygen", type: "LAB_REPORT",
        title: "Complete blood count", summary: "All values within normal range.",
        occurredAt: daysAgo(58), createdAt: daysAgo(58) },
      { patientId: asha.id, institutionId: "inst-sunrise", type: "ENCOUNTER",
        title: "Cardiology consultation", summary: "Mild hypertension. Lifestyle changes, review in 3 months.",
        occurredAt: daysAgo(20), createdAt: daysAgo(20) },
      { patientId: asha.id, institutionId: "inst-sunrise", type: "LAB_REPORT",
        title: "Lipid profile", summary: "LDL slightly raised.",
        occurredAt: daysAgo(19), createdAt: daysAgo(19) },
      // Uploaded by Asha herself, so no author.
      { patientId: asha.id, institutionId: "inst-sunrise", type: "DOCUMENT",
        title: "Discharge summary (uploaded)", summary: "Scanned copy of a 2024 discharge summary.",
        occurredAt: daysAgo(15), createdAt: daysAgo(15) },
    ],
  });

  // Prescriptions are a HealthRecord plus a Prescription row (1:1), created together.
  // Old one: dispensed long ago and expired.
  await db.healthRecord.create({
    data: {
      patientId: asha.id, institutionId: "inst-citygen", type: "PRESCRIPTION",
      title: "Prescription: fever", occurredAt: daysAgo(60), createdAt: daysAgo(60),
      prescription: {
        create: {
          shareCode: "CGEN52",
          items: [
            { drug: "Paracetamol 500 mg", dose: "1 tablet", frequency: "Three times a day", durationDays: 5 },
          ],
          dispensedAt: daysAgo(59),
          dispensedBy: pharmacist.id,
          expiresAt: daysAgo(30),
        },
      },
    },
  });
  // ASHA7K: recent, NOT dispensed, still valid. The pharmacy demo (step 8) uses this one.
  await db.healthRecord.create({
    data: {
      patientId: asha.id, institutionId: "inst-sunrise", type: "PRESCRIPTION",
      title: "Prescription: blood pressure", occurredAt: daysAgo(3), createdAt: daysAgo(3),
      prescription: {
        create: {
          shareCode: "ASHA7K",
          items: [
            { drug: "Amlodipine 5 mg", dose: "1 tablet", frequency: "Once a day", durationDays: 30 },
            { drug: "Atorvastatin 10 mg", dose: "1 tablet", frequency: "At night", durationDays: 30,
              notes: "Recheck lipid profile after 6 weeks" },
          ],
          expiresAt: daysFromNow(27), // created 3 days ago + 30 days
        },
      },
    },
  });

  // ---------- Rohan: Lakeside only, no consent to anyone ----------
  await db.healthRecord.createMany({
    data: [
      { patientId: rohan.id, institutionId: "inst-lakeside", type: "ENCOUNTER",
        title: "General check-up", summary: "No complaints.",
        occurredAt: daysAgo(30), createdAt: daysAgo(30) },
      { patientId: rohan.id, institutionId: "inst-lakeside", type: "LAB_REPORT",
        title: "Fasting blood sugar", summary: "Normal.",
        occurredAt: daysAgo(29), createdAt: daysAgo(29) },
    ],
  });

  // ---------- Meera: records at City General + a consent to Kavya that expired yesterday ----------
  await db.healthRecord.createMany({
    data: [
      { patientId: meera.id, institutionId: "inst-citygen", type: "ENCOUNTER",
        title: "Diabetes review", summary: "Sugar control fair. Continue current plan.",
        occurredAt: daysAgo(10), createdAt: daysAgo(10) },
      { patientId: meera.id, institutionId: "inst-citygen", type: "LAB_REPORT",
        title: "HbA1c", summary: "7.4%",
        occurredAt: daysAgo(10), createdAt: daysAgo(10) },
    ],
  });
  await db.consentGrant.create({
    data: {
      patientId: meera.id,
      doctorId: kavya.id,
      institutionId: "inst-citygen",
      scopes: ["ENCOUNTER", "PRESCRIPTION", "LAB_REPORT", "DOCUMENT"],
      purpose: "Diabetes follow-up",
      status: "GRANTED", // still GRANTED in the table; expired because validTo is in the past (D9)
      requestedAt: daysAgo(9),
      decidedAt: daysAgo(8),
      validFrom: daysAgo(8),
      validTo: daysAgo(1),
    },
  });

  // ---------- Pending lab order: Asha, ordered by Dr Arjun, at Precision ----------
  await db.labOrder.create({
    data: {
      patientId: asha.id,
      orderedById: arjun.id,
      labInstitutionId: "inst-precision",
      tests: ["HbA1c", "Thyroid profile (T3, T4, TSH)"],
      status: "PENDING",
      createdAt: daysAgo(2),
    },
  });

  // ---------- Summary line (QUICKSTART §3 expects this) ----------
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
    process.exitCode = 1; // tells `npm run db:reset` the seed failed
  } finally {
    await db.$disconnect();
  }
}

run();

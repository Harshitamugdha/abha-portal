import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHead } from "@/components/ui/page-head";
import { PublicNav } from "@/components/ui/public-nav";
import { getPublicInstitution, listInstitutionChoices } from "@/server/records/institutions";

export const revalidate = 3600; // ISR: revalidate at most once every hour

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function generateStaticParams() {
  const institutions = await listInstitutionChoices();
  return institutions.map((inst) => ({
    id: inst.id,
  }));
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { id } = await props.params;
  const institution = await getPublicInstitution(id);

  if (!institution) {
    return {
      title: "Facility Not Found | ABHA Health Portal",
    };
  }

  return {
    title: `${institution.name} | ABHA Health Portal`,
    description: `${institution.name} (${institution.type}) located in ${institution.city}. Verified healthcare provider in the ABHA network.`,
  };
}

export default async function InstitutionDetailPage(props: PageProps) {
  const { id } = await props.params;
  const institution = await getPublicInstitution(id);

  if (!institution) {
    notFound();
  }

  return (
    <>
      <PublicNav />
      <main className="landing">
        <PageHead
          kicker="Healthcare provider"
          title={institution.name}
        />

        <div className="container dashboard space-y-6">
          <div className="card p-6 border border-slate-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 mb-6 border-b border-slate-200">
              <div>
                <span
                  className={`text-xs px-2.5 py-1 rounded font-mono font-medium ${
                    institution.type === "HOSPITAL"
                      ? "bg-blue-50 text-blue-800 border border-blue-200"
                      : institution.type === "LAB"
                        ? "bg-purple-50 text-purple-800 border border-purple-200"
                        : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  }`}
                >
                  {institution.type}
                </span>
                <span className="text-xs font-mono text-gray-500 ml-3">ID: {institution.id}</span>
              </div>
              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                ✓ ABDM Verified
              </span>
            </div>

            <dl className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm mb-6">
              <div>
                <dt className="text-gray-500 font-medium">Facility Name</dt>
                <dd className="text-base font-semibold text-gray-900 mt-0.5">{institution.name}</dd>
              </div>
              <div>
                <dt className="text-gray-500 font-medium">Facility Type</dt>
                <dd className="text-base font-semibold text-gray-900 mt-0.5">
                  {institution.type === "HOSPITAL"
                    ? "Hospital & Health Centre"
                    : institution.type === "LAB"
                      ? "Diagnostic Laboratory"
                      : "Pharmacy & Dispensary"}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 font-medium">City Location</dt>
                <dd className="text-base font-semibold text-gray-900 mt-0.5">{institution.city}, India</dd>
              </div>
              <div>
                <dt className="text-gray-500 font-medium">Network Status</dt>
                <dd className="text-base font-semibold text-gray-900 mt-0.5">Active Participant</dd>
              </div>
            </dl>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-md flex items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="font-semibold text-sm text-gray-900">ABDM Integration</h3>
                <p className="text-xs text-gray-600 mt-0.5">
                  This facility participates in India&apos;s digital health mission, supporting consent-based medical records
                  exchange and secure electronic health records.
                </p>
              </div>
              <figure className="shrink-0 hidden sm:block">
                <Image
                  src="/landing/consent-request.png"
                  width={140}
                  height={66}
                  alt="Consent verification"
                  className="rounded border border-slate-200"
                />
              </figure>
            </div>

            <div className="pt-2">
              <Link href="/institutions" className="btn btn-secondary">
                ← Back to institutions directory
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

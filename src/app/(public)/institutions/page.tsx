import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHead } from "@/components/ui/page-head";
import { PublicNav } from "@/components/ui/public-nav";
import { listInstitutionChoices } from "@/server/records/institutions";

export const revalidate = 3600; // ISR: revalidate at most once every hour

export const metadata: Metadata = {
  title: "Participating Health Facilities | ABHA Health Portal",
  description: "Browse registered hospitals, diagnostic laboratories, and pharmacies in the ABHA network.",
};

export default async function InstitutionsDirectoryPage() {
  const institutions = await listInstitutionChoices();

  return (
    <>
      <PublicNav />
      <main className="landing">
        <PageHead
          kicker="Public directory"
          title="Participating Health Facilities"
        />

        <div className="container dashboard space-y-8">
          <div className="card p-6 border border-slate-200 bg-slate-50 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="max-w-xl">
              <h2 className="text-xl font-bold text-gray-900 mb-2">ABDM Health Facility Registry</h2>
              <p className="text-sm text-gray-600 mb-4">
                All listed institutions are verified participants in India&apos;s Ayushman Bharat Digital Mission (ABDM).
                Patients can request, authorize, and review clinical records across any of these verified facilities.
              </p>
              <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                <span className="badge badge-success">{institutions.length} Verified Facilities</span>
                <span>• Updated via Incremental Static Regeneration</span>
              </div>
            </div>
            <figure className="shrink-0">
              <Image
                src="/landing/consent-request.png"
                width={280}
                height={133}
                alt="Health facility registry overview preview"
                className="rounded border border-slate-200 shadow-sm"
              />
            </figure>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {institutions.map((inst) => (
              <div
                key={inst.id}
                className="card p-5 border border-slate-200 flex flex-col justify-between hover:border-slate-300 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-mono font-medium ${
                        inst.type === "HOSPITAL"
                          ? "bg-blue-50 text-blue-800 border border-blue-200"
                          : inst.type === "LAB"
                            ? "bg-purple-50 text-purple-800 border border-purple-200"
                            : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      }`}
                    >
                      {inst.type}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">📍 {inst.city}</span>
                  </div>
                  <h3 className="font-bold text-base text-gray-900 mb-1">
                    <Link href={`/institutions/${inst.id}`} className="hover:underline">
                      {inst.name}
                    </Link>
                  </h3>
                  <p className="text-xs font-mono text-gray-400 mb-4">ID: {inst.id}</p>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <Link
                    href={`/institutions/${inst.id}`}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                  >
                    <span>Facility details</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4">
            <Link href="/" className="btn btn-secondary">
              ← Back to home
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}

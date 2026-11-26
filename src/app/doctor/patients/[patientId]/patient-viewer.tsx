"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ConsentRequired } from "@/components/ui/consent-required";
import { EmptyState } from "@/components/ui/empty-state";
import { RecordCard } from "@/components/ui/record-card";
import { groupRecordsByInstitution } from "@/components/ui/group-by-institution";
import type { ConsentDTO } from "@/contracts/consent";
import { formatIST } from "@/contracts/format";
import type { RecordDTO } from "@/contracts/records";
import type { Page, RecordType } from "@/contracts/shared";
import { viewerState, type ViewerError } from "./viewer-state";

type PatientViewerProps = {
  patientId: string;
  patientName: string;
  abhaNumberMasked: string;
};

type RecordFilters = {
  type?: RecordType;
  institutionId?: string;
};

export function PatientViewer({
  patientId,
  patientName,
  abhaNumberMasked,
}: PatientViewerProps) {
  const [filters, setFilters] = useState<RecordFilters>({});

  // 1. Fetch live records for this patient
  const {
    data: recordsData,
    error: recordsError,
    isLoading: recordsLoading,
    refetch: refetchRecords,
  } = useQuery<Page<RecordDTO>, ViewerError>({
    queryKey: ["records", patientId, filters],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (filters.type) searchParams.set("type", filters.type);
      if (filters.institutionId) searchParams.set("institutionId", filters.institutionId);

      const qs = searchParams.toString();
      const url = `/api/v1/patients/${encodeURIComponent(patientId)}/records${qs ? `?${qs}` : ""}`;
      const res = await fetch(url, { cache: "no-store" });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const err = body.error || { code: "INTERNAL", message: res.statusText };
        throw err;
      }

      return res.json();
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    retry: false,
  });

  // 2. Fetch latest consent banner
  const { data: consentData } = useQuery<{ consent: ConsentDTO | null }>({
    queryKey: ["consent-latest", patientId],
    queryFn: async () => {
      const res = await fetch(
        `/api/v1/consents/latest?patientId=${encodeURIComponent(patientId)}`,
        { cache: "no-store" },
      );
      if (!res.ok) {
        return { consent: null };
      }
      return res.json();
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    retry: false,
  });

  // 3. Compute viewer state in ONE pure helper checking error.code === 'CONSENT_REQUIRED' first (TRAPS §4)
  const state = viewerState(recordsError, recordsData, recordsLoading);

  // 4. Memoize records grouped by institution (useMemo)
  const groupedRecords = useMemo(() => {
    return groupRecordsByInstitution(recordsData?.items || []);
  }, [recordsData?.items]);

  const activeConsent = consentData?.consent;
  const isConsentActive =
    activeConsent &&
    activeConsent.status === "GRANTED" &&
    activeConsent.displayStatus === "GRANTED";

  return (
    <div className="space-y-6">
      {/* Patient Header Summary */}
      <div className="card p-4 border border-slate-200">
        <div
          className="row"
          style={{
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div>
            <h1 className="text-xl font-bold text-gray-900">{patientName}</h1>
            <p className="text-sm text-gray-500">
              ABHA: <span className="font-mono">{abhaNumberMasked}</span>
            </p>
          </div>
          <div className="row" style={{ gap: "8px" }}>
            {isConsentActive && (
              <Link
                href={`/doctor/patients/${encodeURIComponent(patientId)}/prescribe`}
                className="btn btn-primary btn-small"
              >
                + Write prescription
              </Link>
            )}
            <Link
              href={`/doctor/patients/${encodeURIComponent(patientId)}/request-consent`}
              className="btn btn-secondary btn-small"
            >
              Request consent
            </Link>
          </div>
        </div>
      </div>

      {/* Small banner from /api/v1/consents/latest (scopes and valid until) */}
      {isConsentActive && (
        <aside
          className="p-3 bg-emerald-50 border border-emerald-200 rounded text-sm text-emerald-950 row"
          style={{
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "8px",
          }}
          aria-label="Active consent details"
        >
          <div className="row" style={{ gap: "8px", alignItems: "center" }}>
            <span aria-hidden="true">🛡️</span>
            <div>
              <strong className="text-emerald-900">Active consent:</strong>{" "}
              <span>Scopes: {activeConsent.scopes.join(", ")}</span>
              {activeConsent.validTo && (
                <span className="text-emerald-700 ml-2 text-xs">
                  (Valid until {formatIST(activeConsent.validTo)})
                </span>
              )}
            </div>
          </div>
          <Link
            href={`/doctor/patients/${encodeURIComponent(patientId)}/request-consent`}
            className="text-xs text-emerald-800 underline font-medium"
          >
            Request more scopes
          </Link>
        </aside>
      )}

      {/* Type filters when consented and records exist */}
      {state === "records" && (
        <div
          className="row"
          style={{ gap: "8px", flexWrap: "wrap", alignItems: "center" }}
        >
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Filter:
          </span>
          <button
            type="button"
            onClick={() => setFilters({})}
            className={`btn btn-small ${!filters.type ? "btn-accent" : "btn-secondary"}`}
          >
            All records ({recordsData?.total ?? 0})
          </button>
          {(["LAB_REPORT", "PRESCRIPTION", "ENCOUNTER", "DOCUMENT"] as const).map(
            (t) => (
              <button
                key={t}
                type="button"
                onClick={() => setFilters({ type: t })}
                className={`btn btn-small ${
                  filters.type === t ? "btn-accent" : "btn-secondary"
                }`}
              >
                {t.replace("_", " ")}
              </button>
            ),
          )}
        </div>
      )}

      {/* Main State Views */}
      {state === "loading" && (
        <div className="card text-center py-12">
          <p className="muted">Loading patient records…</p>
        </div>
      )}

      {state === "consent" && (
        <ConsentRequired patientId={patientId} patientName={patientName} />
      )}

      {state === "empty" && (
        <EmptyState message="No records in the scopes you have access to." />
      )}

      {state === "records" && (
        <div className="space-y-8">
          {groupedRecords.map((group) => (
            <section key={group.institutionId} className="institution-block">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                <span className="text-xl" aria-hidden="true">
                  🏥
                </span>
                <h2 className="text-lg font-bold text-gray-900">{group.institutionName}</h2>
                <span className="text-xs text-gray-500 font-medium ml-auto">
                  {group.records.length} {group.records.length === 1 ? "record" : "records"}
                </span>
              </div>
              <div className="space-y-3">
                {group.records.map((record) => (
                  <RecordCard key={record.id} record={record} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {state === "error" && (
        <div className="alert-panel" role="alert">
          <p className="error font-medium mb-1">Unable to load records</p>
          <p className="text-sm text-gray-600 mb-3">
            {recordsError?.message || "An unexpected error occurred while fetching records."}
          </p>
          <button
            type="button"
            onClick={() => refetchRecords()}
            className="btn btn-secondary btn-small"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}

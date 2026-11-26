import Image from "next/image";
import Link from "next/link";
import { PublicNav } from "@/components/ui/public-nav";

const STEPS = [
  {
    title: "A doctor asks",
    text: "The doctor chooses which record types they need, why, and for how many days.",
  },
  {
    title: "You decide",
    text: "Approve, untick record types you don't want to share, or deny. Nothing is shared before you approve.",
  },
  {
    title: "Access ends",
    text: "It stops on its own when the days are up. You can revoke it earlier at any moment.",
  },
];

const ROLES = [
  {
    title: "Patients",
    role: "PATIENT",
    badge: "Citizens",
    desc: "View your lifetime longitudinal health records across hospitals, manage consent requests, and inspect audit logs of every access attempt.",
    link: "/login",
    cta: "Log in with ABHA",
  },
  {
    title: "Doctors",
    role: "DOCTOR",
    badge: "Clinical Staff",
    desc: "Search registered patients by ABHA identifier, request time-bound scoped consent, and author encounters, prescriptions, and lab orders.",
    link: "/staff/login",
    cta: "Doctor login",
  },
  {
    title: "Pharmacies",
    role: "PHARMACY",
    badge: "Dispensary",
    desc: "Dispense electronic prescriptions securely using one-time 6-character cryptographic share codes without accessing unrelated medical history.",
    link: "/staff/login",
    cta: "Pharmacy login",
  },
  {
    title: "Diagnostic Labs",
    role: "LAB",
    badge: "Diagnostics",
    desc: "Process pending diagnostic test orders by patient name and upload structured test reports and findings directly into the ABDM network.",
    link: "/staff/login",
    cta: "Lab staff login",
  },
  {
    title: "Administrators",
    role: "ADMIN",
    badge: "Governance",
    desc: "Manage registered healthcare institutions, verify medical staff accounts, and oversee comprehensive compliance and audit trails.",
    link: "/staff/login",
    cta: "Admin login",
  },
];

const FAQS = [
  {
    question: "What is an ABHA number?",
    answer:
      "A 14-digit health ID, for example 91-1000-0000-0001. You can also log in with your ABHA address, such as name@abdm. We send an OTP to the mobile number linked to it.",
  },
  {
    question: "Who can see my records?",
    answer:
      "Only you, and a doctor while you have approved their request. They see only the record types you allowed, and only for the days you allowed.",
  },
  {
    question: "How do I stop a doctor seeing my records?",
    answer:
      "Open Consents and choose Revoke access. It works immediately: the doctor's next attempt shows “Consent required”.",
  },
  {
    question: "Can I see who looked at my records?",
    answer:
      "Yes. Who viewed my records lists every look, with the date, the person and the consent used. Refused attempts are listed too.",
  },
  {
    question: "What does a pharmacy see?",
    answer:
      "With the share code on your prescription, a pharmacy sees that one prescription: the medicines, the doctor and your name. Nothing else.",
  },
];

export default function HomePage() {
  return (
    <>
      <PublicNav />
      <main className="landing">
        <section className="band">
          <div className="container hero">
            <div>
              <h1>Your health records from every hospital, in one place</h1>
              <p className="hero-subtitle">Shared only with your consent</p>
              <p className="hero-sub">
                ABHA Health Portal is India&apos;s digital health platform connecting hospitals, diagnostic laboratories,
                pharmacies, and citizens under the Ayushman Bharat Digital Mission (ABDM). Log in to access your records
                or manage healthcare services.
              </p>
              <div className="flex flex-wrap gap-4 items-center mb-6">
                <Link className="btn btn-accent btn-large" href="/login">
                  Patient login
                </Link>
                <Link className="btn btn-primary btn-large" href="/staff/login">
                  Staff login
                </Link>
              </div>
              <p className="hero-links">
                Looking for participating hospitals and labs?{" "}
                <Link className="accent-link font-semibold" href="/institutions">
                  Browse directory →
                </Link>
                <span className="link-divider" aria-hidden="true">
                  |
                </span>
                <Link className="accent-link" href="/staff/register">
                  Register as staff
                </Link>
              </p>
            </div>
            <figure className="hero-figure">
              <Image
                src="/landing/consent-request.png"
                width={593}
                height={282}
                alt="A consent request in the portal: Dr Arjun Rao asks to see visits and lab reports for 14 days, with buttons to approve or deny."
                priority
              />
              <figcaption>Example: a doctor&apos;s request, as you see it in Consents.</figcaption>
            </figure>
          </div>
        </section>

        {/* The Five Roles */}
        <section id="roles" className="section bg-slate-50 border-y border-slate-200">
          <div className="container">
            <div className="max-w-2xl mb-8">
              <p className="step-label">Ecosystem</p>
              <h2 className="section-title">Built for the five ABDM roles</h2>
              <p className="section-intro text-gray-600">
                A unified, role-based architecture providing secure access and privacy controls for everyone involved in your care.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ROLES.map((role) => (
                <div key={role.role} className="card p-6 border border-slate-200 bg-white flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-lg text-gray-900">{role.title}</h3>
                      <span className="text-xs px-2 py-0.5 rounded font-mono font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        {role.badge}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-6">{role.desc}</p>
                  </div>
                  <div>
                    <Link href={role.link} className="btn btn-secondary btn-small w-full text-center">
                      {role.cta} →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="band-navy section">
          <div className="container">
            <h2 className="section-title">How consent works</h2>
            <p className="section-intro">
              No doctor sees your records until you say yes. Every consent has a purpose, a list of record types and an
              end date.
            </p>
            <ol className="step-cards">
              {STEPS.map((step) => (
                <li key={step.title} className="step-card">
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="faq" className="section">
          <div className="container faq-layout">
            <div>
              <p className="faq-kicker">Help</p>
              <h2 className="section-title">Frequently asked questions</h2>
              <p className="muted">Everything you need to know about your records and consent.</p>
            </div>
            <div className="faq-list">
              {FAQS.map((faq) => (
                <details key={faq.question}>
                  <summary>{faq.question}</summary>
                  <p>{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

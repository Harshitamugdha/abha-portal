import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PublicNav } from "@/components/ui/public-nav";
import { getLanguage, getMessages } from "@/server/i18n";

export const metadata: Metadata = {
  title: "ABHA Health Portal — Unified Digital Health Records",
  description:
    "India's digital health portal connecting hospitals, diagnostic laboratories, pharmacies, and citizens under ABDM. Access longitudinal health records with secure consent.",
  robots: { index: true, follow: true },
};

export default async function HomePage() {
  const lang = await getLanguage();
  const messages = await getMessages(lang);
  const t = messages.landing;

  const roles = [
    {
      role: "PATIENT",
      ...t.roles.patient,
      link: "/login",
    },
    {
      role: "DOCTOR",
      ...t.roles.doctor,
      link: "/staff/login",
    },
    {
      role: "PHARMACY",
      ...t.roles.pharmacy,
      link: "/staff/login",
    },
    {
      role: "LAB",
      ...t.roles.lab,
      link: "/staff/login",
    },
    {
      role: "ADMIN",
      ...t.roles.admin,
      link: "/staff/login",
    },
  ];

  const steps = [
    t.howConsentWorks.steps.step1,
    t.howConsentWorks.steps.step2,
    t.howConsentWorks.steps.step3,
  ];

  const faqs = [
    t.faqs.items.faq1,
    t.faqs.items.faq2,
    t.faqs.items.faq3,
    t.faqs.items.faq4,
    t.faqs.items.faq5,
  ];

  return (
    <>
      <PublicNav lang={lang} />
      <main className="landing">
        <section className="band">
          <div className="container hero">
            <div>
              <h1>{t.heroTitle}</h1>
              <p className="hero-subtitle">{t.heroSubtitle}</p>
              <p className="hero-sub">{t.heroDescription}</p>
              <div className="flex flex-wrap gap-4 items-center mb-6">
                <Link className="btn btn-accent btn-large" href="/login">
                  {t.patientLogin}
                </Link>
                <Link className="btn btn-primary btn-large" href="/staff/login">
                  {t.staffLogin}
                </Link>
              </div>
              <p className="hero-links">
                {t.browseDirectoryPrompt}{" "}
                <Link className="accent-link font-semibold" href="/institutions">
                  {t.browseDirectoryLink}
                </Link>
                <span className="link-divider" aria-hidden="true">
                  |
                </span>
                <Link className="accent-link" href="/staff/register">
                  {t.registerStaff}
                </Link>
              </p>
            </div>
            <figure className="hero-figure">
              <Image
                src="/landing/consent-request.png"
                width={593}
                height={282}
                alt={t.heroImageAlt}
                priority
              />
              <figcaption>{t.heroImageCaption}</figcaption>
            </figure>
          </div>
        </section>

        {/* The Five Roles */}
        <section id="roles" className="section bg-slate-50 border-y border-slate-200">
          <div className="container">
            <div className="max-w-2xl mb-8">
              <p className="step-label">Ecosystem</p>
              <h2 className="section-title">{t.rolesHeading}</h2>
              <p className="section-intro text-slate-700">{t.rolesSub}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {roles.map((role) => (
                <div key={role.role} className="card p-6 border border-slate-200 bg-white flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-lg text-gray-900">{role.title}</h3>
                      <span className="text-xs px-2.5 py-1 rounded font-mono font-semibold bg-blue-100 text-blue-900 border border-blue-300">
                        {role.badge}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 mb-6 leading-relaxed">{role.desc}</p>
                  </div>
                  <div>
                    <Link
                      href={role.link}
                      className="btn btn-secondary btn-small w-full text-center min-h-[44px] inline-flex items-center justify-center"
                    >
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
            <h2 className="section-title">{t.howConsentWorks.heading}</h2>
            <p className="section-intro">{t.howConsentWorks.sub}</p>
            <ol className="step-cards">
              {steps.map((step, idx) => (
                <li key={idx} className="step-card">
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
              <h2 className="section-title">{t.faqs.heading}</h2>
              <p className="muted">Everything you need to know about your records and consent.</p>
            </div>
            <div className="faq-list">
              {faqs.map((faq, idx) => (
                <details key={idx}>
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

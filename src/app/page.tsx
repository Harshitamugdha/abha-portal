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
                Log in with your ABHA number to see your records, approve or revoke doctors&apos; access, and see who
                looked.
              </p>
              <Link className="btn btn-accent btn-large" href="/login">
                Log in with ABHA
              </Link>
              <p className="hero-links">
                Work at a hospital, lab or pharmacy?{" "}
                <Link className="accent-link" href="/staff/login">
                  Staff login
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

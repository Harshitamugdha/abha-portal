import type { Language } from "@/server/i18n";
import enMessages from "../../../messages/en.json";
import hiMessages from "../../../messages/hi.json";

export const PATIENT_LINKS = [
  { href: "/patient", label: "Home" },
  { href: "/patient/records", label: "Records" },
  { href: "/patient/upload", label: "Upload" },
  { href: "/patient/consents", label: "Consents" },
  { href: "/patient/access-log", label: "Who viewed my records" },
];

export function getPatientLinks(lang: Language = "en") {
  const nav = lang === "hi" ? hiMessages.nav : enMessages.nav;
  return [
    { href: "/patient", label: nav.home },
    { href: "/patient/records", label: nav.records },
    { href: "/patient/upload", label: nav.upload },
    { href: "/patient/consents", label: nav.consents },
    { href: "/patient/access-log", label: nav.accessLog },
  ];
}

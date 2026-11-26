import { LanguageToggle } from "./language-toggle";
import { NavLinks } from "./nav-links";
import type { Language } from "@/server/i18n";
import enMessages from "../../../messages/en.json";
import hiMessages from "../../../messages/hi.json";

function getPublicLinks(lang: Language = "en") {
  const nav = lang === "hi" ? hiMessages.nav : enMessages.nav;
  return [
    { href: "/", label: nav.home },
    { href: "/institutions", label: nav.institutions },
    { href: "/#how-it-works", label: nav.howConsentWorks },
    { href: "/#faq", label: nav.faqs },
  ];
}

function getLoginLinks(lang: Language = "en") {
  const nav = lang === "hi" ? hiMessages.nav : enMessages.nav;
  return [
    { href: "/login", label: nav.patientLogin },
    { href: "/staff/login", label: nav.staffLogin },
  ];
}

export function PublicNav({
  lang = "en",
  showToggle = true,
}: {
  lang?: Language;
  showToggle?: boolean;
}) {
  return (
    <div className="topbar">
      <div className="topbar-inner">
        <NavLinks links={getPublicLinks(lang)} />
        <div className="nav-right" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {showToggle && <LanguageToggle current={lang} />}
          <NavLinks links={getLoginLinks(lang)} label="Login" className="nav-links" />
        </div>
      </div>
    </div>
  );
}

import { NavLinks } from "./nav-links";

const PUBLIC_LINKS = [
  { href: "/", label: "Home" },
  { href: "/institutions", label: "Institutions" },
  { href: "/#how-it-works", label: "How consent works" },
  { href: "/#faq", label: "FAQs" },
];

const LOGIN_LINKS = [
  { href: "/login", label: "Patient login" },
  { href: "/staff/login", label: "Staff login" },
];

export function PublicNav() {
  return (
    <div className="topbar">
      <div className="topbar-inner">
        <NavLinks links={PUBLIC_LINKS} />
        <NavLinks links={LOGIN_LINKS} label="Login" className="nav-links nav-right" />
      </div>
    </div>
  );
}

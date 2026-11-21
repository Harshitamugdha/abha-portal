import Link from "next/link";
import { LogoutButton } from "./logout-button";

type TopBarProps = {
  name: string;
  links: { href: string; label: string }[];
};

export function TopBar({ name, links }: TopBarProps) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <strong>ABHA Portal</strong>
        {links.map((link) => (
          <Link key={link.href} href={link.href}>
            {link.label}
          </Link>
        ))}
        <span className="topbar-name">{name}</span>
        <LogoutButton />
      </div>
    </header>
  );
}

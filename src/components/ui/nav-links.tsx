"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLinksProps = {
  links: { href: string; label: string }[];
};

function isInside(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

export function NavLinks({ links }: NavLinksProps) {
  const pathname = usePathname();

  let currentHref = "";
  for (const link of links) {
    if (isInside(pathname, link.href) && link.href.length > currentHref.length) {
      currentHref = link.href;
    }
  }

  return (
    <nav aria-label="Main" className="nav-links">
      {links.map((link) => (
        <Link key={link.href} href={link.href} aria-current={link.href === currentHref ? "page" : undefined}>
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

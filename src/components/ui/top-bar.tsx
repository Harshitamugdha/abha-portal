import type React from "react";
import { LogoutButton } from "./logout-button";
import { NavLinks } from "./nav-links";

type TopBarProps = {
  name: string;
  links: { href: string; label: string }[];
  extra?: React.ReactNode;
};

export function TopBar({ name, links, extra }: TopBarProps) {
  return (
    <div className="topbar">
      <div className="topbar-inner">
        <NavLinks links={links} />
        <div className="topbar-user">
          {extra}
          <span>Signed in as {name}</span>
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}

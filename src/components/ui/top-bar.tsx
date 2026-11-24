import { LogoutButton } from "./logout-button";
import { NavLinks } from "./nav-links";

type TopBarProps = {
  name: string;
  links: { href: string; label: string }[];
};

export function TopBar({ name, links }: TopBarProps) {
  return (
    <div className="topbar">
      <div className="topbar-inner">
        <NavLinks links={links} />
        <div className="topbar-user">
          <span>Signed in as {name}</span>
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}

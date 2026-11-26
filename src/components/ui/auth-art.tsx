import Image from "next/image";
import type { ReactNode } from "react";

type AuthShellProps = {
  art: "patient" | "staff";
  caption: string;
  aside?: ReactNode;
  children: ReactNode;
};

export function AuthShell({ art, caption, aside, children }: AuthShellProps) {
  let photo = "/auth/staff.jpg";
  if (art === "patient") {
    photo = "/auth/patient.jpg";
  }

  return (
    <div className="auth-shell">
      <div className="auth-visual">
        <div className="auth-visual-art">
          <Image src={photo} alt="" fill sizes="600px" priority />
        </div>
        <p className="auth-visual-caption">{caption}</p>
        {aside && <div className="auth-visual-aside">{aside}</div>}
      </div>
      <div className="auth-form-side">{children}</div>
    </div>
  );
}

type AuthHelpProps = {
  title: string;
  children: ReactNode;
};

export function AuthHelp({ title, children }: AuthHelpProps) {
  return (
    <section className="auth-help" aria-label={title}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

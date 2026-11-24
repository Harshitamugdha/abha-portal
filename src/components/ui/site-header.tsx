import Link from "next/link";

export function SiteHeader() {
  return (
    <>
      <div className="gov-strip">
        <div className="container">Student project demo · Not an official Government of India or ABDM service</div>
      </div>
      <header className="site-header">
        <div className="container">
          <Link href="/" className="brand">
            <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
              <rect width="40" height="40" rx="4" fill="#1b3a6b" />
              <rect x="16" y="8" width="8" height="24" fill="#ffffff" />
              <rect x="8" y="16" width="24" height="8" fill="#ffffff" />
            </svg>
            <span>
              <span className="brand-name">ABHA Health Portal</span>
              <br />
              <span className="brand-tagline">Your health records, shared only with your consent</span>
            </span>
          </Link>
        </div>
      </header>
    </>
  );
}

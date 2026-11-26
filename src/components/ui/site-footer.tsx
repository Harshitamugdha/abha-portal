import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer" aria-label="Site footer">
      <div className="container footer-columns">
        <div>
          <p className="footer-title">ABHA Health Portal</p>
          <p>
            One place to see your health records from every participating hospital. Doctors see them only while you
            allow it.
          </p>
        </div>
        <div>
          <p className="footer-title">For patients</p>
          <ul className="footer-links">
            <li>
              <Link href="/login" className="inline-block py-1">Log in with ABHA</Link>
            </li>
            <li>
              <Link href="/#how-it-works" className="inline-block py-1">How consent works</Link>
            </li>
            <li>
              <Link href="/#faq" className="inline-block py-1">FAQs</Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="footer-title">For staff</p>
          <ul className="footer-links">
            <li>
              <Link href="/staff/login" className="inline-block py-1">Staff login</Link>
            </li>
            <li>
              <Link href="/staff/register" className="inline-block py-1">Register as staff</Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <span>© 2026 ABHA Health Portal</span>
          <span>Times are shown in Indian Standard Time</span>
        </div>
      </div>
    </footer>
  );
}

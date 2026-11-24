import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-columns">
        <div>
          <h2>ABHA Health Portal</h2>
          <p>
            One place to see your health records from every participating hospital. Doctors see them only while you
            allow it.
          </p>
        </div>
        <div>
          <h2>For patients</h2>
          <ul className="footer-links">
            <li>
              <Link href="/login">Log in with ABHA</Link>
            </li>
            <li>
              <Link href="/#how-it-works">How consent works</Link>
            </li>
            <li>
              <Link href="/#faq">FAQs</Link>
            </li>
          </ul>
        </div>
        <div>
          <h2>For staff</h2>
          <ul className="footer-links">
            <li>
              <Link href="/staff/login">Staff login</Link>
            </li>
            <li>
              <Link href="/staff/register">Register as staff</Link>
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

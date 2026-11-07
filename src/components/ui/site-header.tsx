import Link from 'next/link';
import { ArrowUpLeft, Compass } from 'lucide-react';
export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/hotels" className="brand" aria-label="همراه؛ صفحه جست‌وجوی هتل">
          <span className="brand-symbol">
            <Compass size={26} strokeWidth={1.6} />
          </span>
          <span>
            همراه<span className="brand-dot">.</span>
            <small>قصه‌ی سفر از اینجا شروع می‌شود</small>
          </span>
        </Link>
        <nav aria-label="منوی اصلی">
          <Link href="/hotels" className="nav-current">
            هتل و اقامتگاه
          </Link>
          <Link href="/hotels#guide" className="nav-guide">
            راهنمای جست‌وجو
          </Link>
        </nav>
        <span className="header-note">
          ایران را آرام‌تر کشف کن <ArrowUpLeft size={17} />
        </span>
      </div>
    </header>
  );
}

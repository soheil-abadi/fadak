'use client';
import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { Compass, Menu, X } from 'lucide-react';

export function SiteHeader() {
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  function closeNav() {
    setOpen(false);
    trigger.current?.focus();
  }

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
        <nav className="header-nav-desktop" aria-label="منوی اصلی">
          <Link href="/hotels" className="nav-current">
            هتل و اقامتگاه
          </Link>
        </nav>
        <button
          ref={trigger}
          type="button"
          className="nav-menu-button"
          aria-expanded={open}
          aria-controls="mobile-nav-drawer"
          aria-label={open ? 'بستن منو' : 'باز کردن منو'}
          onClick={() => (open ? closeNav() : setOpen(true))}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {open && (
        <>
          <button
            type="button"
            className="nav-drawer-backdrop"
            aria-label="بستن منو"
            onClick={closeNav}
          />
          <div
            id="mobile-nav-drawer"
            className="nav-drawer-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
          >
            <h2 id={titleId} className="nav-drawer-title">
              منوی اصلی
            </h2>
            <nav aria-label="منوی موبایل" className="nav-drawer-links">
              <Link href="/hotels" className="nav-current" onClick={closeNav}>
                هتل و اقامتگاه
              </Link>
            </nav>
          </div>
        </>
      )}
    </header>
  );
}

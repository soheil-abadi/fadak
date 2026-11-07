import type { Metadata } from 'next';
import '@fontsource/vazirmatn/400.css';
import '@fontsource/vazirmatn/500.css';
import '@fontsource/vazirmatn/600.css';
import '@fontsource/vazirmatn/700.css';
import './globals.css';
import { SiteHeader } from '@/components/ui/site-header';
import { SiteFooter } from '@/components/ui/site-footer';
export const metadata: Metadata = {
  title: { default: 'همراه | یک اقامت خوب، شروع یک سفر خوب', template: '%s | همراه' },
  description:
    'جست‌وجو و مقایسه اقامتگاه‌ها در ایران با تقویم شمسی. نمونه نمایشی برای ارزیابی توسعه فرانت‌اند.',
  robots: { index: false, follow: false },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        <a className="skip-link" href="#main">
          رفتن به محتوای اصلی
        </a>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}

import { Compass, Heart } from 'lucide-react';
export function SiteFooter() {
  return (
    <footer className="site-footer" id="guide">
      <div className="container footer-inner">
        <div>
          <span className="footer-brand">
            <Compass size={20} /> همراه
          </span>
          <p>برای سفرهایی که به خاطره تبدیل می‌شوند.</p>
        </div>
        <div>
          <strong>ساده جست‌وجو کنید، آگاهانه انتخاب کنید</strong>
          <p>مقصد و تاریخ را انتخاب کنید، هتل‌ها را مقایسه کنید و خلاصه اقامت را ببینید.</p>
          <small>هتل‌ها، تصاویر و قیمت‌ها نمایشی‌اند؛ رزرو یا پرداخت واقعی انجام نمی‌شود.</small>
        </div>
        <span className="footer-sign">
          با حوصله، برای سفر <Heart size={14} />
        </span>
      </div>
    </footer>
  );
}

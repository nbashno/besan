import './globals.css';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'بيسان التعليمية',
  description: 'منصة تواصل المعلم والطالب — واجبات، حلول، وبطاقات تحفيزية',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#4c1d95',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <script src="https://telegram.org/js/telegram-web-app.js"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
window.addEventListener('load', function () {
  setTimeout(function () {
    var tg = window.Telegram && window.Telegram.WebApp;
    var id = tg && tg.initData ? tg.initData : '';
    var h = window.location.hash || '';
    var box = document.createElement('div');
    box.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:99999;background:#111;color:#0f0;font:11px monospace;padding:6px;white-space:pre-wrap;word-break:break-all;max-height:40vh;overflow:auto';
    box.textContent =
      'TG object: ' + (tg ? 'YES' : 'NO') +
      '\ninitData len: ' + id.length +
      '\nhash len: ' + h.length +
      '\nhash starts: ' + h.substring(0, 60) +
      '\ninitData starts: ' + id.substring(0, 80);
    document.body.appendChild(box);
  }, 1200);
});
`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

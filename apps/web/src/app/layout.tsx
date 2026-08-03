import './globals.css';
import type { Metadata, Viewport } from 'next';
import Script from 'next/script';

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
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

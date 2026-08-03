import React from 'react';

/**
 * لوغو بيسان التعليمية.
 * الفكرة: كتاب مفتوح تنبثق من صفحتيه نجمة المعرفة الصاعدة.
 * التدرّج بنفسجي (#4C1D95) → فيروزي (#14B8A6) هو توقيع الهوية.
 */
export function BaysanLogo({
  size = 48,
  withWordmark = false,
}: {
  size?: number;
  withWordmark?: boolean;
}) {
  const glyph = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="بيسان"
    >
      <defs>
        <linearGradient id="baysan-grad" x1="8" y1="56" x2="56" y2="8">
          <stop offset="0" stopColor="#4C1D95" />
          <stop offset="0.55" stopColor="#7C3AED" />
          <stop offset="1" stopColor="#14B8A6" />
        </linearGradient>
        <linearGradient id="baysan-star" x1="24" y1="4" x2="40" y2="30">
          <stop offset="0" stopColor="#2DD4BF" />
          <stop offset="1" stopColor="#7C3AED" />
        </linearGradient>
      </defs>

      {/* الكتاب المفتوح — صفحتان تلتقيان عند السرّة */}
      <path
        d="M32 26C26 20 16 19 9 21C8 21 7 22 7 23V50C7 51 8 52 9 51C16 49 26 50 32 55"
        stroke="url(#baysan-grad)"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M32 26C38 20 48 19 55 21C56 21 57 22 57 23V50C57 51 56 52 55 51C48 49 38 50 32 55"
        stroke="url(#baysan-grad)"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* نجمة المعرفة الصاعدة من الكتاب */}
      <path
        d="M32 6L35.2 16.2L45 18.5L37.5 24.5L39 34L32 28.8L25 34L26.5 24.5L19 18.5L28.8 16.2L32 6Z"
        fill="url(#baysan-star)"
      />
    </svg>
  );

  if (!withWordmark) return glyph;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: size * 0.28,
      }}
    >
      {glyph}
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: size * 0.62,
          background: 'linear-gradient(90deg,#4C1D95,#14B8A6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          letterSpacing: '-0.01em',
        }}
      >
        بيسان
      </span>
    </span>
  );
}

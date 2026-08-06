import React from 'react';

export function BaysanLogo({
  size = 48,
  withWordmark = false,
}: {
  size?: number;
  withWordmark?: boolean;
}) {
  const glyph = (
    <img
      src="/besan-icon.png"
      width={size}
      height={size}
      alt="بيسان"
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        borderRadius: size * 0.22,
        display: 'block',
      }}
    />
  );
  if (!withWordmark) return glyph;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: size * 0.28 }}>
      {glyph}
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: size * 0.62,
          color: 'var(--ink)',
          letterSpacing: '-0.01em',
        }}
      >
        بيسان
      </span>
    </span>
  );
}
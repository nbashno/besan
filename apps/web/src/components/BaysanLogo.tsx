import React from 'react';

export function BaysanLogo({
  size = 48,
  withWordmark = false,
}: {
  size?: number;
  withWordmark?: boolean;
}) {
  // الصورة الكاملة مربّعة (1254x1254) وتحوي اللوغو + النصوص
  return (
    <img
      src="/besan-logo.png"
      width={size}
      height={size}
      alt="بيسان التعليمية"
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        display: 'block',
      }}
    />
  );
}
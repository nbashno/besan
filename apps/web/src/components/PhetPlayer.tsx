'use client';

import { phetEmbedUrl } from '@/lib/phet-catalog';
import { PhetAttribution } from './PhetAttribution';

/**
 * مشغّل محاكاة PhET داخل المنصّة عبر iframe.
 * - sandbox يسمح بتشغيل المحاكاة فقط دون صلاحيات زائدة.
 * - التنويه بالبنط العريض تحت المحاكاة (إلزامي أينما عُرضت).
 * - لا استضافة: الرابط يشير مباشرةً لموقع PhET.
 */
export function PhetPlayer({
  slug,
  titleAr,
}: {
  slug: string;
  titleAr: string;
}) {
  return (
    <div>
      <div
        style={{
          position: 'relative',
          width: '100%',
          // نسبة PhET الرسمية 834×504
          aspectRatio: '834 / 504',
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
          border: '1px solid var(--border)',
          background: 'var(--surface-2)',
        }}
      >
        <iframe
          src={phetEmbedUrl(slug)}
          title={titleAr}
          loading="lazy"
          allowFullScreen
          // سماح ضيق: تشغيل السكربت والوصول لأصله فقط
          sandbox="allow-scripts allow-same-origin allow-popups"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            border: 'none',
          }}
        />
      </div>
      <PhetAttribution variant="bar" />
    </div>
  );
}

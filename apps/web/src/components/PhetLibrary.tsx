'use client';

import { useState, useMemo } from 'react';
import {
  searchPhet,
  PHET_SUBJECTS,
  PhetSubject,
  PhetSim,
} from '@/lib/phet-catalog';
import { PhetPlayer } from './PhetPlayer';
import { PhetAttribution } from './PhetAttribution';
import { EmptyState } from './ui';

/**
 * المكتبة العلمية المجانية.
 * متاحة لكل مستخدم مسجّل الدخول — بلا أي فحص اشتراك (PhET مجانية للجميع).
 * تُستخدم مستقلّة (تصفّح) أو كمنتقٍ لإرفاق محاكاة بواجب (onPick).
 */
export function PhetLibrary({
  onPick,
  onBack,
}: {
  onPick?: (sim: PhetSim) => void;
  onBack?: () => void;
}) {
  const [query, setQuery] = useState('');
  const [subject, setSubject] = useState<PhetSubject | undefined>(undefined);
  const [playing, setPlaying] = useState<PhetSim | null>(null);

  const results = useMemo(
    () => searchPhet(query, subject),
    [query, subject],
  );

  if (playing) {
    return (
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 16,
          }}
        >
          <button
            className="btn btn-ghost"
            onClick={() => setPlaying(null)}
            style={{ padding: '8px 14px' }}
          >
            →
          </button>
          <h2 style={{ fontSize: 18 }}>{playing.titleAr}</h2>
        </div>
        <PhetPlayer slug={playing.slug} titleAr={playing.titleAr} />
        {onPick && (
          <button
            className="btn btn-primary"
            onClick={() => onPick(playing)}
            style={{ width: '100%', marginTop: 14 }}
          >
            إرفاق هذه المحاكاة بالواجب
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 6,
        }}
      >
        {onBack && (
          <button
            className="btn btn-ghost"
            onClick={onBack}
            style={{ padding: '8px 14px' }}
          >
            →
          </button>
        )}
        <div>
          <div className="eyebrow">مجّانية للجميع</div>
          <h1 style={{ fontSize: 21 }}>المكتبة العلمية</h1>
        </div>
      </div>

      {/* التنويه بالبنط العريض أعلى المكتبة */}
      <div style={{ marginBottom: 14 }}>
        <PhetAttribution variant="inline" />
      </div>

      <input
        className="input"
        placeholder="ابحث… (مثال: قانون أوم، atom، كسور)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ marginBottom: 12 }}
      />

      <div
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          paddingBottom: 6,
          marginBottom: 16,
        }}
      >
        <FilterChip
          label="الكل"
          active={subject === undefined}
          onClick={() => setSubject(undefined)}
        />
        {PHET_SUBJECTS.map((s) => (
          <FilterChip
            key={s.id}
            label={s.ar}
            active={subject === s.id}
            onClick={() => setSubject(s.id)}
          />
        ))}
      </div>

      {results.length === 0 ? (
        <EmptyState
          title="لا نتائج"
          hint="جرّب كلمة أخرى أو غيّر تصنيف المادة."
        />
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {results.map((sim) => (
            <div
              key={sim.slug}
              className="card"
              style={{ cursor: 'pointer' }}
              onClick={() => setPlaying(sim)}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <h3 style={{ fontSize: 15.5 }}>{sim.titleAr}</h3>
                  <div
                    style={{
                      color: 'var(--ink-faint)',
                      fontSize: 12.5,
                      marginTop: 2,
                    }}
                  >
                    {sim.titleEn}
                  </div>
                </div>
                <span className="chip">
                  {PHET_SUBJECTS.find((s) => s.id === sim.subject)?.ar}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        whiteSpace: 'nowrap',
        border: 'none',
        cursor: 'pointer',
        padding: '7px 15px',
        borderRadius: 999,
        fontFamily: 'var(--font-body)',
        fontWeight: 700,
        fontSize: 13.5,
        background: active ? 'var(--grad-brand)' : 'var(--surface-2)',
        color: active ? '#fff' : 'var(--ink-soft)',
      }}
    >
      {label}
    </button>
  );
}

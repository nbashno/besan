'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

// ===== بطاقة إحصائية =====
export function StatCard({
  label,
  value,
  accent = 'purple',
}: {
  label: string;
  value: string | number;
  accent?: 'purple' | 'teal';
}) {
  return (
    <div className="card" style={{ padding: 18 }}>
      <div
        className="num"
        style={{
          fontSize: 30,
          fontWeight: 700,
          background:
            accent === 'teal'
              ? 'linear-gradient(120deg,#14b8a6,#2dd4bf)'
              : 'linear-gradient(120deg,#4c1d95,#7c3aed)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      <div style={{ color: 'var(--ink-soft)', fontSize: 13.5, marginTop: 4 }}>
        {label}
      </div>
    </div>
  );
}

// ===== حالة فارغة =====
export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      className="card"
      style={{ textAlign: 'center', padding: '40px 24px' }}
    >
      <div style={{ fontSize: 40, marginBottom: 10 }}>✦</div>
      <h3 style={{ fontSize: 18, marginBottom: 6 }}>{title}</h3>
      <p style={{ color: 'var(--ink-soft)', marginBottom: action ? 18 : 0 }}>
        {hint}
      </p>
      {action}
    </div>
  );
}

// ===== هيكل تحميل =====
export function Skeleton({ h = 72 }: { h?: number }) {
  return <div className="skeleton" style={{ height: h, marginBottom: 12 }} />;
}

// ===== توست =====
interface Toast {
  id: number;
  message: string;
  kind: 'ok' | 'error';
}
const ToastCtx = createContext<(m: string, k?: 'ok' | 'error') => void>(
  () => {},
);
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((message: string, kind: 'ok' | 'error' = 'ok') => {
    const id = Date.now();
    setToasts((t) => [...t, { id, message, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div
        style={{
          position: 'fixed',
          bottom: 20,
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          zIndex: 100,
          pointerEvents: 'none',
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              background: t.kind === 'ok' ? 'var(--ink)' : 'var(--danger)',
              color: '#fff',
              padding: '11px 18px',
              borderRadius: 999,
              fontSize: 14,
              fontWeight: 600,
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

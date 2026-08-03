'use client';

import { useEffect, useState } from 'react';
import { login } from '@/lib/api';
import { initTelegram } from '@/lib/telegram';
import { BaysanLogo } from '@/components/BaysanLogo';
import { TeacherDashboard } from '@/components/TeacherDashboard';
import { StudentDashboard } from '@/components/StudentDashboard';
import { ToastProvider } from '@/components/ui';

type State =
  | { phase: 'loading' }
  | { phase: 'error'; message: string }
  | { phase: 'ready'; role: string; name: string; userId: string };

export default function Home() {
  const [state, setState] = useState<State>({ phase: 'loading' });

  useEffect(() => {
    const scheme = initTelegram();
    document.documentElement.setAttribute('data-theme', scheme);
    login()
      .then((r) =>
        setState({
          phase: 'ready',
          role: r.role,
          name: r.firstName,
          userId: r.userId,
        }),
      )
      .catch((e) =>
        setState({
          phase: 'error',
          message: e?.message ?? 'تعذّر تسجيل الدخول',
        }),
      );
  }, []);

  if (state.phase === 'loading') {
    return <SplashScreen />;
  }

  if (state.phase === 'error') {
    return (
      <div style={centerStyle}>
        <BaysanLogo size={64} />
        <p style={{ marginTop: 20, color: 'var(--danger)', fontWeight: 600 }}>
          {state.message}
        </p>
        <p style={{ color: 'var(--ink-soft)', marginTop: 8, fontSize: 14 }}>
          افتح التطبيق من داخل Telegram للمتابعة.
        </p>
      </div>
    );
  }

  const isTeacher = ['TEACHER', 'BRANCH_ADMIN', 'GROUP_ADMIN'].includes(
    state.role,
  );

  return (
    <ToastProvider>
      {isTeacher ? (
        <TeacherDashboard name={state.name} userId={state.userId} />
      ) : (
        <StudentDashboard name={state.name} userId={state.userId} />
      )}
    </ToastProvider>
  );
}

function SplashScreen() {
  return (
    <div style={centerStyle}>
      <div className="baysan-pulse">
        <BaysanLogo size={72} />
      </div>
      <div
        style={{
          marginTop: 22,
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 22,
          background: 'var(--grad-brand)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        بيسان التعليمية
      </div>
      <style>{`
        .baysan-pulse { animation: bpulse 1.6s ease-in-out infinite; }
        @keyframes bpulse {
          0%,100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.08); opacity: .82; }
        }
      `}</style>
    </div>
  );
}

const centerStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
  textAlign: 'center',
};

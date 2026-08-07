'use client';

import { useEffect, useState } from 'react';
import { login } from '@/lib/api';
import { initTelegram, getStartParam } from '@/lib/telegram';
import { BaysanLogo } from '@/components/BaysanLogo';
import { ProfileSetup } from '@/components/ProfileSetup';
import { TeacherDashboard } from '@/components/TeacherDashboard';
import { StudentDashboard } from '@/components/StudentDashboard';
import { ToastProvider } from '@/components/ui';

type State =
  | { phase: 'loading' }
  | { phase: 'error'; message: string }
  | { phase: 'setup'; name: string; forcedRole?: 'TEACHER' | 'STUDENT' }
  | { phase: 'ready'; role: string; name: string; userId: string };

const MIN_SPLASH_MS = 2800;

export default function Home() {
  const [state, setState] = useState<State>({ phase: 'loading' });
  const [splashDone, setSplashDone] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const scheme = initTelegram();
    document.documentElement.setAttribute('data-theme', scheme);
    const started = Date.now();

    login()
      .then((r) => {
        const wait = Math.max(0, MIN_SPLASH_MS - (Date.now() - started));
        setTimeout(() => {
          r.profileComplete
          ? setState({ phase: 'ready', role: r.role, name: r.displayName || r.firstName, userId: r.userId })
          : setState({ phase: 'setup', name: r.displayName || r.firstName || '', forcedRole: getStartParam() ? 'STUDENT' : undefined });
        }, wait);
      })
      .catch((e) => {
        const wait = Math.max(0, MIN_SPLASH_MS - (Date.now() - started));
        setTimeout(() => {
          setState({
            phase: 'error',
            message: e?.message ?? 'تعذّر تسجيل الدخول',
          });
        }, wait);
      });

    // بدء التلاشي قبيل انتهاء المدة
    const fadeTimer = setTimeout(() => setFadeOut(true), MIN_SPLASH_MS - 500);
    const doneTimer = setTimeout(() => setSplashDone(true), MIN_SPLASH_MS);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, []);

  // الـsplash يظهر حتى تكتمل مدته الدنيا
  if (!splashDone || state.phase === 'loading') {
    return <SplashScreen fadeOut={fadeOut} />;
  }

  if (state.phase === 'setup') {
    return (
      <ProfileSetup
        initialName={state.name}
        forcedRole={state.forcedRole}
        onDone={(r) =>
          setState({ phase: 'ready', role: r.role, name: r.displayName || r.firstName, userId: r.userId })
        }
      />
    );
  }

  if (state.phase === 'error') {
    return (
      <div style={centerStyle}>
        <BaysanLogo size={120} />
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
      <div style={{ animation: 'besanFadeIn 0.5s ease' }}>
        {isTeacher ? (
          <TeacherDashboard name={state.name} userId={state.userId} />
        ) : (
          <StudentDashboard name={state.name} userId={state.userId} />
        )}
      </div>
      <style>{`
        @keyframes besanFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </ToastProvider>
  );
}

function SplashScreen({ fadeOut }: { fadeOut: boolean }) {
  return (
    <div
      style={{
        ...centerStyle,
        background: 'var(--bg)',
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 0.5s ease',
      }}
    >
      <div className="besan-splash-logo">
        <img
          src="/besan-logo.png"
          alt="بيسان التعليمية"
          style={{
            width: 'min(78vw, 300px)',
            height: 'auto',
            objectFit: 'contain',
            display: 'block',
          }}
        />
      </div>

      <div className="besan-splash-bar" aria-hidden>
        <span />
      </div>

      <style>{`
        .besan-splash-logo {
          animation: besanLogoIn 0.9s cubic-bezier(.2,.7,.2,1) both;
        }
        @keyframes besanLogoIn {
          0% { opacity: 0; transform: scale(0.92) translateY(10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .besan-splash-bar {
          margin-top: 30px;
          width: 140px;
          height: 4px;
          border-radius: 999px;
          background: var(--surface-2);
          overflow: hidden;
        }
        .besan-splash-bar span {
          display: block;
          height: 100%;
          width: 40%;
          border-radius: 999px;
          background: var(--grad-brand);
          animation: besanBar 1.3s ease-in-out infinite;
        }
        @keyframes besanBar {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(360%); }
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

'use client';

import { useState } from 'react';
import { completeProfile, type AuthResult } from '@/lib/api';
import { BaysanLogo } from './BaysanLogo';

type Role = 'TEACHER' | 'STUDENT';

export function ProfileSetup({
  initialName,
  forcedRole,
  onDone,
}: {
  initialName?: string;
  forcedRole?: Role;
  onDone: (r: AuthResult) => void;
}) {
  const [step, setStep] = useState<'role' | 'details'>(forcedRole ? 'details' : 'role');
  const [role, setRole] = useState<Role>(forcedRole ?? 'STUDENT');
  const [name, setName] = useState(initialName ?? '');
  const [school, setSchool] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const pickRole = (r: Role) => { setRole(r); setStep('details'); };

  const submit = async () => {
    if (!name.trim()) { setErr('أدخل اسمك'); return; }
    setBusy(true); setErr('');
    try {
      const r = await completeProfile({
        displayName: name.trim(),
        role,
        schoolName: role === 'TEACHER' ? (school.trim() || undefined) : undefined,
      });
      onDone(r);
    } catch { setErr('تعذّر الحفظ، حاول مجددًا'); setBusy(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, maxWidth: 480, margin: '0 auto' }}>
      <div style={{ marginBottom: 26 }}><BaysanLogo size={72} /></div>

      {step === 'role' && (
        <div style={{ width: '100%', animation: 'psFade .4s ease' }}>
          <h1 style={{ fontSize: 26, textAlign: 'center', marginBottom: 6, fontFamily: 'var(--font-display)' }}>مرحبًا بك في بيسان</h1>
          <p style={{ textAlign: 'center', color: 'var(--ink-soft)', marginBottom: 28 }}>كيف ستستخدم المنصة؟</p>
          <button onClick={() => pickRole('TEACHER')} style={roleCard}>
            <span style={{ fontSize: 30 }}>👩‍🏫</span>
            <span><span style={roleTitle}>أنا معلّم</span><span style={roleDesc}>أنشئ صفوفًا واختبارات وتابع طلابي</span></span>
          </button>
          <button onClick={() => pickRole('STUDENT')} style={{ ...roleCard, marginBottom: 0 }}>
            <span style={{ fontSize: 30 }}>🎓</span>
            <span><span style={roleTitle}>أنا طالب</span><span style={roleDesc}>انضمّ لصفوفي وحلّ الاختبارات</span></span>
          </button>
        </div>
      )}

      {step === 'details' && (
        <div style={{ width: '100%', animation: 'psFade .4s ease' }}>
          <h1 style={{ fontSize: 24, textAlign: 'center', marginBottom: 6, fontFamily: 'var(--font-display)' }}>{role === 'TEACHER' ? 'أهلًا أيها المعلم' : 'أهلًا أيها الطالب'}</h1>
          <p style={{ textAlign: 'center', color: 'var(--ink-soft)', marginBottom: 26 }}>أكمل بياناتك للمتابعة</p>
          <label style={fieldLabel}>الاسم الكامل</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: أحمد محمد" style={{ marginBottom: 18 }} />
          {role === 'TEACHER' && (
            <>
              <label style={fieldLabel}>اسم المدرسة <span style={{ color: 'var(--ink-faint)' }}>(اختياري)</span></label>
              <input className="input" value={school} onChange={(e) => setSchool(e.target.value)} placeholder="اتركه فارغًا إن كنت مستقلًّا" style={{ marginBottom: 6 }} />
              <p style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginBottom: 20, lineHeight: 1.6 }}>إن كتبت اسم مدرستك، سيُجمع معلموها تلقائيًا تحت اسمها.</p>
            </>
          )}
          {err && <p style={{ color: 'var(--danger)', fontSize: 13.5, marginBottom: 14 }}>{err}</p>}
          <button onClick={submit} disabled={busy} className="btn btn-primary" style={{ width: '100%', opacity: busy ? 0.7 : 1, marginBottom: 10 }}>{busy ? 'جارٍ الحفظ…' : 'المتابعة'}</button>
          {!forcedRole && <button onClick={() => setStep('role')} className="btn btn-ghost" style={{ width: '100%' }}>رجوع</button>}
        </div>
      )}

      <style>{`@keyframes psFade { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}

const roleCard: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 16, width: '100%', textAlign: 'right', background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 18, padding: '20px 18px', marginBottom: 14, cursor: 'pointer', boxShadow: 'var(--shadow-sm)', fontFamily: 'var(--font-body)' };
const roleTitle: React.CSSProperties = { display: 'block', fontSize: 18, fontWeight: 700, color: 'var(--ink)', marginBottom: 2 };
const roleDesc: React.CSSProperties = { display: 'block', fontSize: 13.5, color: 'var(--ink-soft)' };
const fieldLabel: React.CSSProperties = { display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 };

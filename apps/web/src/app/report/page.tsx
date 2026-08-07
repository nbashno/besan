'use client';

import { useEffect, useState, Suspense } from 'react';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:4000/api/v1';

interface ReportData {
  student: { name: string; className: string };
  teacher: { name: string };
  school: string | null;
  period: { month: string; year: number };
  stats: {
    totalQuizzes: number;
    completed: number;
    completionRate: number;
    average: number;
    highest: number;
    lowest: number;
    onTimeRate: number;
  };
  quizzes: { title: string; score: number | null; total: number; date: string; status: 'graded' | 'pending' }[];
  strengths: string[];
  improvements: string[];
}

function ReportContent() {
  const [data, setData] = useState<ReportData | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const s = p.get('s');
    const c = p.get('c');
    if (!s || !c) {
      setErr(true);
      return;
    }
    fetch(`${API_BASE}/reports/student?s=${s}&c=${c}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setData(j.data);
        else setErr(true);
      })
      .catch(() => setErr(true));
  }, []);

  if (err) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center' }}>
        <p style={{ color: 'var(--ink-soft)' }}>تعذّر تحميل التقرير. تأكّد من الرابط.</p>
      </div>
    );
  }
  if (!data) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <div className="besan-spin" style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid var(--surface-2)', borderTopColor: 'var(--accent-500)' }} />
        <style>{`.besan-spin{animation:sp 0.8s linear infinite}@keyframes sp{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const s = data.stats;
  const grade =
    s.average >= 90 ? { label: 'ممتاز', color: 'var(--ok)' }
    : s.average >= 80 ? { label: 'جيد جدًا', color: 'var(--accent-500)' }
    : s.average >= 70 ? { label: 'جيد', color: 'var(--accent-400)' }
    : s.average >= 60 ? { label: 'مقبول', color: 'var(--warn)' }
    : { label: 'يحتاج جهدًا', color: 'var(--danger)' };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '30px 16px' }}>
      <div className="cert">
        {/* الترويسة */}
        <div className="cert-head">
          <img src="/besan-icon.png" alt="بيسان" className="cert-logo" />
          <div className="cert-brand">بيسان التعليمية</div>
          {data.school && <div className="cert-school">{data.school}</div>}
          <div className="cert-title">تقرير الأداء الشهري</div>
          <div className="cert-period">{data.period.month} {data.period.year}</div>
        </div>

        {/* بيانات الطالب */}
        <div className="cert-student">
          <div className="cert-name">{data.student.name}</div>
          <div className="cert-meta">
            <span>الصف: {data.student.className}</span>
            <span>·</span>
            <span>المعلم: {data.teacher.name}</span>
          </div>
        </div>

        {/* الدرجة الكبرى */}
        <div className="cert-score-ring">
          <div className="ring" style={{ background: `conic-gradient(${grade.color} ${s.average * 3.6}deg, var(--surface-2) 0)` }}>
            <div className="ring-in">
              <div className="ring-num">{s.average}<span>%</span></div>
              <div className="ring-lbl" style={{ color: grade.color }}>{grade.label}</div>
            </div>
          </div>
        </div>

        {/* إحصائيات */}
        <div className="cert-stats">
          <div className="stat"><div className="sv">{s.totalQuizzes}</div><div className="sl">اختبارات</div></div>
          <div className="stat"><div className="sv">{s.completionRate}%</div><div className="sl">نسبة الإنجاز</div></div>
          <div className="stat"><div className="sv">{s.highest}%</div><div className="sl">أعلى درجة</div></div>
          <div className="stat"><div className="sv">{s.onTimeRate}%</div><div className="sl">الالتزام بالموعد</div></div>
        </div>

        {/* تفصيل الاختبارات */}
        {data.quizzes.length > 0 && (
          <div className="cert-section">
            <h3>تفصيل الاختبارات</h3>
            {data.quizzes.map((q, i) => (
              <div key={i} className="qrow">
                <span className="qt">{q.title}</span>
                <span className="qs">
                  {q.status === 'graded'
                    ? <b style={{ color: 'var(--accent-500)' }}>{q.score}/{q.total}</b>
                    : <span style={{ color: 'var(--warn)', fontSize: 13 }}>بانتظار التصحيح</span>}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* القوة والتحسين */}
        <div className="cert-cols">
          <div className="col">
            <h4 style={{ color: 'var(--ok)' }}>نقاط القوة</h4>
            {data.strengths.map((x, i) => <p key={i}>✓ {x}</p>)}
          </div>
          <div className="col">
            <h4 style={{ color: 'var(--warn)' }}>فرص التحسين</h4>
            {data.improvements.map((x, i) => <p key={i}>• {x}</p>)}
          </div>
        </div>

        {/* التذييل */}
        <div className="cert-foot">
          <div className="seal">بيسان</div>
          <div className="foot-text">
            صدر هذا التقرير آليًا من منصة بيسان التعليمية<br />
            {data.school ? `بالشراكة مع ${data.school}` : 'منصة تعليمية'}
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: 18 }}>
        <button onClick={() => window.print()} className="btn btn-ghost">🖨️ حفظ / طباعة</button>
      </div>

      <style>{`
        .cert {
          max-width: 640px; margin: 0 auto; background: var(--surface);
          border: 1px solid var(--border); border-radius: 24px; overflow: hidden;
          box-shadow: var(--shadow-lg); position: relative;
        }
        .cert::before {
          content: ''; position: absolute; inset: 8px; border: 2px solid var(--accent-500);
          border-radius: 18px; opacity: 0.14; pointer-events: none;
        }
        .cert-head {
          text-align: center; padding: 34px 24px 24px; background: var(--grad-brand); color: #fff;
        }
        .cert-logo { width: 66px; height: 66px; border-radius: 16px; object-fit: contain; margin-bottom: 10px; }
        .cert-brand { font-family: var(--font-display); font-size: 22px; font-weight: 700; }
        .cert-school { font-size: 14px; opacity: 0.9; margin-top: 2px; }
        .cert-title { font-family: var(--font-display); font-size: 17px; margin-top: 14px; opacity: 0.95; }
        .cert-period { font-size: 13px; opacity: 0.8; margin-top: 2px; letter-spacing: 0.05em; }
        .cert-student { text-align: center; padding: 24px; }
        .cert-name { font-family: var(--font-display); font-size: 28px; font-weight: 700; color: var(--ink); }
        .cert-meta { display: flex; gap: 10px; justify-content: center; color: var(--ink-soft); font-size: 14px; margin-top: 6px; }
        .cert-score-ring { display: grid; place-items: center; padding: 8px 0 20px; }
        .ring { width: 150px; height: 150px; border-radius: 50%; display: grid; place-items: center; }
        .ring-in { width: 122px; height: 122px; border-radius: 50%; background: var(--surface); display: grid; place-items: center; text-align: center; }
        .ring-num { font-family: var(--font-display); font-size: 38px; font-weight: 700; color: var(--ink); }
        .ring-num span { font-size: 18px; color: var(--ink-faint); }
        .ring-lbl { font-size: 14px; font-weight: 700; margin-top: 2px; }
        .cert-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; padding: 0 24px 20px; }
        .cert-stats .stat { background: var(--surface-2); border-radius: 14px; padding: 14px 6px; text-align: center; }
        .cert-stats .sv { font-family: var(--font-display); font-size: 21px; font-weight: 700; color: var(--accent-500); }
        .cert-stats .sl { font-size: 11px; color: var(--ink-soft); margin-top: 3px; }
        .cert-section { padding: 0 24px 20px; }
        .cert-section h3 { font-size: 16px; margin-bottom: 12px; color: var(--ink); }
        .qrow { display: flex; justify-content: space-between; align-items: center; padding: 11px 0; border-bottom: 1px solid var(--border); }
        .qrow:last-child { border-bottom: none; }
        .qt { font-size: 14.5px; color: var(--ink); }
        .cert-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 4px 24px 24px; }
        .cert-cols h4 { font-size: 14px; margin-bottom: 8px; }
        .cert-cols p { font-size: 13px; color: var(--ink-soft); line-height: 1.7; margin-bottom: 4px; }
        .cert-foot { border-top: 1px solid var(--border); padding: 22px 24px; display: flex; align-items: center; gap: 16px; }
        .seal {
          width: 60px; height: 60px; border-radius: 50%; border: 2px solid var(--accent-500);
          color: var(--accent-500); display: grid; place-items: center; font-family: var(--font-display);
          font-weight: 700; font-size: 15px; opacity: 0.7; flex-shrink: 0; transform: rotate(-8deg);
        }
        .foot-text { font-size: 12px; color: var(--ink-faint); line-height: 1.7; }
        @media print {
          .btn { display: none !important; }
          body { background: #fff !important; }
        }
      `}</style>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={null}>
      <ReportContent />
    </Suspense>
  );
}

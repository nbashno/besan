'use client';

import { useEffect, useState, useCallback } from 'react';
import { api, uploadViaSignedUrl } from '@/lib/api';
import { BaysanLogo } from './BaysanLogo';
import { StatCard, EmptyState, Skeleton, useToast } from './ui';
import { PhetLibrary } from './PhetLibrary';
import type { PhetSim } from '@/lib/phet-catalog';

interface ClassItem {
  id: string;
  name: string;
  description?: string | null;
  code: string;
  memberCount: number;
  archived: boolean;
}
interface Assignment {
  id: string;
  title: string;
  description?: string | null;
  dueAt?: string | null;
  maxGrade?: number | null;
  published: boolean;
}
interface Submission {
  id: string;
  studentId: string;
  status: string;
  isLate: boolean;
  version: number;
}
interface ClassStats {
  studentCount: number;
  assignmentsPublished: number;
  submissionsTotal: number;
  lateSubmissions: number;
  submissionRate: number;
  averageGrade: number | null;
}

type View =
  | { name: 'classes' }
  | { name: 'library' }
  | { name: 'class'; cls: ClassItem }
  | { name: 'assignment'; cls: ClassItem; assignment: Assignment };

export function TeacherDashboard({
  name,
}: {
  name: string;
  userId: string;
}) {
  const [view, setView] = useState<View>({ name: 'classes' });

  if (view.name === 'library') {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '16px 16px 60px' }}>
        <PhetLibrary onBack={() => setView({ name: 'classes' })} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '16px 16px 60px' }}>
      <Header name={name} subtitle="لوحة المعلم" />
      {view.name === 'classes' && (
        <>
          <button
            className="btn btn-ghost"
            onClick={() => setView({ name: 'library' })}
            style={{
              width: '100%',
              justifyContent: 'flex-start',
              marginBottom: 16,
              padding: '14px 16px',
              gap: 10,
            }}
          >
            🔬 المكتبة العلمية — محاكيات PhET المجانية
          </button>
          <ClassesView onOpen={(cls) => setView({ name: 'class', cls })} />
        </>
      )}
      {view.name === 'class' && (
        <ClassView
          cls={view.cls}
          onBack={() => setView({ name: 'classes' })}
          onOpenAssignment={(assignment) =>
            setView({ name: 'assignment', cls: view.cls, assignment })
          }
        />
      )}
      {view.name === 'assignment' && (
        <AssignmentView
          cls={view.cls}
          assignment={view.assignment}
          onBack={() => setView({ name: 'class', cls: view.cls })}
        />
      )}
    </div>
  );
}

function Header({ name, subtitle }: { name: string; subtitle: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 22,
      }}
    >
      <BaysanLogo size={40} />
      <div>
        <div className="eyebrow">{subtitle}</div>
        <h1 style={{ fontSize: 22 }}>أهلًا، {name}</h1>
      </div>
    </div>
  );
}

// ===== قائمة الصفوف =====
function ClassesView({ onOpen }: { onOpen: (c: ClassItem) => void }) {
  const [classes, setClasses] = useState<ClassItem[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const toast = useToast();

  const load = useCallback(() => {
    api
      .get<{ items: ClassItem[] }>('/classes/owned')
      .then((r) => setClasses(r.items))
      .catch(() => setClasses([]));
  }, []);

  useEffect(load, [load]);

  const create = async () => {
    if (!newName.trim()) return;
    try {
      await api.post('/classes', { name: newName.trim() });
      setNewName('');
      setCreating(false);
      toast('تم إنشاء الصف');
      load();
    } catch {
      toast('تعذّر الإنشاء', 'error');
    }
  };

  if (!classes) return <><Skeleton /><Skeleton /><Skeleton /></>;

  return (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 14,
        }}
      >
        <h2 style={{ fontSize: 17 }}>صفوفي</h2>
        <button className="btn btn-primary" onClick={() => setCreating(!creating)}>
          + صف جديد
        </button>
      </div>

      {creating && (
        <div className="card" style={{ marginBottom: 14 }}>
          <input
            className="input"
            placeholder="اسم الصف (مثال: الصف السابع - رياضيات)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            style={{ marginBottom: 10 }}
          />
          <button className="btn btn-primary" onClick={create} style={{ width: '100%' }}>
            إنشاء
          </button>
        </div>
      )}

      {classes.length === 0 ? (
        <EmptyState
          title="لا صفوف بعد"
          hint="أنشئ صفك الأول وشارك رمزه مع الطلاب."
        />
      ) : (
        classes.map((c) => (
          <div
            key={c.id}
            className="card"
            style={{ marginBottom: 12, cursor: 'pointer' }}
            onClick={() => onOpen(c)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: 16 }}>{c.name}</h3>
              <span className="chip">{c.memberCount} طالب</span>
            </div>
            <div
              style={{
                marginTop: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span className="eyebrow">رمز الصف</span>
              <code
                className="num"
                style={{
                  background: 'var(--surface-2)',
                  padding: '3px 10px',
                  borderRadius: 8,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                }}
              >
                {c.code}
              </code>
            </div>
          </div>
        ))
      )}
    </>
  );
}

// ===== تفاصيل الصف: إحصاءات + واجبات =====
function ClassView({
  cls,
  onBack,
  onOpenAssignment,
}: {
  cls: ClassItem;
  onBack: () => void;
  onOpenAssignment: (a: Assignment) => void;
}) {
  const [stats, setStats] = useState<ClassStats | null>(null);
  const [assignments, setAssignments] = useState<Assignment[] | null>(null);
  const [showNew, setShowNew] = useState(false);
  const toast = useToast();

  const load = useCallback(() => {
    api.get<ClassStats>(`/analytics/class/${cls.id}`).then(setStats).catch(() => {});
    api
      .get<{ items: Assignment[] }>(`/assignments/class/${cls.id}`)
      .then((r) => setAssignments(r.items))
      .catch(() => setAssignments([]));
  }, [cls.id]);

  useEffect(load, [load]);

  return (
    <>
      <BackBar title={cls.name} onBack={onBack} />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          marginBottom: 18,
        }}
      >
        <StatCard label="طلاب" value={stats?.studentCount ?? '—'} />
        <StatCard
          label="نسبة التسليم"
          value={stats ? `${Math.round(stats.submissionRate * 100)}%` : '—'}
          accent="teal"
        />
        <StatCard label="واجبات منشورة" value={stats?.assignmentsPublished ?? '—'} />
        <StatCard
          label="متوسط الدرجات"
          value={stats?.averageGrade != null ? stats.averageGrade.toFixed(1) : '—'}
          accent="teal"
        />
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <h2 style={{ fontSize: 17 }}>الواجبات</h2>
        <button className="btn btn-primary" onClick={() => setShowNew(!showNew)}>
          + واجب
        </button>
      </div>

      {showNew && (
        <NewAssignment
          classId={cls.id}
          onDone={() => {
            setShowNew(false);
            toast('تم إنشاء الواجب');
            load();
          }}
        />
      )}

      {!assignments ? (
        <><Skeleton /><Skeleton /></>
      ) : assignments.length === 0 ? (
        <EmptyState title="لا واجبات" hint="أنشئ واجبًا وانشره ليصل الطلاب فورًا." />
      ) : (
        assignments.map((a) => (
          <div
            key={a.id}
            className="card"
            style={{ marginBottom: 10, cursor: 'pointer' }}
            onClick={() => onOpenAssignment(a)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: 15.5 }}>{a.title}</h3>
              <span className={a.published ? 'chip chip-ok' : 'chip'}>
                {a.published ? 'منشور' : 'مسودّة'}
              </span>
            </div>
            {a.dueAt && (
              <div style={{ color: 'var(--ink-soft)', fontSize: 13, marginTop: 6 }}>
                التسليم: {new Date(a.dueAt).toLocaleDateString('ar')}
              </div>
            )}
          </div>
        ))
      )}
    </>
  );
}

function NewAssignment({
  classId,
  onDone,
}: {
  classId: string;
  onDone: () => void;
}) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [due, setDue] = useState('');
  const [max, setMax] = useState('');
  const [phet, setPhet] = useState<PhetSim | null>(null);
  const [picking, setPicking] = useState(false);
  const toast = useToast();

  const submit = async () => {
    if (!title.trim()) return;
    try {
      const a = await api.post<{ id: string }>('/assignments', {
        classId,
        title: title.trim(),
        description: desc.trim() || undefined,
        dueAt: due ? new Date(due).toISOString() : undefined,
        maxGrade: max ? Number(max) : undefined,
        phetSlug: phet?.slug,
      });
      await api.post(`/assignments/${a.id}/publish`);
      onDone();
    } catch {
      toast('تعذّر الإنشاء', 'error');
    }
  };

  if (picking) {
    return (
      <div className="card" style={{ marginBottom: 14 }}>
        <PhetLibrary
          onBack={() => setPicking(false)}
          onPick={(sim) => {
            setPhet(sim);
            setPicking(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="card" style={{ marginBottom: 14 }}>
      <input
        className="input"
        placeholder="عنوان الواجب"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{ marginBottom: 10 }}
      />
      <textarea
        className="textarea"
        placeholder="وصف / تعليمات (اختياري)"
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        style={{ marginBottom: 10 }}
      />
      <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
        <input
          className="input"
          type="date"
          value={due}
          onChange={(e) => setDue(e.target.value)}
        />
        <input
          className="input"
          type="number"
          placeholder="الدرجة القصوى"
          value={max}
          onChange={(e) => setMax(e.target.value)}
        />
      </div>

      {/* إرفاق محاكاة PhET (اختياري) */}
      {phet ? (
        <div
          className="card"
          style={{
            marginBottom: 10,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 14px',
          }}
        >
          <span style={{ fontWeight: 600 }}>🔬 {phet.titleAr}</span>
          <button
            className="btn btn-ghost"
            onClick={() => setPhet(null)}
            style={{ padding: '6px 12px' }}
          >
            إزالة
          </button>
        </div>
      ) : (
        <button
          className="btn btn-ghost"
          onClick={() => setPicking(true)}
          style={{ width: '100%', marginBottom: 10 }}
        >
          🔬 إرفاق محاكاة تفاعلية
        </button>
      )}

      <button className="btn btn-primary" onClick={submit} style={{ width: '100%' }}>
        إنشاء ونشر
      </button>
    </div>
  );
}

// ===== واجب: التسليمات + تصحيح + بطاقة تحفيزية =====
function AssignmentView({
  assignment,
  onBack,
}: {
  cls: ClassItem;
  assignment: Assignment;
  onBack: () => void;
}) {
  const [subs, setSubs] = useState<Submission[] | null>(null);
  const [grading, setGrading] = useState<Submission | null>(null);
  const toast = useToast();

  const load = useCallback(() => {
    api
      .get<Submission[]>(`/submissions/assignment/${assignment.id}/all`)
      .then(setSubs)
      .catch(() => setSubs([]));
  }, [assignment.id]);

  useEffect(load, [load]);

  return (
    <>
      <BackBar title={assignment.title} onBack={onBack} />

      {!subs ? (
        <><Skeleton /><Skeleton /></>
      ) : subs.length === 0 ? (
        <EmptyState title="لا تسليمات بعد" hint="سيظهر حلّ كل طالب هنا فور تسليمه." />
      ) : (
        subs.map((s) => (
          <div key={s.id} className="card" style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600 }}>طالب #{s.studentId.slice(-4)}</span>
              <StatusChip status={s.status} isLate={s.isLate} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={() => setGrading(s)}
              >
                تصحيح
              </button>
              <RewardButton studentId={s.studentId} onDone={() => toast('أُرسلت البطاقة')} />
            </div>
          </div>
        ))
      )}

      {grading && (
        <GradeModal
          submission={grading}
          maxGrade={assignment.maxGrade ?? null}
          onClose={() => setGrading(null)}
          onGraded={() => {
            setGrading(null);
            toast('تم التصحيح');
            load();
          }}
        />
      )}
    </>
  );
}

function GradeModal({
  submission,
  maxGrade,
  onClose,
  onGraded,
}: {
  submission: Submission;
  maxGrade: number | null;
  onClose: () => void;
  onGraded: () => void;
}) {
  const [value, setValue] = useState('');
  const [feedback, setFeedback] = useState('');
  const toast = useToast();

  const submit = async () => {
    if (!value) return;
    try {
      await api.post(`/submissions/${submission.id}/grade`, {
        value: Number(value),
        feedback: feedback.trim() || undefined,
      });
      onGraded();
    } catch (e: unknown) {
      toast((e as Error)?.message ?? 'تعذّر التصحيح', 'error');
    }
  };

  return (
    <Modal onClose={onClose} title="تصحيح الحل">
      <input
        className="input"
        type="number"
        placeholder={maxGrade ? `الدرجة (من ${maxGrade})` : 'الدرجة'}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        style={{ marginBottom: 10 }}
      />
      <textarea
        className="textarea"
        placeholder="ملاحظات للطالب (اختياري)"
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        style={{ marginBottom: 12 }}
      />
      <button className="btn btn-primary" onClick={submit} style={{ width: '100%' }}>
        اعتماد الدرجة
      </button>
    </Modal>
  );
}

function RewardButton({
  studentId,
  onDone,
}: {
  studentId: string;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('أداء متميز');
  const [msg, setMsg] = useState('');
  const [points, setPoints] = useState('10');
  const toast = useToast();

  const send = async () => {
    try {
      await api.post('/rewards/cards', {
        studentId,
        title: title.trim(),
        message: msg.trim() || title.trim(),
        pointValue: Number(points) || 0,
      });
      setOpen(false);
      onDone();
    } catch {
      toast('تعذّر الإرسال', 'error');
    }
  };

  return (
    <>
      <button className="btn btn-ghost" onClick={() => setOpen(true)}>
        🏅 بطاقة
      </button>
      {open && (
        <Modal onClose={() => setOpen(false)} title="بطاقة تحفيزية">
          <input
            className="input"
            placeholder="عنوان البطاقة"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ marginBottom: 10 }}
          />
          <textarea
            className="textarea"
            placeholder="رسالة تشجيعية"
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            style={{ marginBottom: 10 }}
          />
          <input
            className="input"
            type="number"
            placeholder="نقاط مرافقة"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            style={{ marginBottom: 12 }}
          />
          <button className="btn btn-primary" onClick={send} style={{ width: '100%' }}>
            إرسال البطاقة
          </button>
        </Modal>
      )}
    </>
  );
}

// ===== عناصر مساعدة =====
function BackBar({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
      <button
        className="btn btn-ghost"
        onClick={onBack}
        style={{ padding: '8px 14px' }}
      >
        →
      </button>
      <h2 style={{ fontSize: 18 }}>{title}</h2>
    </div>
  );
}

function StatusChip({ status, isLate }: { status: string; isLate: boolean }) {
  if (status === 'GRADED') return <span className="chip chip-graded">مُصحّح</span>;
  if (isLate) return <span className="chip chip-late">متأخر</span>;
  return <span className="chip chip-ok">مُسلّم</span>;
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.55)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        zIndex: 90,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card"
        style={{
          width: '100%',
          maxWidth: 560,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          animation: 'slideUp .22s ease',
        }}
      >
        <h3 style={{ fontSize: 17, marginBottom: 14 }}>{title}</h3>
        {children}
        <style>{`@keyframes slideUp{from{transform:translateY(30px);opacity:.6}to{transform:translateY(0);opacity:1}}`}</style>
      </div>
    </div>
  );
}

// نستخدم uploadViaSignedUrl في شاشة رفع مرفقات الواجب (مخطط للتوسعة)
void uploadViaSignedUrl;

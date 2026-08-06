'use client';

import { useEffect, useState, useCallback } from 'react';
import { api, uploadViaSignedUrl } from '@/lib/api';
import { BaysanLogo } from './BaysanLogo';
import { StatCard, EmptyState, Skeleton, useToast } from './ui';
import { PhetLibrary } from './PhetLibrary';
import { PhetPlayer } from './PhetPlayer';
import { QuizPlayer } from './QuizPlayer';

interface ClassItem {
  id: string;
  name: string;
  code: string;
  memberCount: number;
}
interface Assignment {
  id: string;
  title: string;
  description?: string | null;
  dueAt?: string | null;
  maxGrade?: number | null;
  phetSlug?: string | null;
  isQuiz?: boolean | null;
}
interface MySubmission {
  id: string;
  status: string;
  isLate: boolean;
  grade: { value: number; feedback?: string | null } | null;
}
interface RewardCard {
  id: string;
  title: string;
  message: string;
  pointValue: number;
  createdAt: string;
}

type View =
  | { name: 'home' }
  | { name: 'library' }
  | { name: 'class'; cls: ClassItem }
  | { name: 'assignment'; assignment: Assignment };

export function StudentDashboard({ name }: { name: string; userId: string }) {
  const [view, setView] = useState<View>({ name: 'home' });
  const [tab, setTab] = useState<'classes' | 'rewards'>('classes');

  if (view.name === 'library') {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '16px 16px 60px' }}>
        <PhetLibrary onBack={() => setView({ name: 'home' })} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '16px 16px 60px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <BaysanLogo size={40} />
        <div>
          <div className="eyebrow">لوحة الطالب</div>
          <h1 style={{ fontSize: 22 }}>مرحبًا، {name}</h1>
        </div>
      </div>

      {view.name === 'home' && (
        <>
          <PointsBanner />
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
            🔬 المكتبة العلمية — محاكيات تفاعلية مجانية
          </button>
          <Tabs tab={tab} setTab={setTab} />
          {tab === 'classes' ? (
            <ClassesTab onOpen={(cls) => setView({ name: 'class', cls })} />
          ) : (
            <RewardsTab />
          )}
        </>
      )}

      {view.name === 'class' && (
        <ClassAssignments
          cls={view.cls}
          onBack={() => setView({ name: 'home' })}
          onOpen={(a) => setView({ name: 'assignment', assignment: a })}
        />
      )}

      {view.name === 'assignment' && view.assignment.isQuiz && (
        <QuizPlayer
          assignmentId={view.assignment.id}
          onBack={() => setView({ name: 'home' })}
        />
      )}
      {view.name === 'assignment' && !view.assignment.isQuiz && (
        <AssignmentDetail
          assignment={view.assignment}
          onBack={() => setView({ name: 'home' })}
        />
      )}
    </div>
  );
}

function PointsBanner() {
  const [total, setTotal] = useState<number | null>(null);
  useEffect(() => {
    api.get<{ total: number }>('/rewards/points/mine').then((r) => setTotal(r.total)).catch(() => setTotal(0));
  }, []);
  return (
    <div
      className="card"
      style={{
        background: 'var(--grad-brand)',
        border: 'none',
        color: '#fff',
        marginBottom: 18,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <div>
        <div style={{ opacity: 0.85, fontSize: 13, fontWeight: 600 }}>رصيد نقاطي</div>
        <div className="num" style={{ fontSize: 34, fontWeight: 700, lineHeight: 1.1 }}>
          {total ?? '—'}
        </div>
      </div>
      <div style={{ fontSize: 42 }}>✦</div>
    </div>
  );
}

function Tabs({
  tab,
  setTab,
}: {
  tab: 'classes' | 'rewards';
  setTab: (t: 'classes' | 'rewards') => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
      {(['classes', 'rewards'] as const).map((t) => (
        <button
          key={t}
          onClick={() => setTab(t)}
          className={tab === t ? 'btn btn-primary' : 'btn btn-ghost'}
          style={{ flex: 1 }}
        >
          {t === 'classes' ? 'صفوفي' : 'بطاقاتي'}
        </button>
      ))}
    </div>
  );
}

function ClassesTab({ onOpen }: { onOpen: (c: ClassItem) => void }) {
  const [classes, setClasses] = useState<ClassItem[] | null>(null);
  const [code, setCode] = useState('');
  const toast = useToast();

  const load = useCallback(() => {
    api.get<{ items: ClassItem[] }>('/classes/joined').then((r) => setClasses(r.items)).catch(() => setClasses([]));
  }, []);
  useEffect(load, [load]);

  const join = async () => {
    if (!code.trim()) return;
    try {
      await api.post('/classes/join', { code: code.trim().toUpperCase() });
      setCode('');
      toast('انضممت للصف');
      load();
    } catch (e: unknown) {
      toast((e as Error)?.message ?? 'رمز غير صالح', 'error');
    }
  };

  return (
    <>
      <div className="card" style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <input
          className="input"
          placeholder="أدخل رمز الصف"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          style={{ letterSpacing: '0.1em' }}
        />
        <button className="btn btn-primary" onClick={join}>
          انضمام
        </button>
      </div>

      {!classes ? (
        <><Skeleton /><Skeleton /></>
      ) : classes.length === 0 ? (
        <EmptyState title="لا صفوف" hint="أدخل رمز الصف الذي أعطاك إياه معلمك." />
      ) : (
        classes.map((c) => (
          <div
            key={c.id}
            className="card"
            style={{ marginBottom: 12, cursor: 'pointer' }}
            onClick={() => onOpen(c)}
          >
            <h3 style={{ fontSize: 16 }}>{c.name}</h3>
            <div style={{ color: 'var(--ink-soft)', fontSize: 13, marginTop: 4 }}>
              {c.memberCount} طالب
            </div>
          </div>
        ))
      )}
    </>
  );
}

function RewardsTab() {
  const [cards, setCards] = useState<RewardCard[] | null>(null);
  useEffect(() => {
    api.get<RewardCard[]>('/rewards/cards/mine').then(setCards).catch(() => setCards([]));
  }, []);

  if (!cards) return <><Skeleton h={90} /><Skeleton h={90} /></>;
  if (cards.length === 0)
    return <EmptyState title="لا بطاقات بعد" hint="أكمل واجباتك بتميّز لتحصل على بطاقات تحفيزية." />;

  return (
    <>
      {cards.map((c) => (
        <div
          key={c.id}
          className="card"
          style={{
            marginBottom: 12,
            borderRight: '4px solid var(--teal-500)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: 16 }}>🏅 {c.title}</h3>
            {c.pointValue > 0 && (
              <span className="chip chip-graded num">+{c.pointValue}</span>
            )}
          </div>
          <p style={{ color: 'var(--ink-soft)', marginTop: 8 }}>{c.message}</p>
        </div>
      ))}
    </>
  );
}

function ClassAssignments({
  cls,
  onBack,
  onOpen,
}: {
  cls: ClassItem;
  onBack: () => void;
  onOpen: (a: Assignment) => void;
}) {
  const [items, setItems] = useState<Assignment[] | null>(null);
  useEffect(() => {
    api
      .get<{ items: Assignment[] }>(`/assignments/class/${cls.id}`)
      .then((r) => setItems(r.items))
      .catch(() => setItems([]));
  }, [cls.id]);

  return (
    <>
      <BackBar title={cls.name} onBack={onBack} />
      {!items ? (
        <><Skeleton /><Skeleton /></>
      ) : items.length === 0 ? (
        <EmptyState title="لا واجبات" hint="لا واجبات منشورة في هذا الصف بعد." />
      ) : (
        items.map((a) => (
          <div
            key={a.id}
            className="card"
            style={{ marginBottom: 10, cursor: 'pointer' }}
            onClick={() => onOpen(a)}
          >
            <h3 style={{ fontSize: 15.5 }}>{a.title}</h3>
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

function AssignmentDetail({
  assignment,
  onBack,
}: {
  assignment: Assignment;
  onBack: () => void;
}) {
  const [mine, setMine] = useState<MySubmission | null | 'loading'>('loading');
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const load = useCallback(() => {
    api
      .get<MySubmission | null>(`/submissions/assignment/${assignment.id}/mine`)
      .then((r) => setMine(r))
      .catch(() => setMine(null));
  }, [assignment.id]);
  useEffect(load, [load]);

  const submit = async () => {
    setBusy(true);
    try {
      await api.post(`/submissions/assignment/${assignment.id}`, {
        textContent: text.trim() || undefined,
      });
      // رفع ملف إن وُجد — مباشرة للتخزين عبر رابط موقّع
      if (file) {
        const signed = await api.post<{ uploadUrl: string; path: string }>(
          `/submissions/assignment/${assignment.id}/upload-url`,
          { fileName: file.name, mimeType: file.type },
        );
        await uploadViaSignedUrl(signed.uploadUrl, file);
        await api.post(`/submissions/assignment/${assignment.id}/attach`, {
          path: signed.path,
          fileName: file.name,
          mimeType: file.type,
          size: file.size,
        });
      }
      toast('تم التسليم');
      setText('');
      setFile(null);
      load();
    } catch (e: unknown) {
      toast((e as Error)?.message ?? 'تعذّر التسليم', 'error');
    } finally {
      setBusy(false);
    }
  };

  const graded = mine !== 'loading' && mine?.status === 'GRADED';

  return (
    <>
      <BackBar title={assignment.title} onBack={onBack} />

      {assignment.description && (
        <div className="card" style={{ marginBottom: 14 }}>
          <p style={{ color: 'var(--ink-soft)' }}>{assignment.description}</p>
        </div>
      )}

      {assignment.phetSlug && (
        <div style={{ marginBottom: 14 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            🔬 محاكاة التجربة
          </div>
          <PhetPlayer slug={assignment.phetSlug} titleAr={assignment.title} />
        </div>
      )}

      {mine === 'loading' ? (
        <Skeleton h={120} />
      ) : graded && mine?.grade ? (
        <div
          className="card"
          style={{ marginBottom: 14, borderRight: '4px solid var(--violet-600)' }}
        >
          <div className="eyebrow">النتيجة</div>
          <div
            className="num"
            style={{ fontSize: 32, fontWeight: 700, color: 'var(--violet-600)' }}
          >
            {mine.grade.value}
            {assignment.maxGrade ? ` / ${assignment.maxGrade}` : ''}
          </div>
          {mine.grade.feedback && (
            <p style={{ marginTop: 10, color: 'var(--ink-soft)' }}>
              💬 {mine.grade.feedback}
            </p>
          )}
        </div>
      ) : (
        <div className="card" style={{ marginBottom: 14 }}>
          {mine && (
            <div style={{ marginBottom: 10 }}>
              <span className={mine.isLate ? 'chip chip-late' : 'chip chip-ok'}>
                {mine.isLate ? 'سُلّم متأخرًا' : 'مُسلّم'} — يمكن الاستبدال
              </span>
            </div>
          )}
          <textarea
            className="textarea"
            placeholder="اكتب حلّك هنا…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{ marginBottom: 10 }}
          />
          <label
            className="btn btn-ghost"
            style={{ width: '100%', marginBottom: 10, cursor: 'pointer' }}
          >
            {file ? `📎 ${file.name}` : '📎 إرفاق ملف'}
            <input
              type="file"
              hidden
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <button
            className="btn btn-primary"
            onClick={submit}
            disabled={busy}
            style={{ width: '100%', opacity: busy ? 0.6 : 1 }}
          >
            {busy ? 'جارٍ التسليم…' : mine ? 'استبدال الحل' : 'تسليم الحل'}
          </button>
        </div>
      )}
    </>
  );
}

function BackBar({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
      <button className="btn btn-ghost" onClick={onBack} style={{ padding: '8px 14px' }}>
        →
      </button>
      <h2 style={{ fontSize: 18 }}>{title}</h2>
    </div>
  );
}

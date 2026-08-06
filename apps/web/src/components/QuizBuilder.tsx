'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useToast } from './ui';

type QType = 'MCQ' | 'WRITTEN';

interface Choice {
  text: string;
  isCorrect: boolean;
}
interface Question {
  type: QType;
  text: string;
  points: number;
  choices: Choice[];
}

const MAX_BY_PLAN: Record<string, number> = {
  free: 5,
  basic: 10,
  pro: 20,
};

export function QuizBuilder({
  classId,
  plan = 'free',
  onDone,
  onBack,
}: {
  classId: string;
  plan?: 'free' | 'basic' | 'pro';
  onDone?: (assignmentId: string) => void;
  onBack?: () => void;
}) {
  const toast = useToast();
  const maxQuestions = MAX_BY_PLAN[plan] ?? 5;
  const canWritten = plan === 'pro';
  const canAutoGrade = plan !== 'free';

  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([
    { type: 'MCQ', text: '', points: 1, choices: [
      { text: '', isCorrect: true },
      { text: '', isCorrect: false },
    ] },
  ]);

  const addQuestion = (type: QType) => {
    if (questions.length >= maxQuestions) {
      toast(`الحد الأقصى ${maxQuestions} أسئلة في باقتك`, 'error');
      return;
    }
    setQuestions((q) => [
      ...q,
      type === 'MCQ'
        ? { type, text: '', points: 1, choices: [ { text: '', isCorrect: true }, { text: '', isCorrect: false } ] }
        : { type, text: '', points: 1, choices: [] },
    ]);
  };

  const removeQuestion = (i: number) =>
    setQuestions((q) => q.filter((_, idx) => idx !== i));

  const patchQuestion = (i: number, patch: Partial<Question>) =>
    setQuestions((q) => q.map((item, idx) => (idx === i ? { ...item, ...patch } : item)));

  const addChoice = (qi: number) =>
    setQuestions((q) => q.map((item, idx) =>
      idx === qi ? { ...item, choices: [...item.choices, { text: '', isCorrect: false }] } : item));

  const patchChoice = (qi: number, ci: number, patch: Partial<Choice>) =>
    setQuestions((q) => q.map((item, idx) => {
      if (idx !== qi) return item;
      return { ...item, choices: item.choices.map((c, cidx) => cidx === ci ? { ...c, ...patch } : c) };
    }));

  const setCorrect = (qi: number, ci: number) =>
    setQuestions((q) => q.map((item, idx) => {
      if (idx !== qi) return item;
      return { ...item, choices: item.choices.map((c, cidx) => ({ ...c, isCorrect: cidx === ci })) };
    }));

  const removeChoice = (qi: number, ci: number) =>
    setQuestions((q) => q.map((item, idx) =>
      idx === qi ? { ...item, choices: item.choices.filter((_, cidx) => cidx !== ci) } : item));

  const save = async () => {
    if (!title.trim()) return toast('أدخل عنوان الاختبار', 'error');
    for (const q of questions) {
      if (!q.text.trim()) return toast('يوجد سؤال بلا نص', 'error');
      if (q.type === 'MCQ') {
        if (q.choices.length < 2) return toast('كل سؤال يحتاج خيارين على الأقل', 'error');
        if (!q.choices.some((c) => c.isCorrect)) return toast('حدّد الإجابة الصحيحة لكل سؤال', 'error');
        if (q.choices.some((c) => !c.text.trim())) return toast('يوجد خيار فارغ', 'error');
      }
    }
    setSaving(true);
    try {
      const res = await api.post<{ id: string }>('/assignments/quiz', {
        classId, title: title.trim(), questions,
      });
      await api.post(`/assignments/${res.id}/publish`).catch(() => {});
      toast('تم إنشاء الاختبار', 'ok');
      onDone?.(res.id);
    } catch {
      toast('تعذّر إنشاء الاختبار', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      {/* رأس بأسلوب Apple: كبير، هادئ، بمسافات */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        {onBack && (
          <button onClick={onBack} aria-label="رجوع"
            style={{ border: 'none', background: 'var(--surface-2)', width: 38, height: 38, borderRadius: 12, cursor: 'pointer', fontSize: 18, color: 'var(--ink-soft)' }}>
            ›
          </button>
        )}
        <div className="eyebrow" style={{ color: 'var(--teal-500)', fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 600, letterSpacing: '.14em' }}>
          اختبار جديد
        </div>
      </div>
      <h1 style={{ fontSize: 30, letterSpacing: '-0.02em', marginBottom: 22 }}>أنشئ اختبارك</h1>

      {/* عنوان الاختبار — حقل كبير نظيف */}
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="عنوان الاختبار"
        style={{
          width: '100%', fontSize: 19, fontWeight: 600, fontFamily: 'var(--font-body)',
          border: 'none', borderBottom: '2px solid var(--border)', background: 'transparent',
          padding: '10px 2px', marginBottom: 26, color: 'var(--ink)', outline: 'none',
        }}
      />

      {questions.map((q, qi) => (
        <div key={qi} className="card"
          style={{ padding: 20, marginBottom: 16, borderRadius: 20, boxShadow: 'var(--shadow-sm)', animation: 'fadeUp .3s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 }}>
              <span style={{ width: 26, height: 26, borderRadius: 8, background: 'var(--grad-brand)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 13 }}>{qi + 1}</span>
              {q.type === 'MCQ' ? 'اختيار من متعدد' : 'سؤال كتابي'}
            </span>
            {questions.length > 1 && (
              <button onClick={() => removeQuestion(qi)} aria-label="حذف"
                style={{ border: 'none', background: 'transparent', color: 'var(--ink-faint)', cursor: 'pointer', fontSize: 20 }}>×</button>
            )}
          </div>

          <input
            value={q.text}
            onChange={(e) => patchQuestion(qi, { text: e.target.value })}
            placeholder="اكتب نص السؤال…"
            style={{ width: '100%', fontSize: 16, border: '1.5px solid var(--border)', borderRadius: 12, padding: '12px 14px', marginBottom: 14, fontFamily: 'var(--font-body)', outline: 'none', background: 'var(--surface)' }}
          />

          {q.type === 'MCQ' && (
            <div style={{ display: 'grid', gap: 8 }}>
              {q.choices.map((c, ci) => (
                <div key={ci}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '4px 4px 4px 6px',
                    border: `1.5px solid ${c.isCorrect ? 'var(--teal-400)' : 'var(--border)'}`,
                    borderRadius: 12, background: c.isCorrect ? 'rgba(45,212,191,0.06)' : 'var(--surface)',
                    transition: 'all .2s',
                  }}>
                  <button
                    onClick={() => setCorrect(qi, ci)}
                    aria-label="الإجابة الصحيحة"
                    title="اجعلها الصحيحة"
                    style={{
                      width: 24, height: 24, borderRadius: '50%', cursor: 'pointer', flexShrink: 0,
                      border: c.isCorrect ? 'none' : '2px solid var(--ink-faint)',
                      background: c.isCorrect ? 'var(--teal-500)' : 'transparent',
                      color: '#fff', display: 'grid', placeItems: 'center', fontSize: 13,
                    }}>
                    {c.isCorrect ? '✓' : ''}
                  </button>
                  <input
                    value={c.text}
                    onChange={(e) => patchChoice(qi, ci, { text: e.target.value })}
                    placeholder={`الخيار ${ci + 1}`}
                    style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 15, padding: '8px 2px', outline: 'none', fontFamily: 'var(--font-body)', color: 'var(--ink)' }}
                  />
                  {q.choices.length > 2 && (
                    <button onClick={() => removeChoice(qi, ci)} aria-label="حذف الخيار"
                      style={{ border: 'none', background: 'transparent', color: 'var(--ink-faint)', cursor: 'pointer', fontSize: 16, padding: '0 6px' }}>×</button>
                  )}
                </div>
              ))}
              <button onClick={() => addChoice(qi)}
                style={{ border: '1.5px dashed var(--border)', background: 'transparent', color: 'var(--ink-soft)', borderRadius: 12, padding: '10px', cursor: 'pointer', fontSize: 14, fontFamily: 'var(--font-body)', marginTop: 2 }}>
                + إضافة خيار
              </button>
              {!canAutoGrade && (
                <p style={{ fontSize: 12.5, color: 'var(--warn)', marginTop: 6 }}>
                  في الباقة المجانية: بلا تصحيح تلقائي. رقّ لباقة أعلى لتفعيله.
                </p>
              )}
            </div>
          )}

          {q.type === 'WRITTEN' && (
            <div style={{ padding: '14px', border: '1.5px dashed var(--border)', borderRadius: 12, color: 'var(--ink-faint)', fontSize: 13.5, textAlign: 'center' }}>
              سيكتب الطالب إجابته هنا — تصحّحها يدويًا لاحقًا
            </div>
          )}
        </div>
      ))}

      {/* أزرار الإضافة — بأسلوب Apple: كبسولات ناعمة */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 26, flexWrap: 'wrap' }}>
        <button onClick={() => addQuestion('MCQ')}
          style={{ flex: 1, minWidth: 150, border: 'none', background: 'var(--surface-2)', color: 'var(--ink)', borderRadius: 14, padding: '14px', cursor: 'pointer', fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-body)' }}>
          + اختيار من متعدد
        </button>
        {canWritten && (
          <button onClick={() => addQuestion('WRITTEN')}
            style={{ flex: 1, minWidth: 150, border: 'none', background: 'var(--surface-2)', color: 'var(--ink)', borderRadius: 14, padding: '14px', cursor: 'pointer', fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-body)' }}>
            + سؤال كتابي
          </button>
        )}
      </div>

      <div style={{ fontSize: 13, color: 'var(--ink-faint)', textAlign: 'center', marginBottom: 14 }}>
        {questions.length} / {maxQuestions} أسئلة
      </div>

      {/* زر الحفظ — كبير، متدرّج، بأسلوب Apple */}
      <button onClick={save} disabled={saving}
        style={{
          width: '100%', border: 'none', borderRadius: 16, padding: '16px',
          background: 'var(--grad-brand)', color: '#fff', fontSize: 17, fontWeight: 700,
          fontFamily: 'var(--font-display)', cursor: saving ? 'default' : 'pointer',
          opacity: saving ? 0.7 : 1, boxShadow: 'var(--shadow)', letterSpacing: '-0.01em',
        }}>
        {saving ? 'جارٍ الحفظ…' : 'نشر الاختبار ومشاركته'}
      </button>
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { PhetPlayer } from './PhetPlayer';
import { Skeleton, useToast } from './ui';

interface QChoice {
  id: string;
  text: string;
}
interface QQuestion {
  id: string;
  type: 'MCQ' | 'WRITTEN';
  text: string;
  points: number;
  choices: QChoice[];
}
interface QuizData {
  id: string;
  title: string;
  description?: string | null;
  phetSlug?: string | null;
  dueAt?: string | null;
  alreadySubmitted: boolean;
  score: number | null;
  questions: QQuestion[];
}
interface SubmitResult {
  submissionId: string;
  score: number;
  total: number;
  results: { questionId: string; isCorrect: boolean | null; awardedPoints: number | null }[];
}

export function QuizPlayer({
  assignmentId,
  onBack,
}: {
  assignmentId: string;
  onBack?: () => void;
}) {
  const toast = useToast();
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, { choiceId?: string; writtenText?: string }>>({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get<QuizData>(`/assignments/${assignmentId}/quiz`)
      .then((q) => setQuiz(q))
      .catch(() => toast('تعذّر فتح الاختبار', 'error'))
      .finally(() => setLoading(false));
  }, [assignmentId, toast]);

  useEffect(load, [load]);

  const pickChoice = (qid: string, choiceId: string) =>
    setAnswers((a) => ({ ...a, [qid]: { choiceId } }));
  const setWritten = (qid: string, writtenText: string) =>
    setAnswers((a) => ({ ...a, [qid]: { writtenText } }));

  const submit = async () => {
    if (!quiz) return;
    const unanswered = quiz.questions.filter(
      (q) => q.type === 'MCQ' && !answers[q.id]?.choiceId,
    );
    if (unanswered.length > 0) {
      toast(`أجب عن كل الأسئلة (${unanswered.length} متبقٍّ)`, 'error');
      return;
    }
    setBusy(true);
    try {
      const payload = {
        answers: quiz.questions.map((q) => ({
          questionId: q.id,
          choiceId: answers[q.id]?.choiceId,
          writtenText: answers[q.id]?.writtenText,
        })),
      };
      const res = await api.post<SubmitResult>(
        `/assignments/${assignmentId}/quiz/submit`,
        payload,
      );
      setResult(res);
    } catch {
      toast('تعذّر إرسال الحل', 'error');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 620, margin: '0 auto' }}>
        <Skeleton h={40} />
        <Skeleton h={120} />
        <Skeleton h={120} />
      </div>
    );
  }
  if (!quiz) return null;

  // شاشة النتيجة — بأسلوب Apple: دائرة كبيرة بالدرجة
  if (result || quiz.alreadySubmitted) {
    const score = result?.score ?? quiz.score ?? 0;
    const total =
      result?.total ??
      quiz.questions.reduce((s, q) => s + q.points, 0);
    const pct = total > 0 ? Math.round((score / total) * 100) : 0;
    const resultMap = new Map(
      (result?.results ?? []).map((r) => [r.questionId, r]),
    );
    return (
      <div style={{ maxWidth: 620, margin: '0 auto', textAlign: 'center' }}>
        <div className="eyebrow" style={{ color: 'var(--teal-500)', marginBottom: 6 }}>
          النتيجة
        </div>
        <h1 style={{ fontSize: 26, marginBottom: 26 }}>{quiz.title}</h1>
        <div
          style={{
            width: 180, height: 180, margin: '0 auto 22px', borderRadius: '50%',
            display: 'grid', placeItems: 'center',
            background: `conic-gradient(var(--teal-500) ${pct * 3.6}deg, var(--surface-2) 0deg)`,
          }}
        >
          <div
            style={{
              width: 148, height: 148, borderRadius: '50%', background: 'var(--surface)',
              display: 'grid', placeItems: 'center',
            }}
          >
            <div>
              <div className="num" style={{ fontSize: 40, fontWeight: 700, color: 'var(--ink)' }}>
                {score}<span style={{ fontSize: 20, color: 'var(--ink-faint)' }}>/{total}</span>
              </div>
              <div style={{ fontSize: 14, color: 'var(--teal-500)', fontWeight: 700 }}>{pct}%</div>
            </div>
          </div>
        </div>

        {result && (
          <div style={{ textAlign: 'right', marginBottom: 20 }}>
            {quiz.questions.map((q, i) => {
              const r = resultMap.get(q.id);
              const status =
                q.type === 'WRITTEN'
                  ? 'pending'
                  : r?.isCorrect
                  ? 'correct'
                  : 'wrong';
              return (
                <div key={q.id} className="card" style={{ padding: 14, marginBottom: 10, borderRadius: 14 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span
                      style={{
                        width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                        display: 'grid', placeItems: 'center', color: '#fff', fontSize: 13,
                        background:
                          status === 'correct' ? 'var(--ok)'
                          : status === 'wrong' ? 'var(--danger)'
                          : 'var(--warn)',
                      }}
                    >
                      {status === 'correct' ? '✓' : status === 'wrong' ? '×' : '…'}
                    </span>
                    <div>
                      <div style={{ fontSize: 14.5, fontWeight: 600 }}>{i + 1}. {q.text}</div>
                      {status === 'pending' && (
                        <div style={{ fontSize: 12.5, color: 'var(--warn)', marginTop: 3 }}>
                          سؤال كتابي — بانتظار تصحيح المعلم
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {onBack && (
          <button className="btn btn-primary" onClick={onBack} style={{ width: '100%' }}>
            تمّ
          </button>
        )}
      </div>
    );
  }

  // شاشة الحل
  return (
    <div style={{ maxWidth: 620, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        {onBack && (
          <button onClick={onBack} aria-label="رجوع"
            style={{ border: 'none', background: 'var(--surface-2)', width: 38, height: 38, borderRadius: 12, cursor: 'pointer', fontSize: 18, color: 'var(--ink-soft)' }}>
            ›
          </button>
        )}
        <div className="eyebrow" style={{ color: 'var(--teal-500)' }}>اختبار</div>
      </div>
      <h1 style={{ fontSize: 26, letterSpacing: '-0.02em', marginBottom: 6 }}>{quiz.title}</h1>
      {quiz.description && (
        <p style={{ color: 'var(--ink-soft)', marginBottom: 18 }}>{quiz.description}</p>
      )}

      {quiz.phetSlug && (
        <div style={{ marginBottom: 20 }}>
          <PhetPlayer slug={quiz.phetSlug} titleAr={quiz.title} />
        </div>
      )}

      {quiz.questions.map((q, i) => (
        <div key={q.id} className="card" style={{ padding: 20, marginBottom: 16, borderRadius: 20 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 14 }}>
            <span style={{ width: 26, height: 26, borderRadius: 8, background: 'var(--grad-brand)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 13, flexShrink: 0 }}>
              {i + 1}
            </span>
            <div style={{ fontSize: 16.5, fontWeight: 600, lineHeight: 1.5 }}>{q.text}</div>
          </div>

          {q.type === 'MCQ' ? (
            <div style={{ display: 'grid', gap: 8 }}>
              {q.choices.map((c) => {
                const selected = answers[q.id]?.choiceId === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => pickChoice(q.id, c.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, textAlign: 'right',
                      border: `2px solid ${selected ? 'var(--violet-600)' : 'var(--border)'}`,
                      background: selected ? 'rgba(124,58,237,0.06)' : 'var(--surface)',
                      borderRadius: 14, padding: '14px 16px', cursor: 'pointer',
                      fontSize: 15.5, fontFamily: 'var(--font-body)', color: 'var(--ink)',
                      transition: 'all .15s',
                    }}
                  >
                    <span
                      style={{
                        width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                        border: selected ? 'none' : '2px solid var(--ink-faint)',
                        background: selected ? 'var(--violet-600)' : 'transparent',
                        display: 'grid', placeItems: 'center', color: '#fff', fontSize: 12,
                      }}
                    >
                      {selected ? '✓' : ''}
                    </span>
                    {c.text}
                  </button>
                );
              })}
            </div>
          ) : (
            <textarea
              className="textarea"
              placeholder="اكتب إجابتك…"
              value={answers[q.id]?.writtenText ?? ''}
              onChange={(e) => setWritten(q.id, e.target.value)}
              style={{ width: '100%', minHeight: 90 }}
            />
          )}
        </div>
      ))}

      <button
        onClick={submit}
        disabled={busy}
        style={{
          width: '100%', border: 'none', borderRadius: 16, padding: '16px',
          background: 'var(--grad-brand)', color: '#fff', fontSize: 17, fontWeight: 700,
          fontFamily: 'var(--font-display)', cursor: busy ? 'default' : 'pointer',
          opacity: busy ? 0.7 : 1, boxShadow: 'var(--shadow)',
        }}
      >
        {busy ? 'جارٍ التصحيح…' : 'إرسال الحل'}
      </button>
    </div>
  );
}

import type { McqQuestion, McqTestAttempt } from '../types/study';
import type { ScopeSubjectId } from './validation';

export interface McqQuestionResult {
  question: McqQuestion;
  selectedIndex: number | null;
  isCorrect: boolean;
}

export interface McqTestGradeResult {
  score: number;
  total: number;
  percent: number;
  answeredCount: number;
  breakdown: McqQuestionResult[];
}

export function filterMcqsBySubject(
  bank: McqQuestion[],
  subjectFilter: ScopeSubjectId
): McqQuestion[] {
  if (subjectFilter === 'all') return bank;
  return bank.filter((q) => q.subjectId === subjectFilter);
}

export function buildMcqSessionQuestions(params: {
  bank: McqQuestion[];
  subjectFilter: ScopeSubjectId;
  count: number;
  shuffle?: boolean;
  randomFn?: () => number;
}): McqQuestion[] {
  const pool = [...filterMcqsBySubject(params.bank, params.subjectFilter)];
  if (params.shuffle) {
    const rng = params.randomFn ?? Math.random;
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
  }
  const safeCount = Math.max(1, Math.min(pool.length, Math.round(params.count)));
  return pool.slice(0, safeCount);
}

export function gradeMcqTest(
  questions: McqQuestion[],
  answers: Record<string, number>
): McqTestGradeResult {
  let score = 0;
  let answeredCount = 0;

  const breakdown: McqQuestionResult[] = questions.map((question) => {
    const raw = answers[question.id];
    const selectedIndex =
      typeof raw === 'number' && Number.isInteger(raw) && raw >= 0 && raw <= 3 ? raw : null;
    if (selectedIndex !== null) {
      answeredCount += 1;
    }
    const isCorrect = selectedIndex === question.correctIndex;
    if (isCorrect) {
      score += 1;
    }
    return {
      question,
      selectedIndex,
      isCorrect,
    };
  });

  const total = questions.length;
  const percent = total > 0 ? Math.round((score / total) * 100) : 0;

  return {
    score,
    total,
    percent,
    answeredCount,
    breakdown,
  };
}

export function formatMcqDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function appendMcqAttempt(
  history: McqTestAttempt[],
  attempt: McqTestAttempt,
  maxItems = 20
): McqTestAttempt[] {
  return [attempt, ...history].slice(0, maxItems);
}

export function getBestMcqPercent(history: McqTestAttempt[]): number {
  if (history.length === 0) return 0;
  return history.reduce((best, item) => Math.max(best, item.percent), 0);
}

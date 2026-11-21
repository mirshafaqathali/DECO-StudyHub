import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Play,
  RotateCcw,
  Share2,
  Shuffle,
  Trophy,
  XCircle,
} from 'lucide-react';
import type { McqQuestion, McqTestAttempt, SubjectUnit } from '../types/study';
import {
  buildMcqSessionQuestions,
  filterMcqsBySubject,
  formatMcqDuration,
  getBestMcqPercent,
  gradeMcqTest,
  type McqTestGradeResult,
} from '../utils/mcqEngine';
import type { ScopeSubjectId } from '../utils/validation';

interface McqTestViewProps {
  subjects: SubjectUnit[];
  questionBank: McqQuestion[];
  mcqHistory: McqTestAttempt[];
  onSaveAttempt: (attempt: McqTestAttempt) => void;
  onShareTestResult: (attempt: McqTestAttempt) => void;
}

type TestPhase = 'setup' | 'active' | 'results';
type CountOption = 5 | 10 | 'all';

const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;
const TIMED_SECONDS = 600; // 10-minute optional exam timer

export const McqTestView: React.FC<McqTestViewProps> = ({
  subjects,
  questionBank,
  mcqHistory,
  onSaveAttempt,
  onShareTestResult,
}) => {
  const [phase, setPhase] = useState<TestPhase>('setup');

  // Setup configuration
  const [subjectFilter, setSubjectFilter] = useState<ScopeSubjectId>('all');
  const [countOption, setCountOption] = useState<CountOption>(5);
  const [shuffleOrder, setShuffleOrder] = useState<boolean>(false);
  const [timedMode, setTimedMode] = useState<boolean>(false);

  // Active test state
  const [sessionQuestions, setSessionQuestions] = useState<McqQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Results state
  const [lastAttempt, setLastAttempt] = useState<McqTestAttempt | null>(null);
  const [lastGrade, setLastGrade] = useState<McqTestGradeResult | null>(null);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'incorrect'>('all');

  const availableQuestions = useMemo(
    () => filterMcqsBySubject(questionBank, subjectFilter),
    [questionBank, subjectFilter]
  );

  const effectiveCount =
    countOption === 'all'
      ? availableQuestions.length
      : Math.min(countOption, availableQuestions.length);

  const subjectLabelMap = useMemo(() => {
    const map: Record<string, string> = { all: 'All Units' };
    for (const s of subjects) {
      map[s.id] = `${s.code}: ${s.title}`;
    }
    return map;
  }, [subjects]);

  const bestPercent = useMemo(() => getBestMcqPercent(mcqHistory), [mcqHistory]);

  const finishAndGradeTest = (finalElapsed: number) => {
    if (sessionQuestions.length === 0) return;
    const result = gradeMcqTest(sessionQuestions, answers);
    const attempt: McqTestAttempt = {
      id: `mcq_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      subjectFilter,
      score: result.score,
      total: result.total,
      percent: result.percent,
      elapsedSeconds: finalElapsed,
      completedAtMs: Date.now(),
    };
    setLastGrade(result);
    setLastAttempt(attempt);
    setReviewFilter('all');
    setPhase('results');
    onSaveAttempt(attempt);
  };

  // Live timer during active test
  useEffect(() => {
    if (phase !== 'active') return;
    const timer = window.setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        if (timedMode && next >= TIMED_SECONDS) {
          window.clearInterval(timer);
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phase, timedMode]);

  // Auto-submit when 10-minute timer expires
  useEffect(() => {
    if (phase === 'active' && timedMode && elapsedSeconds >= TIMED_SECONDS) {
      finishAndGradeTest(TIMED_SECONDS);
    }
  }, [phase, timedMode, elapsedSeconds]);

  const handleStartTest = () => {
    const chosen = buildMcqSessionQuestions({
      bank: questionBank,
      subjectFilter,
      count: effectiveCount,
      shuffle: shuffleOrder,
    });
    if (chosen.length === 0) return;
    setSessionQuestions(chosen);
    setCurrentIndex(0);
    setAnswers({});
    setElapsedSeconds(0);
    setLastAttempt(null);
    setLastGrade(null);
    setPhase('active');
  };

  const handleSelectAnswer = (questionId: string, optionIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  if (phase === 'active' && sessionQuestions.length > 0) {
    const activeQ = sessionQuestions[currentIndex];
    const selectedOption = answers[activeQ.id];
    const answeredCount = Object.keys(answers).length;
    const remainingSeconds = Math.max(0, TIMED_SECONDS - elapsedSeconds);

    return (
      <div className="space-y-5">
        {/* Active Test Header */}
        <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              <span className="font-mono font-semibold text-[var(--accent-text)]">
                Question {currentIndex + 1} of {sessionQuestions.length}
              </span>
              <span aria-hidden="true">·</span>
              <span>{activeQ.topic}</span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
              {answeredCount} of {sessionQuestions.length} answered
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-1.5 text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-200 tabular-nums"
              aria-label={timedMode ? 'Time remaining' : 'Elapsed time'}
            >
              <Clock className="w-3.5 h-3.5 text-[var(--accent-text)]" />
              {timedMode
                ? `Remaining ${formatMcqDuration(remainingSeconds)}`
                : `Elapsed ${formatMcqDuration(elapsedSeconds)}`}
            </div>

            <button
              type="button"
              onClick={() => setPhase('setup')}
              className="rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Exit Test
            </button>

            <button
              type="button"
              onClick={() => finishAndGradeTest(elapsedSeconds)}
              className="rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] px-3.5 py-1.5 text-xs font-semibold text-white transition-colors"
            >
              Submit Test
            </button>
          </div>
        </section>

        {/* Clickable Question Navigator Strip */}
        <nav
          aria-label="Question navigator"
          className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 flex flex-wrap gap-1.5"
        >
          {sessionQuestions.map((q, idx) => {
            const isCurrent = idx === currentIndex;
            const isAnswered = answers[q.id] !== undefined;
            return (
              <button
                key={q.id}
                type="button"
                aria-label={`Jump to question ${idx + 1}${isAnswered ? ' (answered)' : ''}`}
                aria-current={isCurrent ? 'step' : undefined}
                onClick={() => setCurrentIndex(idx)}
                className={`w-9 h-9 rounded-lg text-xs font-mono font-semibold transition-colors border ${
                  isCurrent
                    ? 'bg-[var(--accent)] border-[var(--accent)] text-white'
                    : isAnswered
                    ? 'bg-[var(--accent-soft)] border-[var(--accent-border)] text-[var(--accent-text)]'
                    : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </nav>

        {/* Active Question Card */}
        <article className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-7 space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {subjectLabelMap[activeQ.subjectId] ?? activeQ.subjectId}
            </span>
            <h2 className="text-lg sm:text-xl font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">
              {activeQ.question}
            </h2>
          </div>

          <div className="space-y-2.5" role="group" aria-label="Answer choices">
            {activeQ.options.map((optText, optIdx) => {
              const isSelected = selectedOption === optIdx;
              return (
                <button
                  key={`${activeQ.id}-opt-${optIdx}`}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => handleSelectAnswer(activeQ.id, optIdx)}
                  className={`w-full text-left rounded-xl border px-4 py-3.5 flex items-start gap-3 transition-colors ${
                    isSelected
                      ? 'border-[var(--accent-border)] bg-[var(--accent-soft)] text-zinc-900 dark:text-zinc-100'
                      : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/60 text-zinc-800 dark:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/70'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-md shrink-0 inline-flex items-center justify-center text-xs font-mono font-bold border ${
                      isSelected
                        ? 'bg-[var(--accent)] border-[var(--accent)] text-white'
                        : 'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300'
                    }`}
                  >
                    {OPTION_LETTERS[optIdx]}
                  </span>
                  <span className="text-sm leading-relaxed pt-0.5">{optText}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 px-3.5 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            {currentIndex < sessionQuestions.length - 1 ? (
              <button
                type="button"
                onClick={() =>
                  setCurrentIndex((prev) => Math.min(sessionQuestions.length - 1, prev + 1))
                }
                className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] px-4 py-2 text-xs font-semibold text-white transition-colors"
              >
                Next Question
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => finishAndGradeTest(elapsedSeconds)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] px-4 py-2 text-xs font-semibold text-white transition-colors"
              >
                Finish &amp; Grade Test
              </button>
            )}
          </div>
        </article>
      </div>
    );
  }

  if (phase === 'results' && lastGrade && lastAttempt) {
    const visibleBreakdown =
      reviewFilter === 'incorrect'
        ? lastGrade.breakdown.filter((item) => !item.isCorrect)
        : lastGrade.breakdown;

    return (
      <div className="space-y-6">
        {/* Summary Card */}
        <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-7 space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-mono uppercase tracking-wider text-[var(--accent-text)] font-semibold">
                MCQ Test Results · {subjectLabelMap[lastAttempt.subjectFilter] ?? 'DECO'}
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                {lastGrade.score} / {lastGrade.total} Correct ({lastGrade.percent}%)
              </h1>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 tabular-nums">
                Completed in {formatMcqDuration(lastAttempt.elapsedSeconds)} ·{' '}
                {lastGrade.answeredCount}/{lastGrade.total} questions answered
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleStartTest}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] px-4 py-2 text-xs font-semibold text-white transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Retake Test
              </button>
              <button
                type="button"
                onClick={() => setPhase('setup')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 px-3.5 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 transition-colors"
              >
                Back to Setup
              </button>
              <button
                type="button"
                onClick={() => onShareTestResult(lastAttempt)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--accent-border)] bg-[var(--accent-soft)] px-3.5 py-2 text-xs font-semibold text-[var(--accent-text)] hover:opacity-90 transition-opacity"
              >
                <Share2 className="w-3.5 h-3.5" />
                Share Score to Study Group
              </button>
            </div>
          </div>

          <div className="w-full h-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-[var(--accent)] transition-all duration-300"
              style={{ width: `${lastGrade.percent}%` }}
            />
          </div>
        </section>

        {/* Answer Review Breakdown */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Detailed Question Review
            </h2>
            <div className="inline-flex rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-1 gap-1">
              <button
                type="button"
                onClick={() => setReviewFilter('all')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                  reviewFilter === 'all'
                    ? 'bg-[var(--accent)] text-white'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                All Questions ({lastGrade.breakdown.length})
              </button>
              <button
                type="button"
                onClick={() => setReviewFilter('incorrect')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                  reviewFilter === 'incorrect'
                    ? 'bg-[var(--accent)] text-white'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                Incorrect Only ({lastGrade.total - lastGrade.score})
              </button>
            </div>
          </div>

          {visibleBreakdown.length === 0 ? (
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 text-sm text-zinc-600 dark:text-zinc-300">
              Perfect score — no incorrect answers to review.
            </div>
          ) : (
            <div className="space-y-3">
              {visibleBreakdown.map((item, idx) => {
                const { question, selectedIndex, isCorrect } = item;
                return (
                  <article
                    key={question.id}
                    className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                          {question.topic}
                        </span>
                        <h3 className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100">
                          {idx + 1}. {question.question}
                        </h3>
                      </div>
                      {isCorrect ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 shrink-0">
                          <CheckCircle2 className="w-4 h-4" />
                          Correct
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 dark:text-rose-400 shrink-0">
                          <XCircle className="w-4 h-4" />
                          {selectedIndex === null ? 'Unanswered' : 'Incorrect'}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2">
                        <span className="text-zinc-500 dark:text-zinc-400 block mb-0.5">
                          Your answer
                        </span>
                        <span
                          className={`font-medium ${
                            isCorrect
                              ? 'text-emerald-700 dark:text-emerald-300'
                              : 'text-rose-700 dark:text-rose-300'
                          }`}
                        >
                          {selectedIndex === null
                            ? 'No option selected'
                            : `${OPTION_LETTERS[selectedIndex]}. ${question.options[selectedIndex]}`}
                        </span>
                      </div>

                      <div className="rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/30 px-3 py-2">
                        <span className="text-emerald-700 dark:text-emerald-400 block mb-0.5">
                          Correct answer
                        </span>
                        <span className="font-medium text-emerald-900 dark:text-emerald-200">
                          {OPTION_LETTERS[question.correctIndex]}.{' '}
                          {question.options[question.correctIndex]}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed border-t border-zinc-100 dark:border-zinc-800 pt-2.5">
                      <span className="font-semibold text-zinc-800 dark:text-zinc-100">
                        Explanation:{' '}
                      </span>
                      {question.explanation}
                    </p>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    );
  }

  // ================= SETUP SCREEN =================
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Test Builder Card */}
        <section className="lg:col-span-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-7 space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--accent-text)] font-semibold">
              CIE &amp; Quiz Bank · {questionBank.length} Questions
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              DECO MCQ Practice Test
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Practice timed or untimed multiple-choice tests built from DECO Quizzes, Surprise
              Tests, and CIE-2 Question Banks across Units I–V.
            </p>
          </div>

          {/* Subject Filter */}
          <div className="space-y-2">
            <span className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              1. Select Syllabus Scope
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                aria-pressed={subjectFilter === 'all'}
                onClick={() => setSubjectFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  subjectFilter === 'all'
                    ? 'bg-[var(--accent)] border-[var(--accent)] text-white'
                    : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                All Units ({questionBank.length})
              </button>
              {subjects.map((sub) => {
                const subCount = questionBank.filter((q) => q.subjectId === sub.id).length;
                const isSelected = subjectFilter === sub.id;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setSubjectFilter(sub.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      isSelected
                        ? 'bg-[var(--accent)] border-[var(--accent)] text-white'
                        : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {sub.code} ({subCount})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question Count & Mode Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <span className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                2. Question Count
              </span>
              <div className="flex gap-2">
                {([5, 10, 'all'] as CountOption[]).map((opt) => {
                  const isSelected = countOption === opt;
                  const label = opt === 'all' ? `All (${availableQuestions.length})` : `${opt} Qs`;
                  return (
                    <button
                      key={String(opt)}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setCountOption(opt)}
                      className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                        isSelected
                          ? 'bg-[var(--accent-soft)] border-[var(--accent-border)] text-[var(--accent-text)]'
                          : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <span className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                3. Session Mode
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  aria-pressed={!timedMode}
                  onClick={() => setTimedMode(false)}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                    !timedMode
                      ? 'bg-[var(--accent-soft)] border-[var(--accent-border)] text-[var(--accent-text)]'
                      : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  Untimed Practice
                </button>
                <button
                  type="button"
                  aria-pressed={timedMode}
                  onClick={() => setTimedMode(true)}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                    timedMode
                      ? 'bg-[var(--accent-soft)] border-[var(--accent-border)] text-[var(--accent-text)]'
                      : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  10-Min Timer
                </button>
              </div>
            </div>
          </div>

          {/* Shuffle Toggle & Primary Start CTA */}
          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <label className="inline-flex items-center gap-2.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={shuffleOrder}
                onChange={(e) => setShuffleOrder(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 accent-[var(--accent)]"
              />
              <Shuffle className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              Shuffle question order
            </label>

            <button
              type="button"
              disabled={effectiveCount === 0}
              onClick={handleStartTest}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] px-5 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50"
            >
              <Play className="w-4 h-4" />
              Start MCQ Test ({effectiveCount} {effectiveCount === 1 ? 'Question' : 'Questions'})
            </button>
          </div>
        </section>

        {/* Right: Performance KPIs & Recent Attempts */}
        <aside className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Recent Test Attempts
            </h2>
            <Trophy className="w-4 h-4 text-[var(--accent-secondary-text)]" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-3">
              <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block">
                Best Score
              </span>
              <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                {mcqHistory.length > 0 ? `${bestPercent}%` : '—'}
              </span>
            </div>
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-3">
              <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block">
                Total Tests
              </span>
              <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                {mcqHistory.length}
              </span>
            </div>
          </div>

          {mcqHistory.length === 0 ? (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              No MCQ tests completed yet. Start a quick 5-question unit quiz to benchmark your CIE
              readiness.
            </p>
          ) : (
            <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {mcqHistory.slice(0, 8).map((attempt) => (
                <li
                  key={attempt.id}
                  className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/70 px-3 py-2.5 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                      {attempt.subjectFilter === 'all'
                        ? 'All Units'
                        : subjects.find((s) => s.id === attempt.subjectFilter)?.code ??
                          attempt.subjectFilter}
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 tabular-nums">
                      {formatMcqDuration(attempt.elapsedSeconds)} ·{' '}
                      {new Date(attempt.completedAtMs).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="font-mono font-bold text-[var(--accent-text)] tabular-nums shrink-0">
                    {attempt.score}/{attempt.total} ({attempt.percent}%)
                  </span>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
};

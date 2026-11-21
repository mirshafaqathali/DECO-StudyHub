import React, { useMemo } from 'react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Circle,
  Flame,
  Minus,
  Plus,
  Share2,
  Target,
} from 'lucide-react';
import type { DailyGoalMetric, DailyStudyGoal, Lesson, SubjectUnit } from '../types/study';
import {
  clampGoalTarget,
  DAILY_GOAL_LIMITS,
  evaluateDailyGoalStatus,
  getLast7DaysStreakTrack,
} from '../utils/dailyGoal';
import type { OverallSyllabusProgress } from '../utils/studyProgress';
import type { SubjectId } from '../utils/validation';

interface ProgressViewProps {
  subjects: SubjectUnit[];
  lessons: Lesson[];
  completedLessonIds: string[];
  progress: OverallSyllabusProgress;
  upcomingRemindersCount: number;
  studyStreakDays: number;
  dailyGoal: DailyStudyGoal;
  onUpdateDailyGoal: (metric: DailyGoalMetric, target: number) => void;
  onOpenFlashcards: () => void;
  onOpenLesson: (subjectId: SubjectId, lessonId: string) => void;
  onToggleLessonComplete: (lessonId: string) => void;
  onShareProgressToGroup: () => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  subjects,
  lessons,
  completedLessonIds,
  progress,
  upcomingRemindersCount,
  studyStreakDays,
  dailyGoal,
  onUpdateDailyGoal,
  onOpenFlashcards,
  onOpenLesson,
  onToggleLessonComplete,
  onShareProgressToGroup,
}) => {
  const completedSet = useMemo(() => new Set(completedLessonIds), [completedLessonIds]);
  const goalStatus = useMemo(() => evaluateDailyGoalStatus(dailyGoal), [dailyGoal]);
  const streakWeek = useMemo(() => getLast7DaysStreakTrack(dailyGoal), [dailyGoal]);
  const maxTarget =
    dailyGoal.metric === 'lessons'
      ? DAILY_GOAL_LIMITS.lessonsMax
      : DAILY_GOAL_LIMITS.flashcardsMax;
  const minTarget =
    dailyGoal.metric === 'lessons'
      ? DAILY_GOAL_LIMITS.lessonsMin
      : DAILY_GOAL_LIMITS.flashcardsMin;
  const unitLabel =
    dailyGoal.metric === 'lessons'
      ? goalStatus.target === 1
        ? 'lesson'
        : 'lessons'
      : goalStatus.target === 1
        ? 'flashcard'
        : 'flashcards';

  return (
    <div className="space-y-8">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 [text-wrap:balance]">
            DECO Syllabus Progress Tracker
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            U24EC304 · CIE (40 Marks) & SEE (60 Marks) readiness across Units I–V
          </p>
        </div>

        <button
          type="button"
          onClick={onShareProgressToGroup}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] px-4 py-2 text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          <Share2 className="w-3.5 h-3.5" />
          Share Progress Milestone
        </button>
      </div>

      {/* 4-Column KPI Row */}
      <section
        aria-label="Overall study metrics"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Overall Mastery
          </div>
          <div className="mt-2 text-3xl font-bold font-mono tabular-nums text-[var(--accent-text)]">
            {progress.overallMasteryPercent}%
          </div>
          <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            65% lessons · 35% flashcards
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Lessons Completed
          </div>
          <div className="mt-2 text-3xl font-bold font-mono tabular-nums text-zinc-900 dark:text-zinc-100">
            {progress.completedLessons}/{progress.totalLessons}
          </div>
          <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
            {progress.estimatedMinutesCompleted} of {progress.estimatedMinutesTotal} min studied
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Flashcards Mastered
          </div>
          <div className="mt-2 text-3xl font-bold font-mono tabular-nums text-zinc-900 dark:text-zinc-100">
            {progress.masteredCards}/{progress.totalCards}
          </div>
          <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
            {progress.reviewCards} flagged for review
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Active Study Streak
          </div>
          <div className="mt-2 text-3xl font-bold font-mono tabular-nums text-[var(--accent-secondary-text)]">
            {studyStreakDays} {studyStreakDays === 1 ? 'day' : 'days'}
          </div>
          <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
            {upcomingRemindersCount} upcoming deadlines
          </div>
        </div>
      </section>

      {/* Daily Study Goal & Visual Streak Counter */}
      <section
        aria-label="Daily Study Goal"
        className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Goal Target Configurator & Daily Progress */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <Target className="w-5 h-5 text-[var(--accent-text)] mt-0.5 shrink-0" />
                <div>
                  <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                    Daily Study Goal
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Set a daily target for DECO lessons or flashcard reviews
                  </p>
                </div>
              </div>

              <span
                className={`text-xs font-semibold ${
                  goalStatus.isMet
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-[var(--accent-text)]'
                }`}
              >
                {goalStatus.isMet
                  ? 'Daily goal reached'
                  : `${goalStatus.remaining} ${
                      goalStatus.remaining === 1
                        ? dailyGoal.metric === 'lessons'
                          ? 'lesson'
                          : 'flashcard'
                        : dailyGoal.metric === 'lessons'
                          ? 'lessons'
                          : 'flashcards'
                    } to go today`}
              </span>
            </div>

            {/* Today's Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
                <span>
                  Today: {goalStatus.currentCount} of {goalStatus.target} {unitLabel}
                </span>
                <span className="font-mono font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                  {goalStatus.percent}%
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    goalStatus.isMet ? 'bg-emerald-600 dark:bg-emerald-500' : 'bg-[var(--accent)]'
                  }`}
                  style={{ width: `${goalStatus.percent}%` }}
                />
              </div>
            </div>

            {/* Goal Metric & Target Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
              <div className="flex flex-wrap items-center gap-3">
                <div
                  role="group"
                  aria-label="Daily goal metric"
                  className="inline-flex rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 p-0.5"
                >
                  {(['lessons', 'flashcards'] as const).map((metricOption) => {
                    const active = dailyGoal.metric === metricOption;
                    return (
                      <button
                        key={metricOption}
                        type="button"
                        aria-pressed={active}
                        onClick={() =>
                          onUpdateDailyGoal(
                            metricOption,
                            clampGoalTarget(
                              metricOption,
                              metricOption === 'flashcards' && dailyGoal.metric === 'lessons'
                                ? Math.max(5, dailyGoal.target * 3)
                                : metricOption === 'lessons' && dailyGoal.metric === 'flashcards'
                                  ? Math.min(5, Math.max(1, Math.round(dailyGoal.target / 3)))
                                  : dailyGoal.target
                            )
                          )
                        }
                        className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
                          active
                            ? 'bg-[var(--accent)] text-white'
                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                        }`}
                      >
                        {metricOption}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-1.5">
                  <label
                    htmlFor="daily-goal-target"
                    className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mr-1"
                  >
                    Target:
                  </label>
                  <button
                    type="button"
                    aria-label="Decrease daily goal target"
                    disabled={goalStatus.target <= minTarget}
                    onClick={() =>
                      onUpdateDailyGoal(
                        dailyGoal.metric,
                        clampGoalTarget(dailyGoal.metric, goalStatus.target - 1)
                      )
                    }
                    className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:pointer-events-none p-1.5 text-zinc-700 dark:text-zinc-200 transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    id="daily-goal-target"
                    type="number"
                    min={minTarget}
                    max={maxTarget}
                    value={goalStatus.target}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (!Number.isNaN(val) && val >= 1) {
                        onUpdateDailyGoal(
                          dailyGoal.metric,
                          clampGoalTarget(dailyGoal.metric, val)
                        );
                      }
                    }}
                    className="w-16 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-2 py-1 text-center font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]"
                  />
                  <button
                    type="button"
                    aria-label="Increase daily goal target"
                    disabled={goalStatus.target >= maxTarget}
                    onClick={() =>
                      onUpdateDailyGoal(
                        dailyGoal.metric,
                        clampGoalTarget(dailyGoal.metric, goalStatus.target + 1)
                      )
                    }
                    className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:pointer-events-none p-1.5 text-zinc-700 dark:text-zinc-200 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {dailyGoal.metric === 'flashcards' && !goalStatus.isMet && (
                <button
                  type="button"
                  onClick={onOpenFlashcards}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--accent-text)] hover:underline whitespace-nowrap"
                >
                  Practice Flashcards
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Right: Visual Streak Counter & 7-Day Activity Strip */}
          <div className="lg:col-span-5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    goalStatus.isMet
                      ? 'bg-[var(--accent-secondary-soft)] border border-[var(--accent-secondary-border)] text-[var(--accent-secondary-text)]'
                      : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400'
                  }`}
                >
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 font-mono tabular-nums">
                    {studyStreakDays} {studyStreakDays === 1 ? 'day' : 'days'} streak
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    {goalStatus.isMet
                      ? 'Streak active for today'
                      : 'Meet today’s target to extend streak'}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5" aria-label="7-day study streak calendar">
              {streakWeek.map((day) => (
                <div
                  key={day.date}
                  title={`${day.date}: ${day.completed ? 'Goal met' : day.isToday ? 'Today (in progress)' : 'No goal recorded'}`}
                  className="flex flex-col items-center gap-1"
                >
                  <span
                    className={`text-[10px] font-medium ${
                      day.isToday
                        ? 'text-zinc-900 dark:text-zinc-100 font-semibold'
                        : 'text-zinc-500 dark:text-zinc-400'
                    }`}
                  >
                    {day.isToday ? 'Today' : day.dayShort}
                  </span>
                  <div
                    className={`w-full h-8 rounded-md flex items-center justify-center border text-xs transition-colors ${
                      day.completed
                        ? 'bg-[var(--accent)] border-[var(--accent)] text-white'
                        : day.isToday
                          ? 'border-dashed border-[var(--accent-ring)] bg-[var(--accent-soft)] text-[var(--accent-text)]'
                          : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-400 dark:text-zinc-600'
                    }`}
                  >
                    {day.completed ? (
                      <Check className="w-3.5 h-3.5" aria-hidden="true" />
                    ) : day.isToday ? (
                      <span className="font-mono text-[10px] font-semibold tabular-nums">
                        {goalStatus.currentCount}/{goalStatus.target}
                      </span>
                    ) : (
                      <span aria-hidden="true">·</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Subject-by-Subject Breakdown */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Progress by Subject Unit
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {progress.subjects.map((subSummary) => {
            const subjectMeta = subjects.find((s) => s.id === subSummary.subjectId);
            const firstIncomplete =
              lessons.find(
                (l) => l.subjectId === subSummary.subjectId && !completedSet.has(l.id)
              ) ?? lessons.find((l) => l.subjectId === subSummary.subjectId);

            return (
              <div
                key={subSummary.subjectId}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                      {subSummary.code} · {subjectMeta?.courseOutcome} ·{' '}
                      <span
                        className={
                          subSummary.statusLabel === 'Completed'
                            ? 'text-emerald-700 dark:text-emerald-400 font-medium'
                            : subSummary.statusLabel === 'In Progress'
                            ? 'text-[var(--accent-text)] font-medium'
                            : 'text-zinc-500 dark:text-zinc-400'
                        }
                      >
                        {subSummary.statusLabel}
                      </span>
                    </div>
                    <h3 className="mt-1 text-base font-semibold text-zinc-900 dark:text-zinc-100">
                      {subSummary.title}
                    </h3>
                  </div>

                  <span className="text-xl font-bold font-mono tabular-nums text-zinc-900 dark:text-zinc-100">
                    {subSummary.overallPercent}%
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-zinc-600 dark:text-zinc-400">
                      <span>Lessons</span>
                      <span className="font-mono tabular-nums">
                        {subSummary.completedLessons}/{subSummary.totalLessons} ({subSummary.lessonPercent}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-[var(--accent)] transition-all"
                        style={{ width: `${subSummary.lessonPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-zinc-600 dark:text-zinc-400">
                      <span>Flashcards</span>
                      <span className="font-mono tabular-nums">
                        {subSummary.masteredCards}/{subSummary.totalCards} ({subSummary.flashcardPercent}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-[var(--accent-secondary)] transition-all"
                        style={{ width: `${subSummary.flashcardPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {firstIncomplete && (
                  <div className="pt-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => onOpenLesson(subSummary.subjectId, firstIncomplete.id)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--accent-text)] hover:underline whitespace-nowrap"
                    >
                      {subSummary.statusLabel === 'Completed' ? 'Review Unit' : 'Continue Unit'}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Complete Per-Lesson Tracking Matrix */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Syllabus Lesson Checklist
        </h2>

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 divide-y divide-zinc-200 dark:divide-zinc-800">
          {subjects.map((subject) => {
            const unitLessons = lessons
              .filter((l) => l.subjectId === subject.id)
              .sort((a, b) => a.order - b.order);

            return (
              <div key={subject.id} className="p-5 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {subject.code} — {subject.title}
                  </span>
                  <span className="font-mono tabular-nums text-zinc-500 dark:text-zinc-400">
                    {unitLessons.filter((l) => completedSet.has(l.id)).length}/{unitLessons.length} complete
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {unitLessons.map((lesson) => {
                    const done = completedSet.has(lesson.id);
                    return (
                      <div
                        key={lesson.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2.5"
                      >
                        <button
                          type="button"
                          aria-label={`Toggle completion for '${lesson.title}'`}
                          onClick={() => onToggleLessonComplete(lesson.id)}
                          className="flex items-center gap-2.5 min-w-0 text-left flex-1"
                        >
                          {done ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          ) : (
                            <Circle className="w-4 h-4 text-zinc-400 dark:text-zinc-600 shrink-0" />
                          )}
                          <span
                            className={`text-xs sm:text-sm truncate ${
                              done
                                ? 'text-zinc-500 dark:text-zinc-400 line-through'
                                : 'text-zinc-800 dark:text-zinc-200 font-medium'
                            }`}
                          >
                            {String(lesson.order).padStart(2, '0')}. {lesson.title}
                          </span>
                        </button>

                        <button
                          type="button"
                          aria-label={`Open lesson '${lesson.title}'`}
                          onClick={() => onOpenLesson(subject.id, lesson.id)}
                          className="text-xs font-medium text-[var(--accent-text)] hover:underline whitespace-nowrap shrink-0"
                        >
                          Study
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

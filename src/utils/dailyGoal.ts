import type { DailyGoalMetric, DailyStudyGoal } from '../types/study';

export const DAILY_GOAL_LIMITS = {
  lessonsMin: 1,
  lessonsMax: 20,
  flashcardsMin: 1,
  flashcardsMax: 50,
  recentActiveDatesMax: 14,
} as const;

export function getLocalDateKey(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getPreviousDateKey(dateKey: string, daysBack = 1): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - daysBack);
  const py = dt.getUTCFullYear();
  const pm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const pd = String(dt.getUTCDate()).padStart(2, '0');
  return `${py}-${pm}-${pd}`;
}

export function clampGoalTarget(metric: DailyGoalMetric, rawTarget: number): number {
  const safe = Number.isFinite(rawTarget) ? Math.round(rawTarget) : 1;
  const max =
    metric === 'lessons' ? DAILY_GOAL_LIMITS.lessonsMax : DAILY_GOAL_LIMITS.flashcardsMax;
  const min =
    metric === 'lessons' ? DAILY_GOAL_LIMITS.lessonsMin : DAILY_GOAL_LIMITS.flashcardsMin;
  return Math.min(max, Math.max(min, safe));
}

export function createDefaultDailyGoal(todayKey: string = getLocalDateKey()): DailyStudyGoal {
  return {
    metric: 'lessons',
    target: 2,
    date: todayKey,
    lessonsCompletedToday: 0,
    flashcardsStudiedToday: 0,
    lastGoalMetDate: null,
    recentActiveDates: [],
  };
}

export function rolloverDailyGoalIfNeeded(
  goal: DailyStudyGoal,
  todayKey: string = getLocalDateKey()
): DailyStudyGoal {
  if (goal.date === todayKey) {
    return goal;
  }
  return {
    ...goal,
    date: todayKey,
    lessonsCompletedToday: 0,
    flashcardsStudiedToday: 0,
  };
}

export function evaluateDailyGoalStatus(goal: DailyStudyGoal): {
  currentCount: number;
  target: number;
  remaining: number;
  percent: number;
  isMet: boolean;
} {
  const currentCount =
    goal.metric === 'lessons' ? goal.lessonsCompletedToday : goal.flashcardsStudiedToday;
  const target = clampGoalTarget(goal.metric, goal.target);
  const remaining = Math.max(0, target - currentCount);
  const percent = Math.min(100, Math.round((currentCount / target) * 100));
  return {
    currentCount,
    target,
    remaining,
    percent,
    isMet: currentCount >= target,
  };
}

function applyStreakCheck(params: {
  goal: DailyStudyGoal;
  studyStreakDays: number;
  todayKey: string;
}): { dailyGoal: DailyStudyGoal; studyStreakDays: number } {
  const { goal, studyStreakDays, todayKey } = params;
  const status = evaluateDailyGoalStatus(goal);
  if (!status.isMet) {
    return { dailyGoal: goal, studyStreakDays };
  }

  const nextDates = Array.from(new Set([...goal.recentActiveDates, todayKey]))
    .sort()
    .slice(-DAILY_GOAL_LIMITS.recentActiveDatesMax);

  if (goal.lastGoalMetDate === todayKey) {
    return {
      dailyGoal: {
        ...goal,
        recentActiveDates: nextDates,
      },
      studyStreakDays: Math.max(1, studyStreakDays),
    };
  }

  const yesterdayKey = getPreviousDateKey(todayKey, 1);
  let nextStreak: number;
  if (goal.lastGoalMetDate === yesterdayKey) {
    nextStreak = Math.max(1, studyStreakDays) + 1;
  } else if (goal.lastGoalMetDate === null) {
    nextStreak = Math.max(1, studyStreakDays);
  } else {
    nextStreak = 1;
  }

  return {
    dailyGoal: {
      ...goal,
      lastGoalMetDate: todayKey,
      recentActiveDates: nextDates,
    },
    studyStreakDays: nextStreak,
  };
}

export function recordDailyStudyActivity(params: {
  goal: DailyStudyGoal;
  studyStreakDays: number;
  kind: DailyGoalMetric;
  delta: number;
  todayKey?: string;
}): { dailyGoal: DailyStudyGoal; studyStreakDays: number } {
  const todayKey = params.todayKey ?? getLocalDateKey();
  const rolled = rolloverDailyGoalIfNeeded(params.goal, todayKey);
  const nextGoal: DailyStudyGoal = {
    ...rolled,
    lessonsCompletedToday:
      params.kind === 'lessons'
        ? Math.max(0, rolled.lessonsCompletedToday + params.delta)
        : rolled.lessonsCompletedToday,
    flashcardsStudiedToday:
      params.kind === 'flashcards'
        ? Math.max(0, rolled.flashcardsStudiedToday + params.delta)
        : rolled.flashcardsStudiedToday,
  };

  return applyStreakCheck({
    goal: nextGoal,
    studyStreakDays: params.studyStreakDays,
    todayKey,
  });
}

export function updateDailyGoalConfig(params: {
  goal: DailyStudyGoal;
  studyStreakDays: number;
  metric: DailyGoalMetric;
  target: number;
  todayKey?: string;
}): { dailyGoal: DailyStudyGoal; studyStreakDays: number } {
  const todayKey = params.todayKey ?? getLocalDateKey();
  const rolled = rolloverDailyGoalIfNeeded(params.goal, todayKey);
  const nextGoal: DailyStudyGoal = {
    ...rolled,
    metric: params.metric,
    target: clampGoalTarget(params.metric, params.target),
  };

  return applyStreakCheck({
    goal: nextGoal,
    studyStreakDays: params.studyStreakDays,
    todayKey,
  });
}

const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export interface StreakDayCell {
  date: string;
  dayShort: string;
  isToday: boolean;
  completed: boolean;
}

export function getLast7DaysStreakTrack(
  goal: DailyStudyGoal,
  todayKey: string = getLocalDateKey()
): StreakDayCell[] {
  const rolled = rolloverDailyGoalIfNeeded(goal, todayKey);
  const status = evaluateDailyGoalStatus(rolled);
  const activeSet = new Set(rolled.recentActiveDates);

  const cells: StreakDayCell[] = [];
  for (let offset = 6; offset >= 0; offset--) {
    const dateKey = getPreviousDateKey(todayKey, offset);
    const [y, m, d] = dateKey.split('-').map(Number);
    const dayIndex = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
    const isToday = offset === 0;
    cells.push({
      date: dateKey,
      dayShort: WEEKDAY_SHORT[dayIndex],
      isToday,
      completed: activeSet.has(dateKey) || (isToday && status.isMet),
    });
  }
  return cells;
}

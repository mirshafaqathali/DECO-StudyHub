import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildGroupShareSummary,
  calculateSyllabusProgress,
  LESSON_NOTE_MAX_LENGTH,
  mergeStudySnapshots,
  saveLessonNote,
  toggleLessonCompletion,
} from './studyProgress';
import {
  createDefaultDailyGoal,
  evaluateDailyGoalStatus,
  getLast7DaysStreakTrack,
  recordDailyStudyActivity,
  rolloverDailyGoalIfNeeded,
  updateDailyGoalConfig,
} from './dailyGoal';
import { filterFlashcards, getNextCardIndex, gradeFlashcard } from './flashcardEngine';
import {
  appendMcqAttempt,
  buildMcqSessionQuestions,
  formatMcqDuration,
  getBestMcqPercent,
  gradeMcqTest,
} from './mcqEngine';
import { getDaysRemaining, getReminderUrgency, sortAndFilterReminders } from './reminders';
import { DECO_MCQS } from '../data/decoMcqs';
import type {
  Flashcard,
  Lesson,
  LocalStudySnapshot,
  McqTestAttempt,
  ReminderItem,
  SubjectUnit,
} from '../types/study';

const mockSubjects: SubjectUnit[] = [
  {
    id: 'unit-1',
    code: 'Unit I',
    title: 'Structure & Data Rep',
    courseOutcome: 'CO1',
    description: 'Computers and number systems',
    examWeightLabel: 'CIE-1 & SEE',
  },
  {
    id: 'unit-2',
    code: 'Unit II',
    title: 'Logic Circuits',
    courseOutcome: 'CO2',
    description: 'Boolean algebra & K-Maps',
    examWeightLabel: 'CIE-1 & SEE',
  },
];

const mockLessons: Lesson[] = [
  {
    id: 'u1-l1',
    subjectId: 'unit-1',
    order: 1,
    title: 'Functional Units',
    summary: 'CPU, Memory, I/O',
    estimatedMinutes: 20,
    courseOutcome: 'CO1',
    keyPoints: ['ALU', 'CU'],
    examTip: 'Draw block diagram',
  },
  {
    id: 'u1-l2',
    subjectId: 'unit-1',
    order: 2,
    title: 'Number Conversions',
    summary: 'Binary, Octal, Hex',
    estimatedMinutes: 25,
    courseOutcome: 'CO1',
    keyPoints: ['Base 2', 'Base 16'],
    examTip: 'Show remainder steps',
  },
  {
    id: 'u2-l1',
    subjectId: 'unit-2',
    order: 1,
    title: 'Boolean Algebra',
    summary: 'De Morgan & Duality',
    estimatedMinutes: 30,
    courseOutcome: 'CO2',
    keyPoints: ['(A+B)\' = A\'B\''],
    examTip: 'Check truth table',
  },
];

const mockCards: Flashcard[] = [
  { id: 'fc-1', subjectId: 'unit-1', front: 'What is MAR?', back: 'Memory Address Register', tag: 'Registers' },
  { id: 'fc-2', subjectId: 'unit-1', front: '2F in binary?', back: '0010 1111', tag: 'Hex' },
  { id: 'fc-3', subjectId: 'unit-2', front: 'Universal gates?', back: 'NAND and NOR', tag: 'Gates', isCustom: true },
];

test('calculateSyllabusProgress computes per-unit and overall mastery accurately', () => {
  const result = calculateSyllabusProgress({
    subjects: mockSubjects,
    lessons: mockLessons,
    flashcards: mockCards,
    completedLessonIds: ['u1-l1', 'u1-l2'],
    masteredCardIds: ['fc-1'],
    reviewCardIds: ['fc-2'],
  });

  assert.equal(result.completedLessons, 2);
  assert.equal(result.totalLessons, 3);
  assert.equal(result.lessonPercent, 67);
  assert.equal(result.masteredCards, 1);
  assert.equal(result.reviewCards, 1);
  assert.equal(result.flashcardPercent, 33);
  assert.equal(result.estimatedMinutesCompleted, 45);
  assert.equal(result.estimatedMinutesTotal, 75);

  const u1 = result.subjects[0];
  assert.equal(u1.statusLabel, 'Completed');
  assert.equal(u1.lessonPercent, 100);
  assert.equal(u1.flashcardPercent, 50);

  const u2 = result.subjects[1];
  assert.equal(u2.statusLabel, 'Not Started');
  assert.equal(u2.overallPercent, 0);
});

test('toggleLessonCompletion adds and removes lesson IDs idempotently', () => {
  const added = toggleLessonCompletion(['u1-l1'], 'u1-l2');
  assert.deepEqual(added, ['u1-l1', 'u1-l2']);
  const removed = toggleLessonCompletion(added, 'u1-l1');
  assert.deepEqual(removed, ['u1-l2']);
});

test('mergeStudySnapshots unions completed lessons and respects newer flashcard grading', () => {
  const local: LocalStudySnapshot = {
    theme: 'light',
    completedLessonIds: ['u1-l1'],
    masteredCardIds: ['fc-1'],
    reviewCardIds: ['fc-2'],
    studyStreakDays: 2,
    customFlashcards: [],
    reminders: [],
    joinedGroupCodes: ['DECO26'],
    lessonNotes: { 'u1-l1': 'Local MAR/MDR bus notes' },
    dailyGoal: createDefaultDailyGoal('2026-11-19'),
    mcqHistory: [],
    updatedAtMs: 1000,
  };
  const merged = mergeStudySnapshots(local, {
    theme: 'dark',
    completedLessonIds: ['u2-l1'],
    masteredCardIds: ['fc-2'],
    reviewCardIds: ['fc-1'],
    studyStreakDays: 5,
    joinedGroupCodes: ['AIML3B'],
    lessonNotes: { 'u2-l1': 'Remote De Morgan proof' },
    updatedAtMs: 2000,
  });

  assert.equal(merged.theme, 'dark');
  assert.deepEqual(merged.completedLessonIds, ['u1-l1', 'u2-l1']);
  assert.deepEqual(merged.masteredCardIds, ['fc-2']);
  assert.deepEqual(merged.reviewCardIds, ['fc-1']);
  assert.equal(merged.studyStreakDays, 5);
  assert.deepEqual(merged.joinedGroupCodes, ['DECO26', 'AIML3B']);
  assert.deepEqual(merged.lessonNotes, {
    'u1-l1': 'Local MAR/MDR bus notes',
    'u2-l1': 'Remote De Morgan proof',
  });
});

test('flashcardEngine filters, grades, and wraps indices correctly', () => {
  const customOnly = filterFlashcards({
    cards: mockCards,
    subjectFilter: 'all',
    deckFilter: 'custom',
    masteredCardIds: [],
    reviewCardIds: [],
  });
  assert.equal(customOnly.length, 1);
  assert.equal(customOnly[0].id, 'fc-3');

  const dueUnit1 = filterFlashcards({
    cards: mockCards,
    subjectFilter: 'unit-1',
    deckFilter: 'due',
    masteredCardIds: ['fc-1'],
    reviewCardIds: ['fc-2'],
  });
  assert.deepEqual(
    dueUnit1.map((c) => c.id),
    ['fc-2']
  );

  const graded = gradeFlashcard({
    cardId: 'fc-2',
    grade: 'mastered',
    masteredCardIds: ['fc-1'],
    reviewCardIds: ['fc-2'],
  });
  assert.deepEqual(graded.masteredCardIds, ['fc-1', 'fc-2']);
  assert.deepEqual(graded.reviewCardIds, []);

  assert.equal(getNextCardIndex(2, 3, 'next'), 0);
  assert.equal(getNextCardIndex(0, 3, 'prev'), 2);
});

test('reminders countdown, urgency labels, sorting, and share summary work accurately', () => {
  assert.equal(getDaysRemaining('2026-11-22', '2026-11-19'), 3);
  assert.equal(getDaysRemaining('2026-11-18', '2026-11-19'), -1);

  assert.equal(getReminderUrgency({ dueDate: '2026-11-19', completed: false }, '2026-11-19').label, 'Due today');
  assert.equal(getReminderUrgency({ dueDate: '2026-11-17', completed: false }, '2026-11-19').level, 'overdue');
  assert.equal(getReminderUrgency({ dueDate: '2026-11-17', completed: true }, '2026-11-19').level, 'done');

  const items: ReminderItem[] = [
    { id: 'r1', title: 'SEE Exam', subjectId: 'all', kind: 'exam', dueDate: '2026-12-10', notes: '', completed: false, updatedAtMs: 1 },
    { id: 'r2', title: 'Quiz 1', subjectId: 'unit-1', kind: 'quiz', dueDate: '2026-11-20', notes: '', completed: true, updatedAtMs: 1 },
    { id: 'r3', title: 'CIE-2 Exam', subjectId: 'unit-3', kind: 'exam', dueDate: '2026-11-24', notes: '', completed: false, updatedAtMs: 1 },
  ];

  const upcoming = sortAndFilterReminders(items, 'upcoming');
  assert.deepEqual(upcoming.map((r) => r.id), ['r3', 'r1']);

  const all = sortAndFilterReminders(items, 'all');
  assert.deepEqual(all.map((r) => r.id), ['r3', 'r1', 'r2']);

  const progress = calculateSyllabusProgress({
    subjects: mockSubjects,
    lessons: mockLessons,
    flashcards: mockCards,
    completedLessonIds: ['u1-l1'],
    masteredCardIds: [],
    reviewCardIds: [],
  });
  const share = buildGroupShareSummary({ progress, studentName: 'Aisha' });
  assert.match(share.title, /Aisha reached/);
  assert.match(share.body, /1\/3 lessons/);
});

test('saveLessonNote stores, isolates, clamps, and clears per-lesson scratchpad notes', () => {
  const step1 = saveLessonNote({}, 'u1-l1', 'Remember: PC -> MAR -> MBR');
  assert.deepEqual(step1, { 'u1-l1': 'Remember: PC -> MAR -> MBR' });

  const step2 = saveLessonNote(step1, 'u2-l1', 'De Morgan: (A+B)\' = A\'B\'');
  assert.deepEqual(step2, {
    'u1-l1': 'Remember: PC -> MAR -> MBR',
    'u2-l1': 'De Morgan: (A+B)\' = A\'B\'',
  });

  // Clearing with whitespace removes only the targeted lesson note
  const step3 = saveLessonNote(step2, 'u1-l1', '   \n  ');
  assert.deepEqual(step3, { 'u2-l1': 'De Morgan: (A+B)\' = A\'B\'' });

  // Oversized note is safely clamped to LESSON_NOTE_MAX_LENGTH
  const oversized = 'x'.repeat(LESSON_NOTE_MAX_LENGTH + 250);
  const step4 = saveLessonNote({}, 'u3-l1', oversized);
  assert.equal(step4['u3-l1'].length, LESSON_NOTE_MAX_LENGTH);
});

test('dailyGoal tracks lesson/flashcard progress, rolls over daily, and extends streak consecutively', () => {
  const initialGoal = {
    ...createDefaultDailyGoal('2026-11-18'),
    lastGoalMetDate: '2026-11-18',
    recentActiveDates: ['2026-11-18'],
  };

  // Next day rollover resets today's counters while keeping target & active dates
  const rolled = rolloverDailyGoalIfNeeded(initialGoal, '2026-11-19');
  assert.equal(rolled.date, '2026-11-19');
  assert.equal(rolled.lessonsCompletedToday, 0);

  // Completing 1 of 2 lessons does not yet increment streak
  const afterOne = recordDailyStudyActivity({
    goal: rolled,
    studyStreakDays: 3,
    kind: 'lessons',
    delta: 1,
    todayKey: '2026-11-19',
  });
  assert.equal(afterOne.studyStreakDays, 3);
  assert.equal(evaluateDailyGoalStatus(afterOne.dailyGoal).isMet, false);

  // Completing 2nd lesson on consecutive day increments streak 3 -> 4
  const afterTwo = recordDailyStudyActivity({
    goal: afterOne.dailyGoal,
    studyStreakDays: afterOne.studyStreakDays,
    kind: 'lessons',
    delta: 1,
    todayKey: '2026-11-19',
  });
  assert.equal(afterTwo.studyStreakDays, 4);
  assert.equal(evaluateDailyGoalStatus(afterTwo.dailyGoal).isMet, true);
  assert.deepEqual(afterTwo.dailyGoal.recentActiveDates, ['2026-11-18', '2026-11-19']);

  // Switching to flashcards with target 2 and grading cards works cleanly
  const flashcardConfig = updateDailyGoalConfig({
    goal: afterTwo.dailyGoal,
    studyStreakDays: afterTwo.studyStreakDays,
    metric: 'flashcards',
    target: 2,
    todayKey: '2026-11-19',
  });
  assert.equal(flashcardConfig.dailyGoal.metric, 'flashcards');
  assert.equal(evaluateDailyGoalStatus(flashcardConfig.dailyGoal).isMet, false);

  const track = getLast7DaysStreakTrack(afterTwo.dailyGoal, '2026-11-19');
  assert.equal(track.length, 7);
  assert.equal(track[6].isToday, true);
  assert.equal(track[6].completed, true);
  assert.equal(track[5].completed, true);
  assert.equal(track[4].completed, false);
});

test('mcqEngine filters, builds shuffled sessions, grades answers, and tracks history', () => {
  assert.equal(DECO_MCQS.length, 25);

  const unit1Qs = buildMcqSessionQuestions({
    bank: DECO_MCQS,
    subjectFilter: 'unit-1',
    count: 5,
    shuffle: false,
  });
  assert.equal(unit1Qs.length, 5);
  assert.ok(unit1Qs.every((q) => q.subjectId === 'unit-1'));

  const shuffled = buildMcqSessionQuestions({
    bank: DECO_MCQS,
    subjectFilter: 'all',
    count: 10,
    shuffle: true,
    randomFn: () => 0.25,
  });
  assert.equal(shuffled.length, 10);

  // Grade 3 correct, 1 incorrect, 1 unanswered out of 5
  const answers: Record<string, number> = {
    [unit1Qs[0].id]: unit1Qs[0].correctIndex,
    [unit1Qs[1].id]: unit1Qs[1].correctIndex,
    [unit1Qs[2].id]: unit1Qs[2].correctIndex,
    [unit1Qs[3].id]: (unit1Qs[3].correctIndex + 1) % 4,
  };
  const graded = gradeMcqTest(unit1Qs, answers);
  assert.equal(graded.score, 3);
  assert.equal(graded.total, 5);
  assert.equal(graded.percent, 60);
  assert.equal(graded.answeredCount, 4);
  assert.equal(graded.breakdown[4].selectedIndex, null);
  assert.equal(graded.breakdown[4].isCorrect, false);

  assert.equal(formatMcqDuration(65), '01:05');

  const attempt1: McqTestAttempt = {
    id: 'a1',
    subjectFilter: 'unit-1',
    score: 3,
    total: 5,
    percent: 60,
    elapsedSeconds: 65,
    completedAtMs: 1000,
  };
  const attempt2: McqTestAttempt = {
    id: 'a2',
    subjectFilter: 'all',
    score: 9,
    total: 10,
    percent: 90,
    elapsedSeconds: 180,
    completedAtMs: 2000,
  };

  let history = appendMcqAttempt([], attempt1);
  history = appendMcqAttempt(history, attempt2);
  assert.equal(history.length, 2);
  assert.equal(history[0].id, 'a2');
  assert.equal(getBestMcqPercent(history), 90);
});


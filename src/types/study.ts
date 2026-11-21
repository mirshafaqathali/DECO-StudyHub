import type { PostKind, ReminderKind, ScopeSubjectId, SubjectId } from '../utils/validation';

export type ThemeMode = 'light' | 'dark';

export type ColorPalette = 'teal' | 'indigo' | 'copper' | 'crimson';

export type AppTab = 'lessons' | 'flashcards' | 'tests' | 'progress' | 'reminders' | 'groups';

export type DailyGoalMetric = 'lessons' | 'flashcards';

export interface DailyStudyGoal {
  metric: DailyGoalMetric;
  target: number;
  date: string; // YYYY-MM-DD
  lessonsCompletedToday: number;
  flashcardsStudiedToday: number;
  lastGoalMetDate: string | null;
  recentActiveDates: string[];
}

export interface LessonDiagram {
  src: string;
  alt: string;
  caption: string;
}

export interface LessonTable {
  caption: string;
  headers: string[];
  rows: string[][];
}

export interface LessonExample {
  prompt: string;
  solution: string;
}

export interface Lesson {
  id: string;
  subjectId: SubjectId;
  order: number;
  title: string;
  summary: string;
  estimatedMinutes: number;
  courseOutcome: string;
  keyPoints: string[];
  formulas?: string[];
  diagram?: LessonDiagram;
  table?: LessonTable;
  workedExample?: LessonExample;
  examTip: string;
}

export interface SubjectUnit {
  id: SubjectId;
  code: string;
  title: string;
  courseOutcome: string;
  description: string;
  examWeightLabel: string;
}

export interface Flashcard {
  id: string;
  subjectId: SubjectId;
  front: string;
  back: string;
  tag: string;
  isCustom?: boolean;
  createdAtMs?: number;
}

export interface ReminderItem {
  id: string;
  title: string;
  subjectId: ScopeSubjectId;
  kind: ReminderKind;
  dueDate: string; // YYYY-MM-DD
  notes: string;
  completed: boolean;
  isSeeded?: boolean;
  updatedAtMs: number;
}

export interface StudyGroup {
  code: string;
  name: string;
  description: string;
  subjectFocus: ScopeSubjectId;
  ownerId: string;
  ownerName: string;
  memberIds: string[];
  recentPostIds: string[];
  updatedAtMs: number;
}

export interface GroupMember {
  uid: string;
  groupId: string;
  displayName: string;
  role: 'owner' | 'member';
  completedLessonsCount: number;
  masteredCardsCount: number;
}

export interface StudyPost {
  id: string;
  groupId: string;
  authorId: string;
  authorName: string;
  kind: PostKind;
  subjectId: ScopeSubjectId;
  title: string;
  body: string;
  flashcardFront: string;
  flashcardBack: string;
  upvoterIds: string[];
  createdAtMs: number;
}

export interface McqQuestion {
  id: string;
  subjectId: SubjectId;
  topic: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanation: string;
}

export interface McqTestAttempt {
  id: string;
  subjectFilter: ScopeSubjectId;
  score: number;
  total: number;
  percent: number;
  elapsedSeconds: number;
  completedAtMs: number;
}

export interface LocalStudySnapshot {
  theme: ThemeMode;
  completedLessonIds: string[];
  masteredCardIds: string[];
  reviewCardIds: string[];
  studyStreakDays: number;
  customFlashcards: Flashcard[];
  reminders: ReminderItem[];
  joinedGroupCodes: string[];
  lessonNotes: Record<string, string>;
  dailyGoal: DailyStudyGoal;
  mcqHistory: McqTestAttempt[];
  updatedAtMs: number;
}

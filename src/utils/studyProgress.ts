import type { Lesson, LocalStudySnapshot, McqTestAttempt, SubjectUnit } from '../types/study';
import type { SubjectId } from './validation';

export interface SubjectProgressSummary {
  subjectId: SubjectId;
  code: string;
  title: string;
  completedLessons: number;
  totalLessons: number;
  lessonPercent: number;
  masteredCards: number;
  totalCards: number;
  flashcardPercent: number;
  overallPercent: number;
  statusLabel: 'Not Started' | 'In Progress' | 'Completed';
}

export interface OverallSyllabusProgress {
  completedLessons: number;
  totalLessons: number;
  lessonPercent: number;
  masteredCards: number;
  reviewCards: number;
  totalCards: number;
  flashcardPercent: number;
  overallMasteryPercent: number;
  estimatedMinutesCompleted: number;
  estimatedMinutesTotal: number;
  subjects: SubjectProgressSummary[];
}

export function calculateSyllabusProgress(params: {
  subjects: SubjectUnit[];
  lessons: Lesson[];
  flashcards: { id: string; subjectId: SubjectId }[];
  completedLessonIds: string[];
  masteredCardIds: string[];
  reviewCardIds: string[];
}): OverallSyllabusProgress {
  const completedSet = new Set(params.completedLessonIds);
  const masteredSet = new Set(params.masteredCardIds);
  const reviewSet = new Set(params.reviewCardIds);

  const subjectSummaries: SubjectProgressSummary[] = params.subjects.map((subject) => {
    const unitLessons = params.lessons.filter((l) => l.subjectId === subject.id);
    const unitCards = params.flashcards.filter((c) => c.subjectId === subject.id);

    const completedLessons = unitLessons.filter((l) => completedSet.has(l.id)).length;
    const totalLessons = unitLessons.length;
    const lessonPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    const masteredCards = unitCards.filter((c) => masteredSet.has(c.id)).length;
    const totalCards = unitCards.length;
    const flashcardPercent = totalCards > 0 ? Math.round((masteredCards / totalCards) * 100) : 0;

    // Weight lessons 65% and flashcards 35% when both exist
    const overallPercent =
      totalLessons > 0 && totalCards > 0
        ? Math.round(lessonPercent * 0.65 + flashcardPercent * 0.35)
        : lessonPercent;

    let statusLabel: SubjectProgressSummary['statusLabel'] = 'Not Started';
    if (totalLessons > 0 && completedLessons === totalLessons) {
      statusLabel = 'Completed';
    } else if (completedLessons > 0 || masteredCards > 0) {
      statusLabel = 'In Progress';
    }

    return {
      subjectId: subject.id,
      code: subject.code,
      title: subject.title,
      completedLessons,
      totalLessons,
      lessonPercent,
      masteredCards,
      totalCards,
      flashcardPercent,
      overallPercent,
      statusLabel,
    };
  });

  const completedLessons = params.lessons.filter((l) => completedSet.has(l.id)).length;
  const totalLessons = params.lessons.length;
  const lessonPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const masteredCards = params.flashcards.filter((c) => masteredSet.has(c.id)).length;
  const reviewCards = params.flashcards.filter((c) => reviewSet.has(c.id) && !masteredSet.has(c.id)).length;
  const totalCards = params.flashcards.length;
  const flashcardPercent = totalCards > 0 ? Math.round((masteredCards / totalCards) * 100) : 0;

  const overallMasteryPercent =
    totalLessons > 0 && totalCards > 0
      ? Math.round(lessonPercent * 0.65 + flashcardPercent * 0.35)
      : lessonPercent;

  const estimatedMinutesTotal = params.lessons.reduce((sum, l) => sum + l.estimatedMinutes, 0);
  const estimatedMinutesCompleted = params.lessons
    .filter((l) => completedSet.has(l.id))
    .reduce((sum, l) => sum + l.estimatedMinutes, 0);

  return {
    completedLessons,
    totalLessons,
    lessonPercent,
    masteredCards,
    reviewCards,
    totalCards,
    flashcardPercent,
    overallMasteryPercent,
    estimatedMinutesCompleted,
    estimatedMinutesTotal,
    subjects: subjectSummaries,
  };
}

export function toggleLessonCompletion(completedLessonIds: string[], lessonId: string): string[] {
  const exists = completedLessonIds.includes(lessonId);
  if (exists) {
    return completedLessonIds.filter((id) => id !== lessonId);
  }
  return [...completedLessonIds, lessonId];
}

export const LESSON_NOTE_MAX_LENGTH = 4000;

export function saveLessonNote(
  lessonNotes: Record<string, string>,
  lessonId: string,
  noteText: string
): Record<string, string> {
  const next = { ...lessonNotes };
  const clamped = noteText.slice(0, LESSON_NOTE_MAX_LENGTH);
  if (clamped.trim().length === 0) {
    delete next[lessonId];
  } else {
    next[lessonId] = clamped;
  }
  return next;
}

export function mergeStudySnapshots(
  local: LocalStudySnapshot,
  remote: Partial<LocalStudySnapshot> & { updatedAtMs?: number }
): LocalStudySnapshot {
  const remoteWins = (remote.updatedAtMs ?? 0) > local.updatedAtMs;
  const mergedLessons = Array.from(
    new Set([...local.completedLessonIds, ...(remote.completedLessonIds ?? [])])
  ).slice(0, 100);

  // For mastered/review cards, respect whichever snapshot is newer for conflicting card IDs, while preserving disjoint progress
  const primaryMastered = remoteWins ? remote.masteredCardIds ?? [] : local.masteredCardIds;
  const secondaryMastered = remoteWins ? local.masteredCardIds : remote.masteredCardIds ?? [];
  const primaryReview = remoteWins ? remote.reviewCardIds ?? [] : local.reviewCardIds;
  const secondaryReview = remoteWins ? local.reviewCardIds : remote.reviewCardIds ?? [];

  const masteredSet = new Set(primaryMastered);
  const reviewSet = new Set(primaryReview);

  for (const id of secondaryMastered) {
    if (!reviewSet.has(id)) masteredSet.add(id);
  }
  for (const id of secondaryReview) {
    if (!masteredSet.has(id)) reviewSet.add(id);
  }

  const mergedNotes: Record<string, string> = {
    ...(remote.lessonNotes ?? {}),
    ...(local.lessonNotes ?? {}),
  };

  const mergedHistoryMap = new Map<string, McqTestAttempt>();
  for (const item of [...(remote.mcqHistory ?? []), ...(local.mcqHistory ?? [])]) {
    mergedHistoryMap.set(item.id, item);
  }
  const mergedMcqHistory = Array.from(mergedHistoryMap.values())
    .sort((a, b) => b.completedAtMs - a.completedAtMs)
    .slice(0, 20);

  return {
    theme: remoteWins && remote.theme ? remote.theme : local.theme,
    completedLessonIds: mergedLessons,
    masteredCardIds: Array.from(masteredSet).slice(0, 500),
    reviewCardIds: Array.from(reviewSet).slice(0, 500),
    studyStreakDays: Math.max(local.studyStreakDays, remote.studyStreakDays ?? 1),
    customFlashcards: local.customFlashcards,
    reminders: local.reminders,
    joinedGroupCodes: Array.from(
      new Set([...local.joinedGroupCodes, ...(remote.joinedGroupCodes ?? [])])
    ),
    lessonNotes: mergedNotes,
    dailyGoal: local.dailyGoal,
    mcqHistory: mergedMcqHistory,
    updatedAtMs: Math.max(local.updatedAtMs, remote.updatedAtMs ?? 0),
  };
}

export function buildGroupShareSummary(params: {
  progress: OverallSyllabusProgress;
  studentName: string;
}): { title: string; body: string } {
  const { progress, studentName } = params;
  const completedUnits = progress.subjects
    .filter((s) => s.completedLessons > 0)
    .map((s) => `${s.code} (${s.lessonPercent}%)`);
  const focusText = completedUnits.length > 0 ? completedUnits.join(', ') : 'Starting DECO Unit I';

  return {
    title: `${studentName} reached ${progress.overallMasteryPercent}% DECO syllabus mastery`,
    body: `Completed ${progress.completedLessons}/${progress.totalLessons} lessons and mastered ${progress.masteredCards}/${progress.totalCards} flashcards. Active units: ${focusText}.`,
  };
}

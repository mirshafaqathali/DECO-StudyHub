import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Circle,
  Save,
  Search,
  Share2,
  StickyNote,
  Trash2,
} from 'lucide-react';
import type { Lesson, SubjectUnit } from '../types/study';
import { LESSON_NOTE_MAX_LENGTH } from '../utils/studyProgress';
import type { SubjectId } from '../utils/validation';

interface LessonsViewProps {
  subjects: SubjectUnit[];
  lessons: Lesson[];
  selectedSubjectId: SubjectId;
  selectedLessonId: string;
  completedLessonIds: string[];
  lessonNotes: Record<string, string>;
  onSelectSubject: (subjectId: SubjectId) => void;
  onSelectLesson: (lessonId: string) => void;
  onToggleLessonComplete: (lessonId: string) => void;
  onSaveLessonNote: (lessonId: string, note: string) => void;
  onShareLessonToGroup: (lesson: Lesson) => void;
}

export const LessonsView: React.FC<LessonsViewProps> = ({
  subjects,
  lessons,
  selectedSubjectId,
  selectedLessonId,
  completedLessonIds,
  lessonNotes,
  onSelectSubject,
  onSelectLesson,
  onToggleLessonComplete,
  onSaveLessonNote,
  onShareLessonToGroup,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  const completedSet = useMemo(() => new Set(completedLessonIds), [completedLessonIds]);

  const unitLessons = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return lessons
      .filter((l) => l.subjectId === selectedSubjectId)
      .filter((l) => {
        if (!q) return true;
        return (
          l.title.toLowerCase().includes(q) ||
          l.summary.toLowerCase().includes(q) ||
          l.keyPoints.some((kp) => kp.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => a.order - b.order);
  }, [lessons, selectedSubjectId, searchQuery]);

  const activeLesson = useMemo(() => {
    return (
      lessons.find((l) => l.id === selectedLessonId && l.subjectId === selectedSubjectId) ??
      unitLessons[0] ??
      lessons.find((l) => l.subjectId === selectedSubjectId) ??
      lessons[0]
    );
  }, [lessons, selectedLessonId, selectedSubjectId, unitLessons]);

  const activeSubject = subjects.find((s) => s.id === selectedSubjectId) ?? subjects[0];

  const allUnitLessons = useMemo(
    () => lessons.filter((l) => l.subjectId === selectedSubjectId).sort((a, b) => a.order - b.order),
    [lessons, selectedSubjectId]
  );
  const currentIdx = allUnitLessons.findIndex((l) => l.id === activeLesson?.id);
  const prevLesson = currentIdx > 0 ? allUnitLessons[currentIdx - 1] : null;
  const nextLesson =
    currentIdx >= 0 && currentIdx < allUnitLessons.length - 1 ? allUnitLessons[currentIdx + 1] : null;

  const isCompleted = activeLesson ? completedSet.has(activeLesson.id) : false;

  const activeLessonId = activeLesson?.id ?? '';
  const savedNote = lessonNotes[activeLessonId] ?? '';
  const [noteDraft, setNoteDraft] = useState(savedNote);
  const [justSavedLessonId, setJustSavedLessonId] = useState<string | null>(null);

  useEffect(() => {
    setNoteDraft(savedNote);
    setJustSavedLessonId(null);
  }, [activeLessonId, savedNote]);

  const isNoteDirty = noteDraft !== savedNote;

  return (
    <div className="space-y-6">
      {/* Subject Unit Selector Strip */}
      <section aria-label="DECO Syllabus Subjects">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {subjects.map((subject) => {
            const subLessons = lessons.filter((l) => l.subjectId === subject.id);
            const doneCount = subLessons.filter((l) => completedSet.has(l.id)).length;
            const isSelected = subject.id === selectedSubjectId;
            return (
              <button
                key={subject.id}
                type="button"
                onClick={() => {
                  onSelectSubject(subject.id);
                  const first = lessons.find((l) => l.subjectId === subject.id);
                  if (first) onSelectLesson(first.id);
                }}
                className={`text-left rounded-xl border p-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-ring)] ${
                  isSelected
                    ? 'border-[var(--accent-ring)] bg-[var(--accent-soft)]'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="font-semibold text-[var(--accent-text)]">{subject.code}</span>
                  <span className="font-mono tabular-nums">
                    {doneCount}/{subLessons.length}
                  </span>
                </div>
                <div className="mt-1.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2">
                  {subject.title}
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-[var(--accent)] transition-all"
                    style={{
                      width: `${subLessons.length ? Math.round((doneCount / subLessons.length) * 100) : 0}%`,
                    }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Two-Column Syllabus Explorer + Lesson Reader */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Unit Lesson Outline */}
        <aside className="lg:col-span-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-4">
          <div className="space-y-1">
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              {activeSubject.code} · {activeSubject.courseOutcome} · {activeSubject.examWeightLabel}
            </div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              {activeSubject.title}
            </h2>
          </div>

          <div className="relative">
            <label htmlFor="lesson-search" className="sr-only">
              Filter lessons in {activeSubject.code}
            </label>
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="lesson-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeSubject.code} topics...`}
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 pl-9 pr-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]"
            />
          </div>

          <div className="space-y-1.5" role="list" aria-label={`${activeSubject.code} lessons`}>
            {unitLessons.length === 0 ? (
              <p className="py-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
                No lessons match "{searchQuery}".
              </p>
            ) : (
              unitLessons.map((lesson) => {
                const done = completedSet.has(lesson.id);
                const active = activeLesson?.id === lesson.id;
                return (
                  <button
                    key={lesson.id}
                    type="button"
                    onClick={() => onSelectLesson(lesson.id)}
                    className={`w-full text-left flex items-start gap-3 rounded-lg p-3 transition-colors ${
                      active
                        ? 'bg-[var(--accent-soft)] text-zinc-900 dark:text-zinc-100'
                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <span className="mt-0.5 shrink-0">
                      {done ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Circle className="w-4 h-4 text-zinc-300 dark:text-zinc-600" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium leading-snug">
                        {String(lesson.order).padStart(2, '0')}. {lesson.title}
                      </div>
                      <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        {lesson.estimatedMinutes} min · {done ? 'Completed' : 'In syllabus'}
                        {lessonNotes[lesson.id] ? ' · Note saved' : ''}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Right: Detailed Lesson Study Stage */}
        {activeLesson && (
          <article className="lg:col-span-8 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
              <div className="space-y-2">
                <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  {activeSubject.code} · Lesson {String(activeLesson.order).padStart(2, '0')} ·{' '}
                  {activeLesson.courseOutcome} · {activeLesson.estimatedMinutes} min read
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 [text-wrap:balance]">
                  {activeLesson.title}
                </h1>
                <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 leading-relaxed max-w-[68ch]">
                  {activeLesson.summary}
                </p>
              </div>

              <div className="flex flex-wrap sm:flex-col items-stretch sm:items-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onToggleLessonComplete(activeLesson.id)}
                  className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    isCompleted
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  {isCompleted ? 'Lesson Completed' : 'Mark Lesson Complete'}
                </button>

                <button
                  type="button"
                  onClick={() => onShareLessonToGroup(activeLesson)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 px-3.5 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 transition-colors whitespace-nowrap shrink-0"
                >
                  <Share2 className="w-3.5 h-3.5 shrink-0" />
                  Share to Study Group
                </button>
              </div>
            </div>

            {/* Key Concepts */}
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Core Syllabus Notes
              </h2>
              <ul className="space-y-2.5 text-sm sm:text-[15px] text-zinc-700 dark:text-zinc-300 leading-relaxed list-disc pl-5">
                {activeLesson.keyPoints.map((point, idx) => (
                  <li key={idx}>{point}</li>
                ))}
              </ul>
            </section>

            {/* Reference Diagram */}
            {activeLesson.diagram && (
              <figure className="space-y-2">
                {!brokenImages[activeLesson.id] ? (
                  <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white">
                    <img
                      src={activeLesson.diagram.src}
                      alt={activeLesson.diagram.alt}
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setBrokenImages((prev) => ({ ...prev, [activeLesson.id]: true }))
                      }
                      className="w-full max-h-[380px] object-contain mx-auto p-2"
                    />
                  </div>
                ) : (
                  <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-6 flex items-center gap-3 text-zinc-600 dark:text-zinc-400">
                    <BookOpen className="w-5 h-5 shrink-0" />
                    <span className="text-sm">{activeLesson.diagram.alt}</span>
                  </div>
                )}
                <figcaption className="text-xs text-zinc-500 dark:text-zinc-400">
                  Figure: {activeLesson.diagram.caption}
                </figcaption>
              </figure>
            )}

            {/* Formulas */}
            {activeLesson.formulas && activeLesson.formulas.length > 0 && (
              <section className="space-y-2.5">
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Key Equations & Identities
                </h2>
                <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-4 space-y-1.5 font-mono text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 overflow-x-auto">
                  {activeLesson.formulas.map((formula, i) => (
                    <div key={i}>{formula}</div>
                  ))}
                </div>
              </section>
            )}

            {/* Comparison / Reference Table */}
            {activeLesson.table && (
              <section className="space-y-2.5">
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {activeLesson.table.caption}
                </h2>
                <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <table className="w-full text-left text-xs sm:text-sm border-collapse">
                    <thead className="bg-zinc-50 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 border-b border-zinc-200 dark:border-zinc-800">
                      <tr>
                        {activeLesson.table.headers.map((header, i) => (
                          <th key={i} className="px-4 py-2.5 font-semibold whitespace-nowrap">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {activeLesson.table.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="text-zinc-700 dark:text-zinc-300">
                          {row.map((cell, cIdx) => (
                            <td
                              key={cIdx}
                              className={`px-4 py-2.5 tabular-nums ${
                                cIdx === 0 ? 'font-medium text-zinc-900 dark:text-zinc-100' : ''
                              }`}
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Worked Example */}
            {activeLesson.workedExample && (
              <section className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4 space-y-2">
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Worked Exam Problem
                </h2>
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  {activeLesson.workedExample.prompt}
                </p>
                <pre className="whitespace-pre-wrap font-mono text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed pt-1">
                  {activeLesson.workedExample.solution}
                </pre>
              </section>
            )}

            {/* Exam Focus Note */}
            <section className="rounded-lg border border-[var(--accent-secondary-border)] bg-[var(--accent-secondary-soft)] p-4">
              <div className="text-xs font-semibold text-[var(--accent-secondary-text)]">
                CIE & SEE Exam Tip
              </div>
              <p className="mt-1 text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed">
                {activeLesson.examTip}
              </p>
            </section>

            {/* Quick Notes Scratchpad */}
            <section
              aria-label="Quick Notes"
              className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4 sm:p-5 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <StickyNote className="w-4 h-4 text-[var(--accent-text)] shrink-0" />
                  <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Quick Notes
                  </h2>
                </div>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {isNoteDirty
                    ? 'Unsaved changes'
                    : justSavedLessonId === activeLesson.id || savedNote.length > 0
                      ? 'Saved in local snapshot'
                      : 'Lesson scratchpad'}
                </span>
              </div>

              <div>
                <label htmlFor="lesson-quick-notes" className="sr-only">
                  Quick notes for {activeLesson.title}
                </label>
                <textarea
                  id="lesson-quick-notes"
                  rows={4}
                  maxLength={LESSON_NOTE_MAX_LENGTH}
                  value={noteDraft}
                  onChange={(e) => {
                    setNoteDraft(e.target.value);
                    if (justSavedLessonId) setJustSavedLessonId(null);
                  }}
                  placeholder={`Write quick study notes, formula reminders, or questions for "${activeLesson.title}"...`}
                  className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] resize-y"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
                  {noteDraft.length}/{LESSON_NOTE_MAX_LENGTH} characters
                </span>

                <div className="flex items-center gap-2">
                  {(noteDraft.length > 0 || savedNote.length > 0) && (
                    <button
                      type="button"
                      onClick={() => {
                        setNoteDraft('');
                        setJustSavedLessonId(null);
                        onSaveLessonNote(activeLesson.id, '');
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-200 transition-colors whitespace-nowrap"
                    >
                      <Trash2 className="w-3.5 h-3.5 shrink-0" />
                      Clear Note
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={!isNoteDirty}
                    onClick={() => {
                      onSaveLessonNote(activeLesson.id, noteDraft);
                      setJustSavedLessonId(activeLesson.id);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-45 disabled:pointer-events-none px-3.5 py-1.5 text-xs font-semibold text-white transition-colors whitespace-nowrap"
                  >
                    <Save className="w-3.5 h-3.5 shrink-0" />
                    Save Note
                  </button>
                </div>
              </div>
            </section>

            {/* Footer Navigation */}
            <div className="flex items-center justify-between gap-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                disabled={!prevLesson}
                onClick={() => prevLesson && onSelectLesson(prevLesson.id)}
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 px-3.5 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:pointer-events-none transition-colors whitespace-nowrap"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Previous Lesson
              </button>

              <button
                type="button"
                disabled={!nextLesson}
                onClick={() => nextLesson && onSelectLesson(nextLesson.id)}
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 px-3.5 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:pointer-events-none transition-colors whitespace-nowrap"
              >
                Next Lesson
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </article>
        )}
      </div>
    </div>
  );
};

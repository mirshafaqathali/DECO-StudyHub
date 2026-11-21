import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Plus,
  RotateCcw,
  Search,
  Share2,
  Shuffle,
  Trash2,
} from 'lucide-react';
import type { Flashcard, SubjectUnit } from '../types/study';
import {
  filterFlashcards,
  getNextCardIndex,
  type FlashcardDeckFilter,
} from '../utils/flashcardEngine';
import {
  BLUEPRINT_LIMITS,
  validateCustomFlashcardInput,
  type ScopeSubjectId,
  type SubjectId,
} from '../utils/validation';

interface FlashcardsViewProps {
  subjects: SubjectUnit[];
  allCards: Flashcard[];
  masteredCardIds: string[];
  reviewCardIds: string[];
  onGradeCard: (cardId: string, grade: 'mastered' | 'review') => void;
  onAddCustomCard: (input: {
    subjectId: SubjectId;
    front: string;
    back: string;
    tag: string;
  }) => Promise<void>;
  onDeleteCustomCard: (cardId: string) => Promise<void>;
  onShareCardToGroup: (card: Flashcard) => void;
}

export const FlashcardsView: React.FC<FlashcardsViewProps> = ({
  subjects,
  allCards,
  masteredCardIds,
  reviewCardIds,
  onGradeCard,
  onAddCustomCard,
  onDeleteCustomCard,
  onShareCardToGroup,
}) => {
  const [subjectFilter, setSubjectFilter] = useState<ScopeSubjectId>('all');
  const [deckFilter, setDeckFilter] = useState<FlashcardDeckFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [newSubject, setNewSubject] = useState<SubjectId>('unit-1');
  const [newTag, setNewTag] = useState('');
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const filteredDeck = useMemo(() => {
    const base = filterFlashcards({
      cards: allCards,
      subjectFilter,
      deckFilter,
      masteredCardIds,
      reviewCardIds,
      searchQuery,
    });
    if (shuffleSeed === 0) return base;
    const copy = [...base];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = (i * 17 + shuffleSeed * 31) % (i + 1);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }, [allCards, subjectFilter, deckFilter, masteredCardIds, reviewCardIds, searchQuery, shuffleSeed]);

  const safeIndex = filteredDeck.length > 0 ? Math.min(currentIndex, filteredDeck.length - 1) : 0;
  const activeCard = filteredDeck[safeIndex] ?? null;

  const masteredSet = useMemo(() => new Set(masteredCardIds), [masteredCardIds]);
  const reviewSet = useMemo(() => new Set(reviewCardIds), [reviewCardIds]);

  useEffect(() => {
    setIsFlipped(false);
    setCurrentIndex(0);
  }, [subjectFilter, deckFilter, searchQuery]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (!activeCard) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.code === 'ArrowRight') {
        setIsFlipped(false);
        setCurrentIndex((prev) => getNextCardIndex(prev, filteredDeck.length, 'next'));
      } else if (e.code === 'ArrowLeft') {
        setIsFlipped(false);
        setCurrentIndex((prev) => getNextCardIndex(prev, filteredDeck.length, 'prev'));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeCard, filteredDeck.length]);

  const handleGrade = (grade: 'mastered' | 'review') => {
    if (!activeCard) return;
    onGradeCard(activeCard.id, grade);
    setIsFlipped(false);
    if (filteredDeck.length > 1) {
      setCurrentIndex((prev) => getNextCardIndex(prev, filteredDeck.length, 'next'));
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErr = validateCustomFlashcardInput({
      subjectId: newSubject,
      front: newFront,
      back: newBack,
      tag: newTag || 'Study Note',
    });
    if (validationErr) {
      setFormError(validationErr);
      return;
    }
    setFormError(null);
    setSubmitting(true);
    try {
      await onAddCustomCard({
        subjectId: newSubject,
        front: newFront.trim(),
        back: newBack.trim(),
        tag: (newTag || 'Study Note').trim(),
      });
      setNewFront('');
      setNewBack('');
      setNewTag('');
      setShowCreateForm(false);
      setSearchQuery('');
      setIsFlipped(false);
      setCurrentIndex(0);
      if (subjectFilter !== 'all' && subjectFilter !== newSubject) {
        setSubjectFilter(newSubject);
      }
      if (deckFilter === 'mastered' || deckFilter === 'due') {
        setDeckFilter('all');
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to save flashcard.');
    } finally {
      setSubmitting(false);
    }
  };

  const activeSubject = activeCard
    ? subjects.find((s) => s.id === activeCard.subjectId)
    : undefined;

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <div
            role="group"
            aria-label="Filter flashcards by subject"
            className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-1"
          >
            <button
              type="button"
              onClick={() => setSubjectFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                subjectFilter === 'all'
                  ? 'bg-[var(--accent)] text-white'
                  : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              All Units
            </button>
            {subjects.map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => setSubjectFilter(sub.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  subjectFilter === sub.id
                    ? 'bg-[var(--accent)] text-white'
                    : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                {sub.code}
              </button>
            ))}
          </div>

          <div
            role="group"
            aria-label="Filter flashcards by mastery status"
            className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-1"
          >
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'due', label: 'Needs Review' },
                { id: 'mastered', label: 'Mastered' },
                { id: 'custom', label: 'Custom' },
              ] as const
            ).map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setDeckFilter(mode.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  deckFilter === mode.id
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 sm:w-56">
            <label htmlFor="flashcard-search" className="sr-only">
              Search flashcards
            </label>
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="flashcard-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cards..."
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 pl-9 pr-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowCreateForm((prev) => !prev)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] px-3.5 py-2 text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Flashcard
          </button>
        </div>
      </div>

      {/* Add Custom Flashcard Form */}
      {showCreateForm && (
        <form
          onSubmit={(e) => void handleCreateSubmit(e)}
          className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Create Custom Flashcard
            </h2>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label
                htmlFor="new-card-unit"
                className="block text-xs font-medium text-zinc-700 dark:text-zinc-300"
              >
                DECO Unit
              </label>
              <select
                id="new-card-unit"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value as SubjectId)}
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100"
              >
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.code} — {sub.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="new-card-tag"
                className="block text-xs font-medium text-zinc-700 dark:text-zinc-300"
              >
                Topic Label
              </label>
              <input
                id="new-card-tag"
                type="text"
                maxLength={BLUEPRINT_LIMITS.flashcardTagMaxLength}
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="e.g. K-Map or Booth's Algorithm"
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label
                htmlFor="new-card-front"
                className="block text-xs font-medium text-zinc-700 dark:text-zinc-300"
              >
                Question / Prompt (Front)
              </label>
              <textarea
                id="new-card-front"
                rows={3}
                maxLength={BLUEPRINT_LIMITS.flashcardFrontMaxLength}
                value={newFront}
                onChange={(e) => setNewFront(e.target.value)}
                placeholder="Enter question or theorem to test..."
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="new-card-back"
                className="block text-xs font-medium text-zinc-700 dark:text-zinc-300"
              >
                Answer / Solution (Back)
              </label>
              <textarea
                id="new-card-back"
                rows={3}
                maxLength={BLUEPRINT_LIMITS.flashcardBackMaxLength}
                value={newBack}
                onChange={(e) => setNewBack(e.target.value)}
                placeholder="Enter concise answer, formula, or steps..."
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>

          {formError && (
            <p role="alert" className="text-xs font-medium text-red-600 dark:text-red-400">
              {formError}
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-60 px-4 py-2 text-xs font-semibold text-white transition-colors"
            >
              {submitting ? 'Saving Card...' : 'Save Flashcard'}
            </button>
          </div>
        </form>
      )}

      {/* Interactive Flashcard Deck Stage */}
      {activeCard ? (
        <div className="max-w-3xl mx-auto space-y-5">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span className="font-mono tabular-nums">
              Card {safeIndex + 1} of {filteredDeck.length}
            </span>
            <span>
              {activeSubject?.code} · {activeCard.tag} ·{' '}
              {masteredSet.has(activeCard.id)
                ? 'Mastered'
                : reviewSet.has(activeCard.id)
                ? 'Flagged for review'
                : 'Unreviewed'}
            </span>
          </div>

          <div className="card-perspective">
            <button
              type="button"
              aria-label={isFlipped ? 'Flip flashcard to question' : 'Flip flashcard to reveal answer'}
              onClick={() => setIsFlipped((prev) => !prev)}
              className="w-full text-left block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent-ring)] rounded-2xl"
            >
              <div
                className={`card-inner relative min-h-[280px] sm:min-h-[320px] w-full ${
                  isFlipped ? 'is-flipped' : ''
                }`}
              >
                {/* Front Face */}
                <div className="card-face overflow-y-auto absolute inset-0 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-10 flex flex-col justify-between shadow-sm">
                  <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                    <span>
                      Prompt · {activeSubject?.code} · {activeCard.tag}
                    </span>
                    <span>Click or press Space to flip</span>
                  </div>
                  <p className="text-lg sm:text-xl font-semibold text-zinc-900 dark:text-zinc-100 leading-relaxed text-center my-auto py-4">
                    {activeCard.front}
                  </p>
                  <div className="text-center text-xs text-[var(--accent-text)] font-medium">
                    Reveal Answer
                  </div>
                </div>

                {/* Back Face */}
                <div className="card-face card-face-back overflow-y-auto absolute inset-0 rounded-2xl border border-[var(--accent-border)] bg-[var(--accent-soft)] p-6 sm:p-10 flex flex-col justify-between shadow-sm">
                  <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
                    <span>
                      Answer · {activeSubject?.code} · {activeCard.tag}
                    </span>
                    <span>Click or press Space to show prompt</span>
                  </div>
                  <p className="text-base sm:text-lg text-zinc-900 dark:text-zinc-100 leading-relaxed text-center my-auto py-4 whitespace-pre-line">
                    {activeCard.back}
                  </p>
                  <div className="text-center text-xs text-zinc-600 dark:text-zinc-400">
                    Grade your recall below to track progress
                  </div>
                </div>
              </div>
            </button>
          </div>

          {/* Grading & Deck Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Previous flashcard"
                onClick={() => {
                  setIsFlipped(false);
                  setCurrentIndex((prev) => getNextCardIndex(prev, filteredDeck.length, 'prev'));
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Prev
              </button>
              <button
                type="button"
                aria-label="Shuffle deck"
                onClick={() => {
                  setIsFlipped(false);
                  setShuffleSeed((s) => s + 1);
                  setCurrentIndex(0);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 transition-colors"
              >
                <Shuffle className="w-3.5 h-3.5" />
                Shuffle
              </button>
              <button
                type="button"
                aria-label="Next flashcard"
                onClick={() => {
                  setIsFlipped(false);
                  setCurrentIndex((prev) => getNextCardIndex(prev, filteredDeck.length, 'next'));
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 transition-colors"
              >
                Next
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleGrade('review')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--accent-secondary-border)] bg-[var(--accent-secondary-soft)] hover:opacity-90 px-3.5 py-2 text-xs font-semibold text-[var(--accent-secondary-text)] transition-opacity whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Review Again
              </button>
              <button
                type="button"
                onClick={() => handleGrade('mastered')}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white transition-colors whitespace-nowrap"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Mark Mastered
              </button>
              <button
                type="button"
                aria-label="Share flashcard to study group"
                onClick={() => onShareCardToGroup(activeCard)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 transition-colors whitespace-nowrap"
              >
                <Share2 className="w-3.5 h-3.5" />
                Share
              </button>
              {activeCard.isCustom && (
                <button
                  type="button"
                  aria-label={`Delete custom flashcard '${activeCard.tag}'`}
                  onClick={() => void onDeleteCustomCard(activeCard.id)}
                  className="inline-flex items-center justify-center rounded-lg border border-red-200 dark:border-red-900 bg-white dark:bg-zinc-900 hover:bg-red-50 dark:hover:bg-red-950/60 p-2 text-red-600 dark:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-10 text-center space-y-3">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            No flashcards match this filter.
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Switch back to All Cards or create a custom flashcard for this unit.
          </p>
          <button
            type="button"
            onClick={() => {
              setSubjectFilter('all');
              setDeckFilter('all');
              setSearchQuery('');
            }}
            className="inline-flex items-center rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--accent-hover)] transition-colors"
          >
            Show All Cards
          </button>
        </div>
      )}
    </div>
  );
};

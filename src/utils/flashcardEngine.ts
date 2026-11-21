import type { Flashcard } from '../types/study';
import type { ScopeSubjectId } from './validation';

export type FlashcardDeckFilter = 'all' | 'due' | 'mastered' | 'custom';

export function filterFlashcards(params: {
  cards: Flashcard[];
  subjectFilter: ScopeSubjectId;
  deckFilter: FlashcardDeckFilter;
  masteredCardIds: string[];
  reviewCardIds: string[];
  searchQuery?: string;
}): Flashcard[] {
  const masteredSet = new Set(params.masteredCardIds);
  const reviewSet = new Set(params.reviewCardIds);
  const query = (params.searchQuery ?? '').trim().toLowerCase();

  return params.cards.filter((card) => {
    if (params.subjectFilter !== 'all' && card.subjectId !== params.subjectFilter) {
      return false;
    }

    if (params.deckFilter === 'mastered' && !masteredSet.has(card.id)) {
      return false;
    }
    if (params.deckFilter === 'due') {
      const isDue = reviewSet.has(card.id) || !masteredSet.has(card.id);
      if (!isDue) return false;
    }
    if (params.deckFilter === 'custom' && !card.isCustom) {
      return false;
    }

    if (query) {
      const haystack = `${card.front} ${card.back} ${card.tag}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }

    return true;
  });
}

export function gradeFlashcard(params: {
  cardId: string;
  grade: 'mastered' | 'review';
  masteredCardIds: string[];
  reviewCardIds: string[];
}): { masteredCardIds: string[]; reviewCardIds: string[] } {
  const nextMastered = params.masteredCardIds.filter((id) => id !== params.cardId);
  const nextReview = params.reviewCardIds.filter((id) => id !== params.cardId);

  if (params.grade === 'mastered') {
    nextMastered.push(params.cardId);
  } else {
    nextReview.push(params.cardId);
  }

  return {
    masteredCardIds: nextMastered.slice(0, 500),
    reviewCardIds: nextReview.slice(0, 500),
  };
}

export function getNextCardIndex(currentIndex: number, deckLength: number, direction: 'next' | 'prev'): number {
  if (deckLength <= 0) return 0;
  if (direction === 'next') {
    return (currentIndex + 1) % deckLength;
  }
  return (currentIndex - 1 + deckLength) % deckLength;
}

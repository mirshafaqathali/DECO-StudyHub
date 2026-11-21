/**
 * Validation constraints synchronized verbatim with firebase-blueprint.json & firestore.rules.
 */

export const BLUEPRINT_LIMITS = {
  idPattern: /^[a-zA-Z0-9_-]+$/,
  idMaxLength: 128,
  groupCodePattern: /^[A-Z0-9_-]+$/,
  groupCodeMinLength: 4,
  groupCodeMaxLength: 24,
  displayNameMaxLength: 80,
  completedLessonsMax: 100,
  masteredCardsMax: 500,
  reviewCardsMax: 500,
  flashcardFrontMaxLength: 500,
  flashcardBackMaxLength: 1500,
  flashcardTagMaxLength: 60,
  reminderTitleMaxLength: 160,
  reminderNotesMaxLength: 500,
  isoDatePattern: /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/,
  groupNameMinLength: 2,
  groupNameMaxLength: 80,
  groupDescriptionMaxLength: 280,
  groupMembersMax: 30,
  groupRecentPostsMax: 50,
  postTitleMaxLength: 140,
  postBodyMaxLength: 1200,
} as const;

export const VALID_SUBJECT_IDS = ['unit-1', 'unit-2', 'unit-3', 'unit-4', 'unit-5'] as const;
export type SubjectId = (typeof VALID_SUBJECT_IDS)[number];
export type ScopeSubjectId = SubjectId | 'all';

export const VALID_REMINDER_KINDS = ['exam', 'assignment', 'quiz', 'revision'] as const;
export type ReminderKind = (typeof VALID_REMINDER_KINDS)[number];

export const VALID_POST_KINDS = ['note', 'flashcard', 'milestone'] as const;
export type PostKind = (typeof VALID_POST_KINDS)[number];

export function clampText(value: string, maxLength: number): string {
  return value.trim().slice(0, maxLength);
}

export function normalizeGroupCode(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, '')
    .slice(0, BLUEPRINT_LIMITS.groupCodeMaxLength);
}

export function isValidGroupCode(code: string): boolean {
  return (
    typeof code === 'string' &&
    code.length >= BLUEPRINT_LIMITS.groupCodeMinLength &&
    code.length <= BLUEPRINT_LIMITS.groupCodeMaxLength &&
    BLUEPRINT_LIMITS.groupCodePattern.test(code)
  );
}

export function isValidEntityId(id: string): boolean {
  return (
    typeof id === 'string' &&
    id.length >= 1 &&
    id.length <= BLUEPRINT_LIMITS.idMaxLength &&
    BLUEPRINT_LIMITS.idPattern.test(id)
  );
}

export function isValidIsoDate(dateStr: string): boolean {
  if (!BLUEPRINT_LIMITS.isoDatePattern.test(dateStr)) return false;
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function validateCustomFlashcardInput(input: {
  subjectId: string;
  front: string;
  back: string;
  tag: string;
}): string | null {
  if (!VALID_SUBJECT_IDS.includes(input.subjectId as SubjectId)) {
    return 'Please choose a valid DECO unit (Unit I–V).';
  }
  const front = input.front.trim();
  const back = input.back.trim();
  const tag = input.tag.trim();
  if (!front) return 'Question / front prompt is required.';
  if (front.length > BLUEPRINT_LIMITS.flashcardFrontMaxLength) {
    return `Front prompt must be ${BLUEPRINT_LIMITS.flashcardFrontMaxLength} characters or fewer.`;
  }
  if (!back) return 'Answer / back explanation is required.';
  if (back.length > BLUEPRINT_LIMITS.flashcardBackMaxLength) {
    return `Answer must be ${BLUEPRINT_LIMITS.flashcardBackMaxLength} characters or fewer.`;
  }
  if (!tag) return 'Topic label is required.';
  if (tag.length > BLUEPRINT_LIMITS.flashcardTagMaxLength) {
    return `Topic label must be ${BLUEPRINT_LIMITS.flashcardTagMaxLength} characters or fewer.`;
  }
  return null;
}

export function validateReminderInput(input: {
  title: string;
  subjectId: string;
  kind: string;
  dueDate: string;
  notes: string;
}): string | null {
  const title = input.title.trim();
  if (!title) return 'Reminder title is required.';
  if (title.length > BLUEPRINT_LIMITS.reminderTitleMaxLength) {
    return `Title must be ${BLUEPRINT_LIMITS.reminderTitleMaxLength} characters or fewer.`;
  }
  if (!['all', ...VALID_SUBJECT_IDS].includes(input.subjectId)) {
    return 'Select a valid DECO unit or All Units.';
  }
  if (!VALID_REMINDER_KINDS.includes(input.kind as ReminderKind)) {
    return 'Select a valid reminder category.';
  }
  if (!isValidIsoDate(input.dueDate)) {
    return 'Enter a valid due date (YYYY-MM-DD).';
  }
  if (input.notes.trim().length > BLUEPRINT_LIMITS.reminderNotesMaxLength) {
    return `Notes must be ${BLUEPRINT_LIMITS.reminderNotesMaxLength} characters or fewer.`;
  }
  return null;
}

export function validateStudyGroupInput(input: {
  code: string;
  name: string;
  description: string;
  subjectFocus: string;
}): string | null {
  if (!isValidGroupCode(input.code)) {
    return 'Group code must be 4–24 uppercase letters, numbers, hyphens, or underscores.';
  }
  const name = input.name.trim();
  if (name.length < BLUEPRINT_LIMITS.groupNameMinLength) {
    return 'Group name must be at least 2 characters.';
  }
  if (name.length > BLUEPRINT_LIMITS.groupNameMaxLength) {
    return `Group name must be ${BLUEPRINT_LIMITS.groupNameMaxLength} characters or fewer.`;
  }
  if (input.description.trim().length > BLUEPRINT_LIMITS.groupDescriptionMaxLength) {
    return `Description must be ${BLUEPRINT_LIMITS.groupDescriptionMaxLength} characters or fewer.`;
  }
  if (!['all', ...VALID_SUBJECT_IDS].includes(input.subjectFocus)) {
    return 'Select a valid subject focus.';
  }
  return null;
}

export function validateStudyPostInput(input: {
  kind: string;
  subjectId: string;
  title: string;
  body: string;
  flashcardFront?: string;
  flashcardBack?: string;
}): string | null {
  if (!VALID_POST_KINDS.includes(input.kind as PostKind)) {
    return 'Select a valid post type.';
  }
  if (!['all', ...VALID_SUBJECT_IDS].includes(input.subjectId)) {
    return 'Select a valid subject scope.';
  }
  const title = input.title.trim();
  const body = input.body.trim();
  if (!title) return 'Post title is required.';
  if (title.length > BLUEPRINT_LIMITS.postTitleMaxLength) {
    return `Post title must be ${BLUEPRINT_LIMITS.postTitleMaxLength} characters or fewer.`;
  }
  if (!body) return 'Post details are required.';
  if (body.length > BLUEPRINT_LIMITS.postBodyMaxLength) {
    return `Post details must be ${BLUEPRINT_LIMITS.postBodyMaxLength} characters or fewer.`;
  }
  if (input.kind === 'flashcard') {
    const front = (input.flashcardFront ?? '').trim();
    const back = (input.flashcardBack ?? '').trim();
    if (!front || !back) {
      return 'Shared flashcards require both a front question and a back answer.';
    }
    if (front.length > BLUEPRINT_LIMITS.flashcardFrontMaxLength) {
      return `Flashcard front must be ${BLUEPRINT_LIMITS.flashcardFrontMaxLength} characters or fewer.`;
    }
    if (back.length > BLUEPRINT_LIMITS.flashcardBackMaxLength) {
      return `Flashcard back must be ${BLUEPRINT_LIMITS.flashcardBackMaxLength} characters or fewer.`;
    }
  }
  return null;
}

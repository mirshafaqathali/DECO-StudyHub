import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  type Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { SEEDED_DECO_REMINDERS } from '../data/decoSyllabus';
import type {
  DailyStudyGoal,
  Flashcard,
  GroupMember,
  LocalStudySnapshot,
  McqTestAttempt,
  ReminderItem,
  StudyGroup,
  StudyPost,
  ThemeMode,
} from '../types/study';
import {
  clampGoalTarget,
  createDefaultDailyGoal,
  rolloverDailyGoalIfNeeded,
} from '../utils/dailyGoal';
import {
  BLUEPRINT_LIMITS,
  clampText,
  isValidEntityId,
  isValidGroupCode,
  isValidIsoDate,
  normalizeGroupCode,
  type PostKind,
  type ScopeSubjectId,
  type SubjectId,
} from '../utils/validation';

const LOCAL_SNAPSHOT_KEY = 'deco_study_snapshot_v1';
const LOCAL_THEME_KEY = 'deco_theme';
const LOCAL_GROUPS_KEY = 'deco_local_groups_v1';

export function getDefaultLocalSnapshot(): LocalStudySnapshot {
  let theme: ThemeMode = 'light';
  if (typeof window !== 'undefined') {
    const savedTheme = localStorage.getItem(LOCAL_THEME_KEY);
    if (savedTheme === 'dark' || savedTheme === 'light') {
      theme = savedTheme;
    } else if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      theme = 'dark';
    }
  }
  return {
    theme,
    completedLessonIds: [],
    masteredCardIds: [],
    reviewCardIds: [],
    studyStreakDays: 1,
    customFlashcards: [],
    reminders: SEEDED_DECO_REMINDERS,
    joinedGroupCodes: [],
    lessonNotes: {},
    dailyGoal: createDefaultDailyGoal(),
    mcqHistory: [],
    updatedAtMs: 0,
  };
}

function sanitizeLessonNotes(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (isValidEntityId(key) && typeof value === 'string' && value.trim().length > 0) {
      result[key] = value.slice(0, 4000);
    }
  }
  return result;
}

function sanitizeDailyGoal(raw: unknown): DailyStudyGoal {
  const defaults = createDefaultDailyGoal();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return defaults;
  const g = raw as Partial<DailyStudyGoal>;
  const metric = g.metric === 'flashcards' ? 'flashcards' : 'lessons';
  const target = clampGoalTarget(metric, typeof g.target === 'number' ? g.target : defaults.target);
  const date = typeof g.date === 'string' && isValidIsoDate(g.date) ? g.date : defaults.date;
  const lessonsCompletedToday =
    typeof g.lessonsCompletedToday === 'number' && g.lessonsCompletedToday >= 0
      ? Math.round(g.lessonsCompletedToday)
      : 0;
  const flashcardsStudiedToday =
    typeof g.flashcardsStudiedToday === 'number' && g.flashcardsStudiedToday >= 0
      ? Math.round(g.flashcardsStudiedToday)
      : 0;
  const lastGoalMetDate =
    typeof g.lastGoalMetDate === 'string' && isValidIsoDate(g.lastGoalMetDate)
      ? g.lastGoalMetDate
      : null;
  const recentActiveDates = Array.isArray(g.recentActiveDates)
    ? g.recentActiveDates.filter((d): d is string => typeof d === 'string' && isValidIsoDate(d)).slice(-14)
    : [];

  return rolloverDailyGoalIfNeeded({
    metric,
    target,
    date,
    lessonsCompletedToday,
    flashcardsStudiedToday,
    lastGoalMetDate,
    recentActiveDates,
  });
}

function sanitizeMcqHistory(raw: unknown): McqTestAttempt[] {
  if (!Array.isArray(raw)) return [];
  const validSubjects = new Set<ScopeSubjectId>(['all', 'unit-1', 'unit-2', 'unit-3', 'unit-4', 'unit-5']);
  return raw
    .filter((item): item is McqTestAttempt => {
      if (!item || typeof item !== 'object') return false;
      const a = item as Partial<McqTestAttempt>;
      return (
        typeof a.id === 'string' &&
        a.id.length > 0 &&
        typeof a.subjectFilter === 'string' &&
        validSubjects.has(a.subjectFilter as ScopeSubjectId) &&
        typeof a.score === 'number' &&
        typeof a.total === 'number' &&
        a.total > 0 &&
        typeof a.percent === 'number' &&
        typeof a.elapsedSeconds === 'number' &&
        typeof a.completedAtMs === 'number'
      );
    })
    .slice(0, 20);
}

export function loadLocalSnapshot(): LocalStudySnapshot {
  const defaults = getDefaultLocalSnapshot();
  if (typeof window === 'undefined') return defaults;
  try {
    const raw = localStorage.getItem(LOCAL_SNAPSHOT_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<LocalStudySnapshot>;
    return {
      theme: parsed.theme === 'dark' || parsed.theme === 'light' ? parsed.theme : defaults.theme,
      completedLessonIds: Array.isArray(parsed.completedLessonIds)
        ? parsed.completedLessonIds.slice(0, BLUEPRINT_LIMITS.completedLessonsMax)
        : [],
      masteredCardIds: Array.isArray(parsed.masteredCardIds)
        ? parsed.masteredCardIds.slice(0, BLUEPRINT_LIMITS.masteredCardsMax)
        : [],
      reviewCardIds: Array.isArray(parsed.reviewCardIds)
        ? parsed.reviewCardIds.slice(0, BLUEPRINT_LIMITS.reviewCardsMax)
        : [],
      studyStreakDays: typeof parsed.studyStreakDays === 'number' ? Math.max(1, parsed.studyStreakDays) : 1,
      customFlashcards: Array.isArray(parsed.customFlashcards) ? parsed.customFlashcards : [],
      reminders:
        Array.isArray(parsed.reminders) && parsed.reminders.length > 0
          ? parsed.reminders
          : defaults.reminders,
      joinedGroupCodes: Array.isArray(parsed.joinedGroupCodes) ? parsed.joinedGroupCodes : [],
      lessonNotes: sanitizeLessonNotes(parsed.lessonNotes),
      dailyGoal: sanitizeDailyGoal(parsed.dailyGoal),
      mcqHistory: sanitizeMcqHistory(parsed.mcqHistory),
      updatedAtMs: typeof parsed.updatedAtMs === 'number' ? parsed.updatedAtMs : 0,
    };
  } catch {
    return defaults;
  }
}

export function saveLocalSnapshot(snapshot: LocalStudySnapshot): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_SNAPSHOT_KEY, JSON.stringify(snapshot));
    localStorage.setItem(LOCAL_THEME_KEY, snapshot.theme);
  } catch {
    // Ignore storage quota issues in constrained environments
  }
}

export interface LocalGroupBundle {
  groups: Record<string, StudyGroup>;
  members: Record<string, GroupMember[]>;
  posts: Record<string, StudyPost[]>;
}

const DEFAULT_LOCAL_GROUPS: LocalGroupBundle = {
  groups: {
    DECO2026: {
      code: 'DECO2026',
      name: 'DECO U24EC304 Cohort',
      description:
        'Shared CIE-2 & SEE prep room for Units I–V notes, K-Map shortcuts, and pipeline hazard drills.',
      subjectFocus: 'all',
      ownerId: 'cohort_lead',
      ownerName: 'Dr. Mateen Study Circle',
      memberIds: ['cohort_lead', 'peer_riya', 'peer_arjun'],
      recentPostIds: ['seed_post_1', 'seed_post_2'],
      updatedAtMs: 1700000000000,
    },
  },
  members: {
    DECO2026: [
      {
        uid: 'cohort_lead',
        groupId: 'DECO2026',
        displayName: 'Cohort Study Lead',
        role: 'owner',
        completedLessonsCount: 18,
        masteredCardsCount: 28,
      },
      {
        uid: 'peer_riya',
        groupId: 'DECO2026',
        displayName: 'Riya S. (AIML)',
        role: 'member',
        completedLessonsCount: 14,
        masteredCardsCount: 22,
      },
      {
        uid: 'peer_arjun',
        groupId: 'DECO2026',
        displayName: 'Arjun K. (CSE)',
        role: 'member',
        completedLessonsCount: 11,
        masteredCardsCount: 16,
      },
    ],
  },
  posts: {
    DECO2026: [
      {
        id: 'seed_post_1',
        groupId: 'DECO2026',
        authorId: 'peer_riya',
        authorName: 'Riya S. (AIML)',
        kind: 'flashcard',
        subjectId: 'unit-5',
        title: 'CIE-2 High-Yield: Load-Use Hazard Stall Rule',
        body: 'Remember this distinction when drawing pipeline timing diagrams for LAQ 9!',
        flashcardFront: 'Why does LW followed by ADD need 1 stall even with forwarding?',
        flashcardBack:
          'LW data is only ready after MEM (T4), whereas ADD needs it at EX (T4 without stall), forcing 1 bubble.',
        upvoterIds: ['cohort_lead', 'peer_arjun'],
        createdAtMs: 1700000000000,
      },
      {
        id: 'seed_post_2',
        groupId: 'DECO2026',
        authorId: 'peer_arjun',
        authorName: 'Arjun K. (CSE)',
        kind: 'note',
        subjectId: 'unit-4',
        title: 'Cache Mapping 16-bit Split Trick',
        body: 'Always compute Word offset bits first (log2 block size), then Set/Index bits (log2 sets), and subtract both from address width to get Tag bits.',
        flashcardFront: '',
        flashcardBack: '',
        upvoterIds: ['cohort_lead'],
        createdAtMs: 1699990000000,
      },
    ],
  },
};

export function loadLocalGroups(): LocalGroupBundle {
  if (typeof window === 'undefined') return DEFAULT_LOCAL_GROUPS;
  try {
    const raw = localStorage.getItem(LOCAL_GROUPS_KEY);
    if (!raw) return DEFAULT_LOCAL_GROUPS;
    const parsed = JSON.parse(raw) as LocalGroupBundle;
    if (!parsed.groups || Object.keys(parsed.groups).length === 0) {
      return DEFAULT_LOCAL_GROUPS;
    }
    return parsed;
  } catch {
    return DEFAULT_LOCAL_GROUPS;
  }
}

export function saveLocalGroups(bundle: LocalGroupBundle): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_GROUPS_KEY, JSON.stringify(bundle));
  } catch {
    // Ignore storage quota errors
  }
}

function timestampToMs(ts: unknown): number {
  if (ts && typeof ts === 'object' && 'toMillis' in ts && typeof (ts as Timestamp).toMillis === 'function') {
    return (ts as Timestamp).toMillis();
  }
  return Date.now();
}

export function subscribeUserStudyState(
  uid: string,
  onData: (remote: Partial<LocalStudySnapshot> & { updatedAtMs: number }) => void
): Unsubscribe {
  const path = `users/${uid}/studyState/profile`;
  return onSnapshot(
    doc(db, 'users', uid, 'studyState', 'profile'),
    (snap) => {
      if (!snap.exists()) return;
      const d = snap.data();
      onData({
        theme: d.theme === 'dark' ? 'dark' : 'light',
        completedLessonIds: Array.isArray(d.completedLessonIds) ? d.completedLessonIds : [],
        masteredCardIds: Array.isArray(d.masteredCardIds) ? d.masteredCardIds : [],
        reviewCardIds: Array.isArray(d.reviewCardIds) ? d.reviewCardIds : [],
        studyStreakDays: typeof d.studyStreakDays === 'number' ? d.studyStreakDays : 1,
        updatedAtMs: timestampToMs(d.updatedAt),
      });
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function saveUserStudyState(
  uid: string,
  displayName: string,
  snapshot: LocalStudySnapshot
): Promise<void> {
  const path = `users/${uid}/studyState/profile`;
  const ref = doc(db, 'users', uid, 'studyState', 'profile');
  try {
    const existing = await getDoc(ref);
    const payload = {
      uid,
      displayName: clampText(displayName || 'Student', BLUEPRINT_LIMITS.displayNameMaxLength),
      theme: snapshot.theme,
      completedLessonIds: snapshot.completedLessonIds.slice(0, BLUEPRINT_LIMITS.completedLessonsMax),
      masteredCardIds: snapshot.masteredCardIds.slice(0, BLUEPRINT_LIMITS.masteredCardsMax),
      reviewCardIds: snapshot.reviewCardIds.slice(0, BLUEPRINT_LIMITS.reviewCardsMax),
      studyStreakDays: Math.min(3650, Math.max(0, Math.round(snapshot.studyStreakDays))),
      updatedAt: serverTimestamp(),
    };
    if (!existing.exists()) {
      await setDoc(ref, {
        ...payload,
        createdAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        displayName: payload.displayName,
        theme: payload.theme,
        completedLessonIds: payload.completedLessonIds,
        masteredCardIds: payload.masteredCardIds,
        reviewCardIds: payload.reviewCardIds,
        studyStreakDays: payload.studyStreakDays,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeCustomFlashcards(
  uid: string,
  onCards: (cards: Flashcard[]) => void
): Unsubscribe {
  const path = `users/${uid}/customFlashcards`;
  return onSnapshot(
    collection(db, 'users', uid, 'customFlashcards'),
    (snap) => {
      const cards: Flashcard[] = snap.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          subjectId: d.subjectId as SubjectId,
          front: String(d.front ?? ''),
          back: String(d.back ?? ''),
          tag: String(d.tag ?? 'Custom'),
          isCustom: true,
          createdAtMs: timestampToMs(d.createdAt),
        };
      });
      cards.sort((a, b) => (b.createdAtMs ?? 0) - (a.createdAtMs ?? 0));
      onCards(cards);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function saveCustomFlashcard(uid: string, card: Flashcard): Promise<void> {
  if (!isValidEntityId(card.id)) {
    throw new Error('Invalid flashcard identifier.');
  }
  const path = `users/${uid}/customFlashcards/${card.id}`;
  try {
    await setDoc(doc(db, 'users', uid, 'customFlashcards', card.id), {
      uid,
      subjectId: card.subjectId,
      front: clampText(card.front, BLUEPRINT_LIMITS.flashcardFrontMaxLength),
      back: clampText(card.back, BLUEPRINT_LIMITS.flashcardBackMaxLength),
      tag: clampText(card.tag || 'Custom', BLUEPRINT_LIMITS.flashcardTagMaxLength),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteCustomFlashcardDoc(uid: string, cardId: string): Promise<void> {
  const path = `users/${uid}/customFlashcards/${cardId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'customFlashcards', cardId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeReminders(
  uid: string,
  onReminders: (items: ReminderItem[]) => void
): Unsubscribe {
  const path = `users/${uid}/reminders`;
  return onSnapshot(
    collection(db, 'users', uid, 'reminders'),
    (snap) => {
      const items: ReminderItem[] = snap.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          title: String(d.title ?? ''),
          subjectId: d.subjectId as ScopeSubjectId,
          kind: d.kind,
          dueDate: String(d.dueDate ?? ''),
          notes: String(d.notes ?? ''),
          completed: Boolean(d.completed),
          updatedAtMs: timestampToMs(d.updatedAt),
        };
      });
      onReminders(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function upsertReminderDoc(uid: string, reminder: ReminderItem): Promise<void> {
  if (!isValidEntityId(reminder.id)) {
    throw new Error('Invalid reminder identifier.');
  }
  const path = `users/${uid}/reminders/${reminder.id}`;
  const ref = doc(db, 'users', uid, 'reminders', reminder.id);
  try {
    const existing = await getDoc(ref);
    const base = {
      uid,
      title: clampText(reminder.title, BLUEPRINT_LIMITS.reminderTitleMaxLength),
      subjectId: reminder.subjectId,
      kind: reminder.kind,
      dueDate: reminder.dueDate,
      notes: clampText(reminder.notes, BLUEPRINT_LIMITS.reminderNotesMaxLength),
      completed: Boolean(reminder.completed),
      updatedAt: serverTimestamp(),
    };
    if (!existing.exists()) {
      await setDoc(ref, { ...base, createdAt: serverTimestamp() });
    } else {
      await updateDoc(ref, {
        title: base.title,
        subjectId: base.subjectId,
        kind: base.kind,
        dueDate: base.dueDate,
        notes: base.notes,
        completed: base.completed,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteReminderDoc(uid: string, reminderId: string): Promise<void> {
  const path = `users/${uid}/reminders/${reminderId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'reminders', reminderId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeUserGroupMemberships(
  uid: string,
  onCodes: (codes: string[]) => void
): Unsubscribe {
  const path = `users/${uid}/groupMemberships`;
  return onSnapshot(
    collection(db, 'users', uid, 'groupMemberships'),
    (snap) => {
      const codes = snap.docs.map((d) => d.id);
      onCodes(codes);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function createCloudStudyGroup(params: {
  uid: string;
  displayName: string;
  code: string;
  name: string;
  description: string;
  subjectFocus: ScopeSubjectId;
  completedLessonsCount: number;
  masteredCardsCount: number;
}): Promise<void> {
  const cleanCode = normalizeGroupCode(params.code);
  if (!isValidGroupCode(cleanCode)) {
    throw new Error('Invalid study group code.');
  }
  const path = `studyGroups/${cleanCode}`;
  try {
    const groupRef = doc(db, 'studyGroups', cleanCode);
    const existing = await getDoc(groupRef);
    if (existing.exists()) {
      throw new Error(`Study group code "${cleanCode}" already exists. Try joining it instead.`);
    }

    const cleanName = clampText(params.name, BLUEPRINT_LIMITS.groupNameMaxLength);
    const cleanDisplayName = clampText(params.displayName || 'Student', BLUEPRINT_LIMITS.displayNameMaxLength);

    const batch = writeBatch(db);
    batch.set(groupRef, {
      code: cleanCode,
      name: cleanName,
      description: clampText(params.description, BLUEPRINT_LIMITS.groupDescriptionMaxLength),
      subjectFocus: params.subjectFocus,
      ownerId: params.uid,
      ownerName: cleanDisplayName,
      memberIds: [params.uid],
      recentPostIds: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    batch.set(doc(db, 'studyGroups', cleanCode, 'members', params.uid), {
      uid: params.uid,
      groupId: cleanCode,
      displayName: cleanDisplayName,
      role: 'owner',
      completedLessonsCount: Math.min(100, Math.max(0, params.completedLessonsCount)),
      masteredCardsCount: Math.min(500, Math.max(0, params.masteredCardsCount)),
      joinedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    batch.set(doc(db, 'users', params.uid, 'groupMemberships', cleanCode), {
      uid: params.uid,
      groupId: cleanCode,
      groupName: cleanName,
      role: 'owner',
      joinedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      throw error;
    }
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function joinCloudStudyGroup(params: {
  uid: string;
  displayName: string;
  code: string;
  completedLessonsCount: number;
  masteredCardsCount: number;
}): Promise<StudyGroup> {
  const cleanCode = normalizeGroupCode(params.code);
  if (!isValidGroupCode(cleanCode)) {
    throw new Error('Group code must be 4–24 uppercase letters or digits.');
  }
  const path = `studyGroups/${cleanCode}`;
  try {
    const groupRef = doc(db, 'studyGroups', cleanCode);
    const groupSnap = await getDoc(groupRef);
    if (!groupSnap.exists()) {
      throw new Error(`No study group found with code "${cleanCode}".`);
    }
    const g = groupSnap.data();
    const memberIds: string[] = Array.isArray(g.memberIds) ? g.memberIds : [];
    const cleanDisplayName = clampText(params.displayName || 'Student', BLUEPRINT_LIMITS.displayNameMaxLength);

    if (!memberIds.includes(params.uid)) {
      if (memberIds.length >= BLUEPRINT_LIMITS.groupMembersMax) {
        throw new Error(`This study group is full (max ${BLUEPRINT_LIMITS.groupMembersMax} members).`);
      }
      const batch = writeBatch(db);
      batch.update(groupRef, {
        memberIds: [...memberIds, params.uid],
        updatedAt: serverTimestamp(),
      });
      batch.set(doc(db, 'studyGroups', cleanCode, 'members', params.uid), {
        uid: params.uid,
        groupId: cleanCode,
        displayName: cleanDisplayName,
        role: 'member',
        completedLessonsCount: Math.min(100, Math.max(0, params.completedLessonsCount)),
        masteredCardsCount: Math.min(500, Math.max(0, params.masteredCardsCount)),
        joinedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      batch.set(doc(db, 'users', params.uid, 'groupMemberships', cleanCode), {
        uid: params.uid,
        groupId: cleanCode,
        groupName: String(g.name ?? cleanCode),
        role: 'member',
        joinedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await batch.commit();
    } else {
      await setDoc(doc(db, 'users', params.uid, 'groupMemberships', cleanCode), {
        uid: params.uid,
        groupId: cleanCode,
        groupName: String(g.name ?? cleanCode),
        role: g.ownerId === params.uid ? 'owner' : 'member',
        joinedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    return {
      code: cleanCode,
      name: String(g.name ?? cleanCode),
      description: String(g.description ?? ''),
      subjectFocus: (g.subjectFocus ?? 'all') as ScopeSubjectId,
      ownerId: String(g.ownerId ?? ''),
      ownerName: String(g.ownerName ?? ''),
      memberIds: memberIds.includes(params.uid) ? memberIds : [...memberIds, params.uid],
      recentPostIds: Array.isArray(g.recentPostIds) ? g.recentPostIds : [],
      updatedAtMs: timestampToMs(g.updatedAt),
    };
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes('No study group') || error.message.includes('full'))
    ) {
      throw error;
    }
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeStudyGroupDetails(
  groupCode: string,
  onUpdate: (data: { group: StudyGroup | null; members: GroupMember[]; posts: StudyPost[] }) => void
): Unsubscribe {
  const path = `studyGroups/${groupCode}`;
  return onSnapshot(
    doc(db, 'studyGroups', groupCode),
    async (snap) => {
      if (!snap.exists()) {
        onUpdate({ group: null, members: [], posts: [] });
        return;
      }
      const g = snap.data();
      const memberIds: string[] = Array.isArray(g.memberIds) ? g.memberIds : [];
      const recentPostIds: string[] = Array.isArray(g.recentPostIds) ? g.recentPostIds : [];

      const group: StudyGroup = {
        code: groupCode,
        name: String(g.name ?? groupCode),
        description: String(g.description ?? ''),
        subjectFocus: (g.subjectFocus ?? 'all') as ScopeSubjectId,
        ownerId: String(g.ownerId ?? ''),
        ownerName: String(g.ownerName ?? ''),
        memberIds,
        recentPostIds,
        updatedAtMs: timestampToMs(g.updatedAt),
      };

      try {
        const [memberSnaps, postSnaps] = await Promise.all([
          Promise.all(memberIds.map((mId) => getDoc(doc(db, 'studyGroups', groupCode, 'members', mId)))),
          Promise.all(recentPostIds.map((pId) => getDoc(doc(db, 'studyGroups', groupCode, 'posts', pId)))),
        ]);

        const members: GroupMember[] = memberSnaps
          .filter((ms) => ms.exists())
          .map((ms) => {
            const md = ms.data();
            return {
              uid: String(md.uid ?? ms.id),
              groupId: groupCode,
              displayName: String(md.displayName ?? 'Student'),
              role: md.role === 'owner' ? 'owner' : 'member',
              completedLessonsCount: Number(md.completedLessonsCount ?? 0),
              masteredCardsCount: Number(md.masteredCardsCount ?? 0),
            };
          });

        const posts: StudyPost[] = postSnaps
          .filter((ps) => ps.exists())
          .map((ps) => {
            const pd = ps.data();
            return {
              id: ps.id,
              groupId: groupCode,
              authorId: String(pd.authorId ?? ''),
              authorName: String(pd.authorName ?? 'Student'),
              kind: (pd.kind ?? 'note') as PostKind,
              subjectId: (pd.subjectId ?? 'all') as ScopeSubjectId,
              title: String(pd.title ?? ''),
              body: String(pd.body ?? ''),
              flashcardFront: String(pd.flashcardFront ?? ''),
              flashcardBack: String(pd.flashcardBack ?? ''),
              upvoterIds: Array.isArray(pd.upvoterIds) ? pd.upvoterIds : [],
              createdAtMs: timestampToMs(pd.createdAt),
            };
          })
          .sort((a, b) => b.createdAtMs - a.createdAtMs);

        onUpdate({ group, members, posts });
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, path);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function createCloudStudyPost(params: {
  uid: string;
  displayName: string;
  group: StudyGroup;
  postId: string;
  kind: PostKind;
  subjectId: ScopeSubjectId;
  title: string;
  body: string;
  flashcardFront?: string;
  flashcardBack?: string;
}): Promise<void> {
  const path = `studyGroups/${params.group.code}/posts/${params.postId}`;
  try {
    const nextRecentPostIds = [
      params.postId,
      ...params.group.recentPostIds.filter((id) => id !== params.postId),
    ].slice(0, BLUEPRINT_LIMITS.groupRecentPostsMax);

    const batch = writeBatch(db);
    batch.set(doc(db, 'studyGroups', params.group.code, 'posts', params.postId), {
      id: params.postId,
      groupId: params.group.code,
      authorId: params.uid,
      authorName: clampText(params.displayName || 'Student', BLUEPRINT_LIMITS.displayNameMaxLength),
      kind: params.kind,
      subjectId: params.subjectId,
      title: clampText(params.title, BLUEPRINT_LIMITS.postTitleMaxLength),
      body: clampText(params.body, BLUEPRINT_LIMITS.postBodyMaxLength),
      flashcardFront: clampText(params.flashcardFront ?? '', BLUEPRINT_LIMITS.flashcardFrontMaxLength),
      flashcardBack: clampText(params.flashcardBack ?? '', BLUEPRINT_LIMITS.flashcardBackMaxLength),
      upvoterIds: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    batch.update(doc(db, 'studyGroups', params.group.code), {
      recentPostIds: nextRecentPostIds,
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function toggleCloudPostUpvote(
  uid: string,
  groupCode: string,
  post: StudyPost
): Promise<void> {
  const path = `studyGroups/${groupCode}/posts/${post.id}`;
  try {
    const already = post.upvoterIds.includes(uid);
    const nextUpvoters = already
      ? post.upvoterIds.filter((id) => id !== uid)
      : [...post.upvoterIds, uid].slice(0, BLUEPRINT_LIMITS.groupMembersMax);

    await updateDoc(doc(db, 'studyGroups', groupCode, 'posts', post.id), {
      upvoterIds: nextUpvoters,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function syncMemberProgressCount(params: {
  uid: string;
  groupCode: string;
  displayName: string;
  completedLessonsCount: number;
  masteredCardsCount: number;
}): Promise<void> {
  const path = `studyGroups/${params.groupCode}/members/${params.uid}`;
  try {
    const memberRef = doc(db, 'studyGroups', params.groupCode, 'members', params.uid);
    const snap = await getDoc(memberRef);
    if (!snap.exists()) return;
    await updateDoc(memberRef, {
      displayName: clampText(params.displayName || 'Student', BLUEPRINT_LIMITS.displayNameMaxLength),
      completedLessonsCount: Math.min(100, Math.max(0, params.completedLessonsCount)),
      masteredCardsCount: Math.min(500, Math.max(0, params.masteredCardsCount)),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

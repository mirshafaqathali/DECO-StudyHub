import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { Moon, Palette, Sun } from 'lucide-react';
import { CloudSyncModal } from './components/CloudSyncModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { FlashcardsView } from './components/FlashcardsView';
import { LessonsView } from './components/LessonsView';
import { McqTestView } from './components/McqTestView';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ProgressView } from './components/ProgressView';
import { PWAInstallButton } from './components/PWAInstallButton';
import { RemindersView } from './components/RemindersView';
import { StudyGroupsView, type ShareDraftPayload } from './components/StudyGroupsView';
import { MobileNavStrip, TopBar } from './components/TopBar';
import { DECO_MCQS } from './data/decoMcqs';
import {
  DECO_COURSE_INFO,
  DECO_FLASHCARDS,
  DECO_LESSONS,
  DECO_SUBJECTS,
} from './data/decoSyllabus';
import { auth, googleProvider } from './firebase';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import {
  createCloudStudyGroup,
  createCloudStudyPost,
  deleteCustomFlashcardDoc,
  deleteReminderDoc,
  joinCloudStudyGroup,
  loadLocalGroups,
  loadLocalSnapshot,
  saveCustomFlashcard,
  saveLocalGroups,
  saveLocalSnapshot,
  saveUserStudyState,
  subscribeCustomFlashcards,
  subscribeReminders,
  subscribeStudyGroupDetails,
  subscribeUserGroupMemberships,
  subscribeUserStudyState,
  syncMemberProgressCount,
  toggleCloudPostUpvote,
  upsertReminderDoc,
  type LocalGroupBundle,
} from './services/studySyncService';
import type {
  AppTab,
  ColorPalette,
  DailyGoalMetric,
  Flashcard,
  GroupMember,
  LocalStudySnapshot,
  McqTestAttempt,
  ReminderItem,
  StudyGroup,
  StudyPost,
  ThemeMode,
} from './types/study';
import { recordDailyStudyActivity, updateDailyGoalConfig } from './utils/dailyGoal';
import { gradeFlashcard } from './utils/flashcardEngine';
import { appendMcqAttempt, formatMcqDuration } from './utils/mcqEngine';
import {
  buildGroupShareSummary,
  calculateSyllabusProgress,
  mergeStudySnapshots,
  saveLessonNote,
  toggleLessonCompletion,
} from './utils/studyProgress';
import { normalizeGroupCode, type ScopeSubjectId, type SubjectId } from './utils/validation';

const PALETTE_OPTIONS: { id: ColorPalette; label: string; lightThemeColor: string }[] = [
  { id: 'teal', label: 'Teal & Amber', lightThemeColor: '#0f766e' },
  { id: 'indigo', label: 'Indigo & Teal', lightThemeColor: '#4338ca' },
  { id: 'copper', label: 'Copper & Teal', lightThemeColor: '#b45309' },
  { id: 'crimson', label: 'Ruby & Cobalt', lightThemeColor: '#be123c' },
];

function loadSavedPalette(): ColorPalette {
  if (typeof window === 'undefined') return 'teal';
  const saved = localStorage.getItem('deco_palette');
  if (saved === 'teal' || saved === 'indigo' || saved === 'copper' || saved === 'crimson') {
    return saved;
  }
  return 'teal';
}

function StudyHubContent() {
  const isOnline = useOnlineStatus();
  const [snapshot, setSnapshot] = useState<LocalStudySnapshot>(() => loadLocalSnapshot());
  const [localGroups, setLocalGroups] = useState<LocalGroupBundle>(() => loadLocalGroups());
  const [palette, setPalette] = useState<ColorPalette>(() => loadSavedPalette());

  const [activeTab, setActiveTab] = useState<AppTab>('lessons');
  const [selectedSubjectId, setSelectedSubjectId] = useState<SubjectId>('unit-1');
  const [selectedLessonId, setSelectedLessonId] = useState<string>(DECO_LESSONS[0].id);

  // Auth & Cloud Sync State
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAtMs, setLastSyncedAtMs] = useState<number | null>(null);
  const [syncModalOpen, setSyncModalOpen] = useState(false);

  // Cloud Group State
  const [cloudGroupCodes, setCloudGroupCodes] = useState<string[]>([]);
  const [activeGroupCode, setActiveGroupCode] = useState<string>('DECO2026');
  const [cloudGroupDetails, setCloudGroupDetails] = useState<{
    group: StudyGroup | null;
    members: GroupMember[];
    posts: StudyPost[];
  }>({ group: null, members: [], posts: [] });
  const [cloudGroupsMeta, setCloudGroupsMeta] = useState<Record<string, StudyGroup>>({});

  const [shareDraft, setShareDraft] = useState<ShareDraftPayload | null>(null);

  // Apply theme class & palette data attribute to <html>
  useEffect(() => {
    const root = document.documentElement;
    if (snapshot.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    root.dataset.palette = palette;
    try {
      localStorage.setItem('deco_palette', palette);
    } catch {
      // Ignore storage quota issues
    }
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      const currentOption = PALETTE_OPTIONS.find((p) => p.id === palette) ?? PALETTE_OPTIONS[0];
      themeMeta.setAttribute('content', snapshot.theme === 'dark' ? '#09090b' : currentOption.lightThemeColor);
    }
  }, [snapshot.theme, palette]);

  // Persist local snapshot
  useEffect(() => {
    saveLocalSnapshot(snapshot);
  }, [snapshot]);

  // Persist local cohort groups
  useEffect(() => {
    saveLocalGroups(localGroups);
  }, [localGroups]);

  // Handle ?group=CODE invite URL parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invite = params.get('group');
    if (invite) {
      const clean = normalizeGroupCode(invite);
      if (clean.length >= 4) {
        setActiveTab('groups');
        setActiveGroupCode(clean);
      }
    }
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // Subscribe to cloud user state when authenticated
  useEffect(() => {
    if (!authReady || !user) return;

    let initialPushDone = false;
    const unsubState = subscribeUserStudyState(user.uid, (remote) => {
      setSnapshot((prev) => mergeStudySnapshots(prev, remote));
      setLastSyncedAtMs(Date.now());
      initialPushDone = true;
    });

    const unsubCards = subscribeCustomFlashcards(user.uid, (cloudCards) => {
      setSnapshot((prev) => ({
        ...prev,
        customFlashcards: cloudCards,
      }));
      setLastSyncedAtMs(Date.now());
    });

    const unsubReminders = subscribeReminders(user.uid, (cloudReminders) => {
      if (cloudReminders.length > 0) {
        setSnapshot((prev) => ({
          ...prev,
          reminders: cloudReminders,
        }));
      }
      setLastSyncedAtMs(Date.now());
    });

    const unsubMemberships = subscribeUserGroupMemberships(user.uid, (codes) => {
      setCloudGroupCodes(codes);
      if (codes.length > 0) {
        setActiveGroupCode((prev) => (codes.includes(prev) ? prev : codes[0]));
      }
    });

    // Ensure profile doc exists on first sign-in
    const initTimer = window.setTimeout(() => {
      if (!initialPushDone) {
        void saveUserStudyState(user.uid, user.displayName || 'Student', snapshot);
      }
    }, 800);

    return () => {
      window.clearTimeout(initTimer);
      unsubState();
      unsubCards();
      unsubReminders();
      unsubMemberships();
    };
  }, [authReady, user]);

  // Subscribe to active cloud study group details when signed in and group is in cloud
  useEffect(() => {
    if (!authReady || !user || !cloudGroupCodes.includes(activeGroupCode)) {
      setCloudGroupDetails({ group: null, members: [], posts: [] });
      return;
    }

    const unsub = subscribeStudyGroupDetails(activeGroupCode, (details) => {
      setCloudGroupDetails(details);
      if (details.group) {
        setCloudGroupsMeta((prev) => ({
          ...prev,
          [details.group!.code]: details.group!,
        }));
      }
    });

    return () => unsub();
  }, [authReady, user, activeGroupCode, cloudGroupCodes]);

  const allFlashcards = useMemo(
    () => [...snapshot.customFlashcards, ...DECO_FLASHCARDS],
    [snapshot.customFlashcards]
  );

  const progress = useMemo(
    () =>
      calculateSyllabusProgress({
        subjects: DECO_SUBJECTS,
        lessons: DECO_LESSONS,
        flashcards: allFlashcards,
        completedLessonIds: snapshot.completedLessonIds,
        masteredCardIds: snapshot.masteredCardIds,
        reviewCardIds: snapshot.reviewCardIds,
      }),
    [allFlashcards, snapshot.completedLessonIds, snapshot.masteredCardIds, snapshot.reviewCardIds]
  );

  const pushStateToCloud = useCallback(
    async (nextSnapshot: LocalStudySnapshot) => {
      if (!user) return;
      setIsSyncing(true);
      try {
        await saveUserStudyState(user.uid, user.displayName || 'Student', nextSnapshot);
        if (cloudGroupCodes.includes(activeGroupCode)) {
          await syncMemberProgressCount({
            uid: user.uid,
            groupCode: activeGroupCode,
            displayName: user.displayName || 'Student',
            completedLessonsCount: nextSnapshot.completedLessonIds.length,
            masteredCardsCount: nextSnapshot.masteredCardIds.length,
          });
        }
        setLastSyncedAtMs(Date.now());
      } finally {
        setIsSyncing(false);
      }
    },
    [user, cloudGroupCodes, activeGroupCode]
  );

  const updateSnapshot = (updater: (prev: LocalStudySnapshot) => LocalStudySnapshot) => {
    setSnapshot((prev) => {
      const next = { ...updater(prev), updatedAtMs: Date.now() };
      void pushStateToCloud(next);
      return next;
    });
  };

  const handleToggleTheme = () => {
    const nextTheme: ThemeMode = snapshot.theme === 'dark' ? 'light' : 'dark';
    updateSnapshot((prev) => ({ ...prev, theme: nextTheme }));
  };

  const handleToggleLessonComplete = (lessonId: string) => {
    updateSnapshot((prev) => {
      const wasDone = prev.completedLessonIds.includes(lessonId);
      const nextCompleted = toggleLessonCompletion(prev.completedLessonIds, lessonId);
      const goalUpdate = recordDailyStudyActivity({
        goal: prev.dailyGoal,
        studyStreakDays: prev.studyStreakDays,
        kind: 'lessons',
        delta: wasDone ? -1 : 1,
      });
      return {
        ...prev,
        completedLessonIds: nextCompleted,
        dailyGoal: goalUpdate.dailyGoal,
        studyStreakDays: goalUpdate.studyStreakDays,
      };
    });
  };

  const handleSaveLessonNote = (lessonId: string, noteText: string) => {
    updateSnapshot((prev) => ({
      ...prev,
      lessonNotes: saveLessonNote(prev.lessonNotes, lessonId, noteText),
    }));
  };

  const handleGradeCard = (cardId: string, grade: 'mastered' | 'review') => {
    updateSnapshot((prev) => {
      const next = gradeFlashcard({
        cardId,
        grade,
        masteredCardIds: prev.masteredCardIds,
        reviewCardIds: prev.reviewCardIds,
      });
      const goalUpdate = recordDailyStudyActivity({
        goal: prev.dailyGoal,
        studyStreakDays: prev.studyStreakDays,
        kind: 'flashcards',
        delta: 1,
      });
      return {
        ...prev,
        masteredCardIds: next.masteredCardIds,
        reviewCardIds: next.reviewCardIds,
        dailyGoal: goalUpdate.dailyGoal,
        studyStreakDays: goalUpdate.studyStreakDays,
      };
    });
  };

  const handleUpdateDailyGoal = (metric: DailyGoalMetric, target: number) => {
    updateSnapshot((prev) => {
      const goalUpdate = updateDailyGoalConfig({
        goal: prev.dailyGoal,
        studyStreakDays: prev.studyStreakDays,
        metric,
        target,
      });
      return {
        ...prev,
        dailyGoal: goalUpdate.dailyGoal,
        studyStreakDays: goalUpdate.studyStreakDays,
      };
    });
  };

  const handleSaveMcqAttempt = (attempt: McqTestAttempt) => {
    updateSnapshot((prev) => ({
      ...prev,
      mcqHistory: appendMcqAttempt(prev.mcqHistory, attempt),
    }));
  };

  const handleAddCustomCard = async (input: {
    subjectId: SubjectId;
    front: string;
    back: string;
    tag: string;
  }) => {
    const newCard: Flashcard = {
      id: `fc_custom_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      subjectId: input.subjectId,
      front: input.front,
      back: input.back,
      tag: input.tag,
      isCustom: true,
      createdAtMs: Date.now(),
    };
    setSnapshot((prev) => ({
      ...prev,
      customFlashcards: [newCard, ...prev.customFlashcards],
      updatedAtMs: Date.now(),
    }));
    if (user) {
      await saveCustomFlashcard(user.uid, newCard);
      setLastSyncedAtMs(Date.now());
    }
  };

  const handleDeleteCustomCard = async (cardId: string) => {
    setSnapshot((prev) => ({
      ...prev,
      customFlashcards: prev.customFlashcards.filter((c) => c.id !== cardId),
      masteredCardIds: prev.masteredCardIds.filter((id) => id !== cardId),
      reviewCardIds: prev.reviewCardIds.filter((id) => id !== cardId),
      updatedAtMs: Date.now(),
    }));
    if (user) {
      await deleteCustomFlashcardDoc(user.uid, cardId);
      setLastSyncedAtMs(Date.now());
    }
  };

  const handleSaveReminder = async (item: ReminderItem) => {
    setSnapshot((prev) => {
      const exists = prev.reminders.some((r) => r.id === item.id);
      const nextReminders = exists
        ? prev.reminders.map((r) => (r.id === item.id ? item : r))
        : [item, ...prev.reminders];
      return {
        ...prev,
        reminders: nextReminders,
        updatedAtMs: Date.now(),
      };
    });
    if (user) {
      await upsertReminderDoc(user.uid, item);
      setLastSyncedAtMs(Date.now());
    }
  };

  const handleToggleReminderComplete = async (id: string) => {
    let target: ReminderItem | null = null;
    setSnapshot((prev) => {
      const nextReminders = prev.reminders.map((r) => {
        if (r.id !== id) return r;
        target = { ...r, completed: !r.completed, updatedAtMs: Date.now() };
        return target;
      });
      return { ...prev, reminders: nextReminders, updatedAtMs: Date.now() };
    });
    if (user && target) {
      await upsertReminderDoc(user.uid, target);
      setLastSyncedAtMs(Date.now());
    }
  };

  const handleDeleteReminder = async (id: string) => {
    setSnapshot((prev) => ({
      ...prev,
      reminders: prev.reminders.filter((r) => r.id !== id),
      updatedAtMs: Date.now(),
    }));
    if (user) {
      await deleteReminderDoc(user.uid, id);
      setLastSyncedAtMs(Date.now());
    }
  };

  const handleSignIn = async () => {
    setAuthError(null);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      await saveUserStudyState(cred.user.uid, cred.user.displayName || 'Student', snapshot);
      setLastSyncedAtMs(Date.now());
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : 'Sign in was cancelled or blocked by popup settings.'
      );
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setCloudGroupCodes([]);
    setCloudGroupsMeta({});
    setLastSyncedAtMs(null);
  };

  // Study Groups handlers (works seamlessly in both Cloud mode and Local Cohort mode)
  const currentUserId = user?.uid ?? 'local_student';
  const currentUserName = user?.displayName || 'You';

  const displayedGroups = useMemo(() => {
    const map = new Map<string, StudyGroup>();
    Object.values(localGroups.groups).forEach((g) => map.set(g.code, g));
    Object.values(cloudGroupsMeta).forEach((g) => map.set(g.code, g));
    cloudGroupCodes.forEach((code) => {
      if (!map.has(code)) {
        map.set(code, {
          code,
          name: code,
          description: 'Cloud-synced study group',
          subjectFocus: 'all',
          ownerId: '',
          ownerName: 'Group Lead',
          memberIds: [currentUserId],
          recentPostIds: [],
          updatedAtMs: Date.now(),
        });
      }
    });
    return Array.from(map.values());
  }, [localGroups.groups, cloudGroupsMeta, cloudGroupCodes, currentUserId]);

  const isCloudActiveGroup = Boolean(user && cloudGroupCodes.includes(activeGroupCode));

  const activeGroupMembers: GroupMember[] = useMemo(() => {
    if (isCloudActiveGroup && cloudGroupDetails.group) {
      return cloudGroupDetails.members;
    }
    const members = localGroups.members[activeGroupCode] ?? [];
    const hasMe = members.some((m) => m.uid === currentUserId);
    const meEntry: GroupMember = {
      uid: currentUserId,
      groupId: activeGroupCode,
      displayName: currentUserName,
      role: 'member',
      completedLessonsCount: progress.completedLessons,
      masteredCardsCount: progress.masteredCards,
    };
    return hasMe
      ? members.map((m) => (m.uid === currentUserId ? { ...m, ...meEntry, role: m.role } : m))
      : [meEntry, ...members];
  }, [
    isCloudActiveGroup,
    cloudGroupDetails,
    localGroups.members,
    activeGroupCode,
    currentUserId,
    currentUserName,
    progress.completedLessons,
    progress.masteredCards,
  ]);

  const activeGroupPosts: StudyPost[] = useMemo(() => {
    if (isCloudActiveGroup && cloudGroupDetails.group) {
      return cloudGroupDetails.posts;
    }
    return localGroups.posts[activeGroupCode] ?? [];
  }, [isCloudActiveGroup, cloudGroupDetails, localGroups.posts, activeGroupCode]);

  const handleJoinGroup = async (code: string) => {
    if (user && isOnline) {
      const joined = await joinCloudStudyGroup({
        uid: user.uid,
        displayName: currentUserName,
        code,
        completedLessonsCount: progress.completedLessons,
        masteredCardsCount: progress.masteredCards,
      });
      setCloudGroupsMeta((prev) => ({ ...prev, [joined.code]: joined }));
      setCloudGroupCodes((prev) => (prev.includes(joined.code) ? prev : [...prev, joined.code]));
      setActiveGroupCode(joined.code);
      return;
    }

    if (localGroups.groups[code]) {
      setActiveGroupCode(code);
      return;
    }

    throw new Error(
      user
        ? `No study group found with code "${code}".`
        : `Sign in with Google to join cloud group "${code}", or join seeded cohort DECO2026.`
    );
  };

  const handleCreateGroup = async (input: {
    code: string;
    name: string;
    description: string;
    subjectFocus: ScopeSubjectId;
  }) => {
    if (user && isOnline) {
      await createCloudStudyGroup({
        uid: user.uid,
        displayName: currentUserName,
        code: input.code,
        name: input.name,
        description: input.description,
        subjectFocus: input.subjectFocus,
        completedLessonsCount: progress.completedLessons,
        masteredCardsCount: progress.masteredCards,
      });
      setCloudGroupCodes((prev) => (prev.includes(input.code) ? prev : [...prev, input.code]));
      setActiveGroupCode(input.code);
      return;
    }

    if (localGroups.groups[input.code]) {
      throw new Error(`Study group code "${input.code}" already exists locally.`);
    }
    const newGroup: StudyGroup = {
      code: input.code,
      name: input.name,
      description: input.description,
      subjectFocus: input.subjectFocus,
      ownerId: currentUserId,
      ownerName: currentUserName,
      memberIds: [currentUserId],
      recentPostIds: [],
      updatedAtMs: Date.now(),
    };
    const newMember: GroupMember = {
      uid: currentUserId,
      groupId: input.code,
      displayName: currentUserName,
      role: 'owner',
      completedLessonsCount: progress.completedLessons,
      masteredCardsCount: progress.masteredCards,
    };
    setLocalGroups((prev) => ({
      groups: { ...prev.groups, [input.code]: newGroup },
      members: { ...prev.members, [input.code]: [newMember] },
      posts: { ...prev.posts, [input.code]: [] },
    }));
    setActiveGroupCode(input.code);
  };

  const handleCreatePost = async (draft: ShareDraftPayload) => {
    const postId = `post_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    if (isCloudActiveGroup && cloudGroupDetails.group && user) {
      await createCloudStudyPost({
        uid: user.uid,
        displayName: currentUserName,
        group: cloudGroupDetails.group,
        postId,
        kind: draft.kind,
        subjectId: draft.subjectId,
        title: draft.title,
        body: draft.body,
        flashcardFront: draft.flashcardFront,
        flashcardBack: draft.flashcardBack,
      });
      return;
    }

    const newPost: StudyPost = {
      id: postId,
      groupId: activeGroupCode,
      authorId: currentUserId,
      authorName: currentUserName,
      kind: draft.kind,
      subjectId: draft.subjectId,
      title: draft.title,
      body: draft.body,
      flashcardFront: draft.flashcardFront ?? '',
      flashcardBack: draft.flashcardBack ?? '',
      upvoterIds: [],
      createdAtMs: Date.now(),
    };
    setLocalGroups((prev) => ({
      ...prev,
      posts: {
        ...prev.posts,
        [activeGroupCode]: [newPost, ...(prev.posts[activeGroupCode] ?? [])],
      },
    }));
  };

  const handleToggleUpvote = async (post: StudyPost) => {
    if (isCloudActiveGroup && user) {
      await toggleCloudPostUpvote(user.uid, activeGroupCode, post);
      return;
    }
    setLocalGroups((prev) => {
      const existing = prev.posts[activeGroupCode] ?? [];
      const updated = existing.map((p) => {
        if (p.id !== post.id) return p;
        const has = p.upvoterIds.includes(currentUserId);
        return {
          ...p,
          upvoterIds: has
            ? p.upvoterIds.filter((id) => id !== currentUserId)
            : [...p.upvoterIds, currentUserId],
        };
      });
      return {
        ...prev,
        posts: { ...prev.posts, [activeGroupCode]: updated },
      };
    });
  };

  const handleSaveSharedFlashcard = async (post: StudyPost) => {
    const subjectId: SubjectId = post.subjectId === 'all' ? 'unit-1' : post.subjectId;
    await handleAddCustomCard({
      subjectId,
      front: post.flashcardFront,
      back: post.flashcardBack,
      tag: `Shared · ${post.authorName.split(' ')[0]}`,
    });
  };

  const upcomingRemindersCount = snapshot.reminders.filter((r) => !r.completed).length;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col">
      <TopBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        userDisplayName={user?.displayName || null}
        isSyncing={isSyncing}
        isOnline={isOnline}
        onOpenSyncModal={() => setSyncModalOpen(true)}
      />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-5 sm:py-7 space-y-6">
        <MobileNavStrip activeTab={activeTab} onSelectTab={setActiveTab} />

        {/* Workspace Utility Bar (Course Metadata + Palette Selector + Theme Toggle + Install CTA) */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <div className="text-xs text-zinc-600 dark:text-zinc-400">
            <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">
              {DECO_COURSE_INFO.code}
            </span>
            <span aria-hidden="true"> · </span>
            <span>{DECO_COURSE_INFO.title}</span>
            <span aria-hidden="true"> · </span>
            <span className="tabular-nums">
              {progress.completedLessons}/{progress.totalLessons} lessons ({progress.overallMasteryPercent}% mastery)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <PWAInstallButton />

            <div className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-200">
              <Palette className="w-3.5 h-3.5 text-[var(--accent-text)] shrink-0" />
              <label htmlFor="color-palette-select" className="sr-only">
                Color palette
              </label>
              <select
                id="color-palette-select"
                aria-label="Color palette"
                value={palette}
                onChange={(e) => setPalette(e.target.value as ColorPalette)}
                className="bg-transparent text-xs font-medium text-zinc-700 dark:text-zinc-200 focus:outline-none cursor-pointer"
              >
                {PALETTE_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              aria-label={snapshot.theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              onClick={handleToggleTheme}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-200 transition-colors whitespace-nowrap shrink-0"
            >
              {snapshot.theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  Light Mode
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-zinc-600" />
                  Dark Mode
                </>
              )}
            </button>
          </div>
        </div>

        {/* Active Section */}
        {activeTab === 'lessons' && (
          <LessonsView
            subjects={DECO_SUBJECTS}
            lessons={DECO_LESSONS}
            selectedSubjectId={selectedSubjectId}
            selectedLessonId={selectedLessonId}
            completedLessonIds={snapshot.completedLessonIds}
            lessonNotes={snapshot.lessonNotes}
            onSelectSubject={setSelectedSubjectId}
            onSelectLesson={setSelectedLessonId}
            onToggleLessonComplete={handleToggleLessonComplete}
            onSaveLessonNote={handleSaveLessonNote}
            onShareLessonToGroup={(lesson) => {
              setShareDraft({
                kind: 'note',
                subjectId: lesson.subjectId,
                title: `Key Takeaway: ${lesson.title}`,
                body: `${lesson.keyPoints[0]}\n\nExam tip: ${lesson.examTip}`,
              });
              setActiveTab('groups');
            }}
          />
        )}

        {activeTab === 'flashcards' && (
          <FlashcardsView
            subjects={DECO_SUBJECTS}
            allCards={allFlashcards}
            masteredCardIds={snapshot.masteredCardIds}
            reviewCardIds={snapshot.reviewCardIds}
            onGradeCard={handleGradeCard}
            onAddCustomCard={handleAddCustomCard}
            onDeleteCustomCard={handleDeleteCustomCard}
            onShareCardToGroup={(card) => {
              setShareDraft({
                kind: 'flashcard',
                subjectId: card.subjectId,
                title: `Flashcard: ${card.tag}`,
                body: 'Sharing a high-yield DECO revision card with the study group.',
                flashcardFront: card.front,
                flashcardBack: card.back,
              });
              setActiveTab('groups');
            }}
          />
        )}

        {activeTab === 'tests' && (
          <McqTestView
            subjects={DECO_SUBJECTS}
            questionBank={DECO_MCQS}
            mcqHistory={snapshot.mcqHistory}
            onSaveAttempt={handleSaveMcqAttempt}
            onShareTestResult={(attempt) => {
              const scopeLabel =
                attempt.subjectFilter === 'all'
                  ? 'All Units'
                  : DECO_SUBJECTS.find((s) => s.id === attempt.subjectFilter)?.code ??
                    attempt.subjectFilter;
              setShareDraft({
                kind: 'milestone',
                subjectId: attempt.subjectFilter,
                title: `${currentUserName} scored ${attempt.score}/${attempt.total} (${attempt.percent}%) on ${scopeLabel} MCQ Test`,
                body: `Completed the DECO ${scopeLabel} MCQ practice test in ${formatMcqDuration(attempt.elapsedSeconds)}.`,
              });
              setActiveTab('groups');
            }}
          />
        )}

        {activeTab === 'progress' && (
          <ProgressView
            subjects={DECO_SUBJECTS}
            lessons={DECO_LESSONS}
            completedLessonIds={snapshot.completedLessonIds}
            progress={progress}
            upcomingRemindersCount={upcomingRemindersCount}
            studyStreakDays={snapshot.studyStreakDays}
            dailyGoal={snapshot.dailyGoal}
            onUpdateDailyGoal={handleUpdateDailyGoal}
            onOpenFlashcards={() => setActiveTab('flashcards')}
            onOpenLesson={(subjectId, lessonId) => {
              setSelectedSubjectId(subjectId);
              setSelectedLessonId(lessonId);
              setActiveTab('lessons');
            }}
            onToggleLessonComplete={handleToggleLessonComplete}
            onShareProgressToGroup={() => {
              const summary = buildGroupShareSummary({
                progress,
                studentName: currentUserName,
              });
              setShareDraft({
                kind: 'milestone',
                subjectId: 'all',
                title: summary.title,
                body: summary.body,
              });
              setActiveTab('groups');
            }}
          />
        )}

        {activeTab === 'reminders' && (
          <RemindersView
            subjects={DECO_SUBJECTS}
            reminders={snapshot.reminders}
            onSaveReminder={handleSaveReminder}
            onToggleComplete={handleToggleReminderComplete}
            onDeleteReminder={handleDeleteReminder}
          />
        )}

        {activeTab === 'groups' && (
          <StudyGroupsView
            subjects={DECO_SUBJECTS}
            isSignedIn={Boolean(user)}
            isOnline={isOnline}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            groups={displayedGroups}
            activeGroupCode={activeGroupCode}
            activeMembers={activeGroupMembers}
            activePosts={activeGroupPosts}
            shareDraft={shareDraft}
            onClearShareDraft={() => setShareDraft(null)}
            onSelectGroup={setActiveGroupCode}
            onJoinGroup={handleJoinGroup}
            onCreateGroup={handleCreateGroup}
            onCreatePost={handleCreatePost}
            onToggleUpvote={handleToggleUpvote}
            onSaveSharedFlashcard={handleSaveSharedFlashcard}
            onShareMyProgress={() => {
              const summary = buildGroupShareSummary({
                progress,
                studentName: currentUserName,
              });
              setShareDraft({
                kind: 'milestone',
                subjectId: 'all',
                title: summary.title,
                body: summary.body,
              });
            }}
            onOpenSyncModal={() => setSyncModalOpen(true)}
          />
        )}
      </main>

      <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-4 px-4 sm:px-6 text-xs text-zinc-500 dark:text-zinc-400">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>DECO StudyHub · Course U24EC304 Syllabus & Exam Preparation</span>
          <span>Offline-first PWA · Cross-device cloud sync ready</span>
        </div>
      </footer>

      <OfflineIndicator />

      <CloudSyncModal
        isOpen={syncModalOpen}
        onClose={() => setSyncModalOpen(false)}
        user={user}
        isOnline={isOnline}
        isSyncing={isSyncing}
        lastSyncedAtMs={lastSyncedAtMs}
        authError={authError}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        onManualSync={() => pushStateToCloud(snapshot)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <StudyHubContent />
    </ErrorBoundary>
  );
}

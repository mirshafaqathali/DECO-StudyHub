import React, { useEffect, useState } from 'react';
import {
  BookmarkPlus,
  Check,
  Copy,
  Plus,
  Send,
  ThumbsUp,
  UserPlus,
  Users,
} from 'lucide-react';
import type { GroupMember, StudyGroup, StudyPost, SubjectUnit } from '../types/study';
import {
  BLUEPRINT_LIMITS,
  normalizeGroupCode,
  validateStudyGroupInput,
  validateStudyPostInput,
  type PostKind,
  type ScopeSubjectId,
} from '../utils/validation';

export interface ShareDraftPayload {
  kind: PostKind;
  subjectId: ScopeSubjectId;
  title: string;
  body: string;
  flashcardFront?: string;
  flashcardBack?: string;
}

interface StudyGroupsViewProps {
  subjects: SubjectUnit[];
  isSignedIn: boolean;
  isOnline: boolean;
  currentUserId: string;
  currentUserName: string;
  groups: StudyGroup[];
  activeGroupCode: string;
  activeMembers: GroupMember[];
  activePosts: StudyPost[];
  shareDraft: ShareDraftPayload | null;
  onClearShareDraft: () => void;
  onSelectGroup: (code: string) => void;
  onJoinGroup: (code: string) => Promise<void>;
  onCreateGroup: (input: {
    code: string;
    name: string;
    description: string;
    subjectFocus: ScopeSubjectId;
  }) => Promise<void>;
  onCreatePost: (post: ShareDraftPayload) => Promise<void>;
  onToggleUpvote: (post: StudyPost) => Promise<void>;
  onSaveSharedFlashcard: (post: StudyPost) => Promise<void>;
  onShareMyProgress: () => void;
  onOpenSyncModal: () => void;
}

export const StudyGroupsView: React.FC<StudyGroupsViewProps> = ({
  subjects,
  isSignedIn,
  isOnline,
  currentUserId,
  groups,
  activeGroupCode,
  activeMembers,
  activePosts,
  shareDraft,
  onClearShareDraft,
  onSelectGroup,
  onJoinGroup,
  onCreateGroup,
  onCreatePost,
  onToggleUpvote,
  onSaveSharedFlashcard,
  onShareMyProgress,
  onOpenSyncModal,
}) => {
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupCode, setGroupCode] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groupFocus, setGroupFocus] = useState<ScopeSubjectId>('all');
  const [groupDesc, setGroupDesc] = useState('');
  const [groupError, setGroupError] = useState<string | null>(null);
  const [creatingGroup, setCreatingGroup] = useState(false);

  const [postKind, setPostKind] = useState<PostKind>('note');
  const [postSubject, setPostSubject] = useState<ScopeSubjectId>('unit-3');
  const [postTitle, setPostTitle] = useState('');
  const [postBody, setPostBody] = useState('');
  const [cardFront, setCardFront] = useState('');
  const [cardBack, setCardBack] = useState('');
  const [postError, setPostError] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  const [copiedInvite, setCopiedInvite] = useState(false);
  const [savedPostIds, setSavedPostIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!shareDraft) return;
    setPostKind(shareDraft.kind);
    setPostSubject(shareDraft.subjectId);
    setPostTitle(shareDraft.title);
    setPostBody(shareDraft.body);
    setCardFront(shareDraft.flashcardFront ?? '');
    setCardBack(shareDraft.flashcardBack ?? '');
    onClearShareDraft();
  }, [shareDraft, onClearShareDraft]);

  const activeGroup = groups.find((g) => g.code === activeGroupCode) ?? groups[0] ?? null;

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = normalizeGroupCode(joinCode);
    if (clean.length < 4) {
      setJoinError('Enter a 4–24 character invite code (e.g. DECO2026).');
      return;
    }
    setJoinError(null);
    setJoining(true);
    try {
      await onJoinGroup(clean);
      setJoinCode('');
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'Unable to join study group.');
    } finally {
      setJoining(false);
    }
  };

  const handleCreateGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = normalizeGroupCode(groupCode);
    const err = validateStudyGroupInput({
      code: clean,
      name: groupName,
      description: groupDesc,
      subjectFocus: groupFocus,
    });
    if (err) {
      setGroupError(err);
      return;
    }
    setGroupError(null);
    setCreatingGroup(true);
    try {
      await onCreateGroup({
        code: clean,
        name: groupName.trim(),
        description: groupDesc.trim(),
        subjectFocus: groupFocus,
      });
      setGroupCode('');
      setGroupName('');
      setGroupDesc('');
      setShowCreateGroup(false);
    } catch (createErr) {
      setGroupError(createErr instanceof Error ? createErr.message : 'Could not create group.');
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleCreatePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateStudyPostInput({
      kind: postKind,
      subjectId: postSubject,
      title: postTitle,
      body: postBody,
      flashcardFront: cardFront,
      flashcardBack: cardBack,
    });
    if (err) {
      setPostError(err);
      return;
    }
    setPostError(null);
    setPosting(true);
    try {
      await onCreatePost({
        kind: postKind,
        subjectId: postSubject,
        title: postTitle.trim(),
        body: postBody.trim(),
        flashcardFront: postKind === 'flashcard' ? cardFront.trim() : '',
        flashcardBack: postKind === 'flashcard' ? cardBack.trim() : '',
      });
      setPostTitle('');
      setPostBody('');
      setCardFront('');
      setCardBack('');
    } catch (postErr) {
      setPostError(postErr instanceof Error ? postErr.message : 'Unable to share post.');
    } finally {
      setPosting(false);
    }
  };

  const handleCopyInvite = async () => {
    if (!activeGroup) return;
    const url = `${window.location.origin}/?group=${activeGroup.code}`;
    try {
      await navigator.clipboard.writeText(
        `Join my DECO (U24EC304) study group "${activeGroup.name}" with code ${activeGroup.code}: ${url}`
      );
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 2500);
    } catch {
      setCopiedInvite(false);
    }
  };

  const subjectCodeLabel = (id: ScopeSubjectId) => {
    if (id === 'all') return 'All Units';
    return subjects.find((s) => s.id === id)?.code ?? id;
  };

  return (
    <div className="space-y-6">
      {/* Sync Mode Callout (when guest or offline) */}
      {(!isSignedIn || !isOnline) && (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300">
            {!isOnline
              ? 'You are studying offline. Shared posts in this group are cached locally on this device.'
              : 'Previewing local cohort workspace. Sign in with Google to collaborate in real time across devices.'}
          </div>
          {!isSignedIn && isOnline && (
            <button
              type="button"
              onClick={onOpenSyncModal}
              className="rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] px-3.5 py-2 text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
            >
              Sign in for Live Sync
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sidebar: Groups, Join/Create, Leaderboard */}
        <aside className="lg:col-span-4 space-y-5">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Your Study Groups
              </h2>
              <button
                type="button"
                onClick={() => setShowCreateGroup((prev) => !prev)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent-text)] hover:underline whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                {showCreateGroup ? 'Close' : 'New Group'}
              </button>
            </div>

            <div className="space-y-1.5">
              {groups.map((grp) => {
                const isSelected = activeGroup?.code === grp.code;
                return (
                  <button
                    key={grp.code}
                    type="button"
                    onClick={() => onSelectGroup(grp.code)}
                    className={`w-full text-left rounded-lg border p-3 transition-colors ${
                      isSelected
                        ? 'border-[var(--accent-ring)] bg-[var(--accent-soft)]'
                        : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                      <span className="font-mono font-semibold text-[var(--accent-text)]">
                        {grp.code}
                      </span>
                      <span className="tabular-nums">
                        {isSelected ? activeMembers.length : grp.memberIds.length} members
                      </span>
                    </div>
                    <div className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {grp.name}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Join by Invite Code */}
            <form onSubmit={(e) => void handleJoinSubmit(e)} className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
              <label
                htmlFor="join-group-code"
                className="block text-xs font-medium text-zinc-700 dark:text-zinc-300"
              >
                Join Group by Invite Code
              </label>
              <div className="flex gap-2">
                <input
                  id="join-group-code"
                  type="text"
                  maxLength={BLUEPRINT_LIMITS.groupCodeMaxLength}
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="e.g. DECO2026"
                  className="flex-1 min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs font-mono uppercase placeholder:normal-case text-zinc-900 dark:text-zinc-100"
                />
                <button
                  type="submit"
                  disabled={joining}
                  className="inline-flex items-center gap-1 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-90 px-3 py-2 text-xs font-semibold transition-opacity whitespace-nowrap shrink-0"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Join
                </button>
              </div>
              {joinError && (
                <p role="alert" className="text-xs text-red-600 dark:text-red-400">
                  {joinError}
                </p>
              )}
            </form>

            {/* Create Study Group Form */}
            {showCreateGroup && (
              <form
                onSubmit={(e) => void handleCreateGroupSubmit(e)}
                className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-3"
              >
                <div className="space-y-1">
                  <label htmlFor="create-group-code" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Invite Code
                  </label>
                  <input
                    id="create-group-code"
                    type="text"
                    maxLength={BLUEPRINT_LIMITS.groupCodeMaxLength}
                    value={groupCode}
                    onChange={(e) => setGroupCode(e.target.value)}
                    placeholder="e.g. AIML3B"
                    className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs font-mono uppercase placeholder:normal-case text-zinc-900 dark:text-zinc-100"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="create-group-name" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Group Name
                  </label>
                  <input
                    id="create-group-name"
                    type="text"
                    maxLength={BLUEPRINT_LIMITS.groupNameMaxLength}
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="e.g. AIML Sec-B CIE-2 Prep"
                    className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="create-group-focus" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Subject Focus
                  </label>
                  <select
                    id="create-group-focus"
                    value={groupFocus}
                    onChange={(e) => setGroupFocus(e.target.value as ScopeSubjectId)}
                    className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="all">All Units (I–V)</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code} — {s.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label htmlFor="create-group-desc" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Description
                  </label>
                  <textarea
                    id="create-group-desc"
                    rows={2}
                    maxLength={BLUEPRINT_LIMITS.groupDescriptionMaxLength}
                    value={groupDesc}
                    onChange={(e) => setGroupDesc(e.target.value)}
                    placeholder="Goals, exam dates, or study focus..."
                    className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100"
                  />
                </div>
                {groupError && (
                  <p role="alert" className="text-xs text-red-600 dark:text-red-400">
                    {groupError}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={creatingGroup}
                  className="w-full rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-60 py-2 text-xs font-semibold text-white transition-colors"
                >
                  {creatingGroup ? 'Creating...' : 'Create Study Group'}
                </button>
              </form>
            )}
          </div>

          {/* Group Members Progress */}
          {activeGroup && (
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Users className="w-4 h-4 text-zinc-500" />
                  Cohort Progress
                </h3>
                <span className="text-xs font-mono tabular-nums text-zinc-500 dark:text-zinc-400">
                  {activeMembers.length} active
                </span>
              </div>

              <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {activeMembers
                  .slice()
                  .sort((a, b) => b.completedLessonsCount - a.completedLessonsCount)
                  .map((member) => (
                    <div key={member.uid} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                          {member.displayName}
                        </div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          {member.role === 'owner' ? 'Group lead' : 'Member'}
                        </div>
                      </div>
                      <div className="text-right font-mono tabular-nums text-xs text-zinc-600 dark:text-zinc-300 shrink-0">
                        {member.completedLessonsCount}L · {member.masteredCardsCount}C
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </aside>

        {/* Right Column: Group Feed & Composer */}
        {activeGroup && (
          <div className="lg:col-span-8 space-y-6">
            {/* Group Header */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  Code: <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">{activeGroup.code}</span> ·{' '}
                  Focus: {subjectCodeLabel(activeGroup.subjectFocus)} · Led by {activeGroup.ownerName}
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {activeGroup.name}
                </h1>
                {activeGroup.description && (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {activeGroup.description}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={onShareMyProgress}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 px-3.5 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 transition-colors whitespace-nowrap"
                >
                  Share My Progress
                </button>
                <button
                  type="button"
                  onClick={() => void handleCopyInvite()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] px-3.5 py-2 text-xs font-semibold text-white transition-colors whitespace-nowrap"
                >
                  {copiedInvite ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedInvite ? 'Invite Copied' : 'Copy Invite Link'}
                </button>
              </div>
            </div>

            {/* Post Composer */}
            <form
              onSubmit={(e) => void handleCreatePostSubmit(e)}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div
                  role="group"
                  aria-label="Share post type"
                  className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-1"
                >
                  {(
                    [
                      { id: 'note', label: 'Study Note' },
                      { id: 'flashcard', label: 'Flashcard' },
                      { id: 'milestone', label: 'Milestone' },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setPostKind(item.id)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                        postKind === item.id
                          ? 'bg-[var(--accent)] text-white'
                          : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-800'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <div>
                  <label htmlFor="post-subject" className="sr-only">
                    Post subject unit
                  </label>
                  <select
                    id="post-subject"
                    value={postSubject}
                    onChange={(e) => setPostSubject(e.target.value as ScopeSubjectId)}
                    className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="all">All Units</option>
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.code}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label htmlFor="post-title" className="sr-only">
                    Share title
                  </label>
                  <input
                    id="post-title"
                    type="text"
                    maxLength={BLUEPRINT_LIMITS.postTitleMaxLength}
                    value={postTitle}
                    onChange={(e) => setPostTitle(e.target.value)}
                    placeholder="Title (e.g. Quick tip for 4-variable K-Map wrap-around)"
                    className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label htmlFor="post-body" className="sr-only">
                    Share details
                  </label>
                  <textarea
                    id="post-body"
                    rows={2}
                    maxLength={BLUEPRINT_LIMITS.postBodyMaxLength}
                    value={postBody}
                    onChange={(e) => setPostBody(e.target.value)}
                    placeholder="Share a summary, mnemonic, formula breakdown, or study update..."
                    className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                {postKind === 'flashcard' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label htmlFor="post-card-front" className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                        Flashcard Front
                      </label>
                      <input
                        id="post-card-front"
                        type="text"
                        maxLength={BLUEPRINT_LIMITS.flashcardFrontMaxLength}
                        value={cardFront}
                        onChange={(e) => setCardFront(e.target.value)}
                        placeholder="Question prompt..."
                        className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100"
                      />
                    </div>
                    <div>
                      <label htmlFor="post-card-back" className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                        Flashcard Back
                      </label>
                      <input
                        id="post-card-back"
                        type="text"
                        maxLength={BLUEPRINT_LIMITS.flashcardBackMaxLength}
                        value={cardBack}
                        onChange={(e) => setCardBack(e.target.value)}
                        placeholder="Concise answer..."
                        className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100"
                      />
                    </div>
                  </div>
                )}
              </div>

              {postError && (
                <p role="alert" className="text-xs font-medium text-red-600 dark:text-red-400">
                  {postError}
                </p>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={posting}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-60 px-4 py-2 text-xs font-semibold text-white transition-colors whitespace-nowrap"
                >
                  <Send className="w-3.5 h-3.5" />
                  {posting ? 'Sharing...' : 'Share to Group'}
                </button>
              </div>
            </form>

            {/* Shared Group Feed */}
            <div className="space-y-3" aria-label="Study group feed">
              {activePosts.length === 0 ? (
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
                  No shared notes yet in {activeGroup.name}. Post the first study summary or flashcard above!
                </div>
              ) : (
                activePosts.map((post) => {
                  const upvoted = post.upvoterIds.includes(currentUserId);
                  const saved = Boolean(savedPostIds[post.id]);
                  return (
                    <article
                      key={post.id}
                      className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="text-xs text-zinc-500 dark:text-zinc-400">
                            <span>{post.authorName}</span>
                            <span aria-hidden="true"> · </span>
                            <span>{subjectCodeLabel(post.subjectId)}</span>
                            <span aria-hidden="true"> · </span>
                            <span className="capitalize">{post.kind}</span>
                          </div>
                          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                            {post.title}
                          </h3>
                        </div>

                        <button
                          type="button"
                          aria-label={`Upvote '${post.title}' (${post.upvoterIds.length})`}
                          onClick={() => void onToggleUpvote(post)}
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium tabular-nums transition-colors shrink-0 ${
                            upvoted
                              ? 'border-[var(--accent-ring)] bg-[var(--accent-soft)] text-[var(--accent-text)]'
                              : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                          }`}
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span>{post.upvoterIds.length}</span>
                        </button>
                      </div>

                      <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
                        {post.body}
                      </p>

                      {post.kind === 'flashcard' && post.flashcardFront && post.flashcardBack && (
                        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4 space-y-2">
                          <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                            Q: {post.flashcardFront}
                          </div>
                          <div className="text-xs text-zinc-700 dark:text-zinc-300">
                            A: {post.flashcardBack}
                          </div>
                          <div className="pt-1">
                            <button
                              type="button"
                              disabled={saved}
                              onClick={() => {
                                void onSaveSharedFlashcard(post);
                                setSavedPostIds((prev) => ({ ...prev, [post.id]: true }));
                              }}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--accent-text)] hover:underline disabled:text-emerald-600 dark:disabled:text-emerald-400 disabled:no-underline"
                            >
                              {saved ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  Saved to My Flashcards
                                </>
                              ) : (
                                <>
                                  <BookmarkPlus className="w-3.5 h-3.5" />
                                  Save to My Flashcards
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

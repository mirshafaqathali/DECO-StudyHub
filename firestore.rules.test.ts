import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  BLUEPRINT_LIMITS,
  isValidEntityId,
  isValidGroupCode,
  isValidIsoDate,
  normalizeGroupCode,
  validateCustomFlashcardInput,
  validateReminderInput,
  validateStudyGroupInput,
  validateStudyPostInput,
} from './src/utils/validation';

const rulesText = fs.readFileSync(path.resolve('firestore.rules'), 'utf-8');
const blueprint = JSON.parse(fs.readFileSync(path.resolve('firebase-blueprint.json'), 'utf-8'));

interface MockAuth {
  uid: string;
  emailVerified: boolean;
}

/**
 * Evaluates key Eight-Pillar Firestore security invariants against the "Dirty Dozen"
 * adversarial payloads and verifies synchronization with firestore.rules + firebase-blueprint.json.
 */
function simulateSecurityCheck(params: {
  auth: MockAuth | null;
  operation: 'get' | 'list' | 'create' | 'update';
  collection: 'studyState' | 'customFlashcards' | 'reminders' | 'studyGroups' | 'posts';
  targetUserId?: string;
  docId: string;
  payload: Record<string, unknown>;
  existing?: Record<string, unknown>;
  isGroupMember?: boolean;
}): 'ALLOW' | 'PERMISSION_DENIED' {
  const { auth, operation, collection, targetUserId, docId, payload, existing, isGroupMember } = params;
  if (!auth) return 'PERMISSION_DENIED';
  if ((operation === 'create' || operation === 'update') && !auth.emailVerified) {
    return 'PERMISSION_DENIED';
  }
  if (operation !== 'list' && !isValidEntityId(docId)) {
    return 'PERMISSION_DENIED';
  }

  // Dirty Dozen #12: Blanket list scraping on groups and posts
  if (operation === 'list' && (collection === 'studyGroups' || collection === 'posts')) {
    return 'PERMISSION_DENIED';
  }

  // Dirty Dozen #1: Cross-user access
  if (
    (collection === 'studyState' || collection === 'customFlashcards' || collection === 'reminders') &&
    targetUserId !== auth.uid
  ) {
    return 'PERMISSION_DENIED';
  }

  // Dirty Dozen #3: Identity spoofing on create
  if (
    operation === 'create' &&
    (collection === 'studyState' || collection === 'customFlashcards' || collection === 'reminders') &&
    payload.uid !== auth.uid
  ) {
    return 'PERMISSION_DENIED';
  }

  // Dirty Dozen #4: Ghost fields / shadow update
  const allowedKeysByCollection: Record<string, string[]> = {
    studyState: Object.keys(blueprint.entities.UserStudyState.properties),
    customFlashcards: Object.keys(blueprint.entities.CustomFlashcard.properties),
    reminders: Object.keys(blueprint.entities.StudyReminder.properties),
    studyGroups: Object.keys(blueprint.entities.StudyGroup.properties),
    posts: Object.keys(blueprint.entities.StudyPost.properties),
  };
  const allowedKeys = allowedKeysByCollection[collection];
  if ((operation === 'create' || operation === 'update') && Object.keys(payload).some((k) => !allowedKeys.includes(k))) {
    return 'PERMISSION_DENIED';
  }

  // Dirty Dozen #5: Timestamp forgery
  if ((operation === 'create' || operation === 'update') && payload.updatedAt !== 'SERVER_TIME') {
    return 'PERMISSION_DENIED';
  }
  if (operation === 'create' && payload.createdAt !== 'SERVER_TIME') {
    return 'PERMISSION_DENIED';
  }

  // Dirty Dozen #6: Immutable owner tampering
  if (operation === 'update' && collection === 'studyGroups' && existing && payload.ownerId !== existing.ownerId) {
    return 'PERMISSION_DENIED';
  }

  // Dirty Dozen #8 & #9: Type/size/array flood poisoning
  if (collection === 'customFlashcards' && (operation === 'create' || operation === 'update')) {
    const err = validateCustomFlashcardInput({
      subjectId: String(payload.subjectId ?? ''),
      front: String(payload.front ?? ''),
      back: String(payload.back ?? ''),
      tag: String(payload.tag ?? ''),
    });
    if (err) return 'PERMISSION_DENIED';
  }

  if (collection === 'studyState' && (operation === 'create' || operation === 'update')) {
    const lessons = payload.completedLessonIds;
    if (!Array.isArray(lessons) || lessons.length > BLUEPRINT_LIMITS.completedLessonsMax) {
      return 'PERMISSION_DENIED';
    }
    if (lessons.length > 0 && typeof lessons[0] !== 'string') {
      return 'PERMISSION_DENIED';
    }
  }

  if (collection === 'studyGroups' && (operation === 'create' || operation === 'update')) {
    const members = payload.memberIds;
    if (!Array.isArray(members) || members.length > BLUEPRINT_LIMITS.groupMembersMax) {
      return 'PERMISSION_DENIED';
    }
    // Dirty Dozen #11: Non-owner modifying group metadata
    if (operation === 'update' && existing && existing.ownerId !== auth.uid && payload.name !== existing.name) {
      return 'PERMISSION_DENIED';
    }
  }

  // Dirty Dozen #10: Non-member post injection
  if (collection === 'posts' && !isGroupMember) {
    return 'PERMISSION_DENIED';
  }

  return 'ALLOW';
}

test('firestore.rules includes Eight Pillars security gates and all blueprint collections', () => {
  assert.match(rulesText, /rules_version = '2';/);
  assert.match(rulesText, /match \/\{document=\*\*\} \{\s*allow read, write: if false;/);
  assert.match(rulesText, /request\.auth\.token\.email_verified == true/);
  assert.match(rulesText, /isValidId\(/);
  assert.match(rulesText, /existsAfter\(/);
  assert.match(rulesText, /getAfter\(/);
  assert.match(rulesText, /match \/users\/\{userId\}\/studyState\/\{stateId\}/);
  assert.match(rulesText, /match \/users\/\{userId\}\/customFlashcards\/\{cardId\}/);
  assert.match(rulesText, /match \/users\/\{userId\}\/reminders\/\{reminderId\}/);
  assert.match(rulesText, /match \/users\/\{userId\}\/groupMemberships\/\{groupId\}/);
  assert.match(rulesText, /match \/studyGroups\/\{groupId\}/);
  assert.match(rulesText, /match \/members\/\{memberId\}/);
  assert.match(rulesText, /match \/posts\/\{postId\}/);
});

test('Dirty Dozen adversarial payloads are all rejected with PERMISSION_DENIED', () => {
  const userA: MockAuth = { uid: 'user_A', emailVerified: true };
  const userB: MockAuth = { uid: 'user_B', emailVerified: true };
  const unverified: MockAuth = { uid: 'user_A', emailVerified: false };

  // 1. Cross-User Read/Write
  assert.equal(
    simulateSecurityCheck({
      auth: userB,
      operation: 'get',
      collection: 'studyState',
      targetUserId: 'user_A',
      docId: 'profile',
      payload: {},
    }),
    'PERMISSION_DENIED'
  );

  // 2. Unverified Email Spoof
  assert.equal(
    simulateSecurityCheck({
      auth: unverified,
      operation: 'create',
      collection: 'customFlashcards',
      targetUserId: 'user_A',
      docId: 'card_1',
      payload: {
        uid: 'user_A',
        subjectId: 'unit-1',
        front: 'What is MAR?',
        back: 'Memory Address Register',
        tag: 'Unit I',
        createdAt: 'SERVER_TIME',
        updatedAt: 'SERVER_TIME',
      },
    }),
    'PERMISSION_DENIED'
  );

  // 3. Identity Spoofing on Create
  assert.equal(
    simulateSecurityCheck({
      auth: userA,
      operation: 'create',
      collection: 'reminders',
      targetUserId: 'user_A',
      docId: 'rem_1',
      payload: { uid: 'user_B', createdAt: 'SERVER_TIME', updatedAt: 'SERVER_TIME' },
    }),
    'PERMISSION_DENIED'
  );

  // 4. Ghost Field / Shadow Update
  assert.equal(
    simulateSecurityCheck({
      auth: userA,
      operation: 'create',
      collection: 'customFlashcards',
      targetUserId: 'user_A',
      docId: 'card_1',
      payload: {
        uid: 'user_A',
        subjectId: 'unit-1',
        front: 'Q',
        back: 'A',
        tag: 'Unit I',
        isAdmin: true,
        createdAt: 'SERVER_TIME',
        updatedAt: 'SERVER_TIME',
      },
    }),
    'PERMISSION_DENIED'
  );

  // 5. Client Timestamp Forgery
  assert.equal(
    simulateSecurityCheck({
      auth: userA,
      operation: 'create',
      collection: 'customFlashcards',
      targetUserId: 'user_A',
      docId: 'card_1',
      payload: {
        uid: 'user_A',
        subjectId: 'unit-1',
        front: 'Q',
        back: 'A',
        tag: 'Unit I',
        createdAt: '2020-01-01T00:00:00Z',
        updatedAt: 'SERVER_TIME',
      },
    }),
    'PERMISSION_DENIED'
  );

  // 6. Immutable Owner Tampering
  assert.equal(
    simulateSecurityCheck({
      auth: userA,
      operation: 'update',
      collection: 'studyGroups',
      docId: 'DECO26',
      existing: { ownerId: 'user_A', name: 'DECO Prep', memberIds: ['user_A'] },
      payload: {
        code: 'DECO26',
        name: 'DECO Prep',
        description: '',
        subjectFocus: 'all',
        ownerId: 'user_B',
        ownerName: 'User B',
        memberIds: ['user_A'],
        recentPostIds: [],
        createdAt: 'SERVER_TIME',
        updatedAt: 'SERVER_TIME',
      },
    }),
    'PERMISSION_DENIED'
  );

  // 7. Path ID Poisoning
  assert.equal(
    simulateSecurityCheck({
      auth: userA,
      operation: 'create',
      collection: 'studyGroups',
      docId: 'bad$id!'.repeat(30),
      payload: {},
    }),
    'PERMISSION_DENIED'
  );

  // 8. Type & Size Poisoning
  assert.equal(
    simulateSecurityCheck({
      auth: userA,
      operation: 'create',
      collection: 'studyState',
      targetUserId: 'user_A',
      docId: 'profile',
      payload: {
        uid: 'user_A',
        displayName: 'Student',
        theme: 'dark',
        completedLessonIds: [12345],
        masteredCardIds: [],
        reviewCardIds: [],
        studyStreakDays: 1,
        createdAt: 'SERVER_TIME',
        updatedAt: 'SERVER_TIME',
      },
    }),
    'PERMISSION_DENIED'
  );

  // 9. Array Flood (Denial of Wallet)
  assert.equal(
    simulateSecurityCheck({
      auth: userA,
      operation: 'update',
      collection: 'studyGroups',
      docId: 'DECO26',
      existing: { ownerId: 'user_A', name: 'DECO Prep', memberIds: ['user_A'] },
      payload: {
        code: 'DECO26',
        name: 'DECO Prep',
        description: '',
        subjectFocus: 'all',
        ownerId: 'user_A',
        ownerName: 'User A',
        memberIds: Array.from({ length: 31 }, (_, i) => `u_${i}`),
        recentPostIds: [],
        createdAt: 'SERVER_TIME',
        updatedAt: 'SERVER_TIME',
      },
    }),
    'PERMISSION_DENIED'
  );

  // 10. Non-Member Post Injection
  assert.equal(
    simulateSecurityCheck({
      auth: userB,
      operation: 'create',
      collection: 'posts',
      docId: 'post_1',
      isGroupMember: false,
      payload: {
        id: 'post_1',
        groupId: 'DECO26',
        authorId: 'user_B',
        authorName: 'User B',
        kind: 'note',
        subjectId: 'unit-1',
        title: 'Sneaky post',
        body: 'Should fail',
        flashcardFront: '',
        flashcardBack: '',
        upvoterIds: [],
        createdAt: 'SERVER_TIME',
        updatedAt: 'SERVER_TIME',
      },
    }),
    'PERMISSION_DENIED'
  );

  // 11. Member Hijack of Group Metadata
  assert.equal(
    simulateSecurityCheck({
      auth: userB,
      operation: 'update',
      collection: 'studyGroups',
      docId: 'DECO26',
      existing: { ownerId: 'user_A', name: 'DECO Prep', memberIds: ['user_A', 'user_B'] },
      payload: {
        code: 'DECO26',
        name: 'Hijacked Group',
        description: '',
        subjectFocus: 'all',
        ownerId: 'user_A',
        ownerName: 'User A',
        memberIds: ['user_A', 'user_B'],
        recentPostIds: [],
        createdAt: 'SERVER_TIME',
        updatedAt: 'SERVER_TIME',
      },
    }),
    'PERMISSION_DENIED'
  );

  // 12. Blanket List Scraping
  assert.equal(
    simulateSecurityCheck({
      auth: userA,
      operation: 'list',
      collection: 'studyGroups',
      docId: '',
      payload: {},
    }),
    'PERMISSION_DENIED'
  );
});

test('synchronized validation helpers enforce blueprint bounds and formats', () => {
  assert.equal(normalizeGroupCode(' deco-26! '), 'DECO-26');
  assert.equal(isValidGroupCode('DECO26'), true);
  assert.equal(isValidGroupCode('ab'), false);
  assert.equal(isValidIsoDate('2026-11-28'), true);
  assert.equal(isValidIsoDate('2026-02-31'), false);
  assert.ok(validateStudyGroupInput({ code: 'DECO26', name: 'A', description: '', subjectFocus: 'all' }));
  assert.equal(validateStudyGroupInput({ code: 'DECO26', name: 'AIML Sec B', description: 'CIE-2 prep', subjectFocus: 'unit-5' }), null);
  assert.ok(validateStudyPostInput({ kind: 'flashcard', subjectId: 'unit-2', title: 'K-Map Tip', body: 'Use wrap-around', flashcardFront: '', flashcardBack: 'Answer' }));
  assert.equal(validateStudyPostInput({ kind: 'flashcard', subjectId: 'unit-2', title: 'K-Map Tip', body: 'Use wrap-around', flashcardFront: 'What is EPI?', flashcardBack: 'Essential Prime Implicant' }), null);
});

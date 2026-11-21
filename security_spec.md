# Firestore Security Specification & Red-Team Threat Model

## 1. Data Invariants & Master Source of Truth

1. **Private Study State (`/users/{userId}/...`)**: Only the authenticated, email-verified user whose `request.auth.uid == userId` may read, list, create, update, or delete their own `studyState`, `customFlashcards`, `reminders`, and `groupMemberships`. No PII (`email`, `phone`, `address`) is stored in Firestore documents.
2. **Study Group Master Gate (`/studyGroups/{groupId}/members/{memberId}`)**: A user can only read or write `studyGroups/{groupId}/posts/{postId}` or read other members in `studyGroups/{groupId}/members/{memberId}` if `/studyGroups/{groupId}/members/{request.auth.uid}` exists (`isGroupMember(groupId)`).
3. **Group Creation Atomicity**: Creating `/studyGroups/{groupId}` requires `existsAfter(/databases/$(database)/documents/studyGroups/$(groupId)/members/$(request.auth.uid))` in the same atomic batch, and `memberIds == [request.auth.uid]`.
4. **No Open List Scraping**: `studyGroups`, `studyGroups/{groupId}/members`, and `studyGroups/{groupId}/posts` set `allow list: if false;` (clients fetch groups via `groupMemberships` and fetch group posts/members by bounded `recentPostIds`/`memberIds` via `get`). `allow list` on user subcollections strictly requires `isOwner(userId) && resource.data.uid == request.auth.uid`.
5. **Immutable Ownership & Temporal Integrity**: `uid`, `ownerId`, `authorId`, `groupId`, and `createdAt` are immutable once created. All `createdAt` and `updatedAt` timestamps must match `request.time`.

## 2. "Dirty Dozen" Adversarial Payloads (Must All Be Denied)

1. **Cross-User Read/Write**: User B attempts `get` or `set` on `/users/userA/studyState/profile`.
2. **Unverified Email Spoof**: Authenticated user with `email_verified: false` attempts to create a `CustomFlashcard` or `StudyGroup`.
3. **Identity Spoofing on Create**: User A attempts to create `/users/userA/reminders/r1` with `uid: "userB"`.
4. **Ghost Field / Shadow Update**: User A sends `{ ...validReminder, isAdmin: true }` on create or update.
5. **Client Timestamp Forgery**: User A sends `createdAt: Timestamp(2020-01-01)` instead of server `request.time`.
6. **Immutable Owner Tampering**: User A updates `/studyGroups/DECO26` attempting to change `ownerId` or `createdAt`.
7. **Path ID Poisoning**: User attempts to write to `/studyGroups/` with a 500-character or `$bad!id` document ID.
8. **Type & Size Poisoning**: User sends a 2,000-character `front` string on `CustomFlashcard` (limit 500) or non-string `completedLessonIds[0]`.
9. **Array Flood (Denial of Wallet)**: User sends 31 `memberIds` to `StudyGroup` (limit 30) or 101 `completedLessonIds` (limit 100).
10. **Non-Member Post Injection**: User C (not in `/studyGroups/DECO26/members/userC`) attempts to create a `StudyPost` inside `DECO26`.
11. **Member Hijack of Group Metadata**: Non-owner member attempts to update `name` or `description` of `StudyGroup` (allowed only for owner).
12. **Blanket List Scraping**: Any user attempts `list` on `/studyGroups` or `/studyGroups/DECO26/posts`.

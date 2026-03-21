# Active Sessions Collection Specification

## Collection: `active_sessions`

This collection tracks which variant each student is currently working on. It matches the Supabase `active_sessions` table structure exactly, making migration straightforward.

## Purpose

- Track active quiz sessions for students
- Enable Teacher Dashboard to show which students are currently working on which variants
- Display progress (question numbers) in real-time
- Support timeout detection for abandoned sessions

## Document ID

- **Format**: `user_id` (Firebase Auth UID)
- **Uniqueness**: One active session per user (document ID ensures uniqueness)
- **Example**: `"xXHDi7nT01QsKzX7uf1glePizEH2"`

## Document Fields

Matches Supabase `active_sessions` table structure exactly:

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `user_id` | string | Yes | Firebase Auth UID (unique identifier, also used as document ID) |
| `operation` | string | Yes | Current operation student is working on: "addition", "subtraction", "multiplication", or "division" |
| `variant` | string | Yes | Current variant student is working on (e.g., "1A0", "2B", "3C9", "4A1") |
| `last_question_no_completed` | number | Yes | Last question number the student completed (e.g., 5 means student completed questions 1-5) |
| `last_question_correct_wrong` | boolean | No | Whether the last question was answered correctly (true) or incorrectly (false) |
| `total_questions` | number | Yes | Total number of questions in this quiz variant |
| `last_activity` | Timestamp | Yes | When the session was last updated (for timeout detection) |

## Example Document

```json
{
  "user_id": "xXHDi7nT01QsKzX7uf1glePizEH2",
  "operation": "addition",
  "variant": "1A0",
  "last_question_no_completed": 5,
  "last_question_correct_wrong": true,
  "total_questions": 10,
  "last_activity": {
    "_seconds": 1734567890,
    "_nanoseconds": 0
  }
}
```

## Lifecycle

### 1. When Student Starts a Quiz

**Action**: Create or update document in `active_sessions`

**Fields Set**:
- `user_id`: Student's Firebase Auth UID
- `operation`: Quiz operation (e.g., "addition")
- `variant`: Quiz variant (e.g., "1A0")
- `last_question_no_completed`: `0` (no questions completed yet)
- `total_questions`: Total questions in this variant (e.g., 10)
- `last_activity`: Current server timestamp

**Code Example**:
```javascript
await setDoc(doc(db, 'active_sessions', userId), {
  user_id: userId,
  operation: 'addition',
  variant: '1A0',
  last_question_no_completed: 0,
  total_questions: 10,
  last_activity: serverTimestamp()
});
```

### 2. When Student Answers Each Question

**Action**: Update document in `active_sessions`

**Fields Updated**:
- `last_question_no_completed`: Increment by 1 (e.g., 0 → 1 → 2 → ...)
- `last_question_correct_wrong`: `true` if correct, `false` if wrong
- `last_activity`: Update to current server timestamp

**Code Example**:
```javascript
await updateDoc(doc(db, 'active_sessions', userId), {
  last_question_no_completed: 5,
  last_question_correct_wrong: true,
  last_activity: serverTimestamp()
});
```

### 3. When Student Completes Quiz

**Action**: Delete document from `active_sessions`

**Code Example**:
```javascript
await deleteDoc(doc(db, 'active_sessions', userId));
```

### 4. When Student Abandons Quiz

**Action**: Delete document from `active_sessions` (same as completion)

**Note**: Timeout detection can be handled by checking `last_activity` timestamp. If `last_activity` is older than a threshold (e.g., 30 minutes), consider the session abandoned and delete it.

## Teacher Dashboard Integration

### Polling Mechanism

The Teacher Dashboard polls the `active_sessions` collection every 5-10 seconds to detect active sessions.

**Polling Frequency**: 5-10 seconds (acceptable delay for this use case)

**Query Pattern**:
```javascript
// Get all active sessions for students in selected school/class/section
const studentUserIds = students.map(s => s.user_id); // From user_profiles

// Firestore 'in' query has limit of 10, so batch if needed
const batchSize = 10;
for (let i = 0; i < studentUserIds.length; i += batchSize) {
  const batch = studentUserIds.slice(i, i + batchSize);
  const activeSessionsSnapshot = await getDocs(
    query(collection(db, 'active_sessions'), where('user_id', 'in', batch))
  );
  
  activeSessionsSnapshot.forEach((doc) => {
    const session = doc.data();
    // Update UI for this student's active variant
    updateVariantCell(session.user_id, session.operation, session.variant, {
      questionNo: session.last_question_no_completed,
      totalQuestions: session.total_questions,
      isCorrect: session.last_question_correct_wrong
    });
  });
}
```

### Display in Teacher Dashboard

**Variant Cell Display**:
- **Active Session**: Show different background color (e.g., light blue or yellow)
- **Question Progress**: Optionally display `last_question_no_completed` / `total_questions` (e.g., "5/10")
- **Last Answer Status**: Optionally show green/red indicator based on `last_question_correct_wrong`

**Example Cell States**:
- **Not Started**: Empty cell (no active session)
- **In Progress**: Colored cell showing "5/10" (5 questions completed out of 10)
- **Passed**: Shows average time (from `user_scores` collection)
- **Failed**: Shows attempt count (from `user_scores` collection)

## Comparison with Supabase

| Supabase Field | Firestore Field | Notes |
|----------------|-----------------|-------|
| `user_id` (UUID, Primary Key) | `user_id` (string, Document ID) | Same - Firebase Auth UID |
| `operation` (Text) | `operation` (string) | Same |
| `variant` (Text) | `variant` (string) | Same |
| `last_question_no_completed` (Integer) | `last_question_no_completed` (number) | Same |
| `last_question_correct_wrong` (Boolean) | `last_question_correct_wrong` (boolean) | Same |
| `total_questions` (Integer) | `total_questions` (number) | Same |
| `last_activity` (Timestamp) | `last_activity` (Timestamp) | Same |

**Structure matches Supabase exactly** - makes migration straightforward.

## Query Patterns

### Common Queries

1. **Get active session for a specific user**:
   ```javascript
   const docRef = doc(db, 'active_sessions', userId);
   const docSnap = await getDoc(docRef);
   if (docSnap.exists()) {
     const session = docSnap.data();
   }
   ```

2. **Get all active sessions for multiple users**:
   ```javascript
   // Note: Firestore 'in' query limit is 10
   const batchSize = 10;
   for (let i = 0; i < userIds.length; i += batchSize) {
     const batch = userIds.slice(i, i + batchSize);
     const snapshot = await getDocs(
       query(collection(db, 'active_sessions'), where('user_id', 'in', batch))
     );
   }
   ```

3. **Get active sessions by operation/variant**:
   ```javascript
   query(
     collection(db, 'active_sessions'),
     where('operation', '==', 'addition'),
     where('variant', '==', '1A0')
   )
   ```

4. **Find stale sessions (timeout detection)**:
   ```javascript
   const timeoutThreshold = Timestamp.now().toMillis() - (30 * 60 * 1000); // 30 minutes ago
   const thresholdTimestamp = Timestamp.fromMillis(timeoutThreshold);
   
   query(
     collection(db, 'active_sessions'),
     where('last_activity', '<', thresholdTimestamp)
   )
   ```

## Indexes

Recommended Firestore composite indexes:

1. `user_id` (automatic - document ID)
2. `operation` + `variant` (for querying by variant)
3. `last_activity` (for timeout detection)

## Notes

- **One Session Per User**: Document ID is `user_id`, ensuring only one active session per user at a time.

- **Polling Approach**: Teacher Dashboard uses polling (every 5-10 seconds) instead of listeners for simplicity. The delay is acceptable for this use case.

- **Timeout Detection**: Sessions can be cleaned up based on `last_activity` timestamp. If a session hasn't been updated in 30+ minutes, it can be considered abandoned and deleted.

- **Question Numbers**: All question tracking fields are included (no extra cost) and useful for displaying progress in Teacher Dashboard.

- **Matches Supabase**: Structure matches Supabase `active_sessions` table exactly, making migration straightforward.

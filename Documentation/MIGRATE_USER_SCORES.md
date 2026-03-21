# Migrating User Scores from Supabase to Firestore

This guide explains how to migrate `user_scores` data from Supabase to Firestore.

## Prerequisites

1. **Supabase Access**: You need access to your Supabase project
2. **Supabase Credentials**: 
   - Supabase URL (e.g., `https://xxxxx.supabase.co`)
   - Supabase Anon Key (from Supabase Dashboard → Settings → API)
3. **Firebase Admin SDK**: `firebase-service-account-key.json` must exist in the project root

## Step 1: Install Dependencies

```bash
npm install
```

This will install `@supabase/supabase-js` which is needed for the migration.

## Step 2: Configure Supabase Credentials

You have two options:

### Option A: Environment Variables (Recommended)

Set environment variables before running:

**Windows PowerShell:**
```powershell
$env:SUPABASE_URL="https://your-project.supabase.co"
$env:SUPABASE_ANON_KEY="your-anon-key"
```

**Windows CMD:**
```cmd
set SUPABASE_URL=https://your-project.supabase.co
set SUPABASE_ANON_KEY=your-anon-key
```

**Linux/Mac:**
```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key"
```

### Option B: Edit Script Directly

Edit `Utilities/migrate-user-scores-from-supabase.js` and update these lines:

```javascript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_KEY = 'your-anon-key';
```

## Step 3: Run Migration

```bash
npm run migrate-scores
```

Or directly:

```bash
node Utilities/migrate-user-scores-from-supabase.js
```

## What the Script Does

1. **Fetches all user_scores** from Supabase
2. **Transforms data** to match Firestore structure:
   - Converts `completed_at` timestamp to `YYYYMMDDHHMISEC` document ID format
   - Converts `date_of_birth` to `YYYY-MM-DD` string format (if needed)
   - Maps all fields to Firestore structure
3. **Handles collisions**: If a document ID already exists, appends `_1`, `_2`, etc.
4. **Fetches school names**: If not present, tries to get from `classes` or `schools` collections
5. **Uploads in batches**: Processes 100 scores at a time for efficiency
6. **Skips duplicates**: Won't overwrite existing documents

## Field Mapping

| Supabase Field | Firestore Field | Notes |
|----------------|-----------------|-------|
| `id` | Document ID | Generated from `completed_at` as `YYYYMMDDHHMISEC` |
| `user_id` | `user_id` | Firebase Auth UID |
| `user_code` | `user_code` | 6-digit code |
| `email` | `email` | User email |
| `operation` | `operation` | Same |
| `variant` | `variant` | Same |
| `correct_count` | `correct_count` | Same |
| `wrong_count` | `wrong_count` | Same |
| `total_questions` | `total_questions` | Same |
| `total_time` | `total_time` | Same |
| `average_time` | `average_time` | Same |
| `passed` | `passed` | Same |
| `completed_at` | Document ID | Used to generate `YYYYMMDDHHMISEC` ID |
| `date_of_birth` | `date_of_birth` | Converted to `YYYY-MM-DD` string |
| All other fields | Same | Preserved as-is |

## Document ID Format

The script generates Firestore document IDs from the `completed_at` timestamp:

- **Format**: `YYYYMMDDHHMISEC` (e.g., `20260306065600`)
- **Collision Handling**: If ID exists, appends `_1`, `_2`, etc.
- **Example**: 
  - `20260306065600` - First document at that timestamp
  - `20260306065600_1` - Second document if collision
  - `20260306065600_2` - Third document if collision

## Output

The script will display:

```
🚀 Starting user_scores migration from Supabase to Firestore...

📥 Fetching user_scores from Supabase...
✅ Found 1234 user_scores in Supabase

📋 Checking existing Firestore documents...
✅ Found 0 existing documents in Firestore

📤 Migrating scores to Firestore...
✅ Processed batch 1: 100 scores
✅ Processed batch 2: 100 scores
...

============================================================
📊 Migration Summary
============================================================
✅ Successfully migrated: 1234 scores
⏭️  Skipped (already exists): 0 scores
❌ Errors: 0 scores
📦 Total processed: 1234 scores

✅ Migration complete!
```

## Troubleshooting

### Error: "Failed to fetch from Supabase"

**Cause**: Invalid Supabase credentials or network issue

**Solution**:
1. Verify Supabase URL and Anon Key are correct
2. Check Supabase project is active
3. Verify network connection

### Error: "Firebase Admin SDK initialization failed"

**Cause**: Missing or invalid `firebase-service-account-key.json`

**Solution**:
1. Download service account key from Firebase Console
2. Save as `firebase-service-account-key.json` in project root
3. Ensure file is not in `.gitignore` (but don't commit it!)

### Error: "Document ID collision after 100 attempts"

**Cause**: Extremely rare - multiple scores with identical timestamps

**Solution**: The script will log the error and continue with next score. Check logs for details.

### Scores Not Appearing in Firestore

**Possible Causes**:
1. Migration didn't complete (check for errors)
2. Security Rules blocking access
3. Wrong Firestore project

**Solution**:
1. Check migration summary for errors
2. Verify Firestore Security Rules allow reads
3. Check Firebase project in `.firebaserc` matches your project

## After Migration

1. **Verify Data**: Check Firestore Console → `user_scores` collection
2. **Test Application**: Verify scores appear in student dashboard and teacher dashboard
3. **Check Counts**: Compare Supabase count with Firestore count
4. **Test Queries**: Verify teacher dashboard queries work correctly

## Cleanup

After successful migration and verification:

1. **Remove Supabase Dependency** (optional):
   ```bash
   npm uninstall @supabase/supabase-js
   ```

2. **Update package.json**: Remove `migrate-scores` script if desired

3. **Delete Script** (optional): Remove `Utilities/migrate-user-scores-from-supabase.js` if no longer needed

## Notes

- The script **does not delete** data from Supabase (keeps as backup)
- The script **skips** documents that already exist in Firestore (won't overwrite)
- All timestamps are preserved in the document ID format
- `date_of_birth` is converted to `YYYY-MM-DD` string format to match current structure

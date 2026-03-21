# Updating Schools Collection

## Overview

The `schools` collection in Firestore needs to have the following fields for each school:
- `school_id` - The unique identifier for the school
- `school_name` - The name of the school
- `principal_email` - Email of the principal
- `administrator_email` - Email of the administrator
- `session_timeout_minutes` - Session timeout in minutes (default: 30)
- `created_at` - Timestamp when document was created
- `updated_at` - Timestamp when document was last updated

## Option 1: Update via Script (Recommended)

1. **Create an Excel file** (`schools.xlsx`) with columns:
   - School ID
   - School Name
   - Principal Email
   - Administrator Email
   - Session Timeout (minutes)

2. **Run the script:**
   ```bash
   node update-schools-collection.js
   ```

3. The script will:
   - Read schools from Excel file
   - Update existing school documents (preserves existing fields)
   - Create new school documents if they don't exist

## Option 2: Manual Update via Firebase Console

1. Go to Firebase Console → Firestore Database
2. Navigate to `schools` collection
3. For each school document:
   - Click on the document
   - Add/update the following fields:
     - `school_name` (string)
     - `principal_email` (string)
     - `administrator_email` (string)
     - `session_timeout_minutes` (number, default: 30)

## Option 3: Update via Firestore Admin SDK (Programmatic)

You can also update schools programmatically using the Firebase Admin SDK in Node.js.

## Important Notes

- **DO NOT delete `user_profiles`** - These are separate and correct
- **Only update `schools` collection** - Add the missing fields to existing documents
- The script uses `merge: true` to preserve existing fields
- If a school document doesn't exist, it will be created
- `school_id` can be used as the document ID or as a field within the document

## Data Structure

```
schools/
  └── {school_id}/
      ├── school_id: "2000"
      ├── school_name: "ABC School"
      ├── principal_email: "principal@example.com"
      ├── administrator_email: "admin@example.com"
      ├── session_timeout_minutes: 30
      ├── created_at: Timestamp
      └── updated_at: Timestamp
```

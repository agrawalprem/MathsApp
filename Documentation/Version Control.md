# Version Control (PROD vs Git vs Local Files)

This note captures the key ideas from our discussion on **where files live**, **what changes when**, and how to reason about “keep/undo” when an agent (Cursor) edits files.

## The 4 “places” a file can exist

For a file like `index.html`, it helps to name these four versions/locations:

- **PROD (Production / Live Hosting)**  
  The file currently served to real users on Firebase Hosting (for example, `https://<project>.web.app/index.html`).

- **REMOTE (Git-cloud / origin/main)**  
  The latest version stored on the remote Git server (GitHub/other). This is what you get after `git pull` (and what you update after `git push`).

- **HEAD (Git-local / local commit history)**  
  The last committed snapshot in your local repository on the laptop. This changes only when you commit.

- **WORKTREE (Project root directory / working copy)**  
  The actual files in your project folder on disk right now, including any uncommitted edits.

## The “missing” place: STAGE (Git staging area / index)

In Git there is one more important place that behaves like an additional copy:

- **STAGE (staging area / index)**  
  A *snapshot* of exactly what will go into the next commit.

This is why you often see Git described as a 3-step pipeline:

**WORKTREE → STAGE → HEAD**

Then separately:

**HEAD → REMOTE** (via `git push`)  
**WORKTREE → PROD** (via `firebase deploy`)

### Why STAGE is a real “copy” (not just file names)

`git add` does **not** store “file names only”. It stores the **contents** (a snapshot) of each file *as it looked at the moment you ran* `git add`.

That leads to an important rule:

- If you run **`git add fileA`**, then you **edit `fileA` again**, the new edits are **only in WORKTREE**.  
  Your next commit will still use the **older staged snapshot** *unless you run `git add fileA` again*.

So you can have three different versions at the same time:

- WORKTREE: newest edits
- STAGE: what is queued for commit
- HEAD: last committed version

## Typical workflow (and what changes where)

- **Cursor Agent edits**: changes WORKTREE immediately.
- **`git add`**: copies WORKTREE → STAGE (snapshot at that moment).
- **`git commit`**: copies STAGE → HEAD (creates a new local commit).
- **`git push`**: copies HEAD → REMOTE (updates Git-cloud).
- **`firebase hosting:channel:deploy test`**: copies WORKTREE → TEST URL (preview channel).
- **`firebase deploy --only hosting`**: copies WORKTREE → PROD (live Hosting snapshot).

## Key safety habit before deploy

Because Firebase deploy uploads from **WORKTREE**, a good safety habit is:

- Run `git status` and ensure it says **working tree clean** before deploying.

## Test environment (Firebase Hosting preview channel) and “undo”

For the test environment we chose:

- **Test URL = Firebase Hosting Preview Channel**  
  Example deploy command: `firebase hosting:channel:deploy test`

Important notes:

- The preview channel deploy uploads from **WORKTREE** (just like PROD deploy does).
- Preview channels do **not** affect PROD unless you deploy to live (for example: `firebase deploy --only hosting`).
- With “Option A”, the **backend data is shared** (same Auth + Firestore as PROD). Only the Hosting URL is different.

### What “undo” means when testing

If you test on the **test URL** and you are not happy, there are two common situations.

#### Situation 1: Git matches PROD (recommended discipline)

This is the ideal situation:

- **PROD == origin/main == HEAD** (the commit you deployed)

In this case, reverting is easy:

- Reset WORKTREE back to the PROD commit (the same commit on `origin/main`)
- Re-deploy the test channel from that clean WORKTREE

Result:

- Test URL becomes identical to PROD again.
- You do **not** need to “copy files from PROD” at all.

#### Situation 2: PROD differs from Git (happens if you deploy uncommitted changes)

This happens when someone runs `firebase deploy` while WORKTREE has changes that were not committed/pushed.

Then:

- PROD is still a valid “copy” (Firebase keeps the uploaded snapshot),
- but Git (HEAD/REMOTE) may not match it.

If you want everything to match PROD in this situation, you must first:

- download/capture the PROD snapshot,
- commit it,
- and push it,

so that **Git-cloud becomes an exact record of what is live**.

### One simple rule to avoid confusion forever

Before deploying to either test or PROD:

- `git status` must show **working tree clean**
- deploy only from `main` (or from a clearly named test branch)

If you follow this rule, then “revert to PROD” always means:

- reset WORKTREE to `origin/main`
- redeploy the test channel

## Where Cursor/agent edits go

When a Cursor agent edits files:

- The change is applied **immediately to WORKTREE** (the file in your project root directory).
- The agent does **not** change **HEAD** (Git-local) unless *you* create a commit.
- The agent does **not** change **REMOTE** (Git-cloud) unless *you* push commits.
- The agent does **not** change **PROD** unless *you* deploy to Firebase Hosting.

## “Keep” vs “Undo” (what it really means)

- **Keep**  
  Means you choose to **leave the WORKTREE changes** as they are.  
  They are “permanent” on disk unless you later revert them (manually or via Git).

- **Undo**  
  Means you choose to **roll back WORKTREE** to an earlier state.  
  Depending on the undo method, this may revert to the last saved version in the editor, or back to the last committed version in Git.

Important: **If you haven’t said anything yet**, and you open the file in your project root folder, **you will see the updated contents** if the edit has already been applied.

## What “source of truth” means in practice

You can decide that one place is authoritative, for example:

- **“PROD is the source of truth”**  
  Then you want to copy the current production HTML into WORKTREE, and (optionally) commit/push so Git matches production too.

Or:

- **“Git is the source of truth”**  
  Then you want to reset WORKTREE back to HEAD or REMOTE.

## Relationship to `VERSION_CONTROL.md`

There is also a root-level file `VERSION_CONTROL.md` that describes a **non-Git** workflow (Production/Backup/Test folders) to manage versions by copying files around.

This document (`Documentation/Version Control.md`) is different:

- It explains the **Git + Hosting + Laptop** mental model: **PROD / REMOTE / HEAD / WORKTREE**.


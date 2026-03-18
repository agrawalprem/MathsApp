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


# Git Primer

## Core Concepts

**Repository (repo)**: A project folder tracked by Git  
**Commit**: A snapshot of your files at a point in time  
**Branch**: A separate line of development (default: `main` or `master`)  
**Working Directory**: Your current files  
**Staging Area**: Files marked to be included in the next commit

## Essential Commands

### Check Status
```bash
git status              # See what files changed
git log --oneline -5    # See last 5 commits
```

### Save Changes (3 Steps)
```bash
git add .               # Stage all changes (or git add filename)
git commit -m "message" # Save snapshot with message
git push                # Upload to remote (GitHub, etc.)
```

### Undo Changes
```bash
git restore filename    # Discard changes in a file
git restore .           # Discard ALL uncommitted changes
git reset HEAD~1        # Undo last commit (keeps changes)
```

### View Changes
```bash
git diff                # See what changed (unstaged)
git diff --staged       # See staged changes
```

## Typical Workflow

```bash
# 1. Check what changed
git status

# 2. Stage your changes
git add .

# 3. Commit with a message
git commit -m "Fixed login button styling"

# 4. Push to remote (if you have one)
git push
```

## Good Commit Messages

- "Fixed logout button on dashboard"
- "Added quiz controls for multi-digit variants"
- "Updated CSS for registration page"

## Quick Reference

| Action | Command |
|--------|---------|
| See status | `git status` |
| Stage all | `git add .` |
| Commit | `git commit -m "message"` |
| Undo file | `git restore filename` |
| See history | `git log --oneline` |
| Discard all | `git restore .` |

## Tips

1. **Commit often**: Small, logical commits are easier to review
2. **Write clear messages**: Describe what changed and why
3. **Check status before committing**: `git status`
4. **Use `git diff`** to review changes before committing

## Common Scenarios

### I made changes I don't want
```bash
git restore filename     # Undo one file
git restore .           # Undo everything
```

### I want to see what I changed
```bash
git diff                # See unstaged changes
git diff --staged       # See staged changes
```

### I want to save my work
```bash
git add .
git commit -m "Description of changes"
```

### I want to go back to a previous version
```bash
git log --oneline       # Find the commit hash
git reset <commit-hash> # Go back (keeps changes)
git reset --hard <commit-hash> # Go back (discards changes)
```

## Your Current Situation

You have uncommitted changes. To save them:
```bash
git add .
git commit -m "UI modifications - separate pages with navigation"
```

To discard them:
```bash
git restore .
```

## Additional Resources

- [Git Documentation](https://git-scm.com/doc)
- [GitHub Guides](https://guides.github.com/)
- [Atlassian Git Tutorial](https://www.atlassian.com/git/tutorials)

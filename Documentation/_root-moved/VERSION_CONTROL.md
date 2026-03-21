# Version Control Without Git

This document describes how to manage **Production**, **Backup**, and **Test** versions without using Git.

## Folder Structure

Create three folders in your project:

```
MathsInBabySteps/
├── production/          # Current production version (deployed)
├── backup/             # Last working production (backup)
└── test/               # Testing/development version
```

## Workflow

### 1. **Production** (Current Live Version)
- This is your main project folder
- Deployed to Firebase Hosting
- **Never edit directly** - always work in `test/` first

### 2. **Backup** (Last Working Production)
- Copy of the last known working production version
- Updated only when production is stable and working
- Used to restore if production breaks

### 3. **Test** (Development/Testing)
- Where you make all changes and test
- Once tested and working, copy to production

## Step-by-Step Process

### Making Changes

1. **Work in `test/` folder:**
   ```powershell
   # Copy current production to test
   Copy-Item -Path production\* -Destination test\ -Recurse -Force
   ```

2. **Make your changes in `test/` folder**

3. **Test locally:**
   ```powershell
   cd test
   firebase serve
   ```

4. **When ready to deploy:**
   ```powershell
   # Backup current production first
   Copy-Item -Path production\* -Destination backup\ -Recurse -Force
   
   # Copy test to production
   Copy-Item -Path test\* -Destination production\ -Recurse -Force
   
   # Deploy production
   cd production
   firebase deploy --only hosting
   ```

### Restoring from Backup

If production breaks:

```powershell
# Restore from backup
Copy-Item -Path backup\* -Destination production\ -Recurse -Force

# Deploy restored version
cd production
firebase deploy --only hosting
```

## Alternative: Simple File Naming

If you prefer to keep everything in one folder:

```
MathsInBabySteps/
├── index.html                    # Production (current)
├── index.html.backup             # Backup
├── index.html.test               # Test version
├── student-dashboard.html
├── student-dashboard.html.backup
├── student-dashboard.html.test
└── ...
```

**Workflow:**
1. Edit `.test` files
2. Test locally
3. When ready: rename `.backup` → `.old`, current → `.backup`, `.test` → current

## Recommended: Folder Structure

The **folder structure** approach is cleaner and easier to manage.

## Quick Commands (PowerShell)

### Setup (one-time)
```powershell
New-Item -ItemType Directory -Path backup
New-Item -ItemType Directory -Path test
Copy-Item -Path * -Destination backup\ -Recurse -Exclude backup,test,node_modules,.git
Copy-Item -Path * -Destination test\ -Recurse -Exclude backup,test,node_modules,.git
```

### Daily Workflow
```powershell
# 1. Start working (copy production to test)
Copy-Item -Path production\* -Destination test\ -Recurse -Force -Exclude node_modules

# 2. After testing, deploy (backup first, then copy test to production)
Copy-Item -Path production\* -Destination backup\ -Recurse -Force -Exclude node_modules
Copy-Item -Path test\* -Destination production\ -Recurse -Force -Exclude node_modules
cd production
firebase deploy --only hosting
```

## Notes

- **Firebase config**: Each folder needs its own `firebase.json` and `.firebaserc` (or use same project)
- **node_modules**: Don't copy `node_modules` - run `npm install` in each folder if needed
- **Utilities folder**: Keep `Utilities/` in main folder, reference from all versions
- **Documentation**: Keep `Documentation/` in main folder

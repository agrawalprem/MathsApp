# Database Verification Scripts

This folder contains SQL scripts for verifying and validating the database setup.

## Scripts

### `verify-database-automated.sql`
**Purpose**: Quick automated check of all database components
**Use**: Run this first for a quick overview of database health
**Checks**:
- Tables existence
- RLS enabled
- Policy counts
- Index counts
- Column existence
- Constraints
- Triggers and functions
- Data integrity

### `verify-policies-detailed.sql`
**Purpose**: Detailed validation of each RLS policy
**Use**: Run this to verify all security policies are correctly configured
**Checks**:
- Each individual policy (10 expected policies)
- Policy existence by table
- Unexpected policies
- Final pass/fail verdict

### `verify-database-state.sql`
**Purpose**: Comprehensive state verification
**Use**: Run this for detailed verification after migrations
**Checks**:
- Tables dropped (classes, teachers)
- Column existence
- Constraints
- Indexes
- RLS policies
- Foreign keys
- Data integrity

## Usage

Run these scripts in Supabase SQL Editor:
1. After initial setup
2. After running migrations
3. When troubleshooting issues
4. Before deploying to production

## Expected Results

All scripts should show ✅ PASS for all checks when the database is properly configured.

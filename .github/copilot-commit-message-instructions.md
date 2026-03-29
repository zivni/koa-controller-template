# Commit Message Instructions

## CRITICAL: ONE LINE ONLY

Commit messages MUST be exactly ONE line with NO additional text, NO body, NO bullet points, NO lists, NO detailed descriptions.

## Format Rules

- Start with a lowercase verb in imperative mood (e.g., add, fix, update, remove, refactor, change, make, set)
- No period at the end
- Keep under 72 characters (aim for 50 when possible)
- **Focus on the main purpose**, not implementation details (e.g., test data files, config changes)
- Convey what the change accomplishes for the user or system, not how it's implemented
- No conventional commit prefixes (no `feat:`, `fix:`, etc.)
- No ticket or issue numbers

## ✅ Good Examples

- `add evaluation test suite for AI matcher`
- `fix form resubmission on login`
- `update users tables on wcm auth`

## ❌ Bad Examples (DO NOT USE)

**Multi-line with bullets (WRONG):**
```
Add new articles and update evaluation matcher

- Created articles for recent events
- Added costs_log.txt
- Introduced expected.json
```

**Focuses on implementation details instead of main purpose (WRONG):**
- `add new articles and update evaluation matcher with cost tracking`
  - Problem: Focuses on test data files ("new articles") instead of the main feature

**Correct version:**
- `add evaluation test suite for AI article matcher`
  - Focuses on the main purpose (evaluation test suite), not implementation details (article files)

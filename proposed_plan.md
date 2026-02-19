# Plan: Data Formatting & Review Flow Improvements

### 1. Field Formatting
- **Phone Numbers**: Enforce 10-digit limit and numeric-only pad.
- **Dates**: Standardize on YYYY-MM-DD for consistency.
- **Weights/Area**: Auto-formatting for decimals.

### 2. Review & Edit Flow
- **Inline Editing**: Summary cards in `app/review.tsx` will have an "Edit" toggle or per-field editing.
- **Form Integration**: Instead of navigating to other screens, I will add input fields directly into the review screen or use a modal/bottom-sheet style editor to keep the user on the same page.
- **Sync Logic**: Ensure "Save Locally" updates the correct record after edits.

### 3. UI Enhancements
- Add a "Pencil" icon next to editable fields.
- Use a "Save" vs "Edit" state for each section to prevent accidental changes.

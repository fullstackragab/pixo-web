# Shortlist Pricing Screen Updates

## Summary of Changes

Changes implemented in `app/company/shortlists/[id]/page.tsx` to improve conversion and reduce friction on the pricing screen.

---

### 1. Reframed quantity → quality

**Before:**
> "We've prepared {X} candidates who meet your requirements"

**After:**
> "We've prepared a curated shortlist of candidates that meet your requirements, prioritizing quality over volume."

This prevents the "€350 for 1 candidate?" reaction when shortlists are small.

---

### 2. Added value reminder badges

Added checkmark badges next to the price to justify the value without sales language:
- Hand-reviewed
- Availability verified
- No spam

---

### 3. Strengthened pricing reassurance

Added a second line below the existing pricing copy:
> "If this shortlist doesn't feel right, you can decline — no charge."

This single sentence dramatically increases approvals because it removes fear.

---

### 4. Improved CTA wording

**Before:** "Approve to continue"

**After:** "Approve & unlock full profiles"

The new wording feels like exploration rather than a payment gate.

---

### 5. Added explicit "Decline shortlist" option

Added a subtle link below the primary CTA:
> "Not a fit? Decline shortlist"

Clicking opens a modal with four decline reasons:
- Pricing doesn't work
- Candidates not relevant
- Timing changed
- Other reason

Includes an optional feedback textarea for additional context.

**Benefits:**
- Preserves trust
- Feeds matching & pricing intelligence
- Prevents silent churn (tab closes)

---

### 6. Implemented candidate preview cards (gated preview model)

Uses the new API `candidatePreviews` array to show limited candidate info before approval.

Each preview card displays:

| Shown | NOT Shown |
|-------|-----------|
| Role/title | Full name |
| Seniority badge (from `seniorityLabel`) | Email/contact |
| Availability badge (from `availabilityLabel`) | LinkedIn/GitHub |
| Top skills (3-5) | Company names |
| Work setup (from `workSetupLabel`) | Full CV |
| Region (country only) | Profile photos |
| "Why this candidate" (from `whyThisCandidate`) | Candidate ID |
| Rank number | |

Each card has a "Preview" lock badge. Header shows "Full profiles unlock after approval".

**Psychology shift:**

Before: "Pay €350 for 1 candidate"

After: "I see *why* this candidate fits — unlocking makes sense."

---

## API Integration

### Types Added

```typescript
interface ShortlistCandidatePreview {
  previewId: number;           // Sequential ID (1, 2, 3...) - NOT real candidate ID
  role: string | null;
  seniority: string | null;
  topSkills: string[];
  availability: string;
  workSetup: string | null;
  region: string | null;
  whyThisCandidate: string;
  rank: number;
  seniorityLabel: string;
  availabilityLabel: string;
  workSetupLabel: string;
}
```

### ShortlistDetail Updated

```typescript
interface ShortlistDetail {
  // ... existing fields ...
  candidatePreviews?: ShortlistCandidatePreview[];
  hasPreviews?: boolean;
  profilesUnlocked?: boolean;
}
```

### Endpoints Used

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/shortlists/{id}` | GET | Returns shortlist with previews or full candidates |
| `/shortlists/{id}/approve` | POST | Approve pricing |
| `/shortlists/{id}/decline` | POST | Decline pricing (body: `{ reason, feedback }`) |

---

## Files Changed

- `app/company/shortlists/[id]/page.tsx` - Main pricing screen component
- `types/index.ts` - Added `githubUrl` to CandidateProfile interface
- `app/candidate/onboard/page.tsx` - Added GitHub field in onboarding Step 1
- `app/candidate/profile/edit/page.tsx` - Added GitHub field in profile edit
- `app/candidate/profile/page.tsx` - Display GitHub link on profile view

---

## GitHub Profile Field (Opt-in)

Added explicit GitHub profile field for candidates (opt-in, not extracted from CV).

### Candidate-Facing

**Onboarding (Step 1):**
- GitHub URL field appears below LinkedIn
- Helper text: "Public repositories can help highlight hands-on experience for technical roles."

**Profile Edit:**
- GitHub URL field in Personal Information section
- Same helper text as onboarding

**Profile View:**
- GitHub icon + link displayed alongside LinkedIn (if provided)

### Why Opt-in (not CV extraction)

1. **Explicit consent** - Candidates understand it may be used
2. **Higher signal quality** - Those who add it are confident in their work
3. **Cleaner UX** - LinkedIn = professional history, GitHub = technical work
4. **Operationally safer** - No auto-triggering enrichment on every CV

---

## Implementation Status

All features fully implemented (frontend + backend).

See `docs/backend-implementation-guide.md` for backend details.

---

## Design Principles Applied

1. **Trust-first** - Clear pricing, no hidden complexity
2. **Control** - Users can decline without friction
3. **Value demonstration** - Preview builds confidence without leaking value
4. **Fear removal** - Multiple reassurances about no-charge decline

# Mobile Fast-Track UI & State Bridging Lessons

**Date:** 2026-06-10
**Context:** Implemented a new Mobile Fast-Track `MobileFastTrackApp.tsx` overlay to allow shop floor operators to quickly capture rework items with photos and submit them as a batch.

## 1. Bridging useForm State (Flat to Nested)
The existing `useItemVerification` hook was tightly coupled to the structure of the main `AddCaseTab` form, which uses an array of items (`items.0.fieldName`). In the Fast-Track UI, we only deal with one item at a time (flat structure: `fieldName`).
- **Lesson:** Instead of rewriting `useItemVerification` or modifying its core logic, we created a "bridge" using `useMemo` for `setValue` and `getValues`. This bridge intercepts calls like `items.0.itemNumber` and maps them to the flat `itemNumber` field in the Fast-Track form, and vice versa. This preserved the complex verification and debounce logic without code duplication.

## 2. Client-Side Image Processing & Watermarking
To meet the "Evidence Integrity" requirement while supporting low-bandwidth environments, we shifted image processing entirely to the client-side:
- **Compression:** Used `browser-image-compression` to resize and compress camera captures down to a target size of 0.5MB before converting them to base64.
- **Watermarking:** Used the HTML Canvas API (`canvas.getContext('2d')`) to draw the image and overlay a semi-transparent black bar with Timestamp and GPS coordinates. This ensures provenance without relying on server-side processing overhead.
- **Lesson:** Converting `File` objects to Data URLs (base64) for the Canvas API and back to `File` or Blob for upload requires careful handling of asynchronous promises, but it drastically reduces server load and storage costs.

## 3. Local Draft State (`localStorage`)
The shop floor can have spotty Wi-Fi. 
- **Pattern:** We implemented a `qsms_fast_track_draft` key in `localStorage` to save the active queue of items (including their base64 image URLs). 
- **Lesson:** Always clear the draft state (`localStorage.removeItem`) *only* after a successful `onComplete` transfer or API submission. If the browser is closed or refreshed, the `useEffect` hook on mount restores the draft queue, preventing data loss.

## 4. UI/UX: Impeccable Mobile Interactions
Applying the "Grill with Docs" and "Impeccable" principles significantly changed the UI direction:
- **Chunky & Accessible:** Removed inner padding and borders (the "card" look) and made inputs edge-to-edge with `h-14` / `py-4` heights. This provides larger tap targets for operators wearing gloves.
- **Snappy Animations:** Changed `framer-motion` default springs to crisp exponential easing (`transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}`). This removes bouncy delays and matches the psychological expectation of "Fast-Track" speed.
- **Lesson:** On mobile operational tools, dense information and fast, bounce-free transitions are preferred over spacious, highly-animated web-app aesthetics.

## 5. Submission Delegation
Initially, the Fast-Track UI was designed to call `insertCase` directly. However, the business logic requires the user to review the full case, assign responsibilities, and potentially link items before final submission.
- **Refactoring:** We changed the Fast-Track UI to act as an ingestion tool. Clicking "Submit All" fires an `onComplete` callback, which populates the parent `react-hook-form` in `AddCaseTab`. The pre-uploaded image URLs are passed directly into the form's state.
- **Backend Adjusment:** The `insertCase` API route was updated to merge any pre-existing `imageUrls` (from Fast-Track) with any new `File` objects uploaded directly in the main form, ensuring no images are lost during the final save.
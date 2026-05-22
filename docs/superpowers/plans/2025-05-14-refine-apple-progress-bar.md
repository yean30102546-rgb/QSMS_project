# Refine AppleProgressBar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the `AppleProgressBar` to a sleek 4px design with glassmorphism and morphing entry.

**Architecture:** Use `motion/react` for the morphing entry and progress animations. Apply Tailwind CSS classes for the sleeker track and glassmorphism. Refine the inline styles for the glow sweep.

**Tech Stack:** React, Tailwind CSS, motion/react (Framer Motion), Lucide React.

---

### Task 1: Refine AppleProgressBar component

**Files:**
- Modify: `src/components/ui/AppleProgressBar.tsx`

- [ ] **Step 1: Update the progress bar track styles**

```tsx
// old
<div className="relative h-[6px] w-full overflow-hidden rounded-full bg-[#f2f2f7] shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]">

// new
<div className="relative h-[4px] w-full overflow-hidden rounded-full bg-black/5 backdrop-blur-sm">
```

- [ ] **Step 2: Update the progress bar entry and width animation**

```tsx
// old
            <motion.div
              key="progress"
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-3"
            >

// new
            <motion.div
              key="progress"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-3"
            >
```

- [ ] **Step 3: Refine the glow sweep effect**

```tsx
// old
<div className="absolute top-0 left-0 w-[100px] h-full animate-sweep" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)' }} />

// new
<div className="absolute top-0 left-0 w-[120px] h-full animate-sweep blur-md" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }} />
```

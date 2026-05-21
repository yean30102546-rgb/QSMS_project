# Login UI/UX Modernization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the Login page from a dark theme to a "Soft Glassmorphism" pastel theme with improved UX feedback and micro-animations.

**Architecture:** Refactor the existing `Login.tsx` component to use a light color palette, glassmorphism effects via Tailwind, and enhanced interaction states using `motion/react`.

**Tech Stack:** React (TypeScript), Tailwind CSS, `motion/react`, `lucide-react`.

---

### Task 1: Add Glassmorphism CSS Utilities

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Add custom glassmorphism utilities to `src/index.css`**

Add these classes to provide consistent glass effects:
```css
@layer components {
  .glass-panel {
    @apply bg-white/40 backdrop-blur-xl border border-white/20;
  }
  
  .glass-input {
    @apply bg-white/50 border border-black/5 focus:border-blue-400/50 focus:ring-4 focus:ring-blue-400/10 transition-all outline-none;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/index.css
git commit -m "style: add glassmorphism utilities"
```

---

### Task 2: Refactor Login Component Structure and Shell Styles

**Files:**
- Modify: `src/components/Login.tsx`

- [ ] **Step 1: Update the outer shell and background gradients**

Replace the current dark shell with a light, pastel gradient shell.
```tsx
// Inside src/components/Login.tsx
// Replace the outer div and background elements:
<div className="apple-shell flex min-h-screen items-center justify-center overflow-y-auto bg-gradient-to-br from-[#F0F7FF] via-[#FFFFFF] to-[#F5F9FF] px-4 py-8 md:px-8">
  <div className="pointer-events-none absolute inset-0 opacity-40">
    <div className="absolute -left-24 top-12 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(0,102,204,0.1),transparent_70%)]" />
    <div className="absolute -right-24 bottom-6 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(61,89,124,0.1),transparent_70%)]" />
  </div>
  {/* ... rest of content */}
</div>
```

- [ ] **Step 2: Refactor the main card and left panel to Glass style**

Change the left panel from dark to translucent glass.
```tsx
// Inside src/components/Login.tsx
<motion.section
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
  className="relative z-10 w-full max-w-[980px] overflow-hidden rounded-[36px] bg-white/30 backdrop-blur-md shadow-2xl shadow-blue-900/5 border border-white/40"
>
  <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
    {/* Left Panel */}
    <div className="glass-panel px-7 py-10 text-[#1d1d1f] md:px-10 lg:border-0 lg:border-r lg:border-r-black/5">
      <div className="mb-8 flex items-center gap-3">
        <img src="/img/logo.png" alt="QSMS" className="h-10 object-contain" />
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-600/80">Central Workspace</div>
      </div>
      <h1 className="max-w-lg text-4xl font-semibold leading-[1.04] tracking-[-0.03em] md:text-5xl text-[#1d1d1f]">
        One login for Rework and upcoming Roster operations.
      </h1>
      <p className="mt-5 max-w-md text-[16px] leading-7 text-[#515154]">
        เข้าสู่ระบบครั้งเดียว แล้วเลือกใช้งานแต่ละ webapp ผ่าน Central Control ได้ทันที
        โดยรักษา workflow เดิมของ Rework ให้ทำงานต่อเนื่อง
      </p>
      <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-blue-600/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700/70">
        Platform session secured
      </div>
    </div>
    {/* ... Right Panel */}
  </div>
</motion.section>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Login.tsx
git commit -m "feat: refactor login shell and left panel to glassmorphism"
```

---

### Task 3: Modernize Form Inputs and Buttons

**Files:**
- Modify: `src/components/Login.tsx`

- [ ] **Step 1: Update form layout and input styles**

Apply the `glass-input` class and update typography.
```tsx
// Right Panel updates
<div className="bg-white/80 px-6 py-8 md:px-9 md:py-10">
  <div className="mb-8">
    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6e6e73]">Sign in</p>
    <h2 className="mt-2 text-3xl font-semibold tracking-[-0.02em] text-[#1d1d1f]">เข้าสู่ Central Control</h2>
    {/* ... subtitle */}
  </div>

  <form onSubmit={handleSubmit} className="space-y-4">
    <div className="relative group">
      <UserCircle2 size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#7a7a80] group-focus-within:text-blue-500 transition-colors" />
      <input
        type="text"
        value={username}
        className="glass-input w-full rounded-2xl py-3.5 pl-11 pr-4 text-[15px]"
        {/* ... props */}
      />
    </div>
    {/* ... repeat for password */}
  </form>
</div>
```

- [ ] **Step 2: Update the primary button with micro-animations**

```tsx
<motion.button
  whileHover={{ scale: 1.01 }}
  whileTap={{ scale: 0.98 }}
  type="submit"
  className="apple-btn-primary mt-1 inline-flex w-full items-center justify-center gap-2 py-3.5 text-sm font-semibold shadow-lg shadow-blue-600/20"
  {/* ... props */}
>
  {/* ... content */}
</motion.button>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Login.tsx
git commit -m "feat: modernize login form inputs and buttons"
```

---

### Task 4: Final Verification and UX Polish

- [ ] **Step 1: Run manual verification of the UI**
Check for:
- [ ] Contrast ratio (is text readable on the glass panel?)
- [ ] Loading spinner visibility.
- [ ] Smoothness of entry animation.
- [ ] Responsiveness (Check mobile view).

- [ ] **Step 2: Record completion in `Antigravity.md` and `ForLearning.md`**
  - Update `Antigravity.md` with the new task completed.
  - Update `ForLearning.md` if any CSS tricks or issues were encountered.

- [ ] **Step 3: Final Commit**

```bash
git commit -m "docs: finalize login modernization documentation"
```

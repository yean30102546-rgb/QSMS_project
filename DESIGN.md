# QSMS Control Center & Modules — Design System Specification (`DESIGN.md`)

Version: 2.0 (Apple Pro Operations Edition)  
Last Updated: 2026-08-13  
Target Audience: Developers, Designers, and AI Coding Agents (Stitch, Antigravity, Claude Code)

---

## 1. Executive Summary & Design Philosophy

The QSMS application suite (Central Control Center, QSMS Rework, Drawing & Master Storage, Presentation & Guide, and DocAI RAG) operates under the **Apple Pro Minimal Industrial Aesthetic**.

The goal is to deliver a **Modern Enterprise Operations Dashboard** for daily factory and quality management personnel:
- **Photography & Data First**: UI chrome recedes so operational metrics, engineering drawings, and rework evidence speak.
- **Single Interactive Accent**: Action Blue (`#0066cc` / `#0071e3`) serves as the universal signal for interactive buttons, primary actions, and focus rings.
- **Zero Decorative Bloat**: No heavy drop shadows on cards or text, no dark gradient overlays. Section separation is achieved through surface tone changes (Parchment `#f5f5f7` ↔ Pure White `#ffffff`) and 1px `#e0e0e0` hairline borders.
- **Micro-Interactions**: Tactile spring physics (`whileTap={{ scale: 0.97 }}`) and staggered entrance animations powered by Framer Motion (`motion/react`).

---

## 2. Color Tokens & Semantic Palette

### A. Primary Canvas & Surfaces
| Surface Name | Hex / Class | Purpose & Location |
|---|---|---|
| **Parchment Canvas** | `#f5f5f7` (`bg-[#f5f5f7]`) | Global workspace canvas, off-white background |
| **Pure White Tile** | `#ffffff` (`bg-white`) | Utility cards, KPI cards, form containers |
| **Frosted Sub-Nav** | `#f5f5f7`/90 + `backdrop-blur-md` | Floating top header & navigation shell |
| **Pearl Surface** | `#fafafc` (`bg-[#fafafc]`) | Secondary button fills, popover headers |

### B. Interactive & Accent Colors
| Accent Name | Hex / Class | Purpose |
|---|---|---|
| **Action Blue** | `#0066cc` (`bg-[#0066cc]`, `text-[#0066cc]`) | Primary pill buttons, text links, active tabs |
| **Action Blue Hover** | `#0071e3` (`hover:bg-[#0071e3]`) | Primary button hover / focus state |
| **Action Blue Sky** | `#2997ff` (`text-[#2997ff]`) | Dark-mode or high-contrast sky blue accent |
| **Focus Ring Blue** | `#0071e3`/30 (`ring-[3px] ring-blue-500/30`) | Focus ring outline on inputs |

### C. Text Ink & Neutral Scales
| Ink Name | Hex / Class | Purpose |
|---|---|---|
| **Near-Black Ink** | `#1d1d1f` (`text-[#1d1d1f]`) | Primary headlines, body copy, card titles |
| **Muted Ink 80** | `#333333` (`text-[#333333]`) | Secondary paragraph emphasis |
| **Muted Ink 48** | `#7a7a7a` (`text-[#7a7a7a]`) | Captions, meta labels, timestamps, disabled text |
| **Hairline Border** | `#e0e0e0` (`border-[#e0e0e0]`) | 1px hairline border for cards & dividers |
| **Soft Divider** | `#f0f0f0` (`bg-[#f0f0f0]`) | Progress bar track background |

### D. Semantic Status Colors
| Status | Background Pill | Text | Dot Indicator | Use Case |
|---|---|---|---|---|
| **Pending (รอดำเนินการ)** | `bg-amber-50 border-amber-200` | `text-amber-800` | `#f59e0b` | Rework cases pending action |
| **In Progress (กำลังทำ)** | `bg-sky-50 border-sky-200` | `text-sky-800` | `#0284c7` | Rework cases in progress |
| **Completed (เสร็จสิ้น)** | `bg-emerald-50 border-emerald-200` | `text-emerald-800` | `#10b981` | Completed rework cases |
| **Error / Conflict** | `bg-rose-50 border-rose-200` | `text-rose-700` | `#f43f5e` | Data conflict or missing file |

---

## 3. Typography Hierarchy (SF Pro & Sarabun)

- **Font Family**: `Sarabun` (Thai), `-apple-system`, `BlinkMacSystemFont`, `SF Pro Display`, `SF Pro Text`, `sans-serif`.

| Scale Name | Size | Weight | Tracking / Line Height | Use Case |
|---|---|---|---|---|
| **Display Hero** | 34px / 40px | 600 (Semibold) | `tracking-[-0.02em]` / `1.1` | Main module headlines, page title |
| **Section Lead** | 28px | 600 (Semibold) | `tracking-[-0.02em]` / `1.14` | Primary operation card titles |
| **Tagline / Category** | 21px | 600 (Semibold) | `tracking-[-0.015em]` / `1.19` | Section sub-headers, card titles |
| **Body Primary** | 17px | 400 (Regular) | `tracking-[-0.01em]` / `1.47` | Paragraph text, module descriptions |
| **Body Strong** | 17px | 600 (Semibold) | `tracking-[-0.01em]` / `1.24` | Table cell data, bold body copy |
| **Utility / Button** | 14px / 13px | 500 (Medium) | `tracking-[0]` / `1.29` | Button labels, popover items |
| **Caption / Meta** | 12px | 400 (Regular) | `tracking-[0.04em] uppercase` | KPI labels, status tags, table headers |
| **Micro Legal** | 10px | 400 (Regular) | `tracking-[0.05em]` | Disclaimers, timestamp tags |

---

## 4. Geometry & Elevation System

### Border Radius Scale
| Radius Token | Value | Use Case |
|---|---|---|
| `rounded-[18px]` | 18px | Central Portal utility cards (`store-utility-card`), storage panels |
| `rounded-full` | 9999px | Action Blue pill buttons (`button-primary`), status badges, search inputs |
| `rounded-xl` | 12px | Modal dialog containers, input group boxes, popover menus |
| `rounded-lg` | 8px | Form input fields (`apple-input`), utility buttons |

### Shadow & Elevation Rules
- **UI Cards & Buttons**: Flat surfaces with 1px `#e0e0e0` hairline borders. **No heavy card drop shadows**.
- **Product Imagery Shadow**: `box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08)` (applied exclusively to evidence image renders resting on surfaces).

---

## 5. Module-Specific Design Systems

### A. Central Portal Hub (`WorkspacePortal.tsx`)
- **Parchment Canvas**: `#f5f5f7` full viewport background.
- **Sub-Nav Frosted Header**: Sticky header at 44px height, `#f5f5f7` at 90% opacity with `backdrop-blur-md` and `#e0e0e0` hairline border.
- **KPI Summary Cards**: 4-column layout of Pure White `#ffffff` cards with 18px (`rounded-[18px]`) radius, `#e0e0e0` hairline border, 34px KPI values, and `#0066cc` progress tracks.
- **Primary Hero Card**: QSMS Rework featured card with Action Blue pill button ("เข้าสู่ระบบแก้ไขสินค้า (Rework)") and proportional segmented status progress tracker.
- **Floating AI Assistant Capsule**: Fixed bottom capsule with Action Blue button and `Ctrl+K` shortcut pill.

### B. QSMS Rework Module (`src/modules/rework/`)
- **Multi-Item Case Table**: High-density data grid with `#fafafa` header row, hover highlight on rows, and status badges.
- **Two-Way Autofill Indicator**: Visual lifecycle status tags (`Idle` -> `Checking` -> `Verified` / `New` / `Conflict`).
- **Granular Lot Fields**: Batch No, gallonDate, boxNumber, mold, and line inputs styled as clean `#ffffff` inputs with 8px radius and `focus:border-[#0066cc]`.
- **PTT OR Attachment Warning Badge**: Red alert badge ("ขาดไฟล์ OR") when OR documents are missing.

### C. Drawing & Master Storage Module (`src/modules/storage/`)
- **55/45 Split View Panel**: Side-by-side inspection workspace with slide-over drawer (keyboard shortcuts: `ArrowUp`/`ArrowDown` for row navigation, `Escape` to close).
- **PDF Auto-Orientation Toolbar**: Toolbar with 0°, 90°, 180°, 270°, and 1-click Landscape View buttons, remembering rotation in `localStorage`.
- **Decoupled Form Schemas**: Drawing PDF (7 fields, blue accent) vs Master Sheet (8 fields, emerald accent).

### D. Presentation & Guide Module (`src/modules/guide/`)
- **Interactive Tutorial Cards**: Segmented tutorial step tabs with Apple-style segmented control (`.roster-tab-bar`).
- **Slide Deck Viewer**: Clean presentation slide deck with dark slide controls.

### E. DocAI RAG Assistant (`src/modules/rag/`)
- **Global Draggable AI Pill**: Translucent glass pill button floating at bottom-right (`Ctrl+K`).
- **Chat Drawer Overlay**: Slide-over chat panel with SSE streaming markdown response, source citations, and function calling statistics cards.

---

## 6. Motion & Animation Standards (`motion/react`)

```tsx
// Staggered Container Animation
export const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.03,
    },
  },
};

// Item Entrance Spring Animation
export const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 120,
      damping: 20,
    },
  },
};

// Tactile Button Press Physics
export const buttonPressProps = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.97 },
  transition: { type: 'spring', stiffness: 400, damping: 25 },
};
```

---

## 7. Do's and Don'ts

### ✅ Do
- Use `#0066cc` (Action Blue) for **all** interactive elements (CTAs, text links, active tabs).
- Use `#f5f5f7` Parchment for background canvases and `#ffffff` Pure White for cards.
- Use 18px (`rounded-[18px]`) radius for utility cards and full pill (`rounded-full`) for CTAs.
- Use near-black `#1d1d1f` ink for all text headlines and body copy.
- Enforce touch target sizes of at least 44×44px on mobile viewports.

### ❌ Don't
- Don't use heavy black buttons (`#000000` / `#1d1d1f`) for primary action CTAs — Action Blue `#0066cc` is the primary action color.
- Don't add dark gradient overlays or heavy drop shadows to UI cards — section separation comes from surface color changes and 1px `#e0e0e0` hairline borders.
- Don't use emojis as structural navigation icons — use vector SVG icons from `lucide-react`.
- Don't hardcode fake numbers or mock production metrics.

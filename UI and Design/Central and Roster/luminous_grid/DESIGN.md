---
name: Luminous Grid
colors:
  surface: '#f9f9fb'
  surface-dim: '#dadadc'
  surface-bright: '#f9f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f3f5'
  surface-container: '#eeedf0'
  surface-container-high: '#e8e8ea'
  surface-container-highest: '#e2e2e4'
  on-surface: '#1a1c1e'
  on-surface-variant: '#42474d'
  inverse-surface: '#2f3032'
  inverse-on-surface: '#f1f0f3'
  outline: '#72787d'
  outline-variant: '#c2c7cd'
  surface-tint: '#3e627c'
  primary: '#3e627c'
  on-primary: '#ffffff'
  primary-container: '#a2c7e5'
  on-primary-container: '#2e546d'
  inverse-primary: '#a6cbe9'
  secondary: '#6f5b3e'
  on-secondary: '#ffffff'
  secondary-container: '#f6dcb7'
  on-secondary-container: '#736042'
  tertiary: '#50625a'
  on-tertiary: '#ffffff'
  tertiary-container: '#b3c7bd'
  on-tertiary-container: '#42544b'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c9e6ff'
  primary-fixed-dim: '#a6cbe9'
  on-primary-fixed: '#001e2f'
  on-primary-fixed-variant: '#244a64'
  secondary-fixed: '#f9dfba'
  secondary-fixed-dim: '#dcc39f'
  on-secondary-fixed: '#261903'
  on-secondary-fixed-variant: '#554429'
  tertiary-fixed: '#d3e7dc'
  tertiary-fixed-dim: '#b7cbc1'
  on-tertiary-fixed: '#0e1f18'
  on-tertiary-fixed-variant: '#394b43'
  background: '#f9f9fb'
  on-background: '#1a1c1e'
  surface-variant: '#e2e2e4'
typography:
  display:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  sidebar-width: 260px
  grid-gutter: 1px
  section-padding: 32px
  card-gap: 16px
  container-margin: 24px
---

## Brand & Style

The design system is centered on **Functional Serenity**. Designed specifically for shift management, it aims to reduce the cognitive load of complex scheduling through an airy, minimalist aesthetic. The personality is organized yet gentle—moving away from the stressful, high-contrast nature of traditional enterprise software toward a calm, focused environment.

The style leverages **Modern Minimalism** with a focus on tonal layering. By utilizing a soft, pastel-heavy palette and generous whitespace, the UI feels expansive. It avoids harsh borders in favor of subtle depth and soft color blocks, ensuring that the interface remains approachable even when displaying dense data.

## Colors

The palette is designed for high-speed scanning without visual fatigue. It uses a range of desaturated pastels to categorize information semantically:

- **Primary (Pastel Blue):** Used for active states, primary actions, and standard shifts.
- **Swapped Work (Buttercream/Peach):** Indicates temporary schedule changes or handovers.
- **Swapped Holiday (Soft Mint/Sage):** Represents approved time-off or shift-swaps resulting in leave.
- **OT (Lavender/Lilac):** Highlights overtime hours and extended shifts.
- **Public Holidays (Pale Blush/Coral):** Marks institutional non-working days.
- **Non-working (Soft Grey):** Used for background fills in the grid to denote weekends or unavailability.
- **Typography:** A deep charcoal (#374151) is used instead of pure black to maintain the soft, airy feel while ensuring WCAG AA legibility.

## Typography

This design system utilizes **Inter** for its exceptional legibility in data-heavy environments. The typographic hierarchy is disciplined:

- **Weight Usage:** Use `Semibold (600)` for headers to create clear anchors. Use `Medium (500)` for interactive labels and `Regular (400)` for all body text.
- **Spacing:** Slightly tighter letter-spacing is applied to larger headlines for a more "designed" editorial look, while labels use expanded letter-spacing for clarity at small sizes.
- **Color:** Headlines use the primary text color, while secondary body text should drop to a 70% opacity of the main charcoal to create a hierarchy without adding more colors.

## Layout & Spacing

The layout follows a **Fixed-Fluid Hybrid** model. 

- **Sidebar:** A sticky 260px sidebar on the left provides navigation and global filters.
- **Timeline Grid:** The main content area uses a horizontal timeline grid. Columns represent days or shifts, separated by 1px light grey (#E5E7EB) lines to create a structured but unobtrusive framework.
- **Generous Padding:** The design system mandates a minimum of 32px padding around major dashboard sections to maintain an "airy" feel. 
- **Responsive Behavior:** On tablet, the sidebar collapses into a rail. On mobile, the timeline transitions to a vertical list view, and padding reduces to 16px.

## Elevation & Depth

Depth in this design system is achieved through **Tonal Stacking** and **Soft Diffusion**. 

- **Level 0 (Background):** The base canvas is `#F8F9FA`.
- **Level 1 (Cards/Sidebar):** Pure white surfaces `#FFFFFF` with a subtle 1px border (#F3F4F6). No shadow.
- **Level 2 (Interactive/Floating):** Used for shift cards and dropdowns. Features a very soft, high-diffusion shadow: `0 4px 20px rgba(0, 0, 0, 0.04)`.
- **Level 3 (Modals):** A more pronounced but still light shadow: `0 12px 40px rgba(0, 0, 0, 0.08)`.

Avoid heavy shadows or dark overlays. Backdrop blurs (10px) are used behind modals to maintain context without visual clutter.

## Shapes

The shape language is **Soft-Modern**. All primary UI containers, buttons, and shift cards utilize a `0.5rem (8px)` corner radius. 

- **Inner Elements:** Smaller items like input fields or nested chips should use a `0.25rem (4px)` radius.
- **Pill Elements:** Status badges and "Quick-Add" buttons use a fully rounded (pill) shape to distinguish them from structural cards.

## Components

### Buttons
Action buttons should be soft-colored. Instead of high-saturation fills, use a 20% opacity version of the primary color with 100% opacity text for a "tonal" look. Hover states should increase the background opacity to 30%.

### Shift Cards
The centerpiece of the system. Each card has a left-border accent (4px width) matching its category color (e.g., Lavender for OT). Use `body-md` for the title and `label-md` for the time duration.

### Horizontal Timeline
The grid lines should be extremely faint (#F3F4F6). The current day/hour indicator is a 2px Pastel Blue line with a small circular cap at the top.

### Input Fields
Minimalist styling: 1px border (#E5E7EB), no background fill when empty. On focus, the border changes to Pastel Blue with a subtle 2px glow.

### Icons
Use **Lucide** or similar thin-stroke (2px) outlined icons. Icons should always be the same color as the text they accompany, maintaining a monochrome, clean look within the pastel blocks.

### Sticky Sidebar
The sidebar uses a clean white background with no right border; instead, a very subtle `Level 2` shadow on the right edge separates it from the main grid area.
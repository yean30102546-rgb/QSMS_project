---
name: Luminous Professional
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#43474d'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#73777d'
  outline-variant: '#c3c7cd'
  surface-tint: '#45617a'
  primary: '#45617a'
  on-primary: '#ffffff'
  primary-container: '#7c98b3'
  on-primary-container: '#113047'
  inverse-primary: '#adcae6'
  secondary: '#685970'
  on-secondary: '#ffffff'
  secondary-container: '#ecd9f4'
  on-secondary-container: '#6c5d74'
  tertiary: '#715a44'
  on-tertiary: '#ffffff'
  tertiary-container: '#ab9077'
  on-tertiary-container: '#3c2a17'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#cde5ff'
  primary-fixed-dim: '#adcae6'
  on-primary-fixed: '#001d31'
  on-primary-fixed-variant: '#2d4961'
  secondary-fixed: '#efdcf7'
  secondary-fixed-dim: '#d3c0db'
  on-secondary-fixed: '#22172a'
  on-secondary-fixed-variant: '#4f4257'
  tertiary-fixed: '#fcddc1'
  tertiary-fixed-dim: '#dfc1a6'
  on-tertiary-fixed: '#281807'
  on-tertiary-fixed-variant: '#57432e'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
typography:
  display-lg:
    fontFamily: Sarabun
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Sarabun
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-lg-mobile:
    fontFamily: Sarabun
    fontSize: 28px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-md:
    fontFamily: Sarabun
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Sarabun
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Sarabun
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: Sarabun
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Sarabun
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 64px
  container-max: 1280px
---

## Brand & Style
The design system is engineered for professional environments that require a blend of modern transparency and formal authority. The target audience includes corporate stakeholders and service providers who value clarity, precision, and a sophisticated aesthetic. 

The visual style is a refined **Glassmorphism**, characterized by frosted surfaces and subtle multi-layered depth. It maintains a professional air through the use of high-quality typography and generous white space. The emotional response should be one of "structured calm"—a UI that feels lightweight and ethereal yet remains grounded in institutional reliability.

## Colors
The palette utilizes professional pastels to soften the technical nature of glassmorphism. 
- **Primary:** A muted slate blue used for structural elements and primary actions, providing a sense of stability.
- **Secondary:** A soft lavender for accents and interactive highlights.
- **Tertiary:** A warm peach for notifications or subtle differentiators.
- **Neutral:** A range of high-transparency whites and cool grays that form the backdrop for glass effects.

Backgrounds should use a soft gradient of the secondary and tertiary colors at very low opacity (5-10%) to provide a canvas for the frosted glass containers to "pop" against.

## Typography
This design system utilizes **Sarabun** across all levels to ensure a formal, professional, and authoritative appearance, particularly optimized for Thai and Latin scripts. The type scale is generous to support legibility through frosted backgrounds. 

Headings should utilize Semi-Bold or Bold weights to establish clear hierarchy against the soft UI elements. Body text remains at a Regular weight with an increased line-height (1.6) to accommodate the visual complexity of glassmorphism. For mobile displays, headline sizes are scaled down slightly to maintain balance.

## Layout & Spacing
The system employs a **fixed-width centered grid** for desktop and a **fluid grid** for mobile devices. 
- **Desktop:** A 12-column grid with 24px gutters. Content is contained within a 1280px max-width wrapper.
- **Mobile:** A 4-column fluid grid with 16px margins.

Spacing follows a strict 8px base unit. Containers should use generous internal padding (minimum 24px) to emphasize the airy, "breathable" nature of the glass panels. Sections are separated by large vertical gaps (80px+) to maintain a minimalist aesthetic.

## Elevation & Depth
Depth is created through **Backdrop Blurs** rather than traditional heavy shadows.
- **Surface Level:** The base background is a subtle pastel gradient.
- **Tier 1 (Cards/Panels):** White fill at 60% opacity with a `backdrop-filter: blur(20px)`. Includes a 1px solid white border at 30% opacity to define the edge.
- **Tier 2 (Modals/Popovers):** White fill at 80% opacity with `backdrop-filter: blur(40px)`.
- **Shadows:** Use extremely soft, ambient "color-tinted" shadows. For example, a primary-colored button would have a soft blue shadow with a 20px blur and only 10% opacity.

## Shapes
The shape language is "Softly Geometric." A corner radius of 0.5rem (8px) is the standard for most components, providing a modern look that is approachable but remains professional. Large containers like cards or main content areas should scale up to 1rem (16px) or 1.5rem (24px) to emphasize the "object-like" quality of the glass panels.

## Components
- **Buttons:** Primary buttons use a solid primary color with a very slight inner glow. Secondary buttons use the glass effect (translucent white with blur) and a subtle 1px border.
- **Input Fields:** Semi-transparent backgrounds (20% opacity) that become more opaque (40%) on focus. Labels sit just above the field using the `label-md` style.
- **Cards:** The hallmark of the system. Utilize the Tier 1 Glassmorphism spec. No heavy borders; use a light 1px white stroke to catch the "light."
- **Chips/Tags:** Pill-shaped with a low-contrast version of the primary or secondary color.
- **Progress Indicators:** Use thin, elegant lines. Avoid chunky bars.
- **Navigation:** A persistent glass "dock" or header that blurs the content beneath it as the user scrolls.
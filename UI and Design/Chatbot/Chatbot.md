---
name: Honey-Infused Conversational System
colors:
  surface: '#fff8f7'
  surface-dim: '#e3d7d7'
  surface-bright: '#fff8f7'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fdf1f0'
  surface-container: '#f7ebeb'
  surface-container-high: '#f1e6e5'
  surface-container-highest: '#ebe0df'
  on-surface: '#201a1a'
  on-surface-variant: '#514532'
  inverse-surface: '#352f2f'
  inverse-on-surface: '#faeeee'
  outline: '#837560'
  outline-variant: '#d5c4ab'
  surface-tint: '#7c5800'
  primary: '#7c5800'
  on-primary: '#ffffff'
  primary-container: '#ffb800'
  on-primary-container: '#6b4c00'
  inverse-primary: '#ffba20'
  secondary: '#755b00'
  on-secondary: '#ffffff'
  secondary-container: '#ffd666'
  on-secondary-container: '#765c00'
  tertiary: '#625f50'
  on-tertiary: '#ffffff'
  tertiary-container: '#cac5b3'
  on-tertiary-container: '#545244'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdea8'
  primary-fixed-dim: '#ffba20'
  on-primary-fixed: '#271900'
  on-primary-fixed-variant: '#5e4200'
  secondary-fixed: '#ffdf90'
  secondary-fixed-dim: '#e9c254'
  on-secondary-fixed: '#241a00'
  on-secondary-fixed-variant: '#584400'
  tertiary-fixed: '#e8e2d0'
  tertiary-fixed-dim: '#ccc6b5'
  on-tertiary-fixed: '#1e1c11'
  on-tertiary-fixed-variant: '#4a4739'
  background: '#fff8f7'
  on-background: '#201a1a'
  surface-variant: '#ebe0df'
typography:
  display-lg:
    fontFamily: Quicksand
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Quicksand
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Quicksand
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Quicksand
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Quicksand
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 28px
  body-md:
    fontFamily: Quicksand
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
  label-md:
    fontFamily: Quicksand
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Quicksand
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.03em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin-mobile: 20px
  margin-desktop: 40px
---

## Brand & Style

The design system is centered around a warm, helpful, and energetic bee mascot. The personality is "optimistically industrious"—hardworking like a bee but soft, approachable, and friendly. The target audience includes users seeking a stress-free, supportive support or assistant experience.

The visual style is a blend of **Modern Minimalism** and **Tactile Softness**. It avoids sharp edges and clinical coldness, opting instead for organic "bubbly" forms, high-quality white space, and a vibrant honey-inspired palette. The UI should feel like it has physical volume—soft, squishy, and inviting to touch—evoking a sense of comfort and reliability.

## Colors

The palette is derived from the natural warmth of honey and the sharp legibility of a bee's markings.

- **Primary (Honey Yellow):** Used for primary actions, the mascot's brand identity, and key highlights.
- **Secondary (Soft Amber):** Used for hover states, accents, and secondary decorative elements like honeycomb patterns.
- **Tertiary (Warm Cream):** A soft off-white used for container backgrounds to reduce eye strain compared to pure white.
- **Neutral (Charcoal):** A rich, warm dark grey used for typography and icons to ensure high contrast without the harshness of pure black.
- **Functional Whites:** Pure white is reserved for high-elevation elements like chat bubbles and input surfaces.

## Typography

This design system utilizes **Quicksand** exclusively to maintain a consistent, rounded, and friendly voice. The rounded terminals of the typeface mirror the "bubbly" shape language of the UI components.

Headlines should be bold and impactful to establish hierarchy, while body text maintains a medium weight (500) to ensure the rounded stems remain legible and clear at smaller sizes. Avoid all-caps styling unless used for very small labels or "micro-copy" to prevent the tone from appearing aggressive.

## Layout & Spacing

The layout philosophy follows a **Fluid Grid** with generous internal padding to enhance the "breathable" feel of the interface. 

- **Chat Interface:** Uses a centered max-width (800px) on desktop to maintain focus.
- **Rhythm:** A 4px baseline grid ensures consistent vertical rhythm.
- **Margins:** Use larger margins (24px+) between distinct chat messages to allow the mascot's personality to shine through in the negative space.
- **Mobile:** Elements should stretch full-width with 20px side margins, ensuring touch targets for buttons and chips are at least 48px in height.

## Elevation & Depth

Hierarchy is established through **Ambient Shadows** and **Tonal Layering**. 

- **Surface 0 (Background):** The base layer uses the Tertiary Warm Cream (#FFF9E6).
- **Surface 1 (Cards/Bubbles):** White (#FFFFFF) surfaces with a very soft, diffused shadow (Blur: 20px, Y: 4px, Opacity: 8% Charcoal).
- **Floating Action Button:** Uses a more pronounced "squishy" shadow (Blur: 15px, Y: 8px, Opacity: 20% Primary Color) to make the mascot appear as if it is hovering above the glass.
- **Interactive States:** When pressed, elements should appear to sink (shadow decreases) or "pop" (shadow increases and element scales slightly) to provide tactile feedback.

## Shapes

The shape language is **Pill-shaped (3)**. This extreme roundedness is essential to the "cute" and "friendly" brand personality. 

- **Chat Bubbles:** Should use asymmetrical rounding. The corner closest to the sender's avatar has a smaller radius (8px), while the other three corners are fully pill-shaped (24px+).
- **Icons:** Use rounded caps and joins exclusively.
- **Hexagons:** Subtle honeycomb patterns can be used as background textures or mask shapes for avatars to reinforce the bee theme.

## Components

### Chat Bubbles
- **User Bubbles:** Charcoal background with White text. Aligned to the right.
- **Bot (Bee) Bubbles:** White background with Charcoal text and a Primary Honey Yellow border (2px). Aligned to the left, paired with a mascot avatar.
- **Spacing:** Grouped messages from the same sender have tighter vertical spacing (4px) than changes in speaker (16px).

### Input Field
- **Surface:** A "stadium" shaped pill container.
- **Interaction:** On focus, the border transitions from Neutral-light to Primary Honey Yellow.
- **Action:** The "Send" button should be a circular icon button inside the input field, using the Primary Honey Yellow color.

### Floating Action Button (FAB)
- **Mascot Integration:** The FAB is not just a button but a container for the mascot. Use the mascot's face or a full-body miniature.
- **Motion:** The FAB should have a gentle "floating" animation (subtle Y-axis translation) to feel alive.

### Chips & Buttons
- **Style:** Fully rounded buttons with significant horizontal padding (24px).
- **Primary Button:** Solid Honey Yellow with Charcoal text for maximum accessibility.
- **Secondary Button:** Ghost style with a Honey Yellow outline and text.

### Progress Indicators
- Use a "filling honeycomb" animation instead of a standard circular spinner for a distinctive, branded loading state.
# Daisy Han Consulting — Design System
*Single source of truth for UI development and stakeholder review*

---

## 1. Color Tokens

Derived from the brand logo: a sunrise circle with horizontal color bands on warm taupe backgrounds.

### Brand Palette (from logo stripes, top → bottom)

| Token | Name | Hex | Usage |
|---|---|---|---|
| `--color-sun-gold` | Sun Gold | `#F2C02E` | Highlight accents, CTAs |
| `--color-sun-amber` | Sun Amber | `#F07A28` | Secondary actions, hover states |
| `--color-sun-coral` | Sun Coral | `#E84E28` | Alert accents, bold accents |
| `--color-sun-crimson` | Sun Crimson | `#E02458` | Semantic: warning, emphasis |
| `--color-sun-teal` | Sun Teal | `#28A880` | Primary brand color, links |
| `--color-sun-blue` | Sun Blue | `#2870BC` | Interactive elements, focus rings |
| `--color-sun-navy` | Sun Navy | `#1C3870` | Headings, dark surfaces |

### Neutral Palette (from logo background)

| Token | Name | Hex | Usage |
|---|---|---|---|
| `--color-taupe` | Warm Taupe | `#AEA290` | Secondary backgrounds, borders |
| `--color-linen` | Warm Linen | `#DDD5C4` | Section backgrounds, dividers |
| `--color-cream` | Cream | `#F5F0E8` | Page background, card surfaces |
| `--color-white` | White | `#FFFFFF` | Pure white surfaces |
| `--color-ink` | Deep Ink | `#1A1714` | Body text |
| `--color-slate` | Warm Slate | `#4A4540` | Secondary text |
| `--color-mist` | Mist | `#7A746E` | Placeholder text, captions |

### Semantic Tokens

| Token | Hex | Usage |
|---|---|---|
| `--color-primary` | `#28A880` (Sun Teal) | Primary actions, links |
| `--color-primary-dark` | `#1C7A60` | Hover on primary |
| `--color-accent` | `#F2C02E` (Sun Gold) | Highlights, badges |
| `--color-accent-warm` | `#F07A28` (Sun Amber) | Secondary accent |
| `--color-surface` | `#F5F0E8` (Cream) | Page/card background |
| `--color-surface-raised` | `#DDD5C4` (Linen) | Elevated sections |
| `--color-error` | `#E02458` (Sun Crimson) | Form errors |
| `--color-success` | `#28A880` (Sun Teal) | Success states |
| `--color-text` | `#1A1714` (Ink) | Primary text |
| `--color-text-secondary` | `#4A4540` (Slate) | Secondary text |
| `--color-text-muted` | `#7A746E` (Mist) | Placeholder, caption |
| `--color-border` | `#DDD5C4` (Linen) | Borders, dividers |

---

## 2. Typography System

Pairing: **Display serif** (authority, editorial) + **Clean humanist sans** (readability, warmth)

### Font Families

```css
--font-display: 'Cormorant Garamond', Georgia, serif;   /* headings, hero */
--font-body:    'DM Sans', 'Helvetica Neue', sans-serif; /* body, UI labels */
--font-mono:    'DM Mono', monospace;                    /* code, stats */
```

> Load via Google Fonts: `Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,600&DM+Sans:wght@300;400;500;600&DM+Mono`

### Type Scale

| Token | Element | Size | Weight | Line-height | Tracking | Font |
|---|---|---|---|---|---|---|
| `--text-hero` | Hero H1 | `clamp(52px, 7vw, 88px)` | 500 | 1.05 | -0.03em | Display |
| `--text-h1` | H1 | `clamp(40px, 5vw, 64px)` | 500 | 1.1 | -0.025em | Display |
| `--text-h2` | H2 | `clamp(28px, 3.5vw, 44px)` | 500 | 1.15 | -0.02em | Display |
| `--text-h3` | H3 | `clamp(22px, 2.5vw, 32px)` | 500 | 1.2 | -0.015em | Display |
| `--text-h4` | H4 | `20px` | 500 | 1.3 | -0.01em | Display |
| `--text-h5` | H5 | `17px` | 600 | 1.4 | 0.02em | Body |
| `--text-h6` | H6 | `14px` | 600 | 1.4 | 0.06em | Body |
| `--text-body-lg` | Body large | `18px` | 300 | 1.75 | 0 | Body |
| `--text-body` | Body | `16px` | 400 | 1.7 | 0 | Body |
| `--text-body-sm` | Body small | `14px` | 400 | 1.65 | 0 | Body |
| `--text-caption` | Caption | `12px` | 500 | 1.5 | 0.04em | Body |
| `--text-label` | Label/tag | `11px` | 600 | 1.4 | 0.1em | Body |
| `--text-stat` | Impact numbers | `clamp(40px, 5vw, 64px)` | 300 | 1 | -0.03em | Mono |

### Typographic Treatments

- **Italic serif accent**: Key words in headings use `font-style: italic` in display font — editorial, distinctive
- **Uppercase labels**: Section labels/eyebrows in `--text-label`, uppercase, wide tracking, Sun Teal color
- **Stat numerals**: Display numbers in `--font-mono`, light weight, paired with small sans label beneath

---

## 3. Spacing & Layout

### Spacing Scale

```css
--space-1:  4px
--space-2:  8px
--space-3:  12px
--space-4:  16px
--space-5:  24px
--space-6:  32px
--space-7:  48px
--space-8:  64px
--space-9:  96px
--space-10: 128px
--space-11: 160px
--space-12: 200px
```

### Grid System

| Property | Value |
|---|---|
| Columns | 12 |
| Gutter | `clamp(16px, 2.5vw, 32px)` |
| Container max-width | `1280px` |
| Container padding | `clamp(16px, 5vw, 80px)` |

### Breakpoints

| Name | Width | Notes |
|---|---|---|
| `sm` | `480px` | Large phones |
| `md` | `768px` | Tablets |
| `lg` | `1024px` | Small desktop |
| `xl` | `1280px` | Standard desktop |
| `2xl` | `1536px` | Large desktop |

### Section Padding

```css
--section-padding-y: clamp(64px, 8vw, 120px);
--section-padding-x: clamp(16px, 5vw, 80px);
```

### Depth / Surface Layers

| Layer | Z-index | Use |
|---|---|---|
| Base | 0 | Page background, body text |
| Elevated | 10 | Cards, form inputs |
| Floating | 100 | Dropdowns, tooltips |
| Overlay | 500 | Modals, drawers |
| Toast | 1000 | Notifications |

---

## 4. Component Inventory

### Navigation
- **Navbar** — Logo left, nav links center/right, CTA button right
  - States: default, scrolled (adds shadow + solid bg), mobile (hamburger)
  - Sticky on scroll

### Buttons

| Variant | Style | Use |
|---|---|---|
| Primary | Solid Sun Teal bg, white text, 6px radius | Main CTA |
| Secondary | Outline Sun Teal border, teal text | Secondary actions |
| Ghost | No border, teal text, underline on hover | Tertiary links |
| Accent | Sun Gold bg, ink text | Highlight CTA |

- States: default → hover (lift + darken) → active (press down) → focus-visible (ring) → disabled (muted)
- Padding: `12px 28px` (default), `10px 20px` (sm), `16px 36px` (lg)
- No transition-all — animate `transform` and `background-color` separately

### Cards

| Variant | Use |
|---|---|
| Service Card | Icon + title + description, cream bg, linen border |
| Stat Card | Large number + label, minimal, no border |
| Testimonial Card | Quote + attribution, taupe bg, italic serif quote |
| Team/Bio Card | Photo + name + role |

- Elevation: `box-shadow: 0 2px 4px rgba(26,23,20,0.04), 0 8px 24px rgba(26,23,20,0.06)`
- Hover: lift `translateY(-4px)`, shadow deepens
- Border-radius: `8px` (standard), `4px` (compact)

### Form Elements

| Element | Style |
|---|---|
| Input | Cream bg, linen border → teal focus ring, 8px radius |
| Textarea | Same as input, min-height 120px |
| Label | `--text-label` uppercase, 8px below-label margin |
| Submit | Primary button, full-width on mobile |
| Error state | Crimson border + error text beneath |

### Section Components

| Component | Notes |
|---|---|
| Section Eyebrow | Uppercase label tag above heading |
| Divider | 1px linen line or decorative sun arc |
| Stats Row | Horizontal flex of stat cards, centered |
| Quote / Pull Quote | Large italic serif, left border accent |
| Tag / Badge | Pill shape, label text, linen bg |

### Navigation / Wayfinding

- Anchor nav (in-page links to sections)
- Footer nav: grouped link columns
- Breadcrumb (if multi-page)

---

## 5. Interaction & Animation Notes

### Principles
- Only animate `transform` and `opacity` — never `transition-all`
- Use spring-like easing: `cubic-bezier(0.34, 1.56, 0.64, 1)` for lifts
- Standard ease: `cubic-bezier(0.4, 0, 0.2, 1)`
- Duration scale: `100ms` (instant), `200ms` (micro), `300ms` (standard), `500ms` (entrance)

### Hover States (every interactive element)

```css
/* Button lift */
transform: translateY(-2px);
box-shadow: 0 6px 20px rgba(40,168,128,0.25);
transition: transform 200ms cubic-bezier(0.34,1.56,0.64,1),
            box-shadow 200ms ease;

/* Card lift */
transform: translateY(-4px);
transition: transform 300ms cubic-bezier(0.34,1.56,0.64,1),
            box-shadow 300ms ease;

/* Link underline */
text-underline-offset: 3px;
transition: color 150ms ease;
```

### Focus States
- `focus-visible` ring: `2px solid var(--color-sun-teal)` with `2px offset`
- Never remove outline entirely — always show focus for keyboard nav

### Page Load / Entrance Animations
- Hero: heading fades up with `opacity: 0 → 1` + `translateY(24px → 0)`, staggered per word/line
- Sections: fade-in on scroll via `IntersectionObserver`, `translateY(16px → 0)`
- Stats: count-up animation when section enters viewport

### Transitions
```css
--transition-fast:     150ms cubic-bezier(0.4,0,0.2,1);
--transition-standard: 300ms cubic-bezier(0.4,0,0.2,1);
--transition-spring:   300ms cubic-bezier(0.34,1.56,0.64,1);
--transition-slow:     500ms cubic-bezier(0.4,0,0.2,1);
```

---

## 6. Page-Level Layout Descriptions

### Navigation Bar
- **Height**: 72px desktop / 60px mobile
- **Layout**: Logo (left) | Nav links (center, spaced 32px) | CTA button (right)
- **Behavior**: Transparent on hero → solid cream bg + subtle shadow on scroll
- **Mobile**: Hamburger → full-screen or slide-in drawer

---

### Hero Section
- **Height**: 100vh (min 600px)
- **Layout**: Left-aligned text block (60% width desktop), decorative element right
- **Heading**: Display font, italic accent word (e.g. "for *meaningful* change")
- **Subhead**: Body large, 400–450 chars max, warm slate color
- **CTA**: Primary + Ghost button pair, 16px gap
- **Background**: Cream base with subtle warm gradient or texture
- **Decorative**: Sunrise arc or abstract warm gradient shape (drawn from logo palette)

---

### About / Intro Section
- **Layout**: 2-col — large stat/proof point left, editorial body text right (or full-width with offset heading)
- **Heading**: H2, display serif
- **Body**: Body large, generous line-height
- **Accent**: Italic pull quote or highlighted sentence in teal
- **Background**: White or cream

---

### Services Section
- **Layout**: Section eyebrow → H2 → 3-col card grid (stacks to 1-col mobile)
- **Cards**: Icon + service title + description (50–80 words)
- **Hover**: Card lifts, teal border top appears
- **Background**: Linen (`#DDD5C4`) to distinguish from adjacent sections

---

### Impact / Stats Section
- **Layout**: Full-width, centered, dark bg (Navy `#1C3870`) or warm taupe
- **Content**: 3–5 stat cards in a row — large number (mono) + label beneath
- **Animation**: Numbers count up on scroll entrance
- **Background**: Dark navy OR rich taupe — high contrast to surrounding sections

---

### Philosophy / Values Section
- **Layout**: Alternating or editorial — large pull quote + supporting paragraphs
- **Typography**: Oversized italic serif quote, body for supporting text
- **Accent**: Left border in Sun Gold or Sun Teal on quote block
- **Background**: Cream or off-white

---

### Testimonials Section
- **Layout**: Single featured quote (large) OR 2–3 card carousel
- **Style**: Italic serif quote, client name + title beneath
- **Background**: Taupe or linen
- **Decoration**: Large opening quotation mark in teal, low opacity

---

### Who We Serve / Ideal Client Section
- **Layout**: H2 + body intro → bulleted list or icon+label grid
- **Style**: Clean, minimal — lets copy breathe
- **Background**: White

---

### Contact / CTA Section
- **Layout**: 2-col — left: heading + brief copy + contact details | right: form
- **Form fields**: Name, Email, Company, Message, Submit
- **Heading**: "Ready to work together?" in display serif
- **Background**: Cream or light linen
- **CTA button**: Primary full-width on mobile

---

### Footer
- **Layout**: Logo + tagline (left) | Nav groups (center) | Contact/social (right)
- **Divider**: 1px linen line above footer
- **Background**: Navy (`#1C3870`) with light text OR cream with ink text
- **Bottom bar**: Copyright line, legal links — muted text, smaller scale

---

## 7. Shadows & Depth Tokens

```css
--shadow-subtle:  0 1px 3px rgba(26,23,20,0.06), 0 1px 2px rgba(26,23,20,0.04);
--shadow-card:    0 2px 8px rgba(26,23,20,0.06), 0 8px 24px rgba(26,23,20,0.08);
--shadow-raised:  0 4px 16px rgba(26,23,20,0.08), 0 16px 40px rgba(26,23,20,0.10);
--shadow-floating: 0 8px 32px rgba(26,23,20,0.12), 0 24px 64px rgba(26,23,20,0.12);
--shadow-teal:    0 6px 20px rgba(40,168,128,0.20);   /* tinted: primary CTAs */
--shadow-gold:    0 6px 20px rgba(242,192,46,0.25);   /* tinted: accent elements */
```

---

## 8. Border Radius Tokens

```css
--radius-sm:   4px   /* compact elements, tags */
--radius-md:   8px   /* cards, inputs, buttons */
--radius-lg:   16px  /* large cards, modals */
--radius-xl:   24px  /* featured blocks */
--radius-full: 9999px /* pills, avatars */
```

---

## 9. Recommended Figma File Structure

| Page | Purpose |
|---|---|
| 🎨 Design Tokens | Colors, typography, spacing as named styles |
| 🧩 Component Library | All UI components with variants and states |
| 📐 Page Layouts | Wireframe-level layouts per section |
| 📋 Spec Sheet | Developer handoff notes, measurements, behavior |
| 💬 Stakeholder Review | Annotated comps for non-technical feedback |

---

*Generated: 2026-03-22 | Brand: Daisy Han Consulting LLC*

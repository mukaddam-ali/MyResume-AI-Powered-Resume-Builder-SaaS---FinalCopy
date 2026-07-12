# MyResume — Design System Documentation

> **Purpose:** This document is the single source of truth for the visual and interaction design of the MyResume application. Every new component, page, or feature must adhere to the patterns defined here to maintain design cohesion.

---

## Table of Contents

1. [Brand and Identity](#1-brand-and-identity)
2. [Color System](#2-color-system)
3. [Typography](#3-typography)
4. [Spacing and Layout](#4-spacing-and-layout)
5. [Border Radius](#5-border-radius)
6. [Shadows and Elevation](#6-shadows-and-elevation)
7. [Animation and Motion](#7-animation-and-motion)
8. [Component Library (shadcn/ui)](#8-component-library-shadcnui)
9. [Page-Level Design Patterns](#9-page-level-design-patterns)
10. [Resume Template Designs](#10-resume-template-designs)
11. [Editor UI Patterns](#11-editor-ui-patterns)
12. [Premium and Upgrade UI](#12-premium-and-upgrade-ui)
13. [Dark Mode](#13-dark-mode)
14. [Print and PDF Styles](#14-print-and-pdf-styles)
15. [Responsive Design](#15-responsive-design)
16. [Icon System](#16-icon-system)
17. [Accessibility](#17-accessibility)

---

## 1. Brand and Identity

| Property           | Value                                              |
| ------------------ | -------------------------------------------------- |
| **App Name**       | MyResume                                           |
| **Tagline**        | "Build ATS-Friendly Resumes in Minutes"            |
| **Target Audience**| CS students and early-career professionals         |
| **Brand Voice**    | Professional, clean, empowering                    |
| **Logo**           | `FileText` icon (Lucide) + bold text "MyResume"    |
| **Primary CTA**    | "Build My Resume" -> `/editor`                     |
| **Default Theme**  | Light mode (`defaultTheme="light"`)                |

---

## 2. Color System

The color system is built on **CSS custom properties** defined in `app/globals.css` and extended via `tailwind.config.ts`. All colors are **semantic tokens** — never use raw hex values directly in components; reference the token names.

### 2.1 Light Mode (`:root`)

| Token                          | Value       | Usage                                      |
| ------------------------------ | ----------- | ------------------------------------------ |
| `--background`                 | `#ffffff`   | Page background                            |
| `--foreground`                 | `#0a0a0a`   | Default text                               |
| `--card`                       | `#ffffff`   | Card surfaces                              |
| `--card-foreground`            | `#0a0a0a`   | Text on cards                              |
| `--popover`                    | `#ffffff`   | Popover / dropdown background              |
| `--popover-foreground`         | `#0a0a0a`   | Text on popovers                           |
| `--primary`                    | `#BF4D00`   | Brand accent — buttons, links, highlights  |
| `--primary-foreground`         | `#ffffff`   | Text on primary backgrounds                |
| `--secondary`                  | `#f5f5f5`   | Secondary buttons, badges, subtle surfaces |
| `--secondary-foreground`       | `#171717`   | Text on secondary surfaces                 |
| `--muted`                      | `#f5f5f5`   | Muted/subdued surfaces, skeletons          |
| `--muted-foreground`           | `#5b5b5b`   | Placeholder text, meta text, captions      |
| `--accent`                     | `#f5f5f5`   | Hover highlight for ghost elements         |
| `--accent-foreground`          | `#171717`   | Text on accent surfaces                    |
| `--destructive`                | `#ef4444`   | Delete actions, error states               |
| `--border`                     | `#e5e5e5`   | Dividers, card edges, input borders        |
| `--input`                      | `#e5e5e5`   | Input field borders                        |
| `--ring`                       | `#BF4D00`   | Focus ring color                           |

#### Sidebar Tokens (Light)

| Token                          | Value       |
| ------------------------------ | ----------- |
| `--sidebar`                    | `#fafafa`   |
| `--sidebar-foreground`         | `#0a0a0a`   |
| `--sidebar-primary`            | `#BF4D00`   |
| `--sidebar-primary-foreground` | `#ffffff`   |
| `--sidebar-accent`             | `#f5f5f5`   |
| `--sidebar-accent-foreground`  | `#171717`   |
| `--sidebar-border`             | `#e5e5e5`   |
| `--sidebar-ring`               | `#BF4D00`   |

#### Chart Colors (Light)

| Token       | Value       |
| ----------- | ----------- |
| `--chart-1` | `#e76e50`   |
| `--chart-2` | `#2a9d90`   |
| `--chart-3` | `#274754`   |
| `--chart-4` | `#e9c46a`   |
| `--chart-5` | `#f4a462`   |

### 2.2 Dark Mode (`.dark`)

| Token                   | Value                       |
| ----------------------- | --------------------------- |
| `--background`          | `#0a0a0a`                   |
| `--foreground`          | `#fafafa`                   |
| `--card`                | `#171717`                   |
| `--card-foreground`     | `#fafafa`                   |
| `--popover`             | `#171717`                   |
| `--popover-foreground`  | `#fafafa`                   |
| `--primary`             | `#BF4D00`                   |
| `--primary-foreground`  | `#ffffff`                   |
| `--secondary`           | `#262626`                   |
| `--secondary-foreground`| `#fafafa`                   |
| `--muted`               | `#262626`                   |
| `--muted-foreground`    | `#b5b5b5`                   |
| `--accent`              | `#262626`                   |
| `--accent-foreground`   | `#fafafa`                   |
| `--destructive`         | `#dc2626`                   |
| `--border`              | `rgba(255, 255, 255, 0.1)`  |
| `--input`               | `rgba(255, 255, 255, 0.15)` |
| `--ring`                | `#BF4D00`                   |
| `--sidebar`             | `#171717`                   |
| `--sidebar-ring`        | `#737373`                   |

### 2.3 Brand Accent Colors (Non-Token)

Used sparingly for icon color-coding in feature cards and editor UI panels:

| Name         | Hex       | Usage                              |
| ------------ | --------- | ---------------------------------- |
| Texas Red    | `#CC5500` | Editor accent (Burnt Orange)       |
| Deep Blue    | `#003366` | Secondary brand accent             |
| Classic Blue | `#112e51` | Default resume theme color         |
| Emerald      | `#059669` | Resume accent option               |
| Purple       | `#7c3aed` | Resume accent option               |
| Rose         | `#e11d48` | Resume accent option               |
| Charcoal     | `#333333` | Resume accent option               |
| Teal         | `#0d9488` | Resume accent option               |

### 2.4 Semantic Color Usage Rules

- **Primary (#BF4D00)** — Use for primary CTAs, active states, focus rings, and brand highlights.
- **Destructive (red)** — Use exclusively for delete/remove actions. Never repurpose for warnings.
- **Amber/Yellow gradient** — Reserved for the Premium/Pro upgrade flow only (`from-amber-500 to-yellow-600`).
- **Blue tones** — Used for feature card icons and hero backgrounds (`blue-500/20`).
- **Purple tones** — Used for ColorPicker icon backgrounds (`purple-100 / purple-900`).
- **Green** — Used for success states (sync confirmed, ATS-friendly badge, emerald toggle).

---

## 3. Typography

### 3.1 Application UI Font

| Role          | Font       | CSS Variable      |
| ------------- | ---------- | ----------------- |
| **UI Default**| Inter      | `--font-inter`    |
| **Monospace** | Geist Mono | `--font-geist-mono`|

The root `<html>` element receives `font-size: 16px`. The `<body>` uses `font-sans` (Inter), `antialiased`, and `min-h-screen flex flex-col`.

### 3.2 Resume Document Fonts

These fonts are selectable within the resume editor. They are loaded via Google Fonts and mapped through Tailwind CSS variables.

#### Free Tier

| ID             | Display Name        | Family String               |
| -------------- | ------------------- | --------------------------- |
| `inter`        | Inter (Clean)       | `Inter, sans-serif`         |
| `roboto`       | Roboto (Classic)    | `Roboto, sans-serif`        |
| `merriweather` | Merriweather (Slab) | `Merriweather, serif`       |
| `oswald`       | Oswald (Condensed)  | `Oswald, sans-serif`        |

#### Premium Tier (Pro Only)

| ID                  | Display Name           | Family String                    |
| ------------------- | ---------------------- | -------------------------------- |
| `manrope`           | Manrope (Modern)       | `Manrope, sans-serif`            |
| `dm-sans`           | DM Sans (Friendly)     | `DM Sans, sans-serif`            |
| `montserrat`        | Montserrat (Geometric) | `Montserrat, sans-serif`         |
| `raleway`           | Raleway (Elegant)      | `Raleway, sans-serif`            |
| `space-grotesk`     | Space Grotesk (Tech)   | `Space Grotesk, sans-serif`      |
| `playfair`          | Playfair Display       | `Playfair Display, serif`        |
| `lora`              | Lora (Calligraphic)    | `Lora, serif`                    |
| `pt-serif`          | PT Serif (Academic)    | `PT Serif, serif`                |
| `libre-baskerville` | Libre Baskerville      | `Libre Baskerville, serif`       |
| `crimson-pro`       | Crimson Pro            | `Crimson Pro, serif`             |

**Rules:**
- Default font for new resumes: `roboto`
- Premium fonts show a `Crown` icon (`text-yellow-500`) in the font selector dropdown
- Free users with a premium font saved fall back to `roboto` in the rendered output

### 3.3 Text Scale Conventions (UI)

| Classes                                            | Usage                        |
| -------------------------------------------------- | ---------------------------- |
| `text-4xl` / `text-7xl font-extrabold`             | Hero H1                      |
| `text-3xl` / `text-5xl font-bold`                  | Section headings (H2)        |
| `text-xl font-bold`                                | Card titles, resume name     |
| `text-lg font-bold`                                | Feature card titles          |
| `text-sm font-semibold`                            | Panel labels                 |
| `text-xs text-muted-foreground`                    | Metadata, timestamps         |

---

## 4. Spacing and Layout

### 4.1 Page Container

All public pages use a centered max-width container:

```
mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8
```

The dashboard and editor use `max-w-7xl` with the same padding scale.

### 4.2 Section Spacing

| Context                  | Classes                                         |
| ------------------------ | ----------------------------------------------- |
| Home page sections       | `py-24 md:py-32`                                |
| CTA section              | `py-20`                                         |
| Navbar height            | `h-14`                                          |
| Footer height (desktop)  | `md:h-24`                                       |
| Card padding             | `p-5` or `p-6`                                  |
| Editor panel (header)    | `py-4 px-3`                                     |
| Editor panel (body)      | `py-6 px-3`                                     |

### 4.3 Grid Systems

- **Features grid:** `sm:grid-cols-2 md:grid-cols-3` with `gap-4`
- **Template gallery:** 3-column grid with animated cards
- **Editor customization row:** `grid-cols-1 md:grid-cols-2 gap-4`
- **Resume card:** `flex flex-col sm:flex-row` with `sm:h-[280px]`

---

## 5. Border Radius

| Token          | Value                         | Tailwind Class |
| -------------- | ----------------------------- | -------------- |
| `--radius`     | `0.625rem` (10px)             | `rounded-lg`   |
| `--radius-sm`  | `calc(var(--radius) - 4px)`   | `rounded-sm`   |
| `--radius-md`  | `calc(var(--radius) - 2px)`   | `rounded-md`   |
| `--radius-xl`  | `calc(var(--radius) + 4px)`   | `rounded-xl`   |
| `--radius-2xl` | `calc(var(--radius) + 8px)`   | `rounded-2xl`  |
| `--radius-3xl` | `calc(var(--radius) + 12px)`  | `rounded-3xl`  |
| `--radius-4xl` | `calc(var(--radius) + 16px)`  | `rounded-4xl`  |

**Rules:**
- Cards and Panels: `rounded-lg` or `rounded-xl`
- Buttons: `rounded-md` (default), `rounded-full` (pill CTAs in Hero)
- Badges and Tags: `rounded-full`
- Import panel: `rounded-2xl`
- CTA section box: `rounded-3xl`
- Color swatches: `rounded-full`

---

## 6. Shadows and Elevation

| Context                      | Shadow Class / Style                              |
| ---------------------------- | ------------------------------------------------- |
| Feature cards                | `shadow-sm hover:shadow-md`                       |
| Hero primary CTA button      | `shadow-xl shadow-blue-500/20`                    |
| Resume card                  | `hover:shadow-lg transition-shadow duration-300`  |
| Import panel                 | `shadow-lg`                                       |
| Resume preview (quick view)  | `shadow-2xl`                                      |
| Editor color picker card     | `shadow-sm border`                                |
| Hero preview browser mockup  | `shadow-2xl` inside `rounded-xl`                  |
| Upgrade button               | `shadow-lg hover:shadow-xl transition-shadow`     |

**Elevation principle:** Higher elevation = more prominent interaction area. Use `shadow-2xl` only for modal-scale previews.

---

## 7. Animation and Motion

### 7.1 Libraries

- **Framer Motion** — used via `LazyMotion` + `domAnimation` to load only ~18 KB of features (vs ~100 KB full bundle). Always prefer `LazyMotion` + `m.*` components over importing `motion.*` directly.
- **Tailwind CSS Animate** (`tailwindcss-animate`) — used for CSS-only entry animations on the hero section.

### 7.2 Standard Animation Variants

#### Hero Section — Entry Stagger (Framer Motion)

```typescript
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "tween", ease: "easeOut", duration: 0.4 } }
};
```

#### Feature Cards — Scroll-Triggered (Framer Motion)

```typescript
const featureContainerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
};

const featureCardVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut" } }
};
// Applied with: whileInView="visible" viewport={{ once: true, margin: "-100px" }}
// Hover lift: whileHover={{ y: -5 }}
```

#### Import Resume Panel — Collapse/Expand (AnimatePresence)

```typescript
initial={{ opacity: 0, height: 0, y: -8 }}
animate={{ opacity: 1, height: "auto", y: 0 }}
exit={{ opacity: 0, height: 0, y: -8 }}
transition={{ duration: 0.3, ease: "easeOut" }}
// Always wrap conditional renders in <AnimatePresence>
```

### 7.3 CSS Animate Utilities (Tailwind)

| Class                                                | Usage                        |
| ---------------------------------------------------- | ---------------------------- |
| `md:animate-in md:fade-in md:slide-in-from-bottom-4 md:duration-500` | Hero child element entries |
| `md:delay-100` through `md:delay-500`                | Staggered hero delays        |
| `animate-pulse`                                      | Skeleton placeholder shimmer |
| `animate-spin`                                       | Loading spinners             |

### 7.4 Transition Utilities

| Class                                                | Usage                               |
| ---------------------------------------------------- | ----------------------------------- |
| `transition-all`                                     | General hover transitions           |
| `transition-shadow duration-300`                     | Card hover shadow                   |
| `transition-colors`                                  | Button/link color changes           |
| `hover:scale-105`                                    | Hero primary button hover lift      |
| `hover:scale-110`                                    | Color swatch selection ring         |
| `opacity-0 group-hover:opacity-100 transition-opacity` | Hover reveal pattern              |
| `translate-y-2 group-hover:translate-y-0`            | Hover slide-in for overlay buttons  |

### 7.5 Accordion Animation (Radix + Tailwind)

```
accordion-down: height 0 -> var(--radix-accordion-content-height), 0.2s ease-out
accordion-up:   height var(--radix-accordion-content-height) -> 0, 0.2s ease-out
```

---

## 8. Component Library (shadcn/ui)

All UI primitives come from **shadcn/ui** (built on Radix UI). Component files live in `components/ui/`.

### 8.1 Button

**Variants:**

| Variant       | Style                                                                                         |
| ------------- | --------------------------------------------------------------------------------------------- |
| `default`     | `bg-primary text-primary-foreground hover:bg-primary/90`                                      |
| `destructive` | `bg-destructive text-white hover:bg-destructive/90`                                           |
| `outline`     | `border bg-background shadow-xs hover:bg-accent`                                              |
| `secondary`   | `bg-secondary text-secondary-foreground hover:bg-secondary/80`                                |
| `ghost`       | `hover:bg-accent hover:text-accent-foreground`                                                |
| `link`        | `text-primary underline-offset-4 hover:underline`                                             |
| `premium`     | `bg-gradient-to-r from-amber-500 to-yellow-600 text-white hover:shadow-md hover:scale-[1.02]`|

**Sizes:**

| Size      | Classes                          |
| --------- | -------------------------------- |
| `default` | `h-10 px-5 py-2.5`               |
| `sm`      | `h-9 rounded-md gap-1.5 px-3`    |
| `lg`      | `h-12 rounded-md px-8 text-base` |
| `icon`    | `size-10`                        |
| `icon-sm` | `size-9`                         |
| `icon-lg` | `size-12`                        |

**Focus ring:** `focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]`

### 8.2 Card

```
rounded-lg border bg-card text-card-foreground shadow-sm
```

### 8.3 Dialog / Modal

| Context              | max-width setting                                 |
| -------------------- | ------------------------------------------------- |
| Upgrade dialog       | `sm:max-w-md`                                     |
| Resume quick preview | `max-w-3xl sm:max-w-3xl max-h-[95vh]`            |
| Payment modal        | `sm:max-w-[550px] p-0 overflow-hidden border-0`   |

- Dialog header (preview): `px-6 py-4 border-b`
- Dialog footer: `px-6 py-4 border-t bg-muted/10`

### 8.4 Tabs

Used in EditorPanel for section navigation. Tabs are drag-sortable via `@dnd-kit`:

```
TabsList: flex flex-wrap h-auto gap-2 bg-transparent p-0 justify-start border-none shadow-none
TabsTrigger: min-w-[120px] data-[state=active]:bg-background
```

Each tab item has minimum width of `120px`. Custom sections are added dynamically.

### 8.5 Input

```
border bg-background text-foreground rounded-md h-10 px-3 py-2 text-sm
```

Resume name field (editor): `bg-transparent border-transparent hover:border-input focus:border-input` — inline-edit appearance.

### 8.6 Slider

- General Scale control: range `0.6 – 1.4`, step `0.02`
- Section Spacing control: range `0.2 – 2.0`, step `0.1`

### 8.7 Select

Used for font selection (`FontSelector`) and template dropdown (`TemplateSelector`).

### 8.8 Badge

```
inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold
```

### 8.9 Tooltip

`delayDuration={100}` — used in TemplateSelector for template option hints.

### 8.10 Alert Dialog

Used for destructive confirmations (section deletion):
- Title: e.g., "Delete Experience?"
- Description: "This action cannot be undone. All data in this section will be lost."
- Actions: Cancel (outline) / Delete (default)

### 8.11 Popover

Used in ColorPicker for the custom hex color entry. Width: `w-64`, aligned to `end`.

---

## 9. Page-Level Design Patterns

### 9.1 Navbar

**File:** `components/layout/Navbar.tsx`

```
sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60
```

- Height: `h-14`
- Horizontal padding: `px-4 sm:px-8 lg:px-12`
- Logo: `FileText` icon (h-6 w-6) + bold text "MyResume" (hidden below sm)
- Right items (left to right): `UpgradeButton` -> `DebugTierToggle` -> `ModeToggle` -> `UserMenu`
- User avatar loading skeleton: `h-9 w-9 rounded-full bg-muted animate-pulse`

### 9.2 Footer

**File:** `components/layout/Footer.tsx`

```
w-full bg-background/80 backdrop-blur-sm border-t py-2 md:py-0
```

- Desktop height: `md:h-24`
- Content: "Built for CS Students. 2026 MyResume."
- Text style: `text-sm text-muted-foreground`
- Layout: `flex-col items-center md:flex-row`

### 9.3 Home Page

**File:** `app/page.tsx`

Container: `mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8 flex flex-col min-h-screen`

Page sections (top to bottom):
1. **HeroSection** — loaded eagerly (above the fold)
2. **FeaturesSection** — lazy via `LazySection` (min-height: 400px)
3. **TemplateGallery** — lazy via `LazySection` (min-height: 500px)
4. **CTA Section** — dark slate panel, inline in page.tsx
5. **FeedbackWidget** — floating, lazy-loaded

#### Hero Section Design

**File:** `components/home/HeroSection.tsx`

- Background: absolute radial gradient `from-blue-500/20 via-background to-background`, `z-index: -10`
- Padding: `pt-16 pb-20 lg:pt-32 lg:pb-28`
- Version badge pill: `bg-secondary text-secondary-foreground rounded-full` with `Sparkles` icon in `text-primary`
- H1: `text-4xl lg:text-7xl font-extrabold tracking-tight` — gradient text `from-gray-900 to-gray-600`
- H1 accent span: `text-primary` (no gradient, solid color)
- Subtitle: `max-w-[42rem] text-muted-foreground sm:text-xl sm:leading-8`
- Primary CTA button: `h-14 px-8 text-lg bg-primary rounded-full shadow-xl shadow-blue-500/20 hover:scale-105 font-semibold gap-2`
- Secondary CTA button: `h-14 px-8 text-lg rounded-full backdrop-blur-sm bg-background/50` (outline variant)
- Import divider: two `flex-1 h-px bg-border` lines flanking the word "or" (`text-xs text-muted-foreground uppercase tracking-widest`)
- Import toggle button: ghost, `rounded-full px-6 h-10 border border-dashed hover:border-primary/50 hover:bg-primary/5`
- Browser mockup preview: `max-w-5xl rounded-xl bg-gradient-to-b from-border to-transparent p-2`
  - Chrome dots: red (`bg-red-400`), yellow (`bg-yellow-400`), green (`bg-green-400`), each `w-3 h-3 rounded-full`
  - Inner glow: absolute `from-blue-500 to-purple-600 rounded-lg blur opacity-25`

#### CTA Section Design

```
bg-slate-900 dark:bg-secondary px-6 py-16 md:px-12 lg:px-24 rounded-3xl
```

- H2: `text-3xl sm:text-4xl font-bold tracking-tighter text-white`
- Body text: `text-gray-300 md:text-xl`
- Button: `bg-white text-slate-900 hover:bg-white/90 font-semibold h-12 px-8`

### 9.4 Dashboard Page

Resume cards laid out in a vertical list with `flex flex-col gap-4`.

**Resume Card Design** (`components/dashboard/ResumeCard.tsx`):

```
flex flex-col sm:flex-row w-full hover:shadow-lg transition-shadow duration-300 overflow-hidden sm:h-[280px]
```

**Left panel** (metadata + actions):
- Padding: `p-5`
- Resume title: `text-xl font-bold text-foreground line-clamp-1`
- Template badge: `text-xs rounded-full border-transparent bg-secondary text-secondary-foreground`
- Date: `text-xs text-muted-foreground` with `Calendar` icon (`h-3.5 w-3.5`)
- Action row (separated by `border-t border-border`, `mt-4 pt-3`):
  - Edit: `Button variant="default" size="sm" h-9 flex-1 min-w-[100px]`
  - Duplicate: `Button variant="outline" size="icon" h-9 w-9 shrink-0`
  - Download: `Button variant="outline" size="icon" h-9 w-9 p-0`
  - Delete: `Button variant="destructive" size="icon" h-9 w-9 shrink-0`

**Right panel** (live resume thumbnail):
- Width: `sm:w-[240px]`, Background: `bg-slate-50 dark:bg-zinc-900/30`
- Resume rendered at **23% scale** of 794x1123px canvas
- Hover overlay: `bg-black/0 group-hover:bg-black/25 dark:group-hover:bg-black/40 transition-all duration-300`
- Overlay buttons appear with `opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300`

---

## 10. Resume Template Designs

**File:** `components/preview/LiveResume.tsx`

All templates render in a fixed **794 x 1123 px** canvas (A4 at 96 dpi). The canvas is then CSS `transform: scale(...)` to fit its container.

### 10.1 Classic (Free)

- Single-column layout
- Header: large name with theme color, job title, horizontal contact info bar with icons
- Section labels: `uppercase tracking-widest text-xs font-bold border-b pb-2 mb-4` colored with `themeColor`
- Body text: `text-sm`
- Standard resume structure (no sidebar)

### 10.2 Modern (Free)

- **Two-column layout:** colored sidebar (left, ~32% width) + white main area (right, ~68% width)
- Sidebar background: `themeColor`; all sidebar text: `text-white`
- Sidebar contents: name, job title, contact info, education, sidebar sections
- Main area: experience, projects, skills on white background
- Section labels in sidebar: `uppercase tracking-widest text-xs font-bold border-b border-white/30 pb-2 mb-4 opacity-80 text-white`
- Print: sidebar uses `position: fixed` at 32% width (defined in `print.css`)

### 10.3 Minimalist (Free)

- Single-column, no theme color
- Color picker is **hidden** for this template
- Section labels: `font-bold uppercase tracking-widest text-xs mb-4`
- Clean layout, heavy whitespace, no decorative elements

### 10.4 Creative (Premium)

- **Two-column layout:** colored sidebar (left, ~35% width) + white main area (right, ~65% width)
- More expressive than Modern — decorative pattern in sidebar background, bolder typography
- Sidebar: `themeColor` background, white text
- Print: sidebar uses `position: fixed` at 35% width (defined in `print.css`)

### 10.5 Velvet (Premium)

- Distinct premium layout with unique header treatment
- Decorative elements and refined spacing distinguishing it from other templates

### Template Access Rules

| Template  | Required Tier |
| --------- | ------------- |
| Classic   | Free          |
| Modern    | Free          |
| Minimalist| Free          |
| Creative  | Pro           |
| Velvet    | Pro           |

---

## 11. Editor UI Patterns

**File:** `components/editor/EditorPanel.tsx`

### 11.1 Two-Panel Layout

- **Left:** EditorPanel — scrollable sidebar, fixed width
- **Right:** PreviewPanel — live A4 resume preview
- Mobile: one panel at a time, toggled by `MobileViewToggle`

### 11.2 EditorPanel Header

```
py-4 px-3 border-b flex justify-between items-center gap-4
```

- Back link: `p-2 hover:bg-muted rounded-full transition-colors` (ArrowLeft icon)
- Resume name: inline `<Input>` — `bg-transparent border-transparent hover:border-input focus:border-input text-xl font-bold`
- Sync status pill: `px-3 py-1.5 rounded-full bg-muted/50 text-xs font-medium cursor-help shrink-0`

**Sync status states:**

| Status   | Icon          | Text            | Color              |
| -------- | ------------- | --------------- | ------------------ |
| `idle`   | Cloud         | "Saved locally" | muted-foreground   |
| `syncing`| Loader2 spin  | "Syncing..."    | primary            |
| `synced` | Check         | "Auto Saved"    | green-500          |
| `error`  | AlertCircle   | "Sync Error"    | red-500            |
| no user  | LogIn         | "Log in to sync"| amber-600          |

### 11.3 Scale Controls Panel

```
bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800
```

- **General Scale:** Slider `0.6 – 1.4`, step `0.02` — label shows `{Math.round(contentScale * 100)}%`
- **Section Space:** Slider `0.2 – 2.0`, step `0.1` — label shows `{Math.round(sectionSpacing * 100)}%`
- **Remove Branding** (Pro only): custom switch toggle
  - On: `bg-emerald-500`, thumb `translate-x-4`
  - Off: `bg-input`, thumb `translate-x-0.5`
  - Disabled (free): `opacity-40 cursor-not-allowed bg-muted`

### 11.4 Color Picker Panel

**File:** `components/editor/ColorPicker.tsx`

Container: `bg-white dark:bg-black rounded-lg shadow-sm border p-4`

- Header icon: `Check` in `bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 p-1.5 rounded-md`
- Preset color swatches: `w-8 h-8 rounded-full border border-muted-foreground/20 transition-all hover:scale-110`
- Selected swatch: `ring-2 ring-primary ring-offset-2 scale-110` with white checkmark overlay
- Custom color button (Pro): rainbow gradient `from-red-500 via-green-500 to-blue-500` — shows `Lock` icon for free tier
- Free-tier locked popover: `bg-gray-50 dark:bg-gray-800 rounded-md p-3 text-center` with lock icon + UpgradeButton

**Preset color palette:**

| Name         | Hex       |
| ------------ | --------- |
| Classic Blue | `#112e51` |
| Texas Red    | `#CC5500` |
| Emerald      | `#059669` |
| Purple       | `#7c3aed` |
| Rose         | `#e11d48` |
| Charcoal     | `#333333` |
| Teal         | `#0d9488` |
| Black        | `#000000` |

### 11.5 Font Selector Panel

**File:** `components/editor/FontSelector.tsx`

Container: `bg-white dark:bg-black rounded-lg shadow-sm border p-4`

- Header icon: `Type` in `bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-1.5 rounded-md`
- Dropdown shows each font rendered in its own `fontFamily`
- Premium fonts: `Crown` icon (`text-yellow-500 ml-2`) + `disabled` in select when user is free tier
- Clicking a premium font while on free: opens upgrade `Dialog`

### 11.6 Template Selector Panel

**File:** `components/editor/TemplateSelector.tsx`

Container: `bg-white dark:bg-black rounded-lg shadow-sm border p-4 mb-6`

- Header icon: `Layout` in `bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400`
- **Clear All** button: `ghost` variant, `text-destructive hover:bg-destructive/10 gap-2`
- **Auto-Fill** button: `outline` variant, `Sparkles` icon in `text-yellow-500`
- Template cards: `LiveResume` renders at small scale; click selects the template
- Premium templates: show `Crown` badge; clicking while free triggers upgrade dialog

### 11.7 Section Tabs (Drag-Sortable)

```
TabsList: flex flex-wrap h-auto gap-2 bg-transparent p-0 justify-start border-none shadow-none
TabsTrigger: min-w-[120px] h-full data-[state=active]:bg-background
```

Interaction patterns:
- **Drag to reorder:** `GripVertical` handle appears on hover (`opacity-0 group-hover:opacity-100`)
- **Delete section:** `Trash2` icon appears on hover; triggers `AlertDialog` confirmation
- **Rename section:** double-click on the tab label opens an inline `<Input>`; save on blur or Enter, cancel on Escape
- **Add Section:** dashed-border outline button (`border-dashed`) -> `DropdownMenu` with standard sections + "Custom Section..." option

### 11.8 Resume Score Card

**File:** `components/editor/ResumeScore.tsx`

- Card with collapsible body (`ChevronDown` / `ChevronUp` toggle)
- **Quick Score** (Free, local heuristic, 0–100):
  - Full name present: +10
  - Email present: +10
  - Experience section visible and non-empty: +30
  - Education section visible and non-empty: +20
  - Skills section visible and non-empty: +20
  - Summary filled: +10
- **AI Analysis** (Premium): Gemini-powered full section breakdown with named percentages and action suggestions
- Locked state (free trying to use AI scan): blurred overlay with `Lock` icon and `UpgradeButton`

### 11.9 Preview Panel

**File:** `components/preview/PreviewPanel.tsx`

- Zoom controls: `Minus` / `Plus` buttons + `RotateCcw` reset, numeric % display
- **Fullscreen mode:** `Maximize2` button creates a full-viewport portal overlay; closed via `Escape` key
- **Heatmap overlay:** `Flame` button toggles recruiter attention visualization (Premium feature)
- Download: `DownloadResumeButton` generates and downloads the PDF
- Post-import caution banner: amber-toned warning panel about AI import accuracy
- Empty state (no resume selected): centered `FileText` icon with "Create a new resume" CTA

---

## 12. Premium and Upgrade UI

### 12.1 Upgrade Button

**Variant:** `premium` — `bg-gradient-to-r from-amber-500 to-yellow-600 text-white hover:scale-[1.02] hover:shadow-md`

- Icon: `Star` (filled) — used in Navbar trigger
- Shown in Navbar only when user is on free tier
- On click: opens payment/upgrade dialog

### 12.2 Payment Modal / Upgrade Dialog

**File:** `components/payment/PaymentModal.tsx`, `components/payment/UpgradeButton.tsx`

**Modal header:**
```
bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-500 px-6 py-8 text-white
```
- Decorative blobs: `bg-white/10 rounded-full blur-3xl` (top-right and bottom-left)

**Pricing card:**
```
bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-xl border-2 border-amber-200 dark:border-amber-800
```
- Price: `text-5xl font-bold` — "$20 /lifetime"

**Feature item** pattern:
```
flex items-center gap-3 bg-white dark:bg-gray-900 rounded-lg p-3 border
  - Icon: w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 text-white
```

**Pro plan features:**
1. Advanced AI Resume Analysis
2. Access to Premium Templates (Creative, Velvet)
3. Priority Email Support
4. Unlimited Resume Exports
5. Premium fonts (9 options)
6. Custom theme colors (hex picker)
7. Remove Branding toggle
8. Heatmap overlay (recruiter attention map)
9. Variant Manager (job-specific resume variants)

**Trust badges:** Secure (Shield) | Instant Access (Check) | No Subscription (Star)

**Stripe appearance config:**
```typescript
{
  theme: 'stripe',
  variables: {
    colorPrimary: '#f59e0b',
    colorBackground: '#ffffff',
    colorText: '#1f2937',
    colorDanger: '#ef4444',
    borderRadius: '8px',
  }
}
```

### 12.3 Locked Feature Pattern

Whenever a Pro-only feature is shown to a free user:

```
Container: bg-gray-50 dark:bg-gray-800 rounded-md p-3 text-center space-y-2
  - Lock icon: w-4 h-4 mx-auto text-gray-400
  - Description: text-xs text-muted-foreground
  - <UpgradeButton size="sm" variant="default" fullWidth>
```

### 12.4 Inline PRO Badge

Used to label gated controls inline (e.g., "Remove Branding"):

```
px-1.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase text-white
bg-gradient-to-r from-amber-500 to-orange-500
```

---

## 13. Dark Mode

- **Provider:** `ThemeProvider` from `next-themes`, `attribute="class"`, `defaultTheme="light"`, `enableSystem={false}`, `disableTransitionOnChange`
- **Toggle:** `ModeToggle` component in Navbar
- **CSS activation:** `.dark` class on `<html>` element
- **Custom Tailwind variant:** `@custom-variant dark (&:is(.dark *))`

**Dark mode surface hierarchy:**

| Layer             | Color Value |
| ----------------- | ----------- |
| Page background   | `#0a0a0a`   |
| Card / Panel      | `#171717`   |
| Elevated / Input  | `#262626`   |
| Muted text        | `#b5b5b5`   |

**Dark mode class patterns used throughout:**
- Editor panels: `dark:bg-black` (full black cards for contrast)
- Scale control: `dark:bg-slate-900/50 dark:border-slate-800`
- Resume thumbnail panel: `dark:bg-zinc-900/30`
- Preview fullscreen: `dark:bg-slate-900`

---

## 14. Print and PDF Styles

**File:** `app/print.css`

Activated by `@media print`. Injected via `@import "./print.css"` in `globals.css`.

**Core rules:**
- All `body *` hidden by default; only `#resume-preview` and its children are made visible
- Page size: `A4`, `margin: 0mm`
- `#resume-preview` is positioned `absolute; top: 0; left: 0; width: 210mm`
- The `transform: scale(...)` applied by LiveResume is overridden to `transform: none !important`
- Background colors/graphics forced with `print-color-adjust: exact !important`
- `break-inside: avoid` on `.mb-6`, `.mb-8`, `.p-8`, `.p-10`, `li`, `h3`

**Two-column template sidebar handling:**

| Template | Selector                     | Sidebar (print)          | Main (print) |
| -------- | ---------------------------- | ------------------------ | ------------ |
| Modern   | `[data-template="modern"]`   | `position: fixed` 32% width | 68% offset |
| Creative | `[data-template="creative"]` | `position: fixed` 35% width | 65% offset |

---

## 15. Responsive Design

Mobile-first approach. All layouts default to single-column mobile and expand via breakpoints.

| Breakpoint | Prefix | Min Width | Notes                       |
| ---------- | ------ | --------- | --------------------------- |
| Mobile     | (none) | < 640px   | Single column, stacked      |
| SM         | `sm:`  | 640px     | Resume card becomes row     |
| MD         | `md:`  | 768px     | Feature grid 3-col, editor  |
| LG         | `lg:`  | 1024px    | Hero paddings increase      |
| 2XL        | `2xl:` | 1400px    | Container max (1400px)      |

**Key responsive patterns:**

- Hero CTAs: `flex-col sm:flex-row gap-4`
- Features grid: `sm:grid-cols-2 md:grid-cols-3`
- Resume card: `flex-col sm:flex-row`; preview thumbnail hidden on mobile
- Navbar logo text: `hidden sm:inline-block`
- Editor: single panel at a time on mobile via `MobileViewToggle`
- Many hero animations are prefixed `md:animate-in` — disabled on mobile for performance

---

## 16. Icon System

**Library:** Lucide React (`lucide-react`). All icons from this library only — do not mix with other icon sets.

**Standard sizes by context:**

| Context              | Class         |
| -------------------- | ------------- |
| Navbar logo          | `h-6 w-6`     |
| Feature card icons   | `h-6 w-6`     |
| Button icons         | `h-4 w-4`     |
| Panel header icons   | `h-4 w-4`     |
| Metadata/date icons  | `h-3.5 w-3.5` |
| Tab drag handle      | `w-3 h-3`     |
| Trust badge icons    | `h-3 w-3`     |

**Semantic icon usage:**

| Icon           | Meaning / Context                             |
| -------------- | --------------------------------------------- |
| `FileText`     | Logo, resume document                         |
| `Sparkles`     | AI features, v2.0 badge, auto-fill            |
| `ArrowRight`   | CTA direction indicator                       |
| `Upload`       | Import PDF                                    |
| `X`            | Close / cancel                                |
| `Check`        | Success, confirmed color selection            |
| `Crown`        | Premium font / template indicator             |
| `Lock`         | Paywalled / locked feature                    |
| `Star`         | Upgrade / Pro plan trigger                    |
| `Zap`          | Instant preview, AI analysis                  |
| `Shield`       | Privacy, security (Stripe badge)              |
| `Flame`        | Heatmap overlay toggle                        |
| `Cloud`        | Sync idle state                               |
| `Loader2`      | Loading spinner — always paired with `animate-spin` |
| `GripVertical` | Drag handle on sortable tabs/items            |
| `Trash2`       | Delete action                                 |
| `Edit`         | Edit action                                   |
| `Copy`         | Duplicate action                              |
| `Eye`          | Preview action                                |
| `Calendar`     | Last modified date metadata                   |
| `ArrowLeft`    | Back navigation in EditorPanel header         |
| `LogIn`        | Login prompt in sync status pill              |
| `AlertCircle`  | Sync error state                              |
| `Maximize2`    | Fullscreen preview toggle                     |
| `RotateCcw`    | Reset zoom to 100%                            |
| `Type`         | Typography / Font Selector header             |
| `Layout`       | Template Selector header                      |
| `Palette`      | Creative template icon                        |
| `PenTool`      | Minimalist template icon                      |
| `Plus`         | Add section button                            |
| `ChevronDown`  | Collapse resume score section                 |
| `ChevronUp`    | Expand resume score section                   |

**Rule:** All decorative icons must have `aria-hidden="true"`. All interactive icon-only buttons must have `aria-label`.

---

## 17. Accessibility

### 17.1 Focus Management

- Visible focus rings on all interactive elements: `focus-visible:ring-ring/50 focus-visible:ring-[3px]`
- Radix UI Dialog traps focus within modal boundaries automatically
- `Escape` key closes fullscreen preview and all modals
- Pointer sensor for DnD uses `activationConstraint: { distance: 5 }` to prevent accidental drags

### 17.2 Semantic HTML Structure

- **Single `<h1>` per page:** "Editor" in editor page, resume name as page identifier
- `<h2>` for major page sections; `<h3>` for card and panel sub-headings
- `<header>` for Navbar, `<footer>` for Footer, `<nav>` for navigation links
- `<main>` wraps page content
- `role="switch"` + `aria-checked` on the Remove Branding custom toggle
- `role="presentation"` on DnD wrapper divs

### 17.3 ARIA Attributes

- All icon-only buttons: `aria-label` describing the action
- Import toggle button: `aria-expanded={showImport}` + `aria-controls="import-resume-panel"`
- Import panel: `id="import-resume-panel"` on the expandable region
- All Sliders: `aria-label` on each `<Slider>` component
- CTA link in hero vs CTA section: different `aria-label` values to disambiguate

### 17.4 Color Contrast

| Foreground                | Background    | WCAG Level |
| ------------------------- | ------------- | ---------- |
| `#BF4D00` (primary)       | `#ffffff`     | AA (large) |
| `#5b5b5b` (muted fg)      | `#ffffff`     | AA         |
| `#fafafa` (dark mode text)| `#0a0a0a`     | AAA        |

### 17.5 Motion and Animation

- Hero entry animations are `md:` prefixed — not triggered on mobile, reducing cognitive load
- When adding new animations, use `@media (prefers-reduced-motion: reduce)` to disable or reduce motion for users who have this OS setting enabled
- Framer Motion `LazyMotion` is always used (not the full bundle) to keep animation JS lean

---

## Appendix: Design File Reference

| File                                         | Design Role                                        |
| -------------------------------------------- | -------------------------------------------------- |
| `app/globals.css`                            | CSS custom properties (color tokens, base styles)  |
| `tailwind.config.ts`                         | Design token extensions, font families, keyframes  |
| `app/print.css`                              | Print/PDF layout overrides                         |
| `app/layout.tsx`                             | Root layout, font loading, ThemeProvider config    |
| `app/page.tsx`                               | Home page section composition                      |
| `components/layout/Navbar.tsx`               | Global navigation bar design                       |
| `components/layout/Footer.tsx`               | Global footer design                               |
| `components/home/HeroSection.tsx`            | Hero section design and entry animations           |
| `components/home/FeaturesSection.tsx`        | Feature cards grid with scroll animations          |
| `components/home/TemplateGallery.tsx`        | Public template showcase grid                      |
| `components/dashboard/ResumeCard.tsx`        | Dashboard resume card layout and hover effects     |
| `components/editor/EditorPanel.tsx`          | Editor sidebar layout and section tab management   |
| `components/editor/ColorPicker.tsx`          | Theme color selection UI and preset palette        |
| `components/editor/FontSelector.tsx`         | Typography selection UI with premium tier          |
| `components/editor/TemplateSelector.tsx`     | Template picker with live miniature previews       |
| `components/editor/ResumeScore.tsx`          | AI resume scoring and completeness widget          |
| `components/preview/LiveResume.tsx`          | Live resume renderer for all 5 templates           |
| `components/preview/PreviewPanel.tsx`        | Preview panel with zoom, fullscreen, heatmap       |
| `components/payment/UpgradeButton.tsx`       | Premium upgrade button trigger and dialog          |
| `components/payment/PaymentModal.tsx`        | Stripe payment modal UI design                     |
| `components/ui/button.tsx`                   | Button component with all variant definitions      |

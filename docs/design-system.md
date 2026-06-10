# CLS Academy Mobile — Design System

Source of truth: Student Portal screens. All values extracted directly from source code.

---

## Colors

```ts
// from src/components/theme.ts
bg:               "#FAF8FF"   // page background
surface:          "#ffffff"   // card / panel background
surfaceContainer: "#EDE9F5"   // medium tinted surface
surfaceLow:       "#F5F3FF"   // light purple tint (icon bg, pill bg)
surfaceHigh:      "#DDD6FE"   // stronger purple tint (borders on surfaceLow elements)

primary:          "#6D28D9"   // main purple (gradient start, progress fill, primary CTA)
primaryBtn:       "#7C3AED"   // gradient mid / button shade
primaryFixed:     "#EDE9FE"   // very light purple (progress track bg)
onPrimary:        "#ffffff"

onSurface:        "#1B1230"   // main body text, headings
onSurfaceVariant: "#4B3E66"   // secondary body text
outline:          "#8B82A1"   // captions, labels, muted text
outlineVariant:   "#EDE9F5"   // dividers, card borders

success:    "#10B981"
successBg:  "#dcfce7"
successFg:  "#166534"

error:      "#ba1a1a"
errorBg:    "#ffdad6"
errorFg:    "#93000a"

leave:      "#9d4300"
leaveBg:    "#ffdbca"
warningBg:  "#FEF3C7"
warningFg:  "#92400e"
infoBg:     "#F5F3FF"
infoFg:     "#7C3AED"
```

### Gradient header
```ts
LinearGradient colors: [D.primary, D.primaryBtn, "#8B5CF6"]
// = ["#6D28D9", "#7C3AED", "#8B5CF6"]
```

### Subject accent colors
```ts
Physics:   "#6366F1"  (indigo)
Chemistry: "#0EA5E9"  (sky)
Biology:   "#10B981"  (emerald)
Math:      "#F59E0B"  (amber)
```

---

## Typography

Font family: **Plus Jakarta Sans** via `@expo-google-fonts/plus-jakarta-sans`

```ts
font:          "PlusJakartaSans_400Regular"
fontMedium:    "PlusJakartaSans_500Medium"
fontSemiBold:  "PlusJakartaSans_600SemiBold"
fontBold:      "PlusJakartaSans_700Bold"
fontExtraBold: "PlusJakartaSans_800ExtraBold"
```

### Scale

| Role | Size | Weight | Family | Notes |
|------|------|--------|--------|-------|
| Page title | 28 | 800 | ExtraBold | letterSpacing -0.7 |
| Section heading | 20 | 800 | ExtraBold | letterSpacing -0.5, lineHeight 26 |
| Card heading / name | 15–16 | 800 | ExtraBold | letterSpacing -0.2 |
| Hero value (large) | 26 | 700 | Bold | letterSpacing -0.7 |
| Card value | 16–18 | 800 | ExtraBold | letterSpacing -0.35 to -0.5 |
| Section title | 13 | 700 | Bold | letterSpacing -0.15 |
| Body list item | 12–12.5 | 700 | Bold | letterSpacing -0.1 to -0.2 |
| Body meta | 10–10.5 | 400 | Regular | D.outline color |
| Badge / label small | 9–9.5 | 700 | Bold | UPPERCASE, letterSpacing 0.5–0.7 |
| Caption / time | 9–9.5 | 500 | Medium | D.outline |
| Greeting label | 9 | 700 | Bold | UPPERCASE, letterSpacing 0.35, rgba white |
| Tab labels | 11–12 | 600 | SemiBold | |

---

## Spacing

### Page layout
```
Horizontal padding:  18px  (main content), 16px (Other/Account screens)
Top padding (safe):  insets.top + 24  (min 60)
Bottom spacer:       124px (above tab bar)
```

### Cards
```
Card padding:        14px (compact), 16px (standard), 18px (hero)
Card gap (in list):  12px
Card inner gap:      12px (row gap between icon and text)
```

### Sections
```
Section header marginTop:   22px
Section header marginBottom: 12px
```

### Grid
```
2-column gap:  12px
4-column gap:  10px
3-column gap:  10px
```

---
## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| Pill / avatar | 999 | progress bar, tags, avatar circle |
| Chip / badge | 5 | small count badges, next-class badge |
| Icon box | 6 | 26×26 or 32×34 icon containers |
| Quick link | 6 | qlIcon (32×32) |
| Card small | 8 | alert rows, batch info card, quick link box |
| Card standard | 12 | featureCard, list cards, schedule card |
| Card large | 14 | attendanceCard, schedule card, list card |
| Header gradient | 12 | bottom corners of LinearGradient header (Home only) |
| Avatar circle | 17 | 34×34 circle |
| Bell button | 8 | 34×34 icon button |

---

## Page Layout & Heading Styles

### Home Page
- **Gradient Header:** LinearGradient [D.primary, D.primaryBtn, "#8B5CF6"]
- **Height:** Ends just below the Role/Info card.
- **Overlap:** Content (Alerts/Stats) overlaps slightly.

### Non-Home Pages (Detail/List Screens)
- **No Gradient Header.**
- **Background:** D.bg (#FAF8FF).
- **Heading:** Large Page Title (24px, ExtraBold, D.onSurface) with Search icon (Ionicons 'search', size 20) on the far right.
- **Navigation:** Back button (optional, usually handled by layout or specific back button component).
- **Filters:** Tab-row filter chips directly below the heading.

---

## Grid & Stats
- **Stat Cards:** Maximum 2 cards per row.
- **Risk Metrics:** Do not show "At Risk" or "Flagged" metrics for students/results.
- **Gap:** 16px between cards (Minimal spacing).
- **Bottom Padding:** 140px on all scrollable screens to avoid tab bar overlap.

## Elevation / Shadow

All shadows use `D.primary` as shadowColor unless noted.

```ts
// Light (list items, feature cards)
shadowColor: D.primary
shadowOffset: { width: 0, height: 2 }
shadowOpacity: 0.025–0.03
shadowRadius: 4–5
elevation: 1

// Medium (hero attendance card)
shadowColor: D.primary
shadowOffset: { width: 0, height: 8 }
shadowOpacity: 0.06
shadowRadius: 18
elevation: 2

// Other card (StudentOtherScreen)
shadowColor: "#4C1D95"
shadowOpacity: 0.05
shadowRadius: 8
shadowOffset: { width: 0, height: 2 }
elevation: 2
```

---

## Component Patterns

### Gradient Header
```
LinearGradient colors: [D.primary, D.primaryBtn, "#8B5CF6"]
borderBottomLeftRadius: 24
borderBottomRightRadius: 24
paddingTop: max(insets.top + 24, 60)
paddingHorizontal: 22
paddingBottom: 72  ← creates overlap space
```

### Content Overlap
```
marginTop: -44  ← pulls content up into gradient
paddingHorizontal: 18
```

### Avatar (header)
```
34×34, borderRadius 17
bg: "#F3E8FF"
text color: D.primary
font: ExtraBold 12
border: 1.5px rgba(255,255,255,0.45)
```

### Bell Button (header)
```
34×34, borderRadius 10
bg: rgba(255,255,255,0.16)
border: 1px rgba(255,255,255,0.22)
icon: notifications-outline, size 20, #fff
dot: 6×6, borderRadius 3, bg #F472B6, border 2px D.primaryBtn
     position absolute top 7 right 7
```

### Info Pill Card (in header, e.g. batch/role info)
```
marginTop: 18
paddingVertical: 12, paddingHorizontal: 14
borderRadius: 14
bg: rgba(255,255,255,0.13)
border: 1px rgba(255,255,255,0.18)
label:  9px, Bold, rgba(255,255,255,0.7), letterSpacing 0.6, UPPERCASE
value:  11px, SemiBold, #fff, marginTop 4, letterSpacing -0.05
```

### FeatureCard (2-col grid stat card)
```
flex: 1, bg: #fff
borderRadius: 18, padding: 14
border: 1px D.outlineVariant
shadow: light (opacity 0.025)

Top row: icon (26×26, borderRadius 8) left + chevron-forward right
  icon bg: colored tint (e.g. surfaceLow, #FEF3C7, #F0FDF4, #F0F9FF)
  icon color: matching accent
  chevron: size 16, D.outline

Label: marginTop 10, 9.5px, Bold, D.outline, letterSpacing 0.5, UPPERCASE
Value: marginTop 4, 16px, ExtraBold, D.onSurface, letterSpacing -0.35
Sub:   marginTop 4, 9.5px, Regular, D.onSurfaceVariant, lineHeight 14
```

### QuickLink (4-col icon grid)
```
flex: 1, aspectRatio: 0.92
bg: #fff, borderRadius: 14
paddingVertical: 14, paddingHorizontal: 6
border: 1px D.outlineVariant
alignItems: center, justifyContent: center

Icon container: 32×32, borderRadius 10, bg = color+"18" (hex alpha)
Icon: size 20, color = accent color
Label: marginTop 10, 9.5px, Bold, D.onSurface, textAlign center, lineHeight 14
```

### Card (list container)
```
bg: #fff, borderRadius: 18–20
border: 1px D.outlineVariant
overflow: hidden
shadow: light
```

### List Row
```
flexDirection: row, alignItems: center
gap: 12, paddingVertical: 14, paddingHorizontal: 14–16
divider: borderBottomWidth 1, D.outlineVariant
```

### Icon Box (in list rows)
```
34×34, borderRadius: 10
bg: subject/status tint color
icon: size 16–18, accent color
```

### Section Header
```
flexDirection: row, justifyContent: space-between
marginTop: 22, marginBottom: 12, paddingHorizontal: 2

Title:  13px, Bold, D.onSurface, letterSpacing -0.15
Action: 11px, SemiBold, D.primary
```

### Schedule Row
```
paddingVertical: 14, paddingHorizontal: 14
gap: 12

Time block:  width 74, text 12px ExtraBold D.onSurface
Accent line: width 3, alignSelf stretch, borderRadius 999, subject color
Subject tag: 9px Bold, letterSpacing 0.5, subject color, UPPERCASE
Topic:       12px Bold, D.onSurface, letterSpacing -0.1
Meta:        9.5px Regular, D.outline
```

### Tag / Badge Pill
```
paddingHorizontal: 8, paddingVertical: 4
borderRadius: 999 (pill) or 7 (square badge)
fontSize: 9, Bold, letterSpacing 0.3–0.5
```

### Tab Row (filter tabs)
```
Active tab:   bg D.primaryFixed, border D.surfaceHigh, label D.primary ExtraBold
Inactive tab: bg D.surface, border D.outlineVariant, label D.outline
Tab badge:    9px, bg D.surfaceHigh (inactive) / D.primary (active), white text
Height:       ~36px, borderRadius 10–12
```

### Progress Bar (attendance)
```
Track: height 4, borderRadius 999, bg D.primaryFixed
Fill:  LinearGradient [D.primary, D.primaryBtn], left→right
```

### Account Profile Block
```
Avatar: LinearGradient [D.primaryBtn, "#8B5CF6"], 60–70px circle, initials white 24px ExtraBold
Name:   20px ExtraBold D.onSurface
Batch:  12px Regular D.outline
Chip:   bg D.surfaceLow, borderRadius 6, paddingH 8, paddingV 4, 11px SemiBold D.primaryBtn
```

### Settings Row (Account)
```
bg: #fff, padding 16, borderRadius 12, borderWidth 1 D.outlineVariant
Label: 13px SemiBold D.onSurface
Desc:  11px Regular D.outline
Toggle: 44×24, bg D.primaryBtn (on) / #D1D5DB (off), circle 18×18
```

### Sign-out Button
```
margin: 24 bottom, padding 16
borderRadius: 14
bg: D.errorBg
text: 14px Bold D.errorFg, textAlign center
```

### Navigation Header (detail screens)
```
flexDirection: row, alignItems: center, gap 12
paddingTop: insets.top + 12, paddingH 16, paddingB 12

Back button: 36×36, borderRadius 10, bg D.surface, border D.outlineVariant
  chevron-back size 20, D.onSurface
Title: 15–16px, Bold, D.onSurface, flex 1, letterSpacing -0.3
```

### Circular Card
```
bg: #fff, borderRadius 16, padding 16
border: 1px D.outlineVariant
Unread dot: 8×8 circle, bg D.primary, absolute top-right

Tag pill: paddingH 8 paddingV 3, borderRadius 6, 9px Bold UPPERCASE
Date:     10px Regular D.outline
Title:    14px Bold D.onSurface, marginTop 6
Desc:     12px Regular D.onSurfaceVariant, marginTop 4, lineHeight 18
```

---

## Motion

All interactive elements use `AnimatedPressable` from `src/components/motion.tsx`.
- Scale on press: subtle (0.97–0.98)
- No spring bounce on list items, light spring on cards

---

## Tab Bar

Floating pill tab bar — white bg, borderRadius ~28, shadow, positioned bottom 20–24.
- Active tab: icon + label, D.primary color, D.surfaceLow bg pill
- Inactive tab: icon only, D.outline color
- Height: ~60px, paddingH ~6

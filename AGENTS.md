# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.

## UI & Design System

Always adhere to `docs/design-system.md`.
- **Fonts:** Use **Plus Jakarta Sans** (PlusJakartaSans_400Regular, 500Medium, 600SemiBold, 700Bold, 800ExtraBold).
- **Rounding:** Use minimal values (12px standard, 14px large, 8px small).
- **Headings:**
  - Home: Gradient header with info overlap.
  - Non-Home: Large 24px ExtraBold title, search icon on right, chips below. No gradient.
- **Grids:** Max 2 stats per row. Remove "At Risk" metrics.
- **Backgrounds:** Use `D.bg` (#FAF8FF) for pages.
- **Scrolling:** Always use `paddingBottom: 140` in `ScrollView` `contentContainerStyle` to clear the floating tab bar.

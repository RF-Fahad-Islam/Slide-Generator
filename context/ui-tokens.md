# UI Tokens

## The one rule that never changes

**No hardcoded hex values and no raw Tailwind color classes in app components.**
App chrome uses semantic tokens only. Hex values exist in exactly ONE place: the
theme CSS that defines the tokens.

## The critical distinction (D16) — read before enforcing the rule

There are TWO color systems in this product:

1. **App chrome** (buttons, panels, editor UI, dialogs) → **semantic tokens.**
   Enforced. No exceptions.
2. **Slide brand colors** (what the user picks for their slides: accent, background,
   text, etc.) → **runtime data** stored on the BrandKit, applied via CSS custom
   properties / inline style on the render stage (`SlideStage`). These are user DATA,
   like a document's content — the "no hex" rule does NOT ban the color picker.

Confusing these two is the most common misreading. App chrome = tokens. Slide
content = data.

## App chrome tokens (shadcn/ui convention)

Define in the global theme CSS as HSL CSS variables; consume via Tailwind semantic
classes. shadcn/ui provides the base set — use them:

| Token | Tailwind class | Use for |
|---|---|---|
| `--background` / `--foreground` | `bg-background` / `text-foreground` | app shell |
| `--card` / `--card-foreground` | `bg-card` | panels, inspector |
| `--primary` / `--primary-foreground` | `bg-primary` | main actions (Generate, Add questions) |
| `--secondary` | `bg-secondary` | secondary actions |
| `--muted` / `--muted-foreground` | `bg-muted` / `text-muted-foreground` | disabled, hints, meta text |
| `--accent` | `bg-accent` | hover/highlight states |
| `--destructive` | `bg-destructive` | delete, discard |
| `--border` / `--input` / `--ring` | `border-border` etc. | borders, inputs, focus rings |

**Project-specific additions** (define alongside the shadcn set):

| Token | Use for |
|---|---|
| `--success` / `--success-foreground` | correct-answer indicators, accepted review items |
| `--warning` / `--warning-foreground` | **AI confidence flags** (D10) — AI-inferred answers must be visually distinct and demand confirmation; also validation warnings |
| `--info` | hints, source/board tags |

Never use `red-500`, `#22c55e`, etc. in components — add/extend a token instead.

## Spacing / radius / type scale

- Use Tailwind's default spacing scale; do not invent arbitrary pixel values in
  components (`p-[13px]` is a smell — if needed repeatedly, it belongs in the theme).
- Radius: shadcn `--radius` token (`rounded-md` etc.).
- App UI font: system/sans via shadcn default. **Bengali fonts (Hind Siliguri, Noto
  Sans Bengali) are for SLIDE content** and are bundled self-hosted for the render
  stage (D14) — they are not the app chrome font.

## Slide-stage brand application (for implementers)

`SlideStage` receives the BrandKit and sets CSS custom properties on the stage root:

```css
.slide-stage {
  --brand-accent: <BrandKit.accent>;
  --brand-bg: <BrandKit.background>;
  --brand-surface: <BrandKit.surface>;
  --brand-text: <BrandKit.text>;
}
```

Template elements reference `var(--brand-*)` (DOM) or read the BrandKit fields
directly (pptx renderer). This is DATA flow, not hardcoding — fully compliant with
the token rule.

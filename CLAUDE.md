# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server at http://localhost:5173 (hot-reload)
npm run build     # Production build → dist/
npm run preview   # Serve production build at http://localhost:4173
npm run lint      # Run oxlint (React rules + oxc plugin)
```

No test suite is configured. Verify changes via the preview server using the `preview_start` / `preview_screenshot` MCP tools (see `.claude/launch.json` for server configs).

## Architecture

Everything lives in two files:

- **`src/App.jsx`** — all logic, data, and components (single-file architecture by design)
- **`src/App.css`** — all styles; `src/index.css` resets only (`body`, `#root`, `img`, `button`)

### Data layer (top of App.jsx)

Three plain-object constants define the content:

| Constant | What it is |
|----------|-----------|
| `SUN` | Single object for the Sun with `img`, `facts`, `funFact`, stats |
| `PLANETS` | Array of 8 planet objects, same shape as `SUN` plus `order`, `size`, `moons` |
| `ST2_18` | Stephenson 2-18 star — separate shape, no `order`/`moons` |
| `QUESTIONS` | Array of quiz question objects (38 total, 10 picked randomly per game) |

**Question object shapes:**
- `type:'image-to-name'` — shows a planet photo, `planet` key references a `PLANETS` id, `choices` are name strings
- `type:'text-to-name'` — text question, `answer` is the correct choice string, optional `textChoices:true` suppresses planet-image thumbnails on buttons

### Audio engine

`tone(freq, dur, type, vol, delay)` is the single primitive — all sound effects (`playCorrect`, `playWrong`, `playClick`) call it. The `AudioContext` is lazily created and resumed on first user interaction.

### Screen routing

`App` holds a single `screen` state (`'home' | 'explore' | 'quiz'`) and renders one of three screen components. No router library is used.

### Component map

| Component | Renders |
|-----------|---------|
| `HomeScreen` | Landing with planet previews + two mode buttons |
| `ExploreScreen` | Solar-system row + planet cards grid + St2-18 feature banner |
| `PlanetModal` | Detail modal for Sun or any planet (shared) |
| `ST2Modal` | Dedicated modal for Stephenson 2-18 with inline size-comparison diagram |
| `QuizScreen` | 10-question quiz with progress bar, streak, per-answer hints |
| `Stars` | Purely decorative twinkling star background (fixed, pointer-events:none) |

### Adding content

**New planet/star:** add an object to `PLANETS` (or a new constant) matching the existing shape, add a card in `ExploreScreen`, and wire it to `PlanetModal`.

**New quiz questions:** append to `QUESTIONS`. The quiz `shuffle`s and slices 10, so new questions appear automatically. For pure text choices set `textChoices:true` to skip planet-image thumbnails.

### Image sources

All planet/sun images are Wikimedia Commons URLs (NASA public domain). Images render in `<img>` tags — no canvas, no CORS issues. Stephenson 2-18 uses a star-size comparison PNG from Wikimedia.

# Star Cadet — module contract for parallel builders

Read these files before writing yours (all paths relative to `star-cadet/`):

- `js/screens/games/_base.js` — the mini-game contract + helpers (`injectStyle`, `localPoint`, `shuffle`, `wobble`, `rand`, `clamp`). READ IT IN FULL.
- `js/screens/games/asteroid.js` — the reference mini-game. Match its structure exactly.
- `css/tokens.css` — every colour you may use. NEVER invent colours; use `var(--sun)` etc.
- `css/base.css` + `css/screens.css` — shared classes: `.btn`, `.btn-ghost`, `.opt`, `.pill`, `.panel`, `.overlay`, `.hud-btn`, `.wobble`, `.pop-in`.

## The world in one paragraph

1024×768 fixed design canvas, CSS-scaled (never reflowed). The level shell owns HUD,
scoring, hearts, mastery, speech and the teach panel. A mini-game owns ONLY its playfield.
The shell speaks every question aloud when `ask()` is called. Player is a 5-year-old who
cannot read: huge tap targets (≥88×88px, ≥24px apart), icons on every control, nothing
red-cross-shaped, no punishing timers, no "wrong/fail/lost" text anywhere.

## Mini-game module shape

```js
import { injectStyle, wobble, rand, localPoint } from './_base.js'
import { burst } from '../../ui/starburst.js'

export const meta = { id: '<id>', costsHeart: true|false, ownVisual: true|false }
injectStyle('<id>', ` ...scoped css, class names prefixed with your id... `)
export function make({ mount, ask, answer, help, settings }){
  return { start(){}, pause(){}, resume(){}, reask(q){}, destroy(){} }
}
```

- `ask()` → `{ fact, inst, answer, options, spoken }` or `null` (level over → stop; the
  shell shows results itself). `fact` has `.op` ('count'|'subitise'|'order'|'add'|'sub'|
  'mul'|'array'|'skip') and operands (`a`,`b` / `r`,`c` / `n`). `options` is 4 shuffled
  numbers including the answer — use `.slice(0,n)`+re-add answer if you need fewer, or
  ignore it (e.g. a counting game uses `q.answer` as the target).
- `answer(v)` → `{ correct, answer, locked }`. If `locked` (250ms input lock) ignore the
  result completely — no animation, no state change.
- After a correct answer: animate ~600ms, then call `ask()` again for the next question.
- After a wrong answer: wobble the tapped thing; KEEP the current question active (the
  shell may auto-open the teach panel and will then call your `reask(sameQuestion)`).
- `reask(q)`: re-render the SAME question (options may be reused from `q.options`). Also
  called after a "kind restart" with a fresh question.
- `destroy()` MUST cancel every rAF/timeout/interval/listener. `pause()`/`resume()` gate
  your rAF motion (`settings.reduceMotion` true → no drifting/bobbing at all — static
  layouts, instant transitions).
- `meta.ownVisual: true` → the shell hides its question card and gives you the full
  1024×680 zone; you must render the question's visual yourself. `false` → shell renders
  the card (count objects / dots / array / skip strip / symbolic display) in the top 190px
  and your mount is 1024×490.
- Pointer input: `pointerdown/move/up` ONLY (never mouse/touch events). For drags convert
  coordinates with `localPoint(e, mount)`.
- Sounds: the shell plays correct/wrong sounds. You may `import { sfx } from '../../audio.js'`
  for flavour (`sfx.tap`, `sfx.boing`, `sfx.whoosh`, `sfx.coin`) — sparingly.
- Speech: the shell speaks. Do not call `say()` from a game except for game-specific
  flavour lines (e.g. Zibby's "yum!"), and then only via `import { say } from '../../audio.js'`.

## Screens contract (tower / garage / parent)

A screen module exports `export function mountX(root, params){ ... return { destroy(){} } }`.
Navigate with `import { show } from '../router.js'` — e.g. `show('launchpad')`,
`show('level', { label, poolIds, gameId, target, backTo, backParams, onDone(stars) })`.
State: `import { state, saveNow, markDirty } from '../state.js'`.
Style: `injectStyle` from `./games/_base.js` (screens may import it too), tokens only.
Back button: `.hud-btn` with 🏠 in a `.gx-top` bar (copy `stickers.js`'s top bar).
Long-press speech on controls: `import { speakOnHold, say, sfx } from '../audio.js'`.

## Hard rules (spec §13 — acceptance criteria)

1. No fail state, no "Game Over", never the words wrong/fail/lost, no red ✗.
2. Tap targets ≥88×88 canvas px, ≥24px apart.
3. Respect the input lock (`locked` result).
4. No timers that punish. Nothing that removes points.
5. All text ≥15px; numbers in columns get `.tnum`.
6. Contrast ≥4.5:1 — use `--star` / `--star-dim` on `--nebula`/`--void` only.
7. `settings.reduceMotion` → zero drift/bob; instant cuts.
8. Icon on every control; text optional.
9. No external links or network calls of any kind.
10. Colour never the only signal (pair with shape/glyph/position).

Verify your file parses: `node --check <file>` (the folder is ESM via package.json).

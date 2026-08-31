// The mini-game contract (spec §7) and shared helpers.
//
// Every mini-game module exports:
//   export const meta = {
//     id: 'asteroid',
//     costsHeart: true,     // false → wrong answers never cost a heart (e.g. meteordodge)
//     ownVisual: false,     // true → the game draws the question itself; shell hides the q-card
//   }
//   export function make({ mount, ask, answer, help, settings }){ ... }
//
// The factory receives:
//   mount    : HTMLElement — the playfield. With ownVisual:false it spans 1024×490
//              (y 278–768 of the canvas); with ownVisual:true it spans 1024×680 (y 88–768).
//              Read mount.offsetWidth/offsetHeight — they are unscaled design px.
//   ask()    : -> question | null. Returns { fact, inst, answer, options, spoken }.
//              null means the level is over — stop asking, the shell takes over.
//              The shell speaks each question itself when ask() is called.
//   answer(v): -> { correct, answer, locked }. locked:true means the 250ms input
//              lock swallowed the tap — ignore the result entirely, don't animate.
//   help()   : opens the teach panel (never costs anything).
//   settings : { reduceMotion, soundOn, speedBonusOn }
//
// And returns:
//   { start(), pause(), resume(), destroy(), reask(question) }
//   destroy() MUST cancel every rAF, timeout, interval and listener.
//   reask(q) is called after the teach panel closes (same question re-posed) and
//   after a kind restart (new question q) — re-render options if you show any.
//
// The shell owns: HUD, hearts, scoring, grading, guards, speech, the teach panel.

// Inject a game's scoped styles once (id-keyed, so parallel games never clash).
export function injectStyle(id, cssText){
  if (document.getElementById(`style-${id}`)) return
  const s = document.createElement('style')
  s.id = `style-${id}`
  s.textContent = cssText
  document.head.appendChild(s)
}

// Convert a pointer event to local coordinates of `el` in unscaled design px
// (the canvas is CSS-scaled, so clientX/Y must be divided by the scale — spec §3).
export function localPoint(e, el){
  const rect = el.getBoundingClientRect()
  const canvasRect = document.getElementById('canvas').getBoundingClientRect()
  const scale = canvasRect.width / 1024
  return { x: (e.clientX - rect.left) / scale, y: (e.clientY - rect.top) / scale }
}

export const shuffle = arr => [...arr].sort(() => Math.random() - .5)
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
export const rand = (a, b) => a + Math.random() * (b - a)

// Standard wobble for a wrong tap.
export function wobble(el){
  el.classList.remove('wobble')
  void el.offsetWidth              // restart the animation
  el.classList.add('wobble')
}

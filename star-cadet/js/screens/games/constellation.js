// Constellation (trace game) — tap the numbers of a sequence IN ORDER to draw
// a glowing constellation. Owns the full 1024×680 sky (ownVisual). The strip at
// the top fills in as each star is traced; finishing reveals a constellation
// name. Wrong/decoy taps wobble; only genuinely wrong taps are reported.
import { injectStyle, wobble, rand, shuffle, clamp } from './_base.js'
import { burst } from '../../ui/starburst.js'
import { sfx } from '../../audio.js'

export const meta = { id: 'constellation', costsHeart: true, ownVisual: true }

const NAMES = [
  { name: 'The Little Rocket', icon: '🚀' },
  { name: 'The Space Whale',   icon: '🐋' },
  { name: 'The Crown',         icon: '👑' },
  { name: 'The Kite',          icon: '🪁' },
]
let nameIx = 0   // module-level so the name rotates across plays

injectStyle('constellation', `
  .cst-sky{position:absolute;inset:0;overflow:hidden}

  .cst-strip{
    position:absolute;top:14px;left:50%;transform:translateX(-50%);
    display:flex;gap:14px;align-items:center;z-index:2;
    background:var(--nebula);border:3px solid var(--rim-soft);
    border-radius:22px;padding:10px 18px;
  }
  .cst-slot{
    width:64px;height:64px;border-radius:16px;display:grid;place-items:center;
    background:var(--void);border:3px solid var(--rim-soft);
    font-size:30px;font-weight:700;color:var(--star-dim);
    font-variant-numeric:tabular-nums;
  }
  .cst-slot.next{border-color:var(--sun);color:var(--star);animation:cst-pulse 1.1s ease infinite}
  .cst-slot.done{background:var(--nebula-2);border-color:var(--sun);color:var(--sun)}
  @keyframes cst-pulse{50%{transform:scale(1.09)}}
  .cst-rm .cst-slot.next{animation:none}

  .cst-svg{position:absolute;inset:0;pointer-events:none}
  .cst-line{stroke:var(--sun);stroke-width:6;stroke-linecap:round}
  .cst-line.glow{stroke-width:16;opacity:.22}
  .cst-line.draw{transition:stroke-dashoffset .45s ease}
  .cst-svg.flash .cst-line{animation:cst-flash .4s ease 2}
  @keyframes cst-flash{50%{stroke:var(--aqua)}}
  .cst-svg.flash-rm .cst-line{stroke:var(--aqua)}

  .cst-star{
    position:absolute;width:110px;height:110px;border-radius:50%;
    display:grid;place-items:center;cursor:pointer;
    font-size:30px;font-weight:700;font-variant-numeric:tabular-nums;
    background:radial-gradient(circle at 35% 30%, var(--nebula-2) 0%, var(--nebula) 75%);
    border:4px solid var(--rim);color:var(--star);
    transition:transform .25s ease, box-shadow .25s ease;
  }
  .cst-star::before{
    content:'✦';position:absolute;top:7px;left:50%;transform:translateX(-50%);
    font-size:16px;color:var(--star-dim);
  }
  .cst-star.lit{
    background:radial-gradient(circle at 35% 30%, var(--sun) 0%, var(--sun-deep) 80%);
    border-color:var(--star);color:#3A2404;
    box-shadow:0 0 26px var(--sun);transform:scale(1.06);
  }
  .cst-star.lit::before{content:'⭐'}
  .cst-rm .cst-star{transition:none}

  .cst-tw{position:absolute;width:6px;height:6px;border-radius:50%;
    background:var(--star-dim);opacity:.45;pointer-events:none}
  .cst-tw.tw{animation:cst-twinkle 2.6s ease infinite}
  @keyframes cst-twinkle{50%{opacity:.12}}

  .cst-name{
    position:absolute;left:50%;top:46%;transform:translate(-50%,-50%);z-index:3;
    display:flex;gap:14px;align-items:center;pointer-events:none;
    background:var(--nebula-2);border:4px solid var(--sun);border-radius:24px;
    padding:18px 34px;font-size:36px;font-weight:700;color:var(--star);
  }
  .cst-name .cst-ic{font-size:44px}
`)

export function make({ mount, ask, answer, settings }){
  const sky = document.createElement('div')
  sky.className = 'cst-sky' + (settings.reduceMotion ? ' cst-rm' : '')
  mount.appendChild(sky)

  const W = () => mount.offsetWidth || 1024
  const H = () => mount.offsetHeight || 680

  let q = null           // current question object (identity matters for reask)
  let seq = []           // the trace sequence, last tap completes the question
  let stars = []         // { el, value, isSeq, ix, cx, cy, lit }
  let slots = []         // strip slot elements, one per seq number
  let svg = null
  let progress = 0       // index of the next sequence number to tap
  let paused = false
  let celebrating = false
  let destroyed = false

  const timers = new Set()
  function later(fn, ms){
    const t = setTimeout(() => { timers.delete(t); if (!destroyed) fn() }, ms)
    timers.add(t)
    return t
  }

  // ── Sequence + decoys ──────────────────────────────────────────────────────
  function buildSeq(question){
    const f = question.fact
    if (f.op === 'skip' && question.inst && Array.isArray(question.inst.seq))
      return [...question.inst.seq]
    if (f.op === 'order'){
      // last tap must be the answer; run up naturally to it
      const a = question.answer
      return [a - 2, a - 1, a].filter(v => v >= 1)
    }
    const a = question.answer
    const run = []
    for (let v = Math.max(1, a - 3); v <= a; v++) run.push(v)
    return run
  }

  function buildDecoys(question, sequence){
    const inSeq = new Set(sequence)
    const cands = new Set()
    for (const v of (question.options || []))
      if (v >= 1 && v <= 150 && !inSeq.has(v)) cands.add(v)
    const step = sequence.length > 1 ? sequence[1] - sequence[0] : 1
    const near = [sequence[sequence.length - 1] + step, sequence[0] - step]
    for (const s of sequence) near.push(s + 1, s - 1, s + 2)
    for (const v of near)
      if (v >= 1 && v <= 150 && !inSeq.has(v)) cands.add(v)
    const picks = shuffle([...cands]).slice(0, 3)
    let fill = question.answer + 3
    while (picks.length < 3){
      if (fill >= 1 && !inSeq.has(fill) && !picks.includes(fill)) picks.push(fill)
      fill++
    }
    return picks
  }

  // ── Layout: gentle path for the sequence, decoys scattered clear of it ─────
  function layout(nSeq, nDecoy){
    const w = W(), h = H()
    const top = 205, bottom = h - 70, left = 130, right = w - 130
    const pts = []
    const phase = rand(0, Math.PI * 2)
    for (let i = 0; i < nSeq; i++){
      const t = nSeq === 1 ? .5 : i / (nSeq - 1)
      const cx = clamp(left + (right - left) * t + rand(-24, 24), 115, w - 115)
      const cy = clamp(400 + Math.sin(phase + i * 1.2) * 140 + rand(-30, 30), top, bottom)
      pts.push({ cx, cy })
    }
    const all = [...pts]
    for (let d = 0; d < nDecoy; d++){
      let best = null
      for (let minDist of [150, 138]){
        for (let tries = 0; tries < 200 && !best; tries++){
          const cx = rand(115, w - 115)
          const cy = rand(top, bottom)
          if (all.every(p => Math.hypot(p.cx - cx, p.cy - cy) >= minDist)) best = { cx, cy }
        }
        if (best) break
      }
      if (!best) best = { cx: rand(115, w - 115), cy: rand(top, bottom) }  // last resort
      all.push(best)
      pts.push(best)
    }
    return pts   // first nSeq entries are the path, rest are decoys
  }

  // ── Rendering ──────────────────────────────────────────────────────────────
  function render(question){
    sky.innerHTML = ''
    stars = []
    slots = []
    progress = 0
    celebrating = false
    seq = buildSeq(question)
    const decoys = buildDecoys(question, seq)

    // decorative background stars (static when reduceMotion)
    for (let i = 0; i < 14; i++){
      const tw = document.createElement('div')
      tw.className = 'cst-tw' + (settings.reduceMotion ? '' : ' tw')
      tw.style.left = `${rand(10, W() - 16)}px`
      tw.style.top = `${rand(110, H() - 16)}px`
      tw.style.animationDelay = `${rand(0, 2.6)}s`
      sky.appendChild(tw)
    }

    // lines layer (under the stars)
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('class', 'cst-svg')
    svg.setAttribute('viewBox', `0 0 ${W()} ${H()}`)
    svg.setAttribute('width', '100%')
    svg.setAttribute('height', '100%')
    sky.appendChild(svg)

    // instruction strip: '?' marks the next number, '✦' the ones after
    const strip = document.createElement('div')
    strip.className = 'cst-strip'
    seq.forEach(() => {
      const s = document.createElement('div')
      s.className = 'cst-slot tnum'
      strip.appendChild(s)
      slots.push(s)
    })
    sky.appendChild(strip)
    paintSlots()

    // tappable stars
    const pts = layout(seq.length, decoys.length)
    seq.forEach((value, ix) => makeStar(value, true, ix, pts[ix]))
    decoys.forEach((value, d) => makeStar(value, false, -1, pts[seq.length + d]))
  }

  function makeStar(value, isSeq, ix, pt){
    const el = document.createElement('button')
    el.className = 'cst-star'
    el.textContent = value
    el.setAttribute('aria-label', `star ${value}`)
    el.style.left = `${pt.cx - 55}px`
    el.style.top = `${pt.cy - 55}px`
    const star = { el, value, isSeq, ix, cx: pt.cx, cy: pt.cy, lit: false }
    el.addEventListener('pointerdown', () => tap(star))
    sky.appendChild(el)
    stars.push(star)
  }

  function paintSlots(){
    // The strip is the child's map: every number is visible except the LAST,
    // which stays '?' until traced — a pre-reader can match numerals to stars,
    // and the final number (the actual answer) is theirs to work out.
    slots.forEach((s, i) => {
      s.classList.toggle('done', i < progress)
      s.classList.toggle('next', i === progress && !celebrating)
      const isLast = i === seq.length - 1
      s.textContent = (isLast && progress <= i) ? '?' : seq[i]
    })
  }

  function light(star){
    star.lit = true
    star.el.classList.add('lit')
  }

  function drawLine(a, b){
    const mk = cls => {
      const l = document.createElementNS('http://www.w3.org/2000/svg', 'line')
      l.setAttribute('class', cls)
      l.setAttribute('x1', a.cx); l.setAttribute('y1', a.cy)
      l.setAttribute('x2', b.cx); l.setAttribute('y2', b.cy)
      svg.appendChild(l)
      return l
    }
    mk('cst-line glow')
    const main = mk('cst-line')
    if (!settings.reduceMotion){
      const len = Math.hypot(b.cx - a.cx, b.cy - a.cy)
      main.style.strokeDasharray = len
      main.style.strokeDashoffset = len
      void main.getBoundingClientRect()          // flush so the transition runs
      main.classList.add('draw')
      main.style.strokeDashoffset = 0
    }
  }

  // ── Input ──────────────────────────────────────────────────────────────────
  function tap(star){
    if (paused || celebrating || destroyed || !q) return
    if (star.lit) return

    const isNext = star.isSeq && star.ix === progress
    if (isNext){
      if (progress === seq.length - 1){
        const res = answer(q.answer)             // final tap completes the question
        if (res.locked) return
        if (!res.correct){ wobble(star.el); return }   // defensive; cannot happen
        finishTrace(star)
      } else {
        const prev = stars.find(s => s.isSeq && s.ix === progress - 1)
        light(star)
        if (prev) drawLine(prev, star)
        progress++
        paintSlots()
        sfx.tick()
      }
      return
    }

    // Out of order or a decoy: wobble, and report a wrong answer — except in
    // the rare skip case where the tapped value IS the answer (reporting it
    // would grade as correct), so it just wobbles gently instead.
    if (star.value === q.answer){
      wobble(star.el)
      sfx.boing()
      return
    }
    const res = answer(star.value)
    if (res.locked) return
    wobble(star.el)
  }

  // ── Completion ─────────────────────────────────────────────────────────────
  function finishTrace(star){
    celebrating = true
    const prev = stars.find(s => s.isSeq && s.ix === progress - 1)
    light(star)
    if (prev) drawLine(prev, star)
    progress = seq.length
    paintSlots()

    svg.classList.add(settings.reduceMotion ? 'flash-rm' : 'flash')

    const canvas = document.getElementById('canvas')
    if (canvas){
      const fr = sky.getBoundingClientRect()
      const cr = canvas.getBoundingClientRect()
      const scale = cr.width / 1024
      burst((fr.left - cr.left) / scale + star.cx, (fr.top - cr.top) / scale + star.cy)
    }

    const pick = NAMES[nameIx++ % NAMES.length]
    const badge = document.createElement('div')
    badge.className = 'cst-name' + (settings.reduceMotion ? '' : ' pop-in')
    badge.innerHTML = `<span class="cst-ic">${pick.icon}</span><span>${pick.name}</span><span class="cst-ic">✨</span>`
    sky.appendChild(badge)

    later(next, 950)
  }

  function next(){
    q = ask()
    if (q) render(q)
  }

  // ── Contract surface ───────────────────────────────────────────────────────
  return {
    start(){ next() },
    pause(){ paused = true },
    resume(){ paused = false },
    reask(question){
      if (!question) return
      if (question === q){
        // same question after the teach panel: keep the sky and lit progress
        paintSlots()
        return
      }
      q = question
      render(question)
    },
    destroy(){
      destroyed = true
      timers.forEach(clearTimeout)
      timers.clear()
      sky.remove()
    },
  }
}

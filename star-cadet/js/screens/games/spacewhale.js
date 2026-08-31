// Space Whale (spec §7 friendly boss) — a big gentle whale naps on the right
// beneath a 10-segment aqua sleepy-meter (NOT health — nothing here is damage).
// Four answer buttons sit on the left; every correct answer sings one segment
// away and makes the whale happier. Wrong taps just make the whale blink kindly
// — the shell owns hearts, sounds and the teach panel. When ask() returns null
// the whale twirls, blue hearts float up, and it congratulates the cadet.
import { injectStyle, wobble } from './_base.js'
import { burst } from '../../ui/starburst.js'
import { say } from '../../audio.js'

export const meta = { id: 'spacewhale', costsHeart: true, ownVisual: false }

injectStyle('spacewhale', `
  .sw-wrap{position:absolute;inset:0;overflow:hidden}
  .sw-paused *{animation-play-state:paused!important}
  .sw-opts{position:absolute;left:36px;top:50%;transform:translateY(-50%);
    display:grid;grid-template-columns:repeat(2,206px);gap:28px}
  .sw-opt{width:206px;height:138px;font-size:52px}
  .sw-side{position:absolute;right:30px;top:50%;transform:translateY(-50%);
    width:430px;display:flex;flex-direction:column;align-items:center;gap:26px}
  .sw-meter{display:flex;gap:5px;width:400px;height:34px}
  .sw-seg{flex:1;border-radius:9px;border:2px solid var(--rim-soft);
    background:linear-gradient(180deg,var(--aqua),var(--aqua-deep));
    display:grid;place-items:center;font-size:16px;font-weight:700;color:var(--void);
    transition:background .35s,color .35s,transform .35s}
  .sw-seg.sw-sing{transform:translateY(-10px) scale(1.25)}
  .sw-seg.sw-done{background:var(--m-none);color:transparent;transform:none}
  .sw-whale-box{position:relative;width:150px;height:150px;display:grid;place-items:center}
  .sw-whale-box.sw-bob{animation:sw-bob 3.4s ease-in-out infinite alternate}
  .sw-whale{font-size:120px;line-height:1;display:inline-block;user-select:none}
  .sw-whale.sw-wiggle{animation:sw-wiggle .6s ease}
  .sw-whale.sw-blink{animation:sw-blink .4s ease}
  .sw-whale.sw-twirl{animation:sw-twirl .95s ease}
  .sw-spout{position:absolute;top:-4px;font-size:24px;pointer-events:none;
    animation:sw-spout .9s ease-out forwards}
  .sw-heart{position:absolute;bottom:72%;font-size:30px;pointer-events:none;
    animation:sw-float 1.4s ease-out forwards}
  .sw-heart-row{position:absolute;top:-46px;left:50%;transform:translateX(-50%);
    font-size:28px;letter-spacing:4px;white-space:nowrap}
  @keyframes sw-bob{from{transform:translateY(-8px)}to{transform:translateY(8px)}}
  @keyframes sw-wiggle{0%,100%{transform:rotate(0)}30%{transform:rotate(-8deg) scale(1.07)}
    65%{transform:rotate(7deg) scale(1.04)}}
  @keyframes sw-blink{0%,100%{transform:scaleY(1)}45%{transform:scaleY(.86)}}
  @keyframes sw-twirl{from{transform:rotate(0) scale(1)}55%{transform:rotate(360deg) scale(1.12)}
    to{transform:rotate(360deg) scale(1)}}
  @keyframes sw-spout{from{transform:translateY(0) scale(.6);opacity:1}
    to{transform:translateY(-95px) scale(1.15);opacity:0}}
  @keyframes sw-float{from{transform:translateY(0) scale(.9);opacity:1}
    to{transform:translateY(-150px) scale(1.2);opacity:0}}
  html.reduce-motion .sw-wrap *{animation:none!important;transition:none!important}
`)

const SEGS = 10

export function make({ mount, ask, answer, settings }){
  const wrap = document.createElement('div')
  wrap.className = 'sw-wrap'
  wrap.innerHTML = `
    <div class="sw-opts"></div>
    <div class="sw-side">
      <div class="sw-meter" aria-hidden="true"></div>
      <div class="sw-whale-box"><span class="sw-whale" aria-hidden="true">🐋</span></div>
    </div>`
  mount.appendChild(wrap)

  const optsEl = wrap.querySelector('.sw-opts')
  const meterEl = wrap.querySelector('.sw-meter')
  const whaleBox = wrap.querySelector('.sw-whale-box')
  const whale = wrap.querySelector('.sw-whale')

  for (let i = 0; i < SEGS; i++){
    const s = document.createElement('div')
    s.className = 'sw-seg'
    s.textContent = '♪'                       // glyph so colour is never the only signal
    meterEl.appendChild(s)
  }
  if (!settings.reduceMotion) whaleBox.classList.add('sw-bob')

  let q = null
  let drained = 0
  let over = false
  const timers = new Set()
  const after = (ms, fn) => {
    const t = setTimeout(() => { timers.delete(t); fn() }, ms)
    timers.add(t)
    return t
  }

  // centre of `el` in unscaled 1024×768 canvas px (for burst)
  function canvasXY(el){
    const r = el.getBoundingClientRect()
    const cr = document.getElementById('canvas').getBoundingClientRect()
    const scale = cr.width / 1024
    return {
      x: (r.left - cr.left + r.width / 2) / scale,
      y: (r.top - cr.top + r.height / 2) / scale,
    }
  }

  // one-shot animation class; skipped entirely under reduceMotion
  function pulse(el, cls, ms){
    if (settings.reduceMotion) return
    el.classList.remove(cls)
    void el.offsetWidth
    el.classList.add(cls)
    after(ms, () => el.classList.remove(cls))
  }

  function drainOne(){
    if (drained >= SEGS) return
    const seg = meterEl.children[SEGS - 1 - drained]   // sing away right-to-left
    drained++
    if (settings.reduceMotion){ seg.classList.add('sw-done'); return }
    seg.classList.add('sw-sing')
    after(380, () => { seg.classList.remove('sw-sing'); seg.classList.add('sw-done') })
  }

  // every 3rd segment: the whale spouts stars from its blowhole
  function spout(){
    if (settings.reduceMotion) return
    for (let i = 0; i < 3; i++){
      after(i * 130, () => {
        const s = document.createElement('span')
        s.className = 'sw-spout'
        s.textContent = '⭐'
        s.style.left = `${62 + (i - 1) * 26}px`
        whaleBox.appendChild(s)
        after(950, () => s.remove())
      })
    }
  }

  function heartsUp(){
    if (settings.reduceMotion){
      const row = document.createElement('div')
      row.className = 'sw-heart-row'
      row.textContent = '💙💙💙'
      whaleBox.appendChild(row)
      return
    }
    for (let i = 0; i < 5; i++){
      after(i * 180, () => {
        const h = document.createElement('span')
        h.className = 'sw-heart'
        h.textContent = '💙'
        h.style.left = `${18 + Math.random() * 64}%`
        whaleBox.appendChild(h)
        after(1500, () => h.remove())
      })
    }
  }

  function renderOpts(question){
    optsEl.innerHTML = ''
    question.options.forEach(v => {
      const b = document.createElement('button')
      b.className = 'opt sw-opt'
      b.textContent = v
      b.setAttribute('aria-label', `${v}`)
      b.addEventListener('pointerdown', () => tap(b, v))
      optsEl.appendChild(b)
    })
  }

  function tap(btn, v){
    if (!q || over) return
    const res = answer(v)
    if (res.locked) return
    if (res.correct){
      q = null
      btn.classList.add('good')
      drainOne()
      pulse(whale, 'sw-wiggle', 650)
      const p = canvasXY(whaleBox)
      burst(p.x, p.y - 20, { emoji: '✨' })
      if (drained % 3 === 0) spout()
      after(700, next)
    } else {
      wobble(btn)                             // shell handles hearts + gentle sound
      pulse(whale, 'sw-blink', 450)           // the whale just blinks kindly
    }
  }

  function next(){
    q = ask()
    if (q) renderOpts(q)
    else finale()
  }

  // level over: any leftover segments sing away, the whale twirls and
  // congratulates the cadet while the shell's results appear
  function finale(){
    over = true
    optsEl.innerHTML = ''
    const remaining = SEGS - drained
    for (let i = 0; i < remaining; i++) after(i * 90, drainOne)
    pulse(whale, 'sw-twirl', 1000)
    heartsUp()
    say('You did it, little cadet!')
  }

  return {
    start(){ next() },
    pause(){ wrap.classList.add('sw-paused') },
    resume(){ wrap.classList.remove('sw-paused') },
    reask(question){
      if (!question) return
      q = question
      renderOpts(question)
    },
    destroy(){
      for (const t of timers) clearTimeout(t)
      timers.clear()
      wrap.remove()
    },
  }
}

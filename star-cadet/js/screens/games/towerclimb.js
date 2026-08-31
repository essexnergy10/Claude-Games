// Tower Climb — every right answer rides the lift up one floor.
// Left 40%: tower cross-section (numbered floors + lift cab with the cadet).
// Right 60%: the four answer options as big "floor door" buttons in a 2×2 grid.
// The view scrolls (translateY, bottom-anchored) so the lift stays centred as
// it rises; when ask() returns null the lift doors slide open with a little ✨.
import { injectStyle, wobble, clamp } from './_base.js'
import { burst } from '../../ui/starburst.js'
import { sfx } from '../../audio.js'

export const meta = { id: 'towerclimb', costsHeart: true, ownVisual: false }

const FH = 80          // floor height in design px (~6 floors visible in 466px)
const CAB_H = 66       // lift cab height

injectStyle('towerclimb', `
  .twc-wrap{position:absolute;inset:0;overflow:hidden}

  /* ── tower (left 40%) ── */
  .twc-tower{
    position:absolute;left:16px;top:12px;bottom:12px;width:380px;
    background:var(--nebula);border:3px solid var(--rim-soft);border-radius:24px;
    overflow:hidden;
  }
  .twc-shaft{
    position:absolute;left:0;right:0;bottom:0;
    transition:transform .55s ease-in-out;
  }
  .twc-floor{
    position:absolute;left:0;right:0;height:${FH}px;
    border-top:2px solid var(--rim-soft);
    display:flex;align-items:center;gap:12px;padding:0 146px 0 16px;
    box-sizing:border-box;
  }
  .twc-floor.twc-ground{background:var(--nebula-2)}
  .twc-floor.twc-here{background:var(--nebula-2)}
  .twc-floor.twc-here .twc-fnum{color:var(--sun)}
  .twc-fnum{
    min-width:38px;font-size:20px;font-weight:700;color:var(--star-dim);
    font-variant-numeric:tabular-nums;
  }
  .twc-win{
    width:26px;height:32px;border-radius:6px;
    background:var(--void-2);border:2px solid var(--rim-soft);
  }
  .twc-gdoor{font-size:24px}

  /* lift track strip on the right of the cross-section */
  .twc-strip{
    position:absolute;top:0;bottom:0;right:16px;width:120px;
    background:var(--void-2);
    border-left:2px solid var(--rim-soft);border-right:2px solid var(--rim-soft);
  }

  /* the cab */
  .twc-cab{
    position:absolute;right:28px;width:96px;height:${CAB_H}px;
    background:var(--nebula-2);border:3px solid var(--sun);border-radius:14px;
    display:grid;place-items:center;overflow:hidden;
    transition:bottom .55s cubic-bezier(.3,1.25,.5,1);
    box-shadow:0 5px 0 rgba(0,0,0,.3);
  }
  .twc-rider{font-size:36px;line-height:1}
  .twc-panel{
    position:absolute;top:0;bottom:0;width:50%;
    background:var(--rim-soft);transition:transform .5s ease;
  }
  .twc-panel.twc-l{left:0;border-right:3px solid var(--rim);transform:translateX(-62%)}
  .twc-panel.twc-r{right:0;border-left:3px solid var(--rim);transform:translateX(62%)}
  .twc-cab.twc-open .twc-panel.twc-l{transform:translateX(-105%)}
  .twc-cab.twc-open .twc-panel.twc-r{transform:translateX(105%)}
  .twc-cab.twc-open{border-color:var(--aqua)}
  .twc-spark{
    position:absolute;right:52px;font-size:34px;line-height:1;
    transform:translateX(50%);pointer-events:none;
  }

  /* floor counter pill */
  .twc-pill{
    position:absolute;top:10px;left:190px;transform:translateX(-50%);z-index:5;
    font-family:var(--font-mono);font-variant-numeric:tabular-nums;
    color:var(--star);
  }

  /* ── doors (right 60%) ── */
  .twc-doors{
    position:absolute;left:410px;right:0;top:0;bottom:0;
    display:grid;grid-template-columns:repeat(2,220px);gap:28px;
    place-content:center;
  }
  .twc-door{
    position:relative;width:220px;height:150px;font-size:52px;
    border-radius:24px 24px 16px 16px;
  }
  .twc-door::before{
    content:'';position:absolute;top:10px;left:50%;transform:translateX(-50%);
    width:14px;height:14px;border-radius:50%;
    background:var(--sun);border:2px solid var(--sun-deep);
  }

  /* reduce-motion: everything cuts instantly */
  .twc-rm .twc-cab, .twc-rm .twc-shaft, .twc-rm .twc-panel{transition:none}
`)

export function make({ mount, ask, answer, settings }){
  const rm = !!settings.reduceMotion

  const wrap = document.createElement('div')
  wrap.className = 'twc-wrap' + (rm ? ' twc-rm' : '')
  wrap.innerHTML = `
    <div class="twc-tower">
      <div class="twc-shaft">
        <div class="twc-strip"></div>
        <div class="twc-cab">
          <span class="twc-rider">🧑‍🚀</span>
          <span class="twc-panel twc-l"></span>
          <span class="twc-panel twc-r"></span>
        </div>
      </div>
      <div class="pill twc-pill">🛗 Floor <span class="tnum twc-count">0</span></div>
    </div>
    <div class="twc-doors"></div>
  `
  mount.appendChild(wrap)

  const towerEl = wrap.querySelector('.twc-tower')
  const shaft   = wrap.querySelector('.twc-shaft')
  const cab     = wrap.querySelector('.twc-cab')
  const countEl = wrap.querySelector('.twc-count')
  const doorsEl = wrap.querySelector('.twc-doors')

  let q = null
  let floors = 0          // our own correct count = current floor
  let builtN = 0          // how many numbered floors exist above ground
  let rows = []           // rows[i] → floor element for floor i (0 = ground)
  const timers = new Set()

  function later(fn, ms){
    const id = setTimeout(() => { timers.delete(id); fn() }, ms)
    timers.add(id)
  }

  const viewH = () => towerEl.offsetHeight || 466

  // (Re)build the tower rows. Everything is bottom-anchored, so growing the
  // tower just extends it upward off-screen — no visual jump.
  function buildTower(n){
    builtN = n
    for (const r of rows) r.remove()
    rows = []
    shaft.style.height = `${(n + 1) * FH}px`
    for (let i = 0; i <= n; i++){
      const row = document.createElement('div')
      row.className = 'twc-floor' + (i === 0 ? ' twc-ground' : '')
      row.style.bottom = `${i * FH}px`
      row.innerHTML = i === 0
        ? `<span class="twc-gdoor">🚪</span><span class="twc-win"></span><span class="twc-win"></span>`
        : `<span class="twc-fnum">${i}</span><span class="twc-win"></span><span class="twc-win"></span>`
      shaft.insertBefore(row, shaft.firstChild)   // cab + strip stay on top
      rows.push(row)
    }
  }

  // Keep the lift's floor centred in the view (clamped so the ground never
  // lifts off the bottom and the roof never dips below the top).
  function positionLift(){
    cab.style.bottom = `${floors * FH + (FH - CAB_H) / 2}px`
    const shaftH = (builtN + 1) * FH
    const ty = clamp(floors * FH + FH / 2 - viewH() / 2, 0, Math.max(0, shaftH - viewH()))
    shaft.style.transform = `translateY(${ty}px)`
    rows.forEach((r, i) => r.classList.toggle('twc-here', i === floors && i > 0))
  }

  function render(question){
    doorsEl.innerHTML = ''
    question.options.forEach(v => {
      const b = document.createElement('button')
      b.className = 'opt twc-door' + (rm ? '' : ' pop-in')
      b.textContent = v
      b.setAttribute('aria-label', `${v}`)
      b.addEventListener('pointerdown', () => tap(b, v))
      doorsEl.appendChild(b)
    })
  }

  function tap(doorEl, v){
    if (!q) return
    const res = answer(v)
    if (res.locked) return
    if (res.correct){
      q = null
      doorEl.classList.add('good')
      floors++
      if (floors + 2 > builtN) buildTower(builtN + 8)
      countEl.textContent = floors
      positionLift()
      sfx.tick()
      later(next, 650)
    } else {
      wobble(doorEl)
    }
  }

  function next(){
    q = ask()
    if (q) render(q)
    else finish()
  }

  // Level over: the lift arrives — doors slide open with a little sparkle.
  function finish(){
    doorsEl.innerHTML = ''
    later(() => {
      cab.classList.add('twc-open')
      const spark = document.createElement('span')
      spark.className = 'twc-spark' + (rm ? '' : ' pop-in')
      spark.textContent = '✨'
      spark.style.bottom = `${floors * FH + FH + 4}px`
      shaft.appendChild(spark)
      const cr = cab.getBoundingClientRect()
      const canvas = document.getElementById('canvas')
      if (canvas){
        const kr = canvas.getBoundingClientRect()
        const scale = kr.width / 1024
        burst((cr.left + cr.width / 2 - kr.left) / scale,
              (cr.top + cr.height / 2 - kr.top) / scale, { count: 10, emoji: '✨' })
      }
    }, rm ? 0 : 250)
  }

  return {
    start(){
      buildTower(14)
      positionLift()
      next()
    },
    pause(){},        // no rAF motion — CSS transitions only
    resume(){},
    reask(question){
      if (!question) return
      q = question
      render(question)
    },
    destroy(){
      for (const id of timers) clearTimeout(id)
      timers.clear()
      wrap.remove()
    },
  }
}

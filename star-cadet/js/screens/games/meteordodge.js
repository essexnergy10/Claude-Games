// Meteor Dodge (spec §7, slide game) — steer the rocket under the right gate.
// A rank of four numbered arch-gates drifts gently down from the top; the child
// slides the rocket left/right with a finger anywhere on the zone. Whichever
// gate the rocket sits under when the rank arrives is the answer. A wrong gate
// bounces the rocket (boing!) and the rank loops back up for another try —
// it only costs time, never a heart (meta.costsHeart:false).
import { injectStyle, wobble, localPoint, clamp } from './_base.js'
import { burst } from '../../ui/starburst.js'
import { sfx } from '../../audio.js'

export const meta = { id: 'meteordodge', costsHeart: false, ownVisual: false }

const GATE_W = 214                                   // ≥170px wide arches
const GATE_GAP = 32                                  // ≥24px apart
const GATE_H = 120
const GATE_X0 = (1024 - (4 * GATE_W + 3 * GATE_GAP)) / 2   // 36
const POD = 96                                       // rocket pod diameter
const SPEED = 45                                     // gentle descent, px/s
const STEP_PX = 64                                   // reduce-motion: discrete jumps…
const STEP_EVERY = 1.4                               // …every 1.4s (~46px/s average)
const START_Y = -(GATE_H + 24)
const X_MIN = 60, X_MAX = 964

injectStyle('meteordodge', `
  .mdg-field{position:absolute;inset:0;overflow:hidden;touch-action:none;cursor:grab}
  .mdg-rank{position:absolute;left:0;top:0;width:100%;height:${GATE_H}px;
    will-change:transform;pointer-events:none}
  .mdg-rank.mdg-fade{opacity:0;transition:opacity .45s}
  html.reduce-motion .mdg-rank.mdg-fade{transition:none}
  .mdg-gate{
    position:absolute;top:0;width:${GATE_W}px;height:${GATE_H}px;
    display:grid;place-items:center;
    font-size:44px;font-weight:700;color:var(--star);
    font-variant-numeric:tabular-nums;
    background:linear-gradient(180deg, var(--nebula-2) 0%, var(--nebula) 100%);
    border:6px solid var(--rim);border-bottom:none;
    border-radius:110px 110px 18px 18px;
    box-shadow:inset 0 -14px 0 rgba(0,0,0,.22);
  }
  .mdg-gate.mdg-hit{
    border-color:var(--aqua);color:var(--aqua);
    box-shadow:inset 0 -14px 0 rgba(0,0,0,.22), 0 0 28px var(--aqua);
  }
  .mdg-pod{
    position:absolute;width:${POD}px;height:${POD}px;border-radius:50%;
    display:grid;place-items:center;
    background:radial-gradient(circle at 34% 30%, var(--nebula-2) 0%, var(--nebula) 72%);
    border:4px solid var(--rim);
    will-change:left;pointer-events:none;
  }
  .mdg-ship{font-size:64px;line-height:1;transform:rotate(-45deg)}
  .mdg-flame{
    position:absolute;left:50%;bottom:-18px;width:18px;height:26px;
    transform:translateX(-50%);
    border-radius:50% 50% 50% 50% / 30% 30% 70% 70%;
    background:linear-gradient(180deg, var(--sun) 0%, var(--sun-deep) 85%);
    animation:mdg-flick .3s infinite alternate;
  }
  html.reduce-motion .mdg-flame{animation:none}
  @keyframes mdg-flick{from{transform:translateX(-50%) scaleY(1)}
    to{transform:translateX(-50%) scaleY(.62)}}
  .mdg-pod.mdg-bounce{animation:mdg-boing .55s ease}
  @keyframes mdg-boing{
    0%{transform:translateY(0)}38%{transform:translateY(36px)}
    72%{transform:translateY(-10px)}100%{transform:translateY(0)}}
`)

export function make({ mount, ask, answer, settings }){
  const field = document.createElement('div')
  field.className = 'mdg-field'
  field.setAttribute('aria-label', 'slide the rocket under a gate')
  mount.appendChild(field)

  const rank = document.createElement('div')
  rank.className = 'mdg-rank'
  field.appendChild(rank)

  const pod = document.createElement('div')
  pod.className = 'mdg-pod'
  pod.innerHTML = `<span class="mdg-ship">🚀</span><span class="mdg-flame"></span>`
  field.appendChild(pod)

  const H = () => mount.offsetHeight || 490
  const podTop = () => H() - 136                 // pod bottom sits 40px above floor
  const arriveLine = () => podTop()              // rank arrives when gate bottoms touch pod

  let gates = []                                 // { el, x, value }
  let q = null
  let phase = 'idle'                             // 'idle' | 'descend' | 'done'
  let rankY = START_Y
  let rocketX = 512
  let targetX = 512
  let stepAcc = 0
  let raf = 0
  let tOut = 0
  let running = false
  let last = 0

  pod.style.top = `${podTop()}px`
  placePod()

  function placePod(){ pod.style.left = `${rocketX - POD / 2}px` }
  function placeRank(){ rank.style.transform = `translateY(${rankY}px)` }

  function onPoint(e){
    targetX = clamp(localPoint(e, mount).x, X_MIN, X_MAX)
    if (settings.reduceMotion){ rocketX = targetX; placePod() }  // no easing lag
  }
  field.addEventListener('pointerdown', onPoint)
  field.addEventListener('pointermove', onPoint)

  function spawn(question){
    rank.classList.remove('mdg-fade')
    rank.innerHTML = ''
    gates = question.options.map((value, i) => {
      const el = document.createElement('div')
      el.className = 'mdg-gate'
      el.textContent = value
      el.setAttribute('aria-label', `${value}`)
      const x = GATE_X0 + i * (GATE_W + GATE_GAP)
      el.style.left = `${x}px`
      rank.appendChild(el)
      return { el, x, value }
    })
    rankY = START_Y
    stepAcc = 0
    placeRank()
    phase = 'descend'
  }

  function loopBack(silent){
    if (!silent) sfx.whoosh()
    rankY = START_Y
    stepAcc = 0
    placeRank()
    phase = 'descend'
  }

  function arrive(){
    const hit = gates.find(g => rocketX >= g.x && rocketX <= g.x + GATE_W)
    if (!hit){ loopBack(false); return }         // between gates → just loop, no answer()
    const res = answer(hit.value)
    if (res.locked){ loopBack(true); return }    // input lock → ignore entirely
    if (res.correct){
      phase = 'done'
      hit.el.classList.add('mdg-hit')            // gate flashes aqua
      const fr = field.getBoundingClientRect()
      const cr = document.getElementById('canvas').getBoundingClientRect()
      const scale = cr.width / 1024
      burst((fr.left - cr.left) / scale + rocketX,
            (fr.top - cr.top) / scale + podTop() + POD / 2)
      rank.classList.add('mdg-fade')
      q = null
      tOut = setTimeout(next, 600)
    } else {
      sfx.boing()                                // rocket bounces back down
      if (!settings.reduceMotion){
        wobble(hit.el)
        pod.classList.remove('mdg-bounce')
        void pod.offsetWidth
        pod.classList.add('mdg-bounce')
      }
      loopBack(true)                             // same question, another pass
    }
  }

  function next(){
    q = ask()
    if (q) spawn(q)
    else phase = 'idle'                          // level over — the shell takes over
  }

  function loop(t){
    raf = requestAnimationFrame(loop)
    if (!last){ last = t; return }
    const dt = Math.min((t - last) / 1000, .05)
    last = t
    if (!running) return
    if (!settings.reduceMotion){                 // ease the rocket toward the finger
      rocketX += (targetX - rocketX) * Math.min(1, dt * 12)
      placePod()
    }
    if (phase !== 'descend') return
    if (settings.reduceMotion){                  // instant hops, no smooth drift
      stepAcc += dt
      while (stepAcc >= STEP_EVERY){ stepAcc -= STEP_EVERY; rankY += STEP_PX }
    } else {
      rankY += SPEED * dt
    }
    placeRank()
    if (rankY + GATE_H >= arriveLine()) arrive()
  }

  return {
    start(){
      running = true
      next()
      raf = requestAnimationFrame(loop)          // loop always runs: it drives descent
    },
    pause(){ running = false },                  // halts descent and easing
    resume(){ running = true; last = 0 },
    reask(question){
      if (!question) return
      q = question
      spawn(question)                            // same numbers, rank back at the top
    },
    destroy(){
      running = false
      cancelAnimationFrame(raf)
      clearTimeout(tOut)
      field.removeEventListener('pointerdown', onPoint)
      field.removeEventListener('pointermove', onPoint)
      field.remove()
    },
  }
}

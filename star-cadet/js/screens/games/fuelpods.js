// Fuel Pods (spec §7) — drag the capsule with the right number into the rocket's
// fuel tank. Each correct answer fills one of ten gauge segments; a full tank
// gets a happy blast-off shimmy and the gauge starts again. Wrong pods spring
// back with a boing (no cross, no "wrong" — the shell handles hearts/teaching).
// Pods dropped anywhere outside the tank just glide home — no penalty, no answer().
import { injectStyle, wobble, clamp, localPoint } from './_base.js'
import { burst } from '../../ui/starburst.js'
import { sfx } from '../../audio.js'

export const meta = { id: 'fuelpods', costsHeart: true, ownVisual: false }

const POD_W = 200, POD_H = 110
const HOMES = [[70, 50], [330, 50], [70, 270], [330, 270]]   // 2×2 grid, ≥24px apart
const TANK = { cx: 860, cy: 236 }                            // tank centre (field px)
const ZONE = { x1: 750, y1: 50, x2: 1010, y2: 440 }          // drop zone for pod centre
const SEGS = 10

injectStyle('fuelpods', `
  .fp-field{position:absolute;inset:0;overflow:hidden}

  /* ---- rocket (decorative, never a pointer target) ---- */
  .fp-rocket{position:absolute;left:740px;top:16px;width:240px;height:460px;pointer-events:none}
  .fp-nose{position:absolute;left:60px;top:0;width:120px;height:76px;background:var(--sun);
    clip-path:polygon(50% 0,100% 100%,0 100%)}
  .fp-body{position:absolute;left:25px;top:70px;width:190px;height:330px;background:var(--star);
    border:4px solid var(--rim-soft);border-radius:30px 30px 14px 14px;box-sizing:border-box}
  .fp-fin{position:absolute;top:330px;width:60px;height:100px;background:var(--sun-deep)}
  .fp-fin-l{left:0;clip-path:polygon(100% 0,100% 100%,0 100%)}
  .fp-fin-r{left:180px;clip-path:polygon(0 0,100% 100%,0 100%)}
  .fp-flame{position:absolute;left:95px;top:402px;width:50px;height:58px;
    background:radial-gradient(circle at 50% 30%,var(--sun) 30%,var(--sun-deep) 75%);
    border-radius:50% 50% 50% 50% / 30% 30% 70% 70%;transform-origin:50% 0;
    animation:fp-flicker 1.1s ease-in-out infinite}
  @keyframes fp-flicker{0%,100%{transform:scaleY(1)}50%{transform:scaleY(.72) scaleX(.9)}}
  .fp-rocket.fp-blast{animation:fp-blastk .55s ease-in-out 0s 2}
  @keyframes fp-blastk{0%,100%{transform:translate(0,0)}25%{transform:translate(-4px,-6px)}
    50%{transform:translate(3px,-10px)}75%{transform:translate(-2px,-5px)}}

  /* ---- transparent tank window + gauge ---- */
  .fp-tank{position:absolute;left:50px;top:100px;width:140px;height:240px;background:var(--void);
    border:3px solid var(--rim-soft);border-radius:16px;box-sizing:border-box;
    display:flex;flex-direction:column-reverse;padding:6px;gap:4px;
    transition:box-shadow .25s ease}
  .fp-tank.fp-glow{box-shadow:0 0 34px var(--aqua)}
  .fp-seg{flex:1;border-radius:6px;background:rgba(255,255,255,.08)}
  .fp-seg.fp-on{background:var(--aqua);box-shadow:0 0 10px var(--aqua)}

  /* ---- fuel pods (the draggable answers) ---- */
  .fp-pods{position:absolute;inset:0}
  .fp-pod{position:absolute;width:${POD_W}px;height:${POD_H}px;border-radius:55px;
    border:4px solid var(--rim);box-sizing:border-box;padding:0;
    background:linear-gradient(180deg,var(--nebula-2) 0%,var(--nebula) 100%);
    color:var(--star);cursor:grab;touch-action:none;user-select:none;-webkit-user-select:none;
    display:grid;place-items:center;
    box-shadow:inset 0 -8px 0 rgba(0,0,0,.25),0 6px 14px rgba(0,0,0,.3)}
  .fp-pod::before{content:'';position:absolute;left:24px;top:14px;width:70px;height:24px;
    border-radius:14px;background:rgba(255,255,255,.14);pointer-events:none}
  .fp-in{display:flex;align-items:center;gap:12px;pointer-events:none}
  .fp-ico{font-size:24px}
  .fp-num{font-size:44px;font-weight:700;font-variant-numeric:tabular-nums}
  .fp-bob .fp-pod .fp-in{animation:fp-bobk 2.6s ease-in-out infinite}
  @keyframes fp-bobk{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
  .fp-pod.fp-held{transform:scale(1.08);box-shadow:0 18px 34px rgba(0,0,0,.5);
    cursor:grabbing;z-index:5}
  .fp-pod.fp-held .fp-in{animation:none!important}
  .fp-pod.fp-glide{transition:left .3s ease,top .3s ease}
  .fp-pod.fp-spring{transition:left .45s cubic-bezier(.34,1.8,.64,1),top .45s cubic-bezier(.34,1.8,.64,1)}
  .fp-pod.fp-sink{transition:left .45s ease-in,top .45s ease-in,transform .45s ease-in,opacity .45s ease-in;
    transform:scale(.25);opacity:0;z-index:1}

  /* reduceMotion: no bobbing, no flame dance, every move an instant cut */
  .fp-static,.fp-static *{animation:none!important;transition:none!important}
  .fp-paused *{animation-play-state:paused!important}
`)

export function make({ mount, ask, answer, settings }){
  const field = document.createElement('div')
  field.className = 'fp-field' + (settings.reduceMotion ? ' fp-static' : ' fp-bob')
  field.innerHTML = `
    <div class="fp-rocket" aria-hidden="true">
      <div class="fp-fin fp-fin-l"></div><div class="fp-fin fp-fin-r"></div>
      <div class="fp-flame"></div>
      <div class="fp-body"></div>
      <div class="fp-nose"></div>
      <div class="fp-tank">${'<div class="fp-seg"></div>'.repeat(SEGS)}</div>
    </div>
    <div class="fp-pods"></div>`
  mount.appendChild(field)

  const rocket = field.querySelector('.fp-rocket')
  const tank = field.querySelector('.fp-tank')
  const segs = [...field.querySelectorAll('.fp-seg')]   // index 0 = bottom segment
  const podLayer = field.querySelector('.fp-pods')

  let q = null
  let drag = null          // { pod, id, dx, dy }
  let paused = false
  let filled = 0           // own correct count → gauge segments
  const timers = new Set()

  function later(fn, ms){
    const id = setTimeout(() => { timers.delete(id); fn() }, ms)
    timers.add(id)
  }

  const place = pod => { pod.el.style.left = `${pod.x}px`; pod.el.style.top = `${pod.y}px` }

  function burstAt(x, y){
    const fr = field.getBoundingClientRect()
    const cr = document.getElementById('canvas').getBoundingClientRect()
    const scale = cr.width / 1024
    burst((fr.left - cr.left) / scale + x, (fr.top - cr.top) / scale + y)
  }

  // ---- pods --------------------------------------------------------------
  function layPods(question){
    drag = null
    podLayer.innerHTML = ''
    question.options.forEach((value, i) => makePod(value, i % HOMES.length))
  }

  function makePod(value, i){
    const el = document.createElement('button')
    el.className = 'fp-pod'
    el.setAttribute('aria-label', `${value}`)
    el.innerHTML = `<span class="fp-in" style="animation-delay:${(i * .4).toFixed(1)}s">
      <span class="fp-ico">⛽</span><span class="fp-num">${value}</span></span>`
    const pod = { el, value, x: HOMES[i][0], y: HOMES[i][1], hx: HOMES[i][0], hy: HOMES[i][1] }
    place(pod)
    el.addEventListener('pointerdown', e => down(pod, e))
    el.addEventListener('pointermove', e => move(pod, e))
    el.addEventListener('pointerup', e => up(pod, e))
    el.addEventListener('pointercancel', () => cancelDrag(pod))
    podLayer.appendChild(el)
  }

  // Return a pod to home. cls picks the flavour: glide (calm) or spring (bounce).
  function send(pod, cls, ms, after){
    pod.x = pod.hx; pod.y = pod.hy
    pod.el.classList.add(cls)
    void pod.el.offsetWidth               // commit the transition before moving
    place(pod)
    later(() => { pod.el.classList.remove(cls); if (after) after() }, ms)
  }

  // ---- drag input (pointer events only, coords via localPoint) -----------
  function down(pod, e){
    if (paused || !q || drag) return
    const p = localPoint(e, field)
    drag = { pod, id: e.pointerId, dx: p.x - pod.x, dy: p.y - pod.y }
    pod.el.setPointerCapture(e.pointerId)
    pod.el.classList.remove('fp-glide', 'fp-spring')
    pod.el.classList.add('fp-held')
    sfx.tap()
  }

  function move(pod, e){
    if (!drag || drag.pod !== pod || e.pointerId !== drag.id) return
    const p = localPoint(e, field)
    pod.x = clamp(p.x - drag.dx, -30, 1024 - POD_W + 30)
    pod.y = clamp(p.y - drag.dy, -20, (mount.offsetHeight || 490) - POD_H + 20)
    place(pod)
  }

  function up(pod, e){
    if (!drag || drag.pod !== pod || e.pointerId !== drag.id) return
    endDrag(pod)
    const cx = pod.x + POD_W / 2, cy = pod.y + POD_H / 2
    if (q && cx >= ZONE.x1 && cx <= ZONE.x2 && cy >= ZONE.y1 && cy <= ZONE.y2) drop(pod)
    else send(pod, 'fp-glide', 320)       // missed the tank: calm glide back, no answer()
  }

  function cancelDrag(pod){
    if (!drag || drag.pod !== pod) return
    endDrag(pod)
    send(pod, 'fp-glide', 320)
  }

  function endDrag(pod){
    drag = null
    pod.el.classList.remove('fp-held')
  }

  // ---- dropping in the tank ----------------------------------------------
  function drop(pod){
    const res = answer(pod.value)
    if (res.locked){ send(pod, 'fp-glide', 320); return }   // swallowed: no feedback
    if (res.correct){
      q = null
      sinkIntoTank(pod)
      fillSegment()
      later(next, 600)
    } else {
      sfx.boing()
      send(pod, 'fp-spring', 470, () => wobble(pod.el))     // bouncy return; q stays live
    }
  }

  function sinkIntoTank(pod){
    pod.el.classList.add('fp-sink')
    void pod.el.offsetWidth
    pod.x = TANK.cx - POD_W / 2
    pod.y = TANK.cy - POD_H / 2
    place(pod)
    tank.classList.add('fp-glow')
    later(() => tank.classList.remove('fp-glow'), 600)
    burstAt(TANK.cx, TANK.cy)
    later(() => pod.el.remove(), 500)
  }

  function fillSegment(){
    filled = Math.min(filled + 1, SEGS)
    paintGauge()
    if (filled === SEGS){                 // full tank! happy shimmy, then refill from empty
      sfx.whoosh()
      rocket.classList.add('fp-blast')
      later(() => {
        rocket.classList.remove('fp-blast')
        filled = 0
        paintGauge()
      }, 1100)
    }
  }

  function paintGauge(){
    segs.forEach((s, i) => s.classList.toggle('fp-on', i < filled))
  }

  function next(){
    q = ask()
    if (q) layPods(q)
  }

  // ---- lifecycle ----------------------------------------------------------
  return {
    start(){ next() },
    pause(){
      paused = true
      field.classList.add('fp-paused')
      if (drag){ const pod = drag.pod; endDrag(pod); send(pod, 'fp-glide', 320) }
    },
    resume(){
      paused = false
      field.classList.remove('fp-paused')
    },
    reask(question){
      if (!question) return
      q = question
      layPods(question)
    },
    destroy(){
      timers.forEach(clearTimeout)
      timers.clear()
      field.remove()                      // pods + their listeners go with it
    },
  }
}

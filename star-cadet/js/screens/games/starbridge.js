// Star Bridge (spec §7) — a chasm crosses the bottom half of the playfield.
// Each correct answer lays one glowing plank across the gap and the cadet hops
// onto it; ten planks reach the far cliff. Wrong taps only wobble + dim the
// tapped button — the shell owns hearts, speech and the teach panel.
import { injectStyle, wobble } from './_base.js'
import { burst } from '../../ui/starburst.js'
import { sfx } from '../../audio.js'

export const meta = { id: 'starbridge', costsHeart: true, ownVisual: false }

injectStyle('starbridge', `
  .starbridge-field{position:absolute;inset:0;overflow:hidden}

  /* answer buttons — own class, sized to match .opt (spec §13.2: ≥88px, ≥24px apart) */
  .starbridge-row{position:absolute;left:0;right:0;top:14px;display:flex;justify-content:center;gap:28px;z-index:8}
  .starbridge-opt{
    min-width:110px;min-height:96px;border-radius:24px;font-size:44px;font-weight:700;
    background:var(--nebula-2);border:4px solid var(--rim);color:var(--star);
    box-shadow:0 10px 0 var(--void-2);transition:transform .08s, box-shadow .08s, opacity .2s;
    font-variant-numeric:tabular-nums;font-family:inherit;cursor:pointer;
  }
  .starbridge-opt:active{transform:translateY(5px);box-shadow:0 5px 0 var(--void-2)}
  .starbridge-opt.starbridge-dim{opacity:.35}

  /* chasm */
  .starbridge-depth{position:absolute;left:292px;width:440px;top:330px;bottom:0;
    background:var(--void-2);border-radius:26px 26px 0 0}
  .starbridge-cliff{position:absolute;top:308px;bottom:-8px;box-sizing:border-box;
    background:var(--nebula-2);border:4px solid var(--rim-soft);z-index:2}
  .starbridge-cliff-l{left:-8px;width:308px;border-radius:0 26px 0 0}
  .starbridge-cliff-r{left:724px;width:308px;border-radius:26px 0 0 0}
  .starbridge-goal{position:absolute;left:800px;top:262px;font-size:36px;line-height:1;
    pointer-events:none;z-index:3}

  /* planks */
  .starbridge-plank{position:absolute;height:18px;border-radius:9px;box-sizing:border-box;
    background:var(--sun);border:3px solid var(--sun-deep);box-shadow:0 0 14px var(--sun);z-index:4}
  .starbridge-new{animation:starbridge-glow 1.6s ease-in-out infinite}
  @keyframes starbridge-glow{0%,100%{box-shadow:0 0 8px var(--sun)}50%{box-shadow:0 0 22px var(--sun)}}
  .starbridge-tick{position:absolute;font-size:28px;font-weight:700;color:var(--aqua);
    text-shadow:0 0 8px var(--void-2);pointer-events:none;z-index:7}

  /* cadet */
  .starbridge-cadet{position:absolute;width:56px;height:52px;display:grid;place-items:center;
    pointer-events:none;z-index:6}
  .starbridge-move{transition:left .45s cubic-bezier(.4,.8,.4,1), top .45s cubic-bezier(.4,.8,.4,1)}
  .starbridge-stroll{transition:left .9s ease-in-out, top .9s ease-in-out}
  .starbridge-cbody{font-size:44px;line-height:1;display:block}
  .starbridge-hop{animation:starbridge-hopk .45s ease}
  @keyframes starbridge-hopk{0%{transform:translateY(0)}45%{transform:translateY(-36px)}100%{transform:translateY(0)}}
  .starbridge-cheer{animation:starbridge-cheerk .9s ease}
  @keyframes starbridge-cheerk{0%,100%{transform:translateY(0)}25%{transform:translateY(-30px)}
    50%{transform:translateY(0)}75%{transform:translateY(-22px)}}
`)

export function make({ mount, ask, answer, settings }){
  const RM = !!settings.reduceMotion
  const GAP_L = 300, GAP_R = 724, N = 10          // 10 planks = the level target
  const PLANK_W = (GAP_R - GAP_L) / N             // 42.4px each
  const CLIFF_TOP = 308, PLANK_TOP = 296

  const root = document.createElement('div')
  root.className = 'starbridge-field'
  root.innerHTML = `
    <div class="starbridge-depth"></div>
    <div class="starbridge-cliff starbridge-cliff-l"></div>
    <div class="starbridge-cliff starbridge-cliff-r"></div>
    <div class="starbridge-goal">⭐</div>
    <div class="starbridge-row"></div>
    <div class="starbridge-cadet"><span class="starbridge-cbody">🧑‍🚀</span></div>
  `
  mount.appendChild(root)
  const row = root.querySelector('.starbridge-row')
  const cadet = root.querySelector('.starbridge-cadet')
  const body = root.querySelector('.starbridge-cbody')

  let q = null
  let planks = 0                                   // = my correct count, capped at N
  let running = false

  const timers = new Set()
  function later(fn, ms){
    const id = setTimeout(() => { timers.delete(id); fn() }, ms)
    timers.add(id)
  }

  // position the cadet by its feet; mode 'jump'|'walk' animates (instant under RM)
  function place(footX, footY, mode){
    cadet.classList.remove('starbridge-move', 'starbridge-stroll')
    if (!RM && mode){
      void cadet.offsetWidth
      cadet.classList.add(mode === 'walk' ? 'starbridge-stroll' : 'starbridge-move')
    }
    cadet.style.left = `${footX - 28}px`
    cadet.style.top = `${footY - 50}px`
  }

  function hopAnim(cls){
    if (RM) return
    body.classList.remove('starbridge-hop', 'starbridge-cheer')
    void body.offsetWidth
    body.classList.add(cls)
  }

  function burstAt(x, y){
    const fr = root.getBoundingClientRect()
    const cr = document.getElementById('canvas').getBoundingClientRect()
    const scale = cr.width / 1024
    burst((fr.left - cr.left) / scale + x, (fr.top - cr.top) / scale + y)
  }

  function layPlank(i){
    const prev = root.querySelector('.starbridge-new')
    if (prev) prev.classList.remove('starbridge-new')
    const p = document.createElement('div')
    p.className = 'starbridge-plank'
    p.style.left = `${GAP_L + i * PLANK_W - 2}px`
    p.style.width = `${PLANK_W + 4}px`
    p.style.top = `${PLANK_TOP}px`
    if (!RM) p.classList.add('pop-in', 'starbridge-new')
    root.appendChild(p)
    sfx.tick()
    const t = document.createElement('div')
    t.className = 'starbridge-tick'
    t.textContent = '✔'
    t.style.left = `${GAP_L + (i + .5) * PLANK_W - 12}px`
    t.style.top = `${PLANK_TOP - 42}px`
    if (!RM) t.classList.add('pop-in')
    root.appendChild(t)
    later(() => t.remove(), 800)
    burstAt(GAP_L + (i + .5) * PLANK_W, PLANK_TOP)
  }

  function tap(btn, value){
    if (!q || !running) return
    const res = answer(value)
    if (res.locked) return
    if (res.correct){
      q = null
      if (planks < N){
        layPlank(planks)
        planks++
        const footX = GAP_L + (planks - .5) * PLANK_W
        later(() => { place(footX, PLANK_TOP, 'jump'); hopAnim('starbridge-hop') }, RM ? 0 : 160)
      } else {
        hopAnim('starbridge-hop')                  // bridge already complete: hop in place
      }
      later(next, 750)
    } else {
      wobble(btn)                                  // wobble + brief dim; nothing else
      btn.classList.add('starbridge-dim')
      later(() => btn.classList.remove('starbridge-dim'), 700)
    }
  }

  function renderOptions(question){
    row.innerHTML = ''
    question.options.forEach(value => {
      const b = document.createElement('button')
      b.className = 'starbridge-opt'
      b.textContent = value
      b.setAttribute('aria-label', `${value}`)
      b.addEventListener('pointerdown', () => tap(b, value))
      row.appendChild(b)
    })
  }

  function next(){
    q = ask()
    if (q) renderOptions(q)
    else finale()                                  // level over: walk to the far cliff
  }

  function finale(){
    row.innerHTML = ''
    place(770, CLIFF_TOP, 'walk')
    hopAnim('starbridge-cheer')
    later(() => burstAt(770, CLIFF_TOP - 40), RM ? 0 : 900)
  }

  return {
    start(){
      running = true
      place(252, CLIFF_TOP)                        // instant: standing on the left cliff
      next()
    },
    pause(){ running = false },
    resume(){ running = true },
    reask(question){
      if (!question) return
      q = question
      renderOptions(question)
    },
    destroy(){
      running = false
      timers.forEach(clearTimeout)
      timers.clear()
      root.remove()
    },
  }
}

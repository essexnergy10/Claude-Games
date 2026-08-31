// Feed the Alien (spec §7) — counting game. Zibby wants N snacks: the child taps
// the bowl to move snacks onto the plate one at a time (the running count is
// spoken aloud), taps a snack to put it back, then taps ✔ to serve Zibby.
// ownVisual: the shell hides its question card; the prompt strip at the top
// (big numeral, or the 👾 array) is rendered here. Answers are never > 12.
import { injectStyle, wobble } from './_base.js'
import { burst } from '../../ui/starburst.js'
import { zibbySVG } from '../../ui/rocket.js'
import { say, sfx } from '../../audio.js'
import { numWords } from '../../facts.js'

export const meta = { id: 'feedalien', costsHeart: true, ownVisual: true }

const SNACKS = ['🍪', '🍓', '🥕', '🫐']
const PLATE_MAX = 12                       // cap — this game never asks for more

injectStyle('feedalien', `
  .fa-root{position:absolute;inset:0;overflow:hidden}

  /* ── Prompt strip (we own the question card) ── */
  .fa-prompt{
    position:absolute;top:10px;left:50%;transform:translateX(-50%);
    display:flex;align-items:center;gap:20px;min-height:96px;max-width:940px;
    background:var(--nebula);border:3px solid var(--rim-soft);border-radius:26px;
    padding:12px 36px;
  }
  .fa-want{font-size:26px;font-weight:600;color:var(--star);white-space:nowrap}
  .fa-num{
    font-size:60px;font-weight:700;color:var(--sun);line-height:1;
    font-variant-numeric:tabular-nums;
  }
  .fa-hint{font-size:46px;line-height:1}
  .fa-array{display:grid;gap:6px;justify-items:center}
  .fa-array span{line-height:1}

  /* ── Snack bowl (tap = add one) ── */
  .fa-bowl{
    position:absolute;left:40px;top:300px;width:210px;height:196px;
    cursor:pointer;transition:transform .08s ease;
  }
  .fa-bowl:active{transform:scale(.95)}
  .fa-bowl-dish{
    position:absolute;left:0;right:0;bottom:0;height:108px;
    background:var(--nebula-2);border:4px solid var(--rim);
    border-radius:18px 18px 100px 100px;
  }
  .fa-bowl-heap{position:absolute;left:0;right:0;top:0;height:110px;pointer-events:none}
  .fa-bowl-heap span{position:absolute;font-size:54px;line-height:1}
  .fa-bowl-heap span:nth-child(1){left:18px;top:44px}
  .fa-bowl-heap span:nth-child(2){left:78px;top:20px}
  .fa-bowl-heap span:nth-child(3){left:136px;top:44px}
  .fa-bowl-plus{
    position:absolute;top:-8px;right:-4px;width:54px;height:54px;border-radius:50%;
    background:var(--aqua);color:var(--void);border:4px solid var(--void);
    display:grid;place-items:center;font-size:34px;font-weight:700;line-height:1;
    pointer-events:none;
  }

  /* ── Plate ── */
  .fa-plate{
    position:absolute;left:300px;top:240px;width:472px;height:376px;
    background:var(--nebula);border:4px solid var(--rim-soft);border-radius:40px;
  }
  .fa-grid{
    position:absolute;inset:20px;display:grid;
    grid-template-columns:repeat(4,88px);grid-auto-rows:88px;gap:24px;
    justify-content:center;align-content:start;
  }
  .fa-snack{
    width:88px;height:88px;border-radius:50%;background:var(--nebula-2);
    display:grid;place-items:center;font-size:52px;line-height:1;cursor:pointer;
  }
  .fa-snack.fa-eat{
    transition:transform .38s ease-in,opacity .38s ease-in;
    transform:translate(340px,-120px) scale(.15);opacity:0;
  }

  /* ── Zibby ── */
  .fa-zibby{position:absolute;left:805px;top:200px;width:190px;height:190px;pointer-events:none}
  @keyframes fa-bounce{
    0%,100%{transform:translateY(0)}
    30%{transform:translateY(-36px) scale(1.06)}
    60%{transform:translateY(0)}
    80%{transform:translateY(-14px)}
  }
  .fa-zibby.fa-bouncing{animation:fa-bounce .65s ease}

  /* ── ✔ serve button ── */
  .fa-check{
    position:absolute;left:822px;top:482px;width:150px;height:150px;border-radius:50%;
    background:var(--aqua);color:var(--void);font-size:72px;font-weight:700;
    display:grid;place-items:center;box-shadow:0 12px 0 var(--aqua-deep);
    transition:transform .08s ease,box-shadow .08s ease;cursor:pointer;
  }
  .fa-check:active{transform:translateY(6px);box-shadow:0 6px 0 var(--aqua-deep)}
`)

export function make({ mount, ask, answer, settings }){
  const root = document.createElement('div')
  root.className = 'fa-root'
  root.innerHTML = `
    <div class="fa-prompt"></div>
    <button class="fa-bowl" aria-label="Add one snack">
      <span class="fa-bowl-heap"><span></span><span></span><span></span></span>
      <span class="fa-bowl-dish"></span>
      <span class="fa-bowl-plus">+</span>
    </button>
    <div class="fa-plate"><div class="fa-grid"></div></div>
    <div class="fa-zibby">${zibbySVG(190)}</div>
    <button class="fa-check" aria-label="Give the snacks to Zibby">✔</button>
  `
  mount.appendChild(root)

  const prompt = root.querySelector('.fa-prompt')
  const bowl = root.querySelector('.fa-bowl')
  const heap = [...root.querySelectorAll('.fa-bowl-heap span')]
  const plate = root.querySelector('.fa-plate')
  const grid = root.querySelector('.fa-grid')
  const zibby = root.querySelector('.fa-zibby')
  const check = root.querySelector('.fa-check')

  if (!settings.reduceMotion) zibby.classList.add('bob')

  let q = null
  let snack = SNACKS[0]      // this question's snack emoji
  let paused = false
  let busy = false           // true while Zibby is eating

  // Every timeout is tracked so destroy() can cancel them all.
  const timers = new Set()
  function after(ms, fn){
    const t = setTimeout(() => { timers.delete(t); fn() }, ms)
    timers.add(t)
    return t
  }

  const plateCount = () => grid.children.length

  // ── Prompt strip: the visual question ──
  function renderPrompt(question){
    prompt.innerHTML = ''
    const want = document.createElement('span')
    want.className = 'fa-want'
    want.textContent = 'Zibby wants'
    prompt.appendChild(want)

    if (question.fact.op === 'array'){
      // r rows of c space-invaders — the child counts them out as snacks
      const { r, c } = question.inst
      const arr = document.createElement('div')
      arr.className = 'fa-array'
      arr.style.gridTemplateColumns = `repeat(${c},1fr)`
      const px = r <= 2 ? 36 : r === 3 ? 30 : 22
      for (let i = 0; i < r * c; i++){
        const s = document.createElement('span')
        s.style.fontSize = `${px}px`
        s.textContent = '👾'
        arr.appendChild(s)
      }
      prompt.appendChild(arr)
    } else {
      // 'count' (and any numeric fallback): the numeral IS the question
      const num = document.createElement('span')
      num.className = 'fa-num tnum'
      num.textContent = question.answer
      prompt.appendChild(num)
      const hint = document.createElement('span')
      hint.className = 'fa-hint'
      hint.textContent = snack
      prompt.appendChild(hint)
    }
  }

  function render(question, keepPlate){
    if (!keepPlate){
      grid.innerHTML = ''
      snack = SNACKS[Math.floor(Math.random() * SNACKS.length)]
      heap.forEach(s => { s.textContent = snack })
    }
    renderPrompt(question)
  }

  // ── Bowl tap: add ONE snack, speak the running count ──
  function addSnack(){
    if (!q || paused || busy) return
    if (plateCount() >= PLATE_MAX){ sfx.boing(); return }   // plate is full, no fuss
    const b = document.createElement('button')
    b.className = 'fa-snack pop-in'
    b.textContent = snack
    b.setAttribute('aria-label', 'Take one snack back')
    b.addEventListener('pointerdown', e => { e.stopPropagation(); removeSnack(b) })
    grid.appendChild(b)
    sfx.tap()
    say(numWords(plateCount()), { queue: false })
  }

  // ── Snack tap: put it back (mistakes are correctable) ──
  function removeSnack(b){
    if (!q || paused || busy) return
    b.remove()
    sfx.tick()
    say(numWords(plateCount()), { queue: false })
  }

  // ── ✔ tap: serve Zibby ──
  function serve(){
    if (!q || paused || busy) return
    const res = answer(plateCount())
    if (res.locked) return
    if (res.correct){
      busy = true
      q = null
      feast()
    } else {
      wobble(plate)          // snacks stay put so the child can recount and adjust
    }
  }

  // Correct: Zibby bounces and the snacks fly in one by one with quick ticks.
  function feast(){
    const snacks = [...grid.children]
    if (settings.reduceMotion){
      grid.innerHTML = ''
      after(400, next)
      return
    }
    zibby.classList.remove('fa-bouncing')
    void zibby.offsetWidth
    zibby.classList.add('fa-bouncing')
    snacks.forEach((s, i) => after(180 + i * 80, () => {
      s.classList.add('fa-eat')
      sfx.tick()
    }))
    after(180 + snacks.length * 80 + 400, () => {
      grid.innerHTML = ''
      const zr = zibby.getBoundingClientRect()
      const cr = document.getElementById('canvas').getBoundingClientRect()
      const scale = cr.width / 1024
      burst((zr.left - cr.left) / scale + 95, (zr.top - cr.top) / scale + 95, { emoji: '✨' })
      after(260, next)
    })
  }

  function next(){
    busy = false
    q = ask()
    if (q) render(q, false)
  }

  bowl.addEventListener('pointerdown', addSnack)
  check.addEventListener('pointerdown', serve)

  return {
    start(){ next() },
    pause(){ paused = true },
    resume(){ paused = false },
    reask(question){
      if (!question) return
      const same = question === q     // teach panel re-poses the same question
      q = question
      busy = false
      render(question, same)          // same → keep the plate exactly as it was
    },
    destroy(){
      for (const t of timers) clearTimeout(t)
      timers.clear()
      root.remove()
    },
  }
}

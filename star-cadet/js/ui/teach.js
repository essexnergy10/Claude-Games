// Show Me How — the teaching panel (spec §6). One component, visual per operation.
// Returns a promise that resolves when the child closes it.
import { say, sfx } from '../audio.js'
import { numWords, answerOf } from '../facts.js'
import { state, markDirty } from '../state.js'

const reduce = () => document.documentElement.classList.contains('reduce-motion')
const wait = ms => new Promise(r => setTimeout(r, reduce() ? 10 : ms))
const cap = s => s.charAt(0).toUpperCase() + s.slice(1)

let open = false
export const teachIsOpen = () => open

export function showTeach(fact, inst){
  if (open) return Promise.resolve()
  open = true
  state.totals.helpOpens++; markDirty()

  return new Promise(resolve => {
    const overlay = document.createElement('div')
    overlay.className = 'overlay'
    overlay.innerHTML = `
      <div class="panel teach-panel">
        <div class="teach-title">💡 Show me how</div>
        <div class="teach-stage"></div>
        <button class="btn" style="font-size:26px;min-height:88px">Got it! ✔</button>
      </div>`
    document.getElementById('overlay-root').appendChild(overlay)
    const stage = overlay.querySelector('.teach-stage')
    let cancelled = false

    overlay.querySelector('.btn').addEventListener('click', () => {
      cancelled = true
      open = false
      overlay.remove()
      resolve()
    })

    const run = {
      add: teachAdd, sub: teachSub, mul: teachMul, array: teachMul,
      count: teachCount, subitise: teachCount, order: teachOrder, skip: teachSkip,
    }[fact.op] ?? teachCount

    run(stage, fact, inst, () => cancelled).catch(() => {})
  })
}

function counterEl(cls){
  const c = document.createElement('div')
  c.className = `counter ${cls} pop-in`
  return c
}

// ── Add: ten-frame(s), a counters in aqua then b in coral (spec §6) ──
async function teachAdd(stage, f, inst, dead){
  const total = f.a + f.b
  const frames = total > 10 ? 2 : 1
  const wrap = document.createElement('div')
  wrap.style.cssText = 'display:flex;gap:22px'
  const cells = []
  for (let fr = 0; fr < frames; fr++){
    const tf = document.createElement('div')
    tf.className = 'ten-frame'
    for (let i = 0; i < 10; i++){
      const cell = document.createElement('div')
      cell.className = 'cell'
      tf.appendChild(cell)
      cells.push(cell)
    }
    wrap.appendChild(tf)
  }
  stage.appendChild(wrap)
  const sum = document.createElement('div')
  sum.className = 'teach-sum'
  stage.appendChild(sum)

  say(`${cap(numWords(f.a))}…`, { queue: false })
  for (let i = 0; i < f.a; i++){
    if (dead()) return
    cells[i].appendChild(counterEl('a')); sfx.tick()
    await wait(180)
  }
  await wait(420)
  say(`and ${numWords(f.b)} more…`, { queue: true })
  for (let i = f.a; i < total; i++){
    if (dead()) return
    cells[i].appendChild(counterEl('b')); sfx.tick()
    await wait(180)
  }
  await wait(450)
  if (dead()) return
  sum.textContent = `${f.a} + ${f.b} = ${total}`
  say(`makes ${numWords(total)}!`, { queue: true })
}

// ── Take away: a objects, b fade and float away, no minus sign until after (spec §6) ──
async function teachSub(stage, f, inst, dead){
  const row = document.createElement('div')
  row.className = 'teach-row'
  stage.appendChild(row)
  const sum = document.createElement('div')
  sum.className = 'teach-sum'
  stage.appendChild(sum)

  const objs = []
  say(`${cap(numWords(f.a))} stars…`)
  for (let i = 0; i < f.a; i++){
    if (dead()) return
    const o = document.createElement('span')
    o.textContent = '⭐'; o.className = 'pop-in'
    row.appendChild(o); objs.push(o); sfx.tick()
    await wait(150)
  }
  await wait(500)
  say(`take away ${numWords(f.b)}…`, { queue: true })
  for (let i = 0; i < f.b; i++){
    if (dead()) return
    const o = objs[f.a - 1 - i]
    o.classList.add('float-away')
    sfx.whoosh()
    await wait(320)
  }
  await wait(600)
  if (dead()) return
  sum.textContent = `${f.a} − ${f.b} = ${f.a - f.b}`
  say(`${numWords(f.a - f.b)} left!`, { queue: true })
}

// ── Times / array: rows of aliens + skip-count strip lighting up (spec §6) ──
async function teachMul(stage, f, inst, dead){
  const r = f.op === 'array' ? f.r : f.a
  const c = f.op === 'array' ? f.c : f.b
  const grid = document.createElement('div')
  grid.className = 'teach-array'
  grid.style.gridTemplateColumns = `repeat(${c}, 48px)`
  stage.appendChild(grid)
  const strip = document.createElement('div')
  strip.className = 'skip-strip'
  stage.appendChild(strip)
  const sum = document.createElement('div')
  sum.className = 'teach-sum'
  stage.appendChild(sum)

  const stripEls = []
  for (let i = 1; i <= r; i++){
    const sk = document.createElement('div')
    sk.className = 'sk tnum'
    sk.textContent = c * i
    strip.appendChild(sk)
    stripEls.push(sk)
  }

  say(`${cap(numWords(r))} rows. ${cap(numWords(c))} in each row.`)
  for (let row = 0; row < r; row++){
    if (dead()) return
    for (let col = 0; col < c; col++){
      const a = document.createElement('span')
      a.className = 'al pop-in'
      a.textContent = '👾'
      grid.appendChild(a)
    }
    sfx.tick()
    await wait(260)
  }
  await wait(420)
  say("Let's count them!", { queue: true })
  await wait(700)
  for (let i = 0; i < r; i++){
    if (dead()) return
    stripEls[i].classList.add('lit')
    say(`${numWords(c * (i + 1))}…`, { queue: true })
    sfx.tick()
    await wait(620)
  }
  await wait(300)
  if (dead()) return
  const total = r * c
  sum.textContent = f.op === 'array' ? `${r} rows of ${c} = ${total}` : `${f.a} × ${f.b} = ${total}`
  say(`${cap(numWords(r))} ${f.op === 'array' ? 'rows of' : 'times'} ${numWords(c)} makes ${numWords(total)}!`, { queue: true })
}

// ── Count / subitise: objects appear one at a time, counted aloud ──
async function teachCount(stage, f, inst, dead){
  const n = f.n
  const row = document.createElement('div')
  row.className = 'teach-row'
  stage.appendChild(row)
  const sum = document.createElement('div')
  sum.className = 'teach-sum'
  stage.appendChild(sum)

  say("Let's count together!")
  await wait(900)
  for (let i = 1; i <= n; i++){
    if (dead()) return
    const o = document.createElement('span')
    o.textContent = inst?.emoji ?? '⭐'
    o.className = 'pop-in'
    row.appendChild(o)
    say(`${numWords(i)}…`, { queue: true })
    sfx.tick()
    await wait(560)
  }
  await wait(300)
  if (dead()) return
  sum.textContent = `${n}`
  say(`${cap(numWords(n))}!`, { queue: true })
}

// ── Order: a number line, hop from n to n+1 ──
async function teachOrder(stage, f, inst, dead){
  const start = Math.max(1, f.n - 3), end = Math.min(20, f.n + 3)
  const line = document.createElement('div')
  line.className = 'numline'
  stage.appendChild(line)
  const sum = document.createElement('div')
  sum.className = 'teach-sum'
  stage.appendChild(sum)

  const els = {}
  for (let i = start; i <= end; i++){
    const nl = document.createElement('div')
    nl.className = 'nl tnum'
    nl.textContent = i
    line.appendChild(nl)
    els[i] = nl
  }
  say(`Here is ${numWords(f.n)}.`)
  els[f.n].classList.add('here')
  await wait(1300)
  if (dead()) return
  say(`One step along… ${numWords(f.n + 1)}!`, { queue: true })
  els[f.n + 1].classList.add('next')
  sfx.tick()
  await wait(700)
  if (dead()) return
  sum.textContent = `${f.n} → ${f.n + 1}`
}

// ── Skip counting: the strip lights in sequence ──
async function teachSkip(stage, f, inst, dead){
  const strip = document.createElement('div')
  strip.className = 'skip-strip'
  stage.appendChild(strip)
  const seq = inst?.seq ?? [f.n, f.n * 2, f.n * 3, f.n * 4]
  const els = seq.map(v => {
    const sk = document.createElement('div')
    sk.className = 'sk tnum'
    sk.textContent = v
    strip.appendChild(sk)
    return sk
  })
  say(`Counting in ${numWords(f.n)}s!`)
  await wait(1100)
  for (let i = 0; i < seq.length; i++){
    if (dead()) return
    els[i].classList.add('lit')
    say(`${numWords(seq[i])}…`, { queue: true })
    sfx.tick()
    await wait(640)
  }
}

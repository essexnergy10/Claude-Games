// Grown-Up Zone (spec §10) — the adult dashboard behind a written-sum gate.
// The launchpad hold-3s already happened; the two-digit sum here is the second
// gate a 5-year-old cannot pass. Everything reads from state + the curriculum
// pools; every mutation marks dirty, and the save is flushed on leave.
import { injectStyle } from './games/_base.js'
import { show } from '../router.js'
import { state, saveNow, markDirty, weekStats, exportSave, importSave, resetSave } from '../state.js'
import { PLANETS, planetById, planetPool } from '../curriculum.js'
import { MASTERED } from '../mastery.js'
import { parseFact, mulId } from '../facts.js'
import { sfx } from '../audio.js'

const TABLES = [2, 5, 10, 3, 4]          // mastery-map row order — fixed by spec
const LIMITS = [10, 15, 20, 30, 999]     // daily-minute choices; 999 = unlimited
const GLYPH = { mastered: '✓', nearly: '•', learning: '', none: '' }

injectStyle('pz', `
  .pz-body{position:absolute;inset:88px 0 0 0;overflow-y:auto;padding:8px 0 48px;-webkit-overflow-scrolling:touch}

  /* ── Gate ── */
  .pz-gate{min-height:100%;display:grid;place-items:center}
  .pz-gate-panel{
    background:var(--nebula);border:3px solid var(--rim);border-radius:28px;
    padding:28px 36px;display:flex;flex-direction:column;align-items:center;gap:18px;
  }
  .pz-gate-hint{font-family:var(--font-mono);text-transform:uppercase;letter-spacing:.16em;
    font-size:15px;color:var(--star-dim)}
  .pz-gate-sum{font-size:46px;font-weight:600;font-variant-numeric:tabular-nums}
  .pz-entry{display:inline-block;min-width:100px;color:var(--sun)}
  .pz-pad{display:grid;grid-template-columns:repeat(3,78px);gap:12px}
  .pz-key{
    width:78px;height:78px;border-radius:20px;background:var(--nebula-2);
    border:3px solid var(--rim);color:var(--star);font-size:30px;font-weight:600;
    display:grid;place-items:center;font-variant-numeric:tabular-nums;
    box-shadow:0 6px 0 #1A1140;transition:transform .08s, box-shadow .08s;
  }
  .pz-key:active{transform:translateY(3px);box-shadow:0 3px 0 #1A1140}
  .pz-key-ok{background:var(--aqua);border-color:var(--aqua-deep);color:var(--void)}

  /* ── Dashboard ── */
  .pz-col{width:720px;margin:0 auto;display:flex;flex-direction:column;gap:16px;font-size:16px}
  .pz-sec{background:var(--nebula);border:3px solid var(--rim-soft);border-radius:22px;padding:20px 22px}
  .pz-h{font-family:var(--font-mono);text-transform:uppercase;letter-spacing:.16em;
    font-size:15px;color:var(--lilac);margin-bottom:14px}

  .pz-map{display:flex;flex-direction:column;gap:4px;overflow-x:auto}
  .pz-map-row{display:flex;gap:4px}
  .pz-cell{width:44px;height:44px;min-width:44px;border-radius:10px;display:grid;place-items:center;
    font-size:17px;font-weight:600;font-variant-numeric:tabular-nums}
  .pz-lab{background:none;color:var(--star-dim);font-family:var(--font-mono);font-size:15px}
  .pz-c-mastered{background:var(--m-mastered);color:var(--void)}
  .pz-c-nearly{background:var(--m-nearly);color:var(--void)}
  .pz-c-learning{background:var(--m-learning);color:var(--star)}
  .pz-c-none{background:var(--m-none)}
  .pz-legend{display:flex;gap:20px;flex-wrap:wrap;margin-top:12px;font-size:15px;color:var(--star-dim)}
  .pz-legend .pz-sw{display:inline-grid;place-items:center;width:22px;height:22px;min-width:22px;
    border-radius:6px;margin-right:7px;vertical-align:-5px;font-size:13px;color:var(--void)}
  .pz-legend span{display:inline-flex;align-items:center}

  .pz-bar-row{display:flex;align-items:center;gap:14px;min-height:36px}
  .pz-bar-lab{width:220px;font-family:var(--font-mono);text-transform:uppercase;letter-spacing:.08em;
    font-size:15px;color:var(--star-dim)}
  .pz-bar{flex:1;height:16px;border-radius:999px;background:var(--m-none);overflow:hidden}
  .pz-bar-fill{height:100%;border-radius:999px;background:var(--aqua)}
  .pz-bar-n{width:66px;text-align:right;font-size:16px;font-variant-numeric:tabular-nums}

  .pz-tricky-row{display:flex;justify-content:space-between;align-items:center;
    min-height:44px;border-bottom:2px solid var(--rim-soft)}
  .pz-tricky-row:last-child{border-bottom:none}
  .pz-tricky-sum{font-size:22px;font-weight:600;font-variant-numeric:tabular-nums}
  .pz-tricky-tally{font-family:var(--font-mono);font-size:15px;letter-spacing:.08em;color:var(--star-dim)}

  .pz-tiles{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
  .pz-tile{background:var(--nebula-2);border:2px solid var(--rim-soft);border-radius:16px;
    padding:14px 8px;text-align:center}
  .pz-tile-v{font-size:30px;font-weight:700;font-variant-numeric:tabular-nums}
  .pz-tile-l{font-family:var(--font-mono);text-transform:uppercase;letter-spacing:.1em;
    font-size:15px;color:var(--star-dim);margin-top:4px}

  .pz-ctl-row{display:flex;align-items:center;gap:12px;min-height:60px;flex-wrap:wrap}
  .pz-ctl-row + .pz-ctl-row{margin-top:10px}
  .pz-ctl-lab{width:200px;font-family:var(--font-mono);text-transform:uppercase;letter-spacing:.08em;
    font-size:15px;color:var(--star-dim)}
  .pz-seg{display:flex;gap:8px}
  .pz-seg button{min-width:74px;min-height:56px;border-radius:14px;background:var(--nebula-2);
    border:3px solid var(--rim-soft);color:var(--star);font-size:19px;font-weight:600}
  .pz-seg button.on{background:var(--sun);border-color:var(--sun-deep);color:#3A2404}

  .pz-toggle{display:flex;align-items:center;gap:12px;min-height:60px;width:100%;text-align:left;
    background:var(--nebula-2);border:3px solid var(--rim-soft);border-radius:16px;
    padding:0 18px;font-size:17px;font-weight:600;color:var(--star)}
  .pz-toggle .pz-tstate{margin-left:auto;font-family:var(--font-mono);font-size:15px;
    letter-spacing:.14em;color:var(--star-dim);border:2px solid var(--rim-soft);
    border-radius:999px;padding:6px 14px}
  .pz-toggle.on{border-color:var(--aqua-deep)}
  .pz-toggle.on .pz-tstate{background:var(--aqua);border-color:var(--aqua-deep);color:var(--void)}

  .pz-planets{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
  .pz-planet{min-height:60px;border-radius:16px;background:var(--nebula-2);
    border:3px solid var(--rim-soft);display:flex;align-items:center;justify-content:center;
    gap:8px;font-size:17px;font-weight:600;color:var(--star)}
  .pz-planet.forced{border-color:var(--aqua-deep)}

  .pz-actions{display:flex;flex-direction:column;gap:12px}
  .pz-act{min-height:60px;border-radius:16px;background:var(--nebula-2);
    border:3px solid var(--rim-soft);display:flex;align-items:center;gap:12px;
    padding:0 18px;font-size:17px;font-weight:600;color:var(--star)}
  .pz-act.armed{background:var(--coral);border-color:var(--coral);color:var(--void)}
  .pz-note{font-size:15px;color:var(--star-dim);min-height:20px}
  .pz-install{font-size:15px;color:var(--star-dim);text-align:center;padding:4px 0 10px}
`)

// ── Pure helpers (read state, build HTML strings) ──

function cellState(t, n){
  const f = state.facts[mulId(t, n)]
  if (f && MASTERED(f)) return 'mastered'
  if (f && f.box >= 3) return 'nearly'
  if (f && f.seen > 0) return 'learning'
  return 'none'
}

function mapHTML(){
  const cols = Array.from({ length: 12 }, (_, i) => i + 1)
  const head = `<div class="pz-map-row"><div class="pz-cell pz-lab">×</div>` +
    cols.map(n => `<div class="pz-cell pz-lab tnum">${n}</div>`).join('') + `</div>`
  const rows = TABLES.map(t =>
    `<div class="pz-map-row"><div class="pz-cell pz-lab tnum">${t}</div>` +
    cols.map(n => {
      const st = cellState(t, n)
      return `<div class="pz-cell pz-c-${st} tnum" aria-label="${t} times ${n}: ${st}">${GLYPH[st]}</div>`
    }).join('') + `</div>`).join('')
  return head + rows
}

function bandsHTML(){
  const plus  = planetPool(planetById('plusto')).map(parseFact).filter(f => f.op === 'add')
  const minus = planetPool(planetById('minoo')).map(parseFact).filter(f => f.op === 'sub')
  const bands = [
    ['add within 10',       plus.filter(f => f.a + f.b <= 10)],
    ['add within 20',       plus.filter(f => f.a + f.b > 10)],
    ['take away within 10', minus.filter(f => f.a <= 10)],
    ['take away within 20', minus.filter(f => f.a > 10)],
  ]
  return bands.map(([lab, facts]) => {
    const done = facts.filter(f => { const r = state.facts[f.id]; return r && MASTERED(r) }).length
    const pct = facts.length ? Math.round(done * 100 / facts.length) : 0
    return `<div class="pz-bar-row">
      <div class="pz-bar-lab">${lab}</div>
      <div class="pz-bar"><div class="pz-bar-fill" style="width:${pct}%"></div></div>
      <div class="pz-bar-n tnum">${done}/${facts.length}</div>
    </div>`
  }).join('')
}

function humanFact(id){
  try {
    const f = parseFact(id)
    switch (f.op){
      case 'add':      return `${f.a} + ${f.b}`
      case 'sub':      return `${f.a} − ${f.b}`
      case 'mul':      return `${f.a} × ${f.b}`
      case 'array':    return `${f.r} × ${f.c} array`
      case 'count':    return `count to ${f.n}`
      case 'subitise': return `spot ${f.n} dots`
      case 'order':    return `after ${f.n}`
      case 'skip':     return `count in ${f.n}s`
    }
  } catch { /* unknown id shape — show raw */ }
  return id
}

function trickyHTML(){
  const top = Object.values(state.facts)
    .filter(f => f.wrong > 0)
    .sort((a, b) => b.wrong - a.wrong)
    .slice(0, 4)
  if (!top.length) return `<div class="pz-note">Nothing tricky yet — smooth flying so far.</div>`
  return top.map(f => `<div class="pz-tricky-row">
    <div class="pz-tricky-sum tnum">${humanFact(f.id)}</div>
    <div class="pz-tricky-tally tnum">right ${f.right} · missed ${f.wrong}</div>
  </div>`).join('')
}

function applyReduce(){
  const sys = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
  document.documentElement.classList.toggle('reduce-motion', !!state.settings.reduceMotion || sys)
}

const newSum = () => ({
  a: 12 + Math.floor(Math.random() * 76),      // 12–87: always two digits,
  b: 12 + Math.floor(Math.random() * 76),      // sums reach three digits
})

// ── Screen ──

export function mountParent(root){
  let alive = true
  const timers = new Set()
  const later = (fn, ms) => {
    const t = setTimeout(() => { timers.delete(t); if (alive) fn() }, ms)
    timers.add(t)
  }

  const el = document.createElement('div')
  el.className = 'screen'
  el.innerHTML = `
    <div class="gx-top">
      <button class="hud-btn" data-a="back" aria-label="Back">🏠</button>
      <div class="gx-title">🔒 Grown-Up Zone</div>
    </div>
    <div class="pz-body"></div>
  `
  root.appendChild(el)
  const body = el.querySelector('.pz-body')

  el.querySelector('[data-a="back"]').addEventListener('click', () => {
    sfx.tap()
    saveNow()
    show('launchpad')
  })

  // Import file input lives at mount level so re-renders never duplicate it.
  const file = document.createElement('input')
  file.type = 'file'
  file.accept = '.json'
  file.hidden = true
  el.appendChild(file)
  file.addEventListener('change', () => {
    const f = file.files && file.files[0]
    if (!f) return
    f.text()
      .then(text => {
        if (!alive) return
        try {
          importSave(text)
          applyReduce()
          renderDash()
          body.querySelector('[data-r="note"]').textContent = 'Save imported — all set. ✓'
        } catch {
          setNote(`Import didn't work — that file isn't a Star Cadet save.`)
        }
      })
      .catch(() => { if (alive) setNote(`Import didn't work — could not read that file.`) })
  })

  const setNote = txt => {
    const n = body.querySelector('[data-r="note"]')
    if (n) n.textContent = txt
  }

  // ── Gate: a written two-digit sum, regenerated on each mount ──
  function renderGate(){
    let sum = newSum()
    let entry = ''
    let locked = false
    body.innerHTML = `
      <div class="pz-gate">
        <div class="pz-gate-panel">
          <div class="pz-gate-hint">For grown-ups — solve to enter</div>
          <div class="pz-gate-sum tnum"><span data-r="sum"></span><span class="pz-entry" data-r="entry"></span></div>
          <div class="pz-pad" data-r="pad"></div>
        </div>
      </div>
    `
    const panel = body.querySelector('.pz-gate-panel')
    const sumEl = body.querySelector('[data-r="sum"]')
    const entryEl = body.querySelector('[data-r="entry"]')
    const pad = body.querySelector('[data-r="pad"]')

    const draw = () => {
      sumEl.textContent = `${sum.a} + ${sum.b} = `
      entryEl.textContent = entry === '' ? '?' : entry
    }

    function press(k){
      if (locked) return
      sfx.tap()
      if (k === '⌫'){
        entry = entry.slice(0, -1)
      } else if (k === '✔'){
        if (entry !== '' && +entry === sum.a + sum.b){ renderDash(); return }
        locked = true                                   // gentle shake, then a new sum
        panel.classList.remove('wobble')
        void panel.offsetWidth
        panel.classList.add('wobble')
        later(() => { locked = false; sum = newSum(); entry = ''; draw() }, 650)
        return
      } else if (entry.length < 3){
        entry += k
      }
      draw()
    }

    for (const k of ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✔']){
      const b = document.createElement('button')
      b.className = 'pz-key' + (k === '✔' ? ' pz-key-ok' : '')
      b.textContent = k
      b.setAttribute('aria-label', k === '⌫' ? 'Delete' : k === '✔' ? 'Submit' : k)
      b.addEventListener('pointerdown', () => press(k))
      pad.appendChild(b)
    }
    draw()
  }

  // ── Dashboard ──
  function renderDash(){
    const w = weekStats()
    const tries = w.right + w.wrong
    const acc = tries ? `${Math.round(w.right * 100 / tries)}%` : '—'
    const mins = Math.round(w.seconds / 60)
    const masteredN = Object.values(state.facts).filter(MASTERED).length

    body.innerHTML = `
      <div class="pz-col">
        <div class="pz-sec">
          <div class="pz-h">✖️ Times-table mastery</div>
          <div class="pz-map">${mapHTML()}</div>
          <div class="pz-legend">
            <span><span class="pz-sw pz-c-mastered">✓</span>mastered</span>
            <span><span class="pz-sw pz-c-nearly">•</span>nearly</span>
            <span><span class="pz-sw pz-c-learning"></span>learning</span>
            <span><span class="pz-sw pz-c-none"></span>not seen</span>
          </div>
        </div>

        <div class="pz-sec">
          <div class="pz-h">➕ Adding &amp; taking away</div>
          ${bandsHTML()}
        </div>

        <div class="pz-sec">
          <div class="pz-h">💡 Worth two minutes this week</div>
          ${trickyHTML()}
        </div>

        <div class="pz-sec">
          <div class="pz-h">📅 This week</div>
          <div class="pz-tiles">
            <div class="pz-tile"><div class="pz-tile-v tnum">${acc}</div><div class="pz-tile-l">accuracy</div></div>
            <div class="pz-tile"><div class="pz-tile-v tnum">${mins}</div><div class="pz-tile-l">minutes</div></div>
            <div class="pz-tile"><div class="pz-tile-v tnum">${state.streak.count}</div><div class="pz-tile-l">day streak</div></div>
            <div class="pz-tile"><div class="pz-tile-v tnum">${masteredN}</div><div class="pz-tile-l">facts solid</div></div>
          </div>
        </div>

        <div class="pz-sec">
          <div class="pz-h">⚙️ Settings</div>
          <div class="pz-ctl-row">
            <div class="pz-ctl-lab">⏱ Daily limit (min)</div>
            <div class="pz-seg">${LIMITS.map(v =>
              `<button class="tnum${state.settings.dailyLimitMin === v ? ' on' : ''}" data-v="${v}" aria-label="${v === 999 ? 'Unlimited' : `${v} minutes`}">${v === 999 ? '∞' : v}</button>`).join('')}
            </div>
          </div>
          <div class="pz-ctl-row"><button class="pz-toggle" data-t="soundOn">🔊 Sound<span class="pz-tstate"></span></button></div>
          <div class="pz-ctl-row"><button class="pz-toggle" data-t="speedBonusOn">⚡ Speed bonus rounds<span class="pz-tstate"></span></button></div>
          <div class="pz-ctl-row"><button class="pz-toggle" data-t="reduceMotion">🐢 Reduce motion<span class="pz-tstate"></span></button></div>
        </div>

        <div class="pz-sec">
          <div class="pz-h">🔓 Force-unlock a planet</div>
          <div class="pz-planets">${PLANETS.map(p =>
            `<button class="pz-planet${state.planets[p.id]?.forced ? ' forced' : ''}" data-p="${p.id}">${p.icon} ${p.name}<span data-r="fk">${state.planets[p.id]?.forced ? ' ✓' : ''}</span></button>`).join('')}
          </div>
        </div>

        <div class="pz-sec">
          <div class="pz-h">💾 Save data</div>
          <div class="pz-actions">
            <button class="pz-act" data-a="export">📤 Export save</button>
            <button class="pz-act" data-a="import">📥 Import save</button>
            <button class="pz-act" data-a="reset">🗑 Reset all progress</button>
            <div class="pz-note" data-r="note"></div>
          </div>
        </div>

        <div class="pz-install">Install: open in Safari → Share → Add to Home Screen.</div>
      </div>
    `
    wire()
  }

  function wire(){
    // Daily limit segmented control.
    const segBtns = [...body.querySelectorAll('.pz-seg button')]
    for (const b of segBtns){
      b.addEventListener('click', () => {
        sfx.tap()
        state.settings.dailyLimitMin = +b.dataset.v
        markDirty()
        for (const x of segBtns) x.classList.toggle('on', +x.dataset.v === state.settings.dailyLimitMin)
      })
    }

    // Toggles.
    const paint = t => {
      const on = !!state.settings[t.dataset.t]
      t.classList.toggle('on', on)
      t.querySelector('.pz-tstate').textContent = on ? 'ON' : 'OFF'
    }
    for (const t of body.querySelectorAll('.pz-toggle')){
      paint(t)
      t.addEventListener('click', () => {
        sfx.tap()
        const k = t.dataset.t
        state.settings[k] = !state.settings[k]
        markDirty()
        if (k === 'reduceMotion') applyReduce()          // takes effect immediately
        paint(t)
      })
    }

    // Force-unlock planets.
    for (const b of body.querySelectorAll('.pz-planet')){
      b.addEventListener('click', () => {
        sfx.tap()
        const id = b.dataset.p
        state.planets[id] = { ...(state.planets[id] ?? { stars: {} }), forced: true }
        markDirty()
        b.classList.add('forced')
        b.querySelector('[data-r="fk"]').textContent = ' ✓'
      })
    }

    // Export save as a downloaded JSON file.
    body.querySelector('[data-a="export"]').addEventListener('click', () => {
      sfx.tap()
      const blob = new Blob([exportSave()], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'star-cadet-save.json'
      el.appendChild(a)
      a.click()
      a.remove()
      later(() => URL.revokeObjectURL(url), 3000)
      setNote('Save exported — check your downloads.')
    })

    // Import save from a picked JSON file.
    body.querySelector('[data-a="import"]').addEventListener('click', () => {
      sfx.tap()
      file.value = ''
      file.click()
    })

    // Reset progress — two-tap confirm, disarms after 3s.
    const rb = body.querySelector('[data-a="reset"]')
    let armed = false
    rb.addEventListener('click', () => {
      sfx.tap()
      if (armed){
        resetSave()
        applyReduce()
        show('launchpad')
        return
      }
      armed = true
      rb.classList.add('armed')
      rb.textContent = '🗑 Reset all progress (tap again to confirm)'
      later(() => {
        armed = false
        if (rb.isConnected){
          rb.classList.remove('armed')
          rb.textContent = '🗑 Reset all progress'
        }
      }, 3000)
    })
  }

  renderGate()

  return {
    destroy(){
      alive = false
      for (const t of timers) clearTimeout(t)
      timers.clear()
      saveNow()                                          // flush any pending mutations on leave
    },
  }
}

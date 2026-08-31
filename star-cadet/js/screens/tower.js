// Table Tower — pick a times table and climb its 12 floors (spec §4 phase 7).
// Order is TOWER_ORDER (2,5,10,3,4 then 6..12), never numeric. The 6..12 group
// stays visible-but-locked until every core table is 80% mastered.
import { state, markDirty } from '../state.js'
import { show } from '../router.js'
import { say, sfx, speakOnHold } from '../audio.js'
import { TOWER_ORDER, CORE_TABLES, towerUnlocked, towerPool, tableMastery } from '../curriculum.js'
import { injectStyle, wobble } from './games/_base.js'

injectStyle('tower-screen', `
  .twr-wrap{position:absolute;inset:88px 0 0 0;overflow-y:auto;padding:16px 40px 36px}
  .twr-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:24px}
  .twr-chip{
    position:relative;min-height:168px;border-radius:24px;
    background:var(--nebula);border:3px solid var(--rim-soft);
    display:flex;flex-direction:column;align-items:center;justify-content:center;
    gap:4px;padding:12px 8px;box-shadow:0 8px 0 rgba(0,0,0,.3);
    transition:transform .08s ease, box-shadow .08s ease;cursor:pointer;
  }
  .twr-chip:active{transform:translateY(4px);box-shadow:0 4px 0 rgba(0,0,0,.3)}
  .twr-ring{position:relative;width:100px;height:100px}
  .twr-ring svg{width:100%;height:100%;transform:rotate(-90deg)}
  .twr-num{
    position:absolute;inset:0;display:grid;place-items:center;
    font-size:34px;font-weight:700;color:var(--star);
  }
  .twr-pct{font-size:18px;font-weight:600;color:var(--aqua)}
  .twr-stars{font-size:18px;font-weight:600;color:var(--sun)}
  .twr-stars.twr-none{color:var(--star-dim)}
  .twr-locked{border-color:var(--rim-soft)}
  .twr-locked .twr-ring,.twr-locked .twr-pct,.twr-locked .twr-stars{opacity:.4}
  .twr-lockbadge{position:absolute;top:8px;right:12px;font-size:24px}
  .twr-caption{
    grid-column:1/-1;display:flex;align-items:center;justify-content:center;gap:10px;
    color:var(--star-dim);font-size:20px;font-weight:600;padding-top:8px;text-align:center;
  }
`)

const RING_R = 42
const RING_C = 2 * Math.PI * RING_R

const coreListSpoken = `${CORE_TABLES.slice(0, -1).join(', ')} and ${CORE_TABLES[CORE_TABLES.length - 1]}`
const lockedLine = `Master the ${coreListSpoken} times tables first!`

function chipEl(t){
  const unlocked = towerUnlocked(t)
  const pct = Math.round(tableMastery(t) * 100)
  const stars = state.tower[t]?.stars ?? 0
  const dash = (pct / 100 * RING_C).toFixed(1)

  const el = document.createElement('button')
  el.className = 'twr-chip' + (unlocked ? '' : ' twr-locked')
  el.setAttribute('aria-label', `The ${t} times table`)
  el.innerHTML = `
    ${unlocked ? '' : '<div class="twr-lockbadge">🔒</div>'}
    <div class="twr-ring">
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="${RING_R}" fill="none" stroke="var(--rim-soft)" stroke-width="10"/>
        ${pct > 0 ? `<circle cx="50" cy="50" r="${RING_R}" fill="none" stroke="var(--aqua)" stroke-width="10"
          stroke-linecap="round" stroke-dasharray="${dash} ${RING_C.toFixed(1)}"/>` : ''}
      </svg>
      <div class="twr-num tnum">×${t}</div>
    </div>
    <div class="twr-pct tnum">${pct}%</div>
    <div class="twr-stars tnum${stars ? '' : ' twr-none'}">⭐×${stars}</div>
  `

  if (unlocked){
    el.addEventListener('click', () => {
      sfx.tap()
      show('level', {
        label: '🗼 The ' + t + ' times table',
        poolIds: towerPool(t),
        gameId: 'towerclimb',
        target: 12,
        backTo: 'tower',
        onDone: s => {
          const rec = state.tower[t] ?? (state.tower[t] = { floor: 0, stars: 0 })
          rec.floor = 12
          rec.stars = Math.max(rec.stars, s)
          markDirty()
        },
      })
    })
    speakOnHold(el, `The ${t} times table. ${pct} percent learned. ${stars} ${stars === 1 ? 'star' : 'stars'}.`)
  } else {
    el.addEventListener('click', () => {
      sfx.boing()
      wobble(el)
      say(lockedLine)
    })
    speakOnHold(el, `Locked. ${lockedLine}`)
  }
  return el
}

export function mountTower(root){
  const el = document.createElement('div')
  el.className = 'screen'
  el.innerHTML = `
    <div class="gx-top">
      <button class="hud-btn" data-a="back" aria-label="Back to the launch pad">🏠</button>
      <div class="gx-title">🗼 Table Tower</div>
      <div class="spacer" style="flex:1"></div>
      <div class="pill coin-pill tnum">🪙 ${state.coins}</div>
    </div>
    <div class="twr-wrap"><div class="twr-grid"></div></div>
  `
  root.appendChild(el)

  const back = el.querySelector('[data-a="back"]')
  back.addEventListener('click', () => { sfx.tap(); show('launchpad') })
  speakOnHold(back, 'Back to the launch pad')

  const grid = el.querySelector('.twr-grid')
  let captionAdded = false
  for (const t of TOWER_ORDER){
    if (!captionAdded && !towerUnlocked(t)){
      const cap = document.createElement('div')
      cap.className = 'twr-caption'
      cap.innerHTML = `<span aria-hidden="true">🔒</span> Master 2, 5, 10, 3 and 4 first!`
      grid.appendChild(cap)
      captionAdded = true
    }
    grid.appendChild(chipEl(t))
  }

  say('The Table Tower! Pick a times table to climb!')
  return { destroy(){} }
}

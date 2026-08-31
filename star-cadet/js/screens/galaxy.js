// Galaxy Map — six planets, unlock rules, level picker (spec phase 5).
import { PLANETS, isUnlocked, planetStars, levelStars, setLevelStars, levelPool, planetMastery } from '../curriculum.js'
import { state, saveNow } from '../state.js'
import { show } from '../router.js'
import { say, sfx, speakOnHold } from '../audio.js'
import { wobble } from './games/_base.js'

const SPOTS = [
  [170, 210], [430, 150], [700, 220],
  [880, 430], [620, 560], [300, 540],
]

export function mountGalaxy(root){
  const el = document.createElement('div')
  el.className = 'screen galaxy'
  el.innerHTML = `
    <div class="gx-top">
      <button class="hud-btn" data-a="back" aria-label="Back">🏠</button>
      <div class="gx-title">🌌 The Galaxy</div>
      <div class="spacer" style="flex:1"></div>
      <div class="pill coin-pill tnum">🪙 ${state.coins}</div>
    </div>
    <div class="gx-field"></div>
  `
  root.appendChild(el)
  el.querySelector('[data-a="back"]').addEventListener('click', () => { sfx.tap(); show('launchpad') })

  const field = el.querySelector('.gx-field')
  PLANETS.forEach((p, idx) => {
    const unlocked = isUnlocked(idx)
    const total = p.levels.length * 3
    const btn = document.createElement('button')
    btn.className = 'gx-planet' + (unlocked ? '' : ' locked')
    btn.style.left = `${SPOTS[idx][0]}px`
    btn.style.top = `${SPOTS[idx][1]}px`
    btn.innerHTML = `
      <div class="gx-ball" style="background:radial-gradient(circle at 32% 28%, ${p.hue}66, ${p.hue}22 60%, #14102B)">${p.icon}</div>
      ${unlocked ? '' : `<div class="gx-lock">🔒</div>`}
      <div class="gx-name">${p.name}</div>
      <div class="gx-stars tnum">⭐ ${planetStars(p)} / ${total}</div>
      <div class="gx-teach">${p.teaches}</div>
    `
    btn.addEventListener('click', () => {
      if (!unlocked){
        wobble(btn)
        sfx.boing()
        const prev = PLANETS[idx - 1]
        const pct = Math.round(planetMastery(prev) * 100)
        say(`Keep practising on ${prev.name} first! You are ${pct} percent of the way there.`)
        return
      }
      sfx.tap()
      say(`${p.name}! ${p.teaches}.`)
      openLevels(p)
    })
    speakOnHold(btn, `${p.name}. ${p.teaches}.`)
    field.appendChild(btn)
  })

  function openLevels(p){
    const overlay = document.createElement('div')
    overlay.className = 'overlay'
    const next = p.levels.findIndex((_, i) => levelStars(p, i) === 0)
    overlay.innerHTML = `
      <div class="panel" style="display:flex;flex-direction:column;gap:22px;align-items:center">
        <div class="title">${p.icon} ${p.name}</div>
        <div class="lvl-grid"></div>
        <button class="btn-ghost" data-a="close">✖ Close</button>
      </div>`
    const grid = overlay.querySelector('.lvl-grid')
    p.levels.forEach((lvl, i) => {
      const stars = levelStars(p, i)
      const chip = document.createElement('button')
      chip.className = 'lvl-chip' + (i === next ? ' next' : '')
      chip.innerHTML = `
        <span class="tnum">${i + 1}</span>
        <span class="lvl-stars">${stars ? '⭐'.repeat(stars) : '·'}</span>
        <span class="lvl-t">${lvl.title}</span>`
      chip.addEventListener('click', () => {
        sfx.tap()
        overlay.remove()
        show('level', {
          label: `${p.icon} ${lvl.title}`,
          poolIds: levelPool(p, i),
          gameId: lvl.game,
          backTo: 'galaxy',
          onDone: stars2 => { setLevelStars(p, i, stars2); saveNow() },
        })
      })
      speakOnHold(chip, `Level ${i + 1}. ${lvl.title}.`)
      grid.appendChild(chip)
    })
    overlay.querySelector('[data-a="close"]').addEventListener('click', () => { sfx.tap(); overlay.remove() })
    document.getElementById('overlay-root').appendChild(overlay)
  }

  return { destroy(){ document.getElementById('overlay-root').innerHTML = '' } }
}

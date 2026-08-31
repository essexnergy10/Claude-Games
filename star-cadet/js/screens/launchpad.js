// Launch Pad — home screen (spec phase 5).
import { state } from '../state.js'
import { show } from '../router.js'
import { say, sfx, speakOnHold } from '../audio.js'
import { rocketSVG, zibbySVG } from '../ui/rocket.js'

export function mountLaunchpad(root){
  const el = document.createElement('div')
  el.className = 'screen launchpad'
  el.innerHTML = `
    <div class="lp-rocket bob">${rocketSVG(230)}</div>
    <div class="lp-zibby bob" style="animation-delay:1.4s">${zibbySVG(170)}</div>
    <div class="lp-title">⭐ Star Cadet</div>
    <div class="lp-sub mono">Maths adventure in space</div>
    <button class="btn big" data-a="play">🚀 PLAY</button>
    <div class="lp-row">
      <button class="btn-ghost" data-a="tower">🗼 Tower</button>
      <button class="btn-ghost" data-a="garage">🔧 Garage</button>
      <button class="btn-ghost" data-a="stickers">🌟 Stickers</button>
    </div>
    <div class="lp-corner-left">
      ${state.streak.count > 0 ? `<div class="pill streak-pill tnum">🔥 ${state.streak.count}</div>` : ''}
      <div class="pill coin-pill tnum">🪙 ${state.coins}</div>
    </div>
    <div class="lp-corner">
      <button class="hud-btn" data-a="parent" aria-label="Grown-Up Zone">🔒</button>
    </div>
  `
  root.appendChild(el)

  const go = (name, params) => { sfx.tap(); show(name, params) }
  el.querySelector('[data-a="play"]').addEventListener('click', () => { say('Off we go!'); go('galaxy') })
  el.querySelector('[data-a="tower"]').addEventListener('click', () => go('tower'))
  el.querySelector('[data-a="garage"]').addEventListener('click', () => go('garage'))
  el.querySelector('[data-a="stickers"]').addEventListener('click', () => go('stickers'))
  speakOnHold(el.querySelector('[data-a="play"]'), 'Play!')
  speakOnHold(el.querySelector('[data-a="tower"]'), 'Table Tower')
  speakOnHold(el.querySelector('[data-a="garage"]'), 'Rocket Garage')
  speakOnHold(el.querySelector('[data-a="stickers"]'), 'Sticker album')

  // Grown-Up Zone gate step 1: press and hold for 3 seconds (spec §10)
  const lockBtn = el.querySelector('[data-a="parent"]')
  let holdT = null
  lockBtn.addEventListener('pointerdown', () => {
    holdT = setTimeout(() => show('parent'), 3000)
  })
  const cancelHold = () => { clearTimeout(holdT); holdT = null }
  lockBtn.addEventListener('pointerup', cancelHold)
  lockBtn.addEventListener('pointercancel', cancelHold)
  lockBtn.addEventListener('pointerleave', cancelHold)

  return { destroy(){ clearTimeout(holdT) } }
}

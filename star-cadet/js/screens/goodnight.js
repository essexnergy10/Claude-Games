// The kind session end (spec §10) — no countdown, no lock-out mid-question.
import { state } from '../state.js'
import { say } from '../audio.js'
import { zibbySVG } from '../ui/rocket.js'

export function mountGoodnight(root){
  const el = document.createElement('div')
  el.className = 'screen goodnight'
  el.innerHTML = `
    <div class="bob">${zibbySVG(180)}</div>
    <div class="gn-moon">🌙</div>
    <div class="gn-title">See you tomorrow!</div>
    <div class="gn-sub">Zibby is parking the rocket for the night.</div>
    ${state.streak.count > 0 ? `<div class="pill streak-pill tnum" style="font-size:26px">🔥 ${state.streak.count} day streak</div>` : ''}
  `
  root.appendChild(el)
  say('Wonderful flying today, Cadet! Zibby is parking the rocket. See you tomorrow!')

  // Parents can still reach the Grown-Up Zone from here (hold the moon 3s).
  let holdT = null
  const moon = el.querySelector('.gn-moon')
  moon.addEventListener('pointerdown', () => {
    holdT = setTimeout(() => import('../router.js').then(r => r.show('parent')), 3000)
  })
  const cancel = () => clearTimeout(holdT)
  moon.addEventListener('pointerup', cancel)
  moon.addEventListener('pointercancel', cancel)

  return { destroy(){ clearTimeout(holdT) } }
}

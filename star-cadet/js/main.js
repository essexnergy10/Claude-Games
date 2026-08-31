// Boot: scaling, starfield, audio unlock, routing (spec §3, phase 0).
import { state, startAutosave, touchDay } from './state.js'
import { installAudioUnlock } from './audio.js'
import { initRouter, register, show } from './router.js'
import { mountLaunchpad } from './screens/launchpad.js'
import { mountGalaxy } from './screens/galaxy.js'
import { mountLevel } from './screens/level.js'
import { mountGoodnight } from './screens/goodnight.js'
import { mountTower } from './screens/tower.js'
import { mountGarage } from './screens/garage.js'
import { mountStickers } from './screens/stickers.js'
import { mountParent } from './screens/parent.js'

const canvas = document.getElementById('canvas')

// ── The fixed-canvas scaling trick (spec §3) ──
function fit(){
  const s = Math.min(innerWidth / 1024, innerHeight / 768)
  canvas.style.transform = `scale(${s})`
}
addEventListener('resize', fit)
addEventListener('orientationchange', () => setTimeout(fit, 120))
new ResizeObserver(fit).observe(document.documentElement)
fit()

// ── Reduced motion: system preference OR parent toggle (spec §13.7) ──
const rmQuery = matchMedia('(prefers-reduced-motion: reduce)')
export function applyMotionPref(){
  const reduce = state.settings.reduceMotion || rmQuery.matches
  document.documentElement.classList.toggle('reduce-motion', reduce)
  return reduce
}
rmQuery.addEventListener?.('change', () => { applyMotionPref(); restartStarfield() })
applyMotionPref()

// ── Starfield ──
const sf = document.getElementById('starfield')
const sctx = sf.getContext('2d')
const STARS = Array.from({ length: 110 }, () => ({
  x: Math.random() * 1024, y: Math.random() * 768,
  r: .6 + Math.random() * 1.7, phase: Math.random() * Math.PI * 2,
  tw: .5 + Math.random() * 1.4, vy: 2 + Math.random() * 5,
}))
let sfRaf = 0
function drawStars(t = 0, still = false){
  sctx.clearRect(0, 0, 1024, 768)
  for (const s of STARS){
    const a = still ? .8 : .45 + .55 * Math.abs(Math.sin(s.phase + t / 1000 * s.tw))
    sctx.globalAlpha = a * .9
    sctx.fillStyle = '#FFF4DE'
    sctx.beginPath()
    const y = still ? s.y : (s.y + t / 1000 * s.vy) % 768
    sctx.arc(s.x, y, s.r, 0, Math.PI * 2)
    sctx.fill()
  }
  sctx.globalAlpha = 1
}
function loop(t){ drawStars(t); sfRaf = requestAnimationFrame(loop) }
export function restartStarfield(){
  cancelAnimationFrame(sfRaf)
  if (document.documentElement.classList.contains('reduce-motion')) drawStars(0, true)
  else sfRaf = requestAnimationFrame(loop)
}
restartStarfield()
document.addEventListener('visibilitychange', () => {
  if (document.hidden) cancelAnimationFrame(sfRaf)
  else restartStarfield()
})

// ── Boot ──
touchDay()
startAutosave()
installAudioUnlock()

initRouter(document.getElementById('screen-root'))
register('launchpad', mountLaunchpad)
register('galaxy', mountGalaxy)
register('level', mountLevel)
register('goodnight', mountGoodnight)
register('tower', mountTower)
register('garage', mountGarage)
register('stickers', mountStickers)
register('parent', mountParent)

show('launchpad')

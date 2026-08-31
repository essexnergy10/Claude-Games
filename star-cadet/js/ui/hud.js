// The level HUD: back, label, progress dots, hearts, coins, repeat, help.
import { speakOnHold } from '../audio.js'

export function makeHud(container, { label, target, onBack, onRepeat, onHelp }){
  const el = document.createElement('div')
  el.className = 'hud'
  el.innerHTML = `
    <button class="hud-btn" data-h="back" aria-label="Back">🏠</button>
    <div class="pill" data-h="label">${label}</div>
    <div class="spacer"></div>
    <div class="hud-progress" data-h="dots"></div>
    <div class="hearts" data-h="hearts"></div>
    <div class="spacer"></div>
    <div class="pill coin-pill tnum" data-h="coins">🪙 0</div>
    <button class="hud-btn" data-h="repeat" aria-label="Say it again">🔊</button>
    <button class="hud-btn" data-h="help" aria-label="Show me how">💡</button>
  `
  container.appendChild(el)
  const q = s => el.querySelector(`[data-h="${s}"]`)

  const dots = q('dots')
  for (let i = 0; i < target; i++){
    const d = document.createElement('div')
    d.className = 'dot'
    dots.appendChild(d)
  }

  q('back').addEventListener('click', onBack)
  q('repeat').addEventListener('click', onRepeat)
  q('help').addEventListener('click', onHelp)
  speakOnHold(q('back'), 'Go back home')
  speakOnHold(q('repeat'), 'Hear the question again')
  speakOnHold(q('help'), 'Show me how')

  return {
    el,
    update({ progress, hearts, coins }){
      if (progress !== undefined){
        ;[...dots.children].forEach((d, i) => d.classList.toggle('done', i < progress))
      }
      if (hearts !== undefined){
        const h = q('hearts')
        h.innerHTML = ''
        for (let i = 0; i < 3; i++){
          const s = document.createElement('span')
          s.className = 'h' + (i < hearts ? '' : ' lost')
          s.textContent = '♥'
          h.appendChild(s)
        }
      }
      if (coins !== undefined) q('coins').textContent = `🪙 ${coins}`
    },
    setHeartsVisible(v){ q('hearts').style.display = v ? '' : 'none' },
  }
}

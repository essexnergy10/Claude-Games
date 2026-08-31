// Asteroid Blast (spec §7 game 1) — reference implementation of the contract.
// Four numbered asteroids drift downward; tap the right one. Wrong taps wobble
// and cost a heart (shell-owned). Rocks wrap to the top so nothing is ever lost.
import { injectStyle, wobble, rand } from './_base.js'
import { burst } from '../../ui/starburst.js'

export const meta = { id: 'asteroid', costsHeart: true, ownVisual: false }

injectStyle('asteroid', `
  .ast-field{position:absolute;inset:0;overflow:hidden}
  .ast{
    position:absolute;width:150px;height:150px;border-radius:50%;
    display:grid;place-items:center;font-size:44px;font-weight:700;
    background:radial-gradient(circle at 34% 30%, #5A4494 0%, #38266A 55%, #241847 100%);
    border:4px solid var(--rim);color:var(--star);cursor:pointer;
    box-shadow:inset -10px -12px 0 rgba(0,0,0,.28);
    font-variant-numeric:tabular-nums;
  }
  .ast::before{content:'';position:absolute;width:26px;height:26px;border-radius:50%;
    background:rgba(0,0,0,.25);top:26px;left:30px}
  .ast::after{content:'';position:absolute;width:16px;height:16px;border-radius:50%;
    background:rgba(0,0,0,.22);bottom:30px;right:34px}
  .ast.gone{transition:transform .3s, opacity .3s;transform:scale(.2);opacity:0}
`)

export function make({ mount, ask, answer, settings }){
  const field = document.createElement('div')
  field.className = 'ast-field'
  mount.appendChild(field)

  let rocks = []          // { el, x, y, vy, value }
  let raf = 0
  let running = false
  let q = null

  const H = () => mount.offsetHeight || 490

  function spawn(question){
    field.innerHTML = ''
    rocks = []
    const lanes = [90, 330, 570, 810].sort(() => Math.random() - .5)
    question.options.forEach((value, i) => {
      const el = document.createElement('button')
      el.className = 'ast'
      el.textContent = value
      el.setAttribute('aria-label', `${value}`)
      const rock = {
        el, value,
        x: lanes[i] + rand(-12, 12),
        y: settings.reduceMotion ? 90 + (i % 2) * 210 : rand(-260, -40),
        vy: settings.reduceMotion ? 0 : rand(34, 58),
      }
      el.style.left = `${rock.x}px`
      el.style.top = `${rock.y}px`
      el.addEventListener('pointerdown', () => tap(rock))
      field.appendChild(el)
      rocks.push(rock)
    })
  }

  function tap(rock){
    if (!q) return
    const res = answer(rock.value)
    if (res.locked) return
    if (res.correct){
      rock.el.classList.add('gone')
      const fr = field.getBoundingClientRect()
      const cr = document.getElementById('canvas').getBoundingClientRect()
      const scale = cr.width / 1024
      burst((fr.left - cr.left) / scale + rock.x + 75, (fr.top - cr.top) / scale + rock.y + 75)
      q = null
      setTimeout(next, 650)
    } else {
      wobble(rock.el)
    }
  }

  function next(){
    q = ask()
    if (q) spawn(q)
  }

  let last = 0
  function loop(t){
    raf = requestAnimationFrame(loop)
    if (!last){ last = t; return }
    const dt = Math.min((t - last) / 1000, .05)
    last = t
    if (!running) return
    const h = H()
    for (const r of rocks){
      r.y += r.vy * dt
      if (r.y > h) r.y = -170            // wrap to the top — nothing is ever lost
      r.el.style.top = `${r.y}px`
    }
  }

  return {
    start(){
      running = true
      next()
      if (!settings.reduceMotion) raf = requestAnimationFrame(loop)
    },
    pause(){ running = false },
    resume(){ running = true; last = 0 },
    reask(question){
      if (!question) return
      q = question
      spawn(question)
    },
    destroy(){
      running = false
      cancelAnimationFrame(raf)
      field.remove()
    },
  }
}

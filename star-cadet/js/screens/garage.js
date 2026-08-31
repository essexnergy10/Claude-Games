// Rocket Garage (spec §10) — spend coins on rocket parts; Zibby models the hats.
// Screen contract: export mountGarage(root) → { destroy() }.
// Every price is always visible — the part he cannot afford yet is the reason
// he plays more. Nothing here ever looks like failure.
import { state, saveNow, markDirty } from '../state.js'
import { show } from '../router.js'
import { say, sfx, speakOnHold } from '../audio.js'
import { CATALOG, PALETTES, rocketSVG, zibbySVG } from '../ui/rocket.js'
import { burst } from '../ui/starburst.js'
import { injectStyle, wobble } from './games/_base.js'

const SLOTS = [
  { key: 'nose',  icon: '🔺', label: 'Nose',   spoken: 'Nose cones!' },
  { key: 'body',  icon: '🚀', label: 'Body',   spoken: 'Rocket bodies!' },
  { key: 'wings', icon: '🛩️', label: 'Wings',  spoken: 'Wings!' },
  { key: 'color', icon: '🎨', label: 'Colour', spoken: 'Paint colours!' },
  { key: 'hat',   icon: '🧢', label: 'Hat',    spoken: 'Hats for Zibby!' },
]

injectStyle('garage', `
  .grg-body{position:absolute;inset:88px 0 0 0;display:flex;gap:20px;padding:16px 20px 20px}
  .grg-preview{
    flex:0 0 336px;display:flex;flex-direction:column;align-items:center;justify-content:center;
    gap:14px;background:var(--nebula);border:3px solid var(--rim-soft);border-radius:28px;overflow:hidden;
  }
  .grg-stage{display:flex;align-items:flex-end}
  .grg-stage .grg-zibby{margin-left:-28px;margin-bottom:6px}
  .grg-shop{flex:1;min-width:0;display:flex;flex-direction:column;gap:24px}
  .grg-tabs{display:flex;gap:24px}
  .grg-tab{
    flex:1;min-width:88px;height:88px;border-radius:22px;color:var(--star);
    background:var(--nebula-2);border:3px solid var(--rim-soft);
    display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;
    box-shadow:0 6px 0 rgba(0,0,0,.35);transition:transform .08s, box-shadow .08s;
  }
  .grg-tab:active{transform:translateY(3px);box-shadow:0 3px 0 rgba(0,0,0,.35)}
  .grg-tab .grg-ti{font-size:32px}
  .grg-tab .grg-tl{font-size:15px;font-weight:600}
  .grg-tab.grg-on{background:var(--sun);border-color:var(--sun-deep);color:var(--void)}
  .grg-grid{flex:1;display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(2,1fr);gap:24px}
  .grg-card{
    position:relative;min-width:88px;min-height:88px;border-radius:24px;color:var(--star);
    background:var(--nebula-2);border:4px solid var(--rim-soft);
    display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:12px;
    box-shadow:0 8px 0 rgba(0,0,0,.35);transition:transform .08s, box-shadow .08s;
  }
  .grg-card:active{transform:translateY(4px);box-shadow:0 4px 0 rgba(0,0,0,.35)}
  .grg-card.grg-equipped{border-color:var(--sun)}
  .grg-card .grg-ce{font-size:52px;line-height:1.15}
  .grg-card .grg-cn{font-size:18px;font-weight:600;text-align:center}
  .grg-row{min-height:36px;display:flex;align-items:center;justify-content:center}
  .grg-check{
    position:absolute;top:10px;right:10px;width:40px;height:40px;border-radius:50%;
    background:var(--sun);color:var(--void);font-size:24px;font-weight:700;
    display:grid;place-items:center;
  }
  .grg-price{
    display:inline-flex;align-items:center;gap:7px;background:var(--void);
    border:2px solid var(--rim-soft);border-radius:999px;padding:4px 16px;
    font-size:19px;font-weight:700;color:var(--sun);
  }
  .grg-own{font-size:15px;font-weight:600;color:var(--star-dim)}
  .grg-sw{display:flex;gap:6px}
  .grg-sw i{width:18px;height:18px;border-radius:50%;border:2px solid var(--rim)}
`)

// Tap on pointerup only, and only for a short press — a ≥400ms hold belongs to
// speakOnHold (it reads the label aloud) and must never also buy/equip.
function tapper(el, fn){
  let down = 0
  el.addEventListener('pointerdown', () => { down = Date.now() })
  el.addEventListener('pointerup', () => {
    if (down && Date.now() - down < 400) fn()
    down = 0
  })
  el.addEventListener('pointercancel', () => { down = 0 })
  el.addEventListener('pointerleave', () => { down = 0 })
}

// Centre of an element in unscaled 1024×768 canvas px (for burst()).
function canvasCenter(el){
  const r = el.getBoundingClientRect()
  const c = document.getElementById('canvas').getBoundingClientRect()
  const scale = c.width / 1024
  return { x: (r.left - c.left + r.width / 2) / scale, y: (r.top - c.top + r.height / 2) / scale }
}

export function mountGarage(root){
  const el = document.createElement('div')
  el.className = 'screen'
  el.innerHTML = `
    <div class="gx-top">
      <button class="hud-btn" data-a="back" aria-label="Back">🏠</button>
      <div class="gx-title">🔧 Rocket Garage</div>
      <div class="spacer" style="flex:1"></div>
      <div class="pill coin-pill tnum" data-a="coins">🪙 <span>${state.coins}</span></div>
    </div>
    <div class="grg-body">
      <div class="grg-preview"><div class="grg-stage"></div></div>
      <div class="grg-shop">
        <div class="grg-tabs"></div>
        <div class="grg-grid"></div>
      </div>
    </div>
  `
  root.appendChild(el)

  const coinsEl = el.querySelector('[data-a="coins"]')
  const stageEl = el.querySelector('.grg-stage')
  const tabsEl  = el.querySelector('.grg-tabs')
  const gridEl  = el.querySelector('.grg-grid')
  let slot = 'nose'

  const back = el.querySelector('[data-a="back"]')
  tapper(back, () => { sfx.tap(); show('launchpad') })
  speakOnHold(back, 'Back to the launch pad.')

  // Holding the coins pill speaks the LIVE count (speakOnHold captures static text).
  let coinHold = 0
  coinsEl.addEventListener('pointerdown', () => {
    clearTimeout(coinHold)
    coinHold = setTimeout(() => say(`You have ${state.coins} coins.`), 400)
  })
  const cancelCoinHold = () => clearTimeout(coinHold)
  coinsEl.addEventListener('pointerup', cancelCoinHold)
  coinsEl.addEventListener('pointercancel', cancelCoinHold)
  coinsEl.addEventListener('pointerleave', cancelCoinHold)

  function renderCoins(){
    coinsEl.querySelector('span').textContent = state.coins
  }

  function renderPreview(){
    const bob = state.settings.reduceMotion ? '' : ' bob'
    stageEl.innerHTML = `
      <div class="grg-rocket${bob}">${rocketSVG(240, state.equipped)}</div>
      <div class="grg-zibby">${zibbySVG(120, state.equipped.hat)}</div>
    `
  }

  function renderTabs(){
    tabsEl.innerHTML = ''
    for (const s of SLOTS){
      const b = document.createElement('button')
      b.className = 'grg-tab' + (s.key === slot ? ' grg-on' : '')
      b.setAttribute('aria-label', s.label)
      b.innerHTML = `<div class="grg-ti">${s.icon}</div><div class="grg-tl">${s.label}</div>`
      tapper(b, () => {
        if (slot === s.key) return
        slot = s.key
        sfx.tap()
        say(s.spoken)
        renderTabs()
        renderGrid()
      })
      speakOnHold(b, s.spoken)
      tabsEl.appendChild(b)
    }
  }

  function renderGrid(){
    gridEl.innerHTML = ''
    for (const item of CATALOG[slot]){
      const equipped = state.equipped[slot] === item.id
      const owned = state.owned.includes(item.id)
      const b = document.createElement('button')
      b.className = 'grg-card' + (equipped ? ' grg-equipped' : '')
      // Colour cards get real paint swatches so a non-reader sees the actual colours.
      let swatch = ''
      if (slot === 'color' && PALETTES[item.id]){
        const p = PALETTES[item.id]
        swatch = `<div class="grg-sw"><i style="background:${p.body}"></i><i style="background:${p.trim}"></i><i style="background:${p.fin}"></i></div>`
      }
      const row = equipped ? '<div class="grg-own">on now</div>'
        : owned ? '<div class="grg-own">tap to wear</div>'
        : `<div class="grg-price">🪙 <span class="tnum">${item.price}</span></div>`
      b.innerHTML = `
        ${equipped ? '<div class="grg-check">✓</div>' : ''}
        <div class="grg-ce">${item.emoji}</div>
        ${swatch}
        <div class="grg-cn">${item.name}</div>
        <div class="grg-row">${row}</div>
      `
      const wearer = slot === 'hat' ? 'Zibby is' : 'Your rocket is'
      const holdText = equipped ? `${item.name}. ${wearer} wearing it!`
        : owned ? `${item.name}. Tap to put it on!`
        : `${item.name}. It costs ${item.price} coins.`
      b.setAttribute('aria-label', holdText)
      speakOnHold(b, holdText)
      tapper(b, () => onCard(item, b))
      gridEl.appendChild(b)
    }
  }

  function onCard(item, cardEl){
    if (state.equipped[slot] === item.id){ sfx.tap(); return }
    if (state.owned.includes(item.id)){
      state.equipped[slot] = item.id
      markDirty()
      saveNow()
      sfx.tap()
      renderPreview()
      renderGrid()
      return
    }
    if (state.coins >= item.price){
      const p = canvasCenter(cardEl)
      state.coins -= item.price
      state.owned.push(item.id)
      state.equipped[slot] = item.id
      markDirty()
      saveNow()
      sfx.coin()
      burst(p.x, p.y)
      renderCoins()
      renderPreview()
      renderGrid()
      say(`You bought the ${item.name}! It looks amazing!`)
    } else {
      // Kind, never negative: the pill does a little wiggle and Zibby cheers him on.
      wobble(coinsEl)
      sfx.boing()
      say('Keep earning coins, cadet! You can do it!')
    }
  }

  renderCoins()
  renderPreview()
  renderTabs()
  renderGrid()
  say(`Welcome to the Rocket Garage! You have ${state.coins} coins to spend.`)

  return { destroy(){ clearTimeout(coinHold) } }
}

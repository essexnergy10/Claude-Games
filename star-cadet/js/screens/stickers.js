// Sticker album — 40 milestone stickers (spec §9). checkStickers() is called by
// the level shell after every level; newly earned stickers toast + speak.
import { state, markDirty } from '../state.js'
import { show } from '../router.js'
import { say, sfx, speakOnHold } from '../audio.js'
import { toast } from '../ui/toast.js'
import { PLANETS, planetStars, tableMastery, CORE_TABLES } from '../curriculum.js'
import { MASTERED } from '../mastery.js'
import { injectStyle } from './games/_base.js'

const masteredCount = () => Object.values(state.facts).filter(MASTERED).length
const planetDone = id => {
  const p = PLANETS.find(x => x.id === id)
  return p.levels.every((_, i) => (state.planets[id]?.stars?.[i] ?? 0) > 0)
}

export const STICKERS = [
  { id: 'first-level',   emoji: '🚀', name: 'Lift Off',        check: s => s.totals.levelsFinished >= 1 },
  { id: 'first-3star',   emoji: '🌟', name: 'Triple Star',     check: s => s.totals.threeStars >= 1 },
  { id: 'five-levels',   emoji: '🛸', name: 'Frequent Flyer',  check: s => s.totals.levelsFinished >= 5 },
  { id: 'ten-levels',    emoji: '🎖️', name: 'Sky Captain',     check: s => s.totals.levelsFinished >= 10 },
  { id: 'twenty-levels', emoji: '🏅', name: 'Star Commander',  check: s => s.totals.levelsFinished >= 20 },
  { id: 'forty-levels',  emoji: '👑', name: 'Galaxy Legend',   check: s => s.totals.levelsFinished >= 40 },
  { id: 'countaria',     emoji: '🪐', name: 'Countaria Done',  check: () => planetDone('countaria') },
  { id: 'plusto',        emoji: '➕', name: 'Plusto Done',     check: () => planetDone('plusto') },
  { id: 'minoo',         emoji: '➖', name: 'Minoo Done',      check: () => planetDone('minoo') },
  { id: 'groupa',        emoji: '🫧', name: 'Groupa Done',     check: () => planetDone('groupa') },
  { id: 'multiplex',     emoji: '✖️', name: 'Multiplex Done',  check: () => planetDone('multiplex') },
  { id: 'mixaroo',       emoji: '🌈', name: 'Mixaroo Done',    check: () => planetDone('mixaroo') },
  { id: 'all-planets',   emoji: '🌌', name: 'Whole Galaxy',    check: () => PLANETS.every(p => planetDone(p.id)) },
  { id: 'streak-3',      emoji: '🔥', name: '3 Day Streak',    check: s => s.streak.count >= 3 },
  { id: 'streak-7',      emoji: '💥', name: '7 Day Streak',    check: s => s.streak.count >= 7 },
  { id: 'streak-14',     emoji: '🌋', name: '14 Day Streak',   check: s => s.streak.count >= 14 },
  { id: 'coins-100',     emoji: '🪙', name: 'Coin Collector',  check: s => s.coins >= 100 },
  { id: 'coins-500',     emoji: '💰', name: 'Coin Mountain',   check: s => s.coins >= 500 },
  { id: 'coins-1000',    emoji: '🏦', name: 'Space Banker',    check: s => s.coins >= 1000 },
  { id: 'facts-10',      emoji: '🧠', name: '10 Facts Solid',  check: () => masteredCount() >= 10 },
  { id: 'facts-25',      emoji: '🎓', name: '25 Facts Solid',  check: () => masteredCount() >= 25 },
  { id: 'facts-50',      emoji: '🦉', name: '50 Facts Solid',  check: () => masteredCount() >= 50 },
  { id: 'facts-100',     emoji: '🔭', name: '100 Facts Solid', check: () => masteredCount() >= 100 },
  { id: 'table-2',       emoji: '2️⃣', name: 'Twos Table',      check: () => tableMastery(2) >= 0.8 },
  { id: 'table-5',       emoji: '5️⃣', name: 'Fives Table',     check: () => tableMastery(5) >= 0.8 },
  { id: 'table-10',      emoji: '🔟', name: 'Tens Table',      check: () => tableMastery(10) >= 0.8 },
  { id: 'table-3',       emoji: '3️⃣', name: 'Threes Table',    check: () => tableMastery(3) >= 0.8 },
  { id: 'table-4',       emoji: '4️⃣', name: 'Fours Table',     check: () => tableMastery(4) >= 0.8 },
  { id: 'all-tables',    emoji: '🏆', name: 'Table Champion',  check: () => CORE_TABLES.every(t => tableMastery(t) >= 0.8) },
  { id: 'bonus-1',       emoji: '⚡', name: 'Super Speeder',   check: s => s.totals.bonusRounds >= 1 },
  { id: 'bonus-5',       emoji: '🌠', name: 'Speed of Light',  check: s => s.totals.bonusRounds >= 5 },
  { id: 'helper',        emoji: '💡', name: 'Wise Learner',    check: s => s.totals.helpOpens >= 10 },
  { id: 'garage-1',      emoji: '🔧', name: 'First Upgrade',   check: s => s.owned.length >= 6 },
  { id: 'garage-5',      emoji: '🛠️', name: 'Rocket Builder',  check: s => s.owned.length >= 10 },
  { id: 'right-200',     emoji: '✨', name: '200 Right',       check: s => s.totals.correct >= 200 },
  { id: 'right-500',     emoji: '💫', name: '500 Right',       check: s => s.totals.correct >= 500 },
  { id: 'right-1000',    emoji: '🌞', name: '1000 Right',      check: s => s.totals.correct >= 1000 },
  { id: 'ten-3star',     emoji: '🥇', name: 'Ten Perfects',    check: s => s.totals.threeStars >= 10 },
  { id: 'whale',         emoji: '🐋', name: 'Whale Friend',    check: () => (state.planets.mixaroo?.stars?.[3] ?? 0) > 0 },
  { id: 'big-whale',     emoji: '🐳', name: 'Whale Champion',  check: () => (state.planets.mixaroo?.stars?.[5] ?? 0) > 0 },
]

export function checkStickers(){
  const fresh = []
  for (const st of STICKERS){
    if (state.stickers.includes(st.id)) continue
    let earned = false
    try { earned = st.check(state) } catch { /* a bad check must never break a level */ }
    if (earned){
      state.stickers.push(st.id)
      fresh.push(st)
    }
  }
  if (fresh.length){
    markDirty()
    const st = fresh[0]
    setTimeout(() => {
      sfx.star()
      toast(`New sticker: ${st.name}!`, { emoji: st.emoji, ms: 3200 })
      say(`You earned a new sticker! ${st.name}!`)
    }, 1600)
  }
  return fresh
}

injectStyle('stickers-screen', `
  .stickers-wrap{position:absolute;inset:88px 0 0 0;overflow-y:auto;padding:10px 60px 40px}
  .stk-grid{display:grid;grid-template-columns:repeat(8,1fr);gap:16px}
  .stk{
    aspect-ratio:1;border-radius:20px;background:var(--nebula);border:3px solid var(--rim-soft);
    display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:6px;
  }
  .stk .e{font-size:40px}
  .stk .n{font-size:11px;color:var(--star-dim);text-align:center;font-weight:500}
  .stk.locked .e{filter:grayscale(1);opacity:.28}
  .stk.locked .n{opacity:.5}
  .stk.earned{border-color:var(--sun)}
`)

export function mountStickers(root){
  const el = document.createElement('div')
  el.className = 'screen'
  const earned = state.stickers.length
  el.innerHTML = `
    <div class="gx-top">
      <button class="hud-btn" data-a="back" aria-label="Back">🏠</button>
      <div class="gx-title">🌟 Sticker Album</div>
      <div class="spacer" style="flex:1"></div>
      <div class="pill tnum">${earned} / ${STICKERS.length}</div>
    </div>
    <div class="stickers-wrap"><div class="stk-grid"></div></div>
  `
  root.appendChild(el)
  el.querySelector('[data-a="back"]').addEventListener('click', () => { sfx.tap(); show('launchpad') })

  const grid = el.querySelector('.stk-grid')
  for (const st of STICKERS){
    const got = state.stickers.includes(st.id)
    const d = document.createElement('div')
    d.className = 'stk ' + (got ? 'earned' : 'locked')
    d.innerHTML = `<div class="e">${st.emoji}</div><div class="n">${st.name}</div>`
    speakOnHold(d, got ? st.name : `Locked sticker. ${st.name}.`)
    grid.appendChild(d)
  }

  say(`Your sticker album! You have ${earned} sticker${earned === 1 ? '' : 's'}.`)
  return {}
}

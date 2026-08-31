// The level shell (spec phase 3). Owns HUD, question lifecycle, grading, scoring,
// both guards, the teach panel, hearts, results — games own only their playfield.
import { state, getFact, logAnswer, saveNow, addSeconds, overDailyLimit, streakTouch, markDirty } from '../state.js'
import { parseFact, makeInstance, answerOf, buildOptions, spokenQuestion, spokenFact, displayText } from '../facts.js'
import { grade, nextFact, FrustrationGuard, FlowGuard, pickWin, bonusPool } from '../mastery.js'
import { say, sfx, praiseLine, gentleLine, speakOnHold } from '../audio.js'
import { makeHud } from '../ui/hud.js'
import { showTeach } from '../ui/teach.js'
import { burst, celebrate } from '../ui/starburst.js'
import { zibbySays } from '../ui/toast.js'
import { easierPool } from '../curriculum.js'
import { show } from '../router.js'
import { GAMES } from './games/index.js'
import { checkStickers } from './stickers.js'

const INPUT_LOCK_MS = 250          // spec §13.3
const BONUS_MS = 20_000

// params: { label, poolIds, gameId, target=10, onDone(stars), backTo, backParams }
export function mountLevel(root, params){
  const { label, gameId, target = 10, onDone, backTo = 'galaxy', backParams = {} } = params
  let poolIds = [...params.poolIds]

  const gameDef = GAMES[gameId]
  const meta = gameDef.meta ?? {}

  // ── DOM skeleton ──
  const screen = document.createElement('div')
  screen.className = 'screen'
  root.appendChild(screen)

  const hud = makeHud(screen, {
    label, target,
    onBack: () => exit(),
    onRepeat: () => { if (current) say(current.spoken) },
    onHelp: () => openTeach(),
  })

  const qcard = document.createElement('div')
  qcard.className = 'q-card'
  if (meta.ownVisual) qcard.style.display = 'none'
  screen.appendChild(qcard)

  const zone = document.createElement('div')
  zone.className = 'game-zone' + (meta.ownVisual ? ' full' : '')
  screen.appendChild(zone)

  // ── Session state ──
  let correct = 0, mistakes = 0, hearts = 3
  let current = null               // { fact, inst, answer, options, spoken }
  let lastId = null
  let locked = false, ended = false
  let wrongOnThisFact = 0
  let askedAt = 0
  let bonus = null                 // { until, timer, el }
  let coinsEarned = 0
  const frust = new FrustrationGuard()
  const flow = new FlowGuard()

  hud.update({ progress: 0, hearts, coins: state.coins })
  hud.setHeartsVisible(meta.costsHeart !== false)

  // Wake lock so the screen doesn't dim mid-question (spec §12)
  let wakeLock = null
  try { navigator.wakeLock?.request('screen').then(w => { wakeLock = w }).catch(() => {}) } catch { /* older Safari */ }

  // Play-time ticking for the daily limit + parent stats
  const tick = setInterval(() => { if (!document.hidden && !ended) addSeconds(1) }, 1000)

  // ── Question lifecycle ──
  function records(){ return poolIds.map(id => getFact(id)) }

  function ask(){
    if (ended) return null
    if (correct >= target){ finish(); return null }

    let rec
    if (frust.injectWin){                           // guaranteed win after help
      frust.injectWin = false
      rec = pickWin(records(), lastId)
    } else if (bonus){
      const bp = bonusPool(records())
      rec = bp[Math.floor(Math.random() * bp.length)] ?? nextFact(records(), lastId)
    } else {
      rec = nextFact(records(), lastId)
    }

    const fact = parseFact(rec.id)
    const inst = makeInstance(fact)
    const ans = answerOf(fact, inst)
    current = {
      fact, inst, rec,
      answer: ans,
      options: buildOptions(fact, inst, 4),
      spoken: spokenQuestion(fact, inst),
    }
    if (rec.id !== lastId) wrongOnThisFact = 0
    lastId = rec.id
    askedAt = Date.now()
    renderCard()
    say(current.spoken)
    return current
  }

  function renderCard(){
    if (meta.ownVisual || !current) return
    const { fact, inst } = current
    const dt = displayText(fact, inst)
    qcard.innerHTML = ''
    if (dt){
      const d = document.createElement('div')
      d.className = 'q-display tnum'
      d.innerHTML = dt.replace('?', '<span class="q-mark">?</span>')
      qcard.appendChild(d)
    }
    if (fact.op === 'count'){
      const v = document.createElement('div')
      v.className = 'q-visual'
      for (let i = 0; i < inst.n; i++){
        const o = document.createElement('span')
        o.className = 'obj'
        o.style.animationDelay = `${i * 60}ms`
        o.textContent = inst.emoji
        v.appendChild(o)
      }
      qcard.appendChild(v)
    } else if (fact.op === 'subitise'){
      const v = document.createElement('div')
      v.className = 'q-sub-dots'
      for (let i = 0; i < inst.n; i++){
        const d = document.createElement('div')
        d.className = 'dt'
        v.appendChild(d)
      }
      qcard.appendChild(v)
    } else if (fact.op === 'array'){
      const v = document.createElement('div')
      v.className = 'q-array'
      v.style.gridTemplateColumns = `repeat(${inst.c}, 40px)`
      for (let i = 0; i < inst.r * inst.c; i++){
        const o = document.createElement('span')
        o.className = 'obj'
        o.textContent = '👾'
        v.appendChild(o)
      }
      qcard.appendChild(v)
    } else if (fact.op === 'skip'){
      const v = document.createElement('div')
      v.className = 'q-skip'
      inst.seq.forEach((n, i) => {
        const s = document.createElement('div')
        s.className = 'skip-n tnum' + (i === inst.blank ? ' blank' : '')
        s.textContent = i === inst.blank ? '?' : n
        v.appendChild(s)
      })
      qcard.appendChild(v)
    }
  }

  // ── Answering ──
  function answer(value){
    if (locked || ended || !current) return { correct: false, answer: current?.answer ?? 0, locked: true }
    locked = true
    setTimeout(() => { locked = false }, INPUT_LOCK_MS)

    const isRight = value === current.answer
    const ms = Date.now() - askedAt
    grade(current.rec, isRight)
    logAnswer(isRight)
    markDirty()

    if (isRight){
      correct++
      wrongOnThisFact = 0
      sfx.correct()
      say(`${praiseLine()} ${spokenFact(current.fact, current.inst)}`)
      hud.update({ progress: correct })
      if (bonus){
        coinsEarned += 2
        state.coins += 2; markDirty()
        sfx.coin()
        hud.update({ coins: state.coins })
      }
      frust.record(true)
      if (!bonus && state.settings.speedBonusOn && flow.record(true, ms)) startBonus()
    } else {
      mistakes++
      wrongOnThisFact++
      sfx.wrong()
      say(gentleLine())
      flow.record(false, ms)
      if (meta.costsHeart !== false){
        hearts--
        hud.update({ hearts })
        if (hearts <= 0){ kindRestart(); return { correct: false, answer: current.answer, locked: false } }
      }
      const frustrated = frust.record(false)
      if (frustrated || wrongOnThisFact >= 2){
        // Auto-open the teach panel; then re-ask the same fact (spec §6)
        setTimeout(() => openTeach(frustrated), 650)
      }
    }
    return { correct: isRight, answer: current.answer, locked: false }
  }

  // ── Teach panel ──
  let teaching = false
  function openTeach(fromFrustration = false){
    if (teaching || ended || !current) return
    teaching = true
    game.pause?.()
    showTeach(current.fact, current.inst).then(() => {
      teaching = false
      if (ended) return
      if (fromFrustration) frust.injectWin = true    // after the helped win comes a sure win
      // Re-ask the same question so the help converts into a win (spec §6)
      askedAt = Date.now()
      say(current.spoken)
      game.resume?.()
      game.reask?.(current)
    })
  }

  // ── Kind restart: no fail state, easier numbers (spec §13.1) ──
  function kindRestart(){
    hearts = 3; correct = 0; mistakes = 0
    poolIds = easierPool(poolIds)
    hud.update({ progress: 0, hearts })
    zibbySays("Let's try some friendlier numbers!", 3200)
    say("Don't worry! Let's try some friendlier numbers. You can do this!")
    setTimeout(() => { if (!ended) game.reask?.(ask()) }, 2600)
  }

  // ── SUPER SPEED bonus round (spec §5) ──
  function startBonus(){
    state.totals.bonusRounds++; markDirty()
    const el = document.createElement('div')
    el.className = 'speed-banner pop-in'
    el.innerHTML = `<div class="sb-title">⚡ SUPER SPEED! Double coins!</div><div class="speed-bar"><div style="width:100%"></div></div>`
    screen.appendChild(el)
    const bar = el.querySelector('.speed-bar>div')
    const started = Date.now()
    say('Super speed! Double coins!')
    sfx.star()
    const t = setInterval(() => {
      const left = 1 - (Date.now() - started) / BONUS_MS
      if (left <= 0) endBonus()
      else bar.style.width = `${left * 100}%`
    }, 200)
    bonus = { el, timer: t }
  }
  function endBonus(){
    if (!bonus) return
    clearInterval(bonus.timer)
    bonus.el.remove()
    bonus = null
  }

  // ── Finish ──
  function finish(){
    if (ended) return
    ended = true
    endBonus()
    clearInterval(tick)
    game.destroy?.()

    const stars = mistakes <= 1 ? 3 : mistakes <= 3 ? 2 : 1     // accuracy only, never speed
    const coins = stars * 10 + 5 + coinsEarned
    state.coins += stars * 10 + 5
    state.stars += stars
    state.totals.levelsFinished++
    if (stars === 3) state.totals.threeStars++
    streakTouch()
    onDone?.(stars)
    checkStickers()
    saveNow()

    celebrate()
    sfx.star()

    const overlay = document.createElement('div')
    overlay.className = 'overlay'
    overlay.innerHTML = `
      <div class="panel results">
        <div class="title">${label}</div>
        <div class="res-stars">
          ${[0, 1, 2].map(i => `<span class="st${i < stars ? ' on' : ''}" style="animation-delay:${i * .45}s">⭐</span>`).join('')}
        </div>
        <div class="res-coins tnum">+${coins} 🪙</div>
        <div class="res-msg">${stars === 3 ? 'Perfect flying, Cadet!' : stars === 2 ? 'Great flying! One more try for three stars?' : 'Level done! Every flight makes you stronger!'}</div>
        <button class="btn" style="font-size:28px">Onward! 🚀</button>
      </div>`
    screen.appendChild(overlay)
    say(stars === 3 ? 'Three stars! Perfect flying, Cadet!' : stars === 2 ? 'Two stars! Great flying!' : 'Level finished! Well done!')

    overlay.querySelector('.btn').addEventListener('click', () => {
      sfx.tap()
      if (overDailyLimit()) show('goodnight')
      else show(backTo, backParams)
    })
  }

  function exit(){
    ended = true
    endBonus()
    clearInterval(tick)
    game.destroy?.()
    saveNow()
    show(backTo, backParams)
  }

  // ── Boot the mini-game ──
  const game = gameDef.make({
    mount: zone,
    ask,
    answer,
    help: () => openTeach(),
    settings: {
      reduceMotion: document.documentElement.classList.contains('reduce-motion'),
      soundOn: state.settings.soundOn,
      speedBonusOn: state.settings.speedBonusOn,
    },
  })
  game.start()

  return {
    destroy(){
      ended = true
      endBonus()
      clearInterval(tick)
      try { game.destroy?.() } catch { /* must not block unmount */ }
      try { wakeLock?.release?.() } catch { /* already released */ }
    },
  }
}

// Save/load, schema, migration (spec §11). Node-safe for unit tests.
const SAVE_KEY = 'starcadet.v1'

const store = (typeof localStorage !== 'undefined')
  ? localStorage
  : { _m: {}, getItem(k){ return this._m[k] ?? null }, setItem(k, v){ this._m[k] = v }, removeItem(k){ delete this._m[k] } }

export function todayStr(d = new Date()){
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function freshSave(){
  return {
    v: 1,
    child: { name: '', avatarSeed: 0 },
    facts: {},                      // id -> fact record (spec §5)
    planets: {},                    // id -> { stars: {0:3,...}, forced: false }
    tower: {},                      // table -> { floor, stars }
    coins: 0, stars: 0,
    owned: ['nose.default', 'body.default', 'wings.default', 'color.default', 'hat.none'],
    equipped: { nose: 'nose.default', body: 'body.default', wings: 'wings.default', color: 'color.default', hat: 'hat.none' },
    stickers: [],
    streak: { count: 0, lastPlayed: '' },
    session: { date: todayStr(), secondsToday: 0 },
    settings: { soundOn: true, speedBonusOn: true, dailyLimitMin: 20, reduceMotion: false },
    totals: { correct: 0, wrong: 0, helpOpens: 0, bonusRounds: 0, levelsFinished: 0, threeStars: 0 },
    history: {},                    // 'YYYY-MM-DD' -> { seconds, right, wrong }
  }
}

// Fill any keys missing from an older/partial save with fresh defaults.
function deepFill(target, template){
  for (const k of Object.keys(template)){
    if (!(k in target) || target[k] === null || target[k] === undefined){
      target[k] = template[k]
    } else if (typeof template[k] === 'object' && !Array.isArray(template[k]) &&
               typeof target[k] === 'object' && !Array.isArray(target[k])){
      deepFill(target[k], template[k])
    }
  }
  return target
}

export function migrate(s){
  try {
    if (!s || typeof s !== 'object' || typeof s.v !== 'number') return freshSave()
    if (s.v === 1) return deepFill(s, freshSave())
    return freshSave()              // unknown future version: never white-screen
  } catch { return freshSave() }
}

function load(){
  try {
    const raw = store.getItem(SAVE_KEY)
    if (!raw) return freshSave()
    return migrate(JSON.parse(raw))
  } catch { return freshSave() }
}

export const state = load()

let dirty = false
export function markDirty(){ dirty = true }
export function saveNow(){
  try { store.setItem(SAVE_KEY, JSON.stringify(state)) } catch { /* storage full/blocked */ }
  dirty = false
}
export function startAutosave(){
  setInterval(() => { if (dirty) saveNow() }, 30_000)   // never per-question (spec §11)
  addEventListener('pagehide', saveNow)
  document.addEventListener('visibilitychange', () => { if (document.hidden) saveNow() })
}

export function getFact(id){
  let f = state.facts[id]
  if (!f) f = state.facts[id] = { id, box: 0, streak: 0, seen: 0, right: 0, wrong: 0, lastSeen: 0, recent: [] }
  return f
}

export function touchDay(){
  const t = todayStr()
  if (state.session.date !== t){
    state.session = { date: t, secondsToday: 0 }
    markDirty()
  }
}

export function dayHistory(){
  const t = todayStr()
  if (!state.history[t]) state.history[t] = { seconds: 0, right: 0, wrong: 0 }
  return state.history[t]
}

export function logAnswer(correct){
  const h = dayHistory()
  correct ? h.right++ : h.wrong++
  state.totals[correct ? 'correct' : 'wrong']++
  markDirty()
}

export function addSeconds(n = 1){
  touchDay()
  state.session.secondsToday += n
  dayHistory().seconds += n
  markDirty()
}

export function overDailyLimit(){
  const lim = state.settings.dailyLimitMin
  if (!lim || lim >= 999) return false
  return state.session.secondsToday >= lim * 60
}

// Streak per spec §9: one missed day costs nothing, two resets it.
export function streakTouch(){
  const t = todayStr(), last = state.streak.lastPlayed
  if (last === t) return
  const diff = last ? Math.round((Date.parse(t) - Date.parse(last)) / 864e5) : Infinity
  state.streak.count = diff <= 2 ? state.streak.count + 1 : 1
  state.streak.lastPlayed = t
  markDirty()
}

export function weekStats(){
  const out = { seconds: 0, right: 0, wrong: 0 }
  for (let i = 0; i < 7; i++){
    const d = new Date(); d.setDate(d.getDate() - i)
    const h = state.history[todayStr(d)]
    if (h){ out.seconds += h.seconds; out.right += h.right; out.wrong += h.wrong }
  }
  return out
}

export function exportSave(){ return JSON.stringify(state, null, 2) }

export function importSave(text){
  const parsed = JSON.parse(text)            // throws on bad JSON — caller catches
  if (!parsed || typeof parsed !== 'object' || parsed.v !== 1) throw new Error('not a Star Cadet save')
  const s = migrate(parsed)
  for (const k of Object.keys(state)) delete state[k]
  Object.assign(state, s)
  saveNow()
}

export function resetSave(){
  const s = freshSave()
  for (const k of Object.keys(state)) delete state[k]
  Object.assign(state, s)
  saveNow()
}

// Planets, levels, fact pools and unlock rules (spec §4, §7).
import { mulId, addId } from './facts.js'
import { state, getFact } from './state.js'
import { masteredFraction } from './mastery.js'

const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i)
const counts   = (a, b) => range(a, b).map(n => `count:${n}`)
const orders   = (a, b) => range(a, b).map(n => `order:${n}`)
const subitise = (a, b) => range(a, b).map(n => `subitise:${n}`)
const uniq = arr => [...new Set(arr)]

// Curated pools — small enough that 80%-mastered is reachable by a 5-year-old.
const PLUS_ONES   = range(1, 9).map(a => addId(a, 1))
const DOUBLES_S   = range(1, 5).map(a => `add:${a}+${a}`)
const DOUBLES_B   = range(6, 10).map(a => `add:${a}+${a}`)
const BONDS_10    = [[1,9],[2,8],[3,7],[4,6],[5,5]].map(([a,b]) => addId(a, b))
const ADD_IN_10   = [[2,3],[2,4],[2,5],[3,4],[3,5],[4,5],[2,6],[3,6],[2,7]].map(([a,b]) => addId(a, b))
const ADD_IN_20   = [[10,3],[10,5],[10,7],[11,2],[12,3],[13,2],[14,3],[15,2],[12,5]].map(([a,b]) => addId(a, b))

const SUB_ONES    = range(2, 10).map(a => `sub:${a}-1`)
const SUB_TWOS    = range(3, 10).map(a => `sub:${a}-2`)
const SUB_IN_5    = [[3,2],[4,2],[4,3],[5,2],[5,3],[5,4]].map(([a,b]) => `sub:${a}-${b}`)
const FROM_10     = range(1, 9).map(b => `sub:10-${b}`)
const FAMILIES    = [[7,3],[7,4],[8,3],[8,5],[9,4],[9,5],[6,2],[6,4]].map(([a,b]) => `sub:${a}-${b}`)
const SUB_TEENS   = [[12,2],[13,3],[15,5],[14,2],[16,3],[17,2],[18,4],[15,3]].map(([a,b]) => `sub:${a}-${b}`)

const ARRAYS_2 = [[2,2],[2,3],[2,4],[2,5],[2,6]].map(([r,c]) => `array:${r}x${c}`)
const ARRAYS_S = [[3,3],[3,4],[4,4],[3,5],[4,5],[5,5]].map(([r,c]) => `array:${r}x${c}`)
const ARRAYS_M = [[3,2],[4,2],[5,2],[5,3],[2,10],[3,10]].map(([r,c]) => `array:${r}x${c}`)

const table = t => range(1, 12).map(n => mulId(t, n))
const tableSlice = (t, a, b) => range(a, b).map(n => mulId(t, n))

export const PLANETS = [
  {
    id: 'countaria', name: 'Countaria', icon: '🪐', hue: '#3FE0D0',
    teaches: 'Counting to 20',
    levels: [
      { title: 'First numbers',  game: 'feedalien',     pool: counts(1, 5) },
      { title: 'Count to ten',   game: 'asteroid',      pool: [...counts(3, 10), ...subitise(1, 3)] },
      { title: 'Number order',   game: 'constellation', pool: orders(1, 8) },
      { title: 'Quick eyes',     game: 'asteroid',      pool: subitise(1, 6) },
      { title: 'Bigger snacks',  game: 'feedalien',     pool: counts(6, 12) },
      { title: 'Up to twenty',   game: 'asteroid',      pool: [...counts(11, 20), ...orders(9, 18)] },
    ],
  },
  {
    id: 'plusto', name: 'Plusto', icon: '➕', hue: '#FFB13C',
    teaches: 'Adding',
    levels: [
      { title: 'One more',       game: 'asteroid',   pool: PLUS_ONES },
      { title: 'Little doubles', game: 'fuelpods',   pool: DOUBLES_S },
      { title: 'Friends of ten', game: 'starbridge', pool: BONDS_10 },
      { title: 'Add to ten',     game: 'fuelpods',   pool: ADD_IN_10 },
      { title: 'Big doubles',    game: 'asteroid',   pool: DOUBLES_B },
      { title: 'Add to twenty',  game: 'starbridge', pool: ADD_IN_20 },
    ],
  },
  {
    id: 'minoo', name: 'Minoo', icon: '➖', hue: '#FF5D73',
    teaches: 'Taking away',
    levels: [
      { title: 'One less',       game: 'asteroid',    pool: [...SUB_ONES, ...SUB_TWOS.slice(0, 4)] },
      { title: 'Small takes',    game: 'starbridge',  pool: SUB_IN_5 },
      { title: 'Take from ten',  game: 'meteordodge', pool: FROM_10 },
      { title: 'Fact families',  game: 'starbridge',  pool: FAMILIES },
      { title: 'Teen takes',     game: 'meteordodge', pool: SUB_TEENS },
      { title: 'Mix it up',      game: 'asteroid',    pool: uniq([...SUB_IN_5, ...FROM_10, ...FAMILIES]) },
    ],
  },
  {
    id: 'groupa', name: 'Groupa', icon: '🫧', hue: '#A98CE8',
    teaches: 'Equal groups',
    levels: [
      { title: 'Count in 2s',    game: 'constellation', pool: ['skip:2'] },
      { title: 'Rows of two',    game: 'fuelpods',      pool: ARRAYS_2 },
      { title: 'Count in 5s',    game: 'constellation', pool: ['skip:5'] },
      { title: 'Little arrays',  game: 'feedalien',     pool: [[2,2],[2,3],[3,3],[2,4]].map(([r,c]) => `array:${r}x${c}`) },
      { title: 'Count in 10s',   game: 'constellation', pool: ['skip:10'] },
      { title: 'Array parade',   game: 'fuelpods',      pool: uniq([...ARRAYS_S, ...ARRAYS_M, 'skip:2', 'skip:5', 'skip:10']) },
    ],
  },
  {
    id: 'multiplex', name: 'Multiplex', icon: '✖️', hue: '#3FE0D0',
    teaches: 'Times tables',
    levels: [
      { title: 'Twos begin',     game: 'towerclimb',  pool: tableSlice(2, 1, 6) },
      { title: 'Tens tower',     game: 'asteroid',    pool: tableSlice(10, 1, 6) },
      { title: 'Fives alive',    game: 'towerclimb',  pool: tableSlice(5, 1, 6) },
      { title: 'Speedy mix',     game: 'meteordodge', pool: uniq([...tableSlice(2, 2, 8), ...tableSlice(5, 2, 8), ...tableSlice(10, 2, 8)]) },
      { title: 'Threes trees',   game: 'towerclimb',  pool: tableSlice(3, 1, 6) },
      { title: 'Fours galore',   game: 'asteroid',    pool: tableSlice(4, 1, 6) },
      { title: 'High floors',    game: 'towerclimb',  pool: uniq([...tableSlice(2, 7, 12), ...tableSlice(5, 7, 12), ...tableSlice(3, 7, 10)]) },
      { title: 'Table storm',    game: 'meteordodge', pool: uniq([...table(2), ...table(5), ...table(10), ...table(3), ...table(4)]) },
    ],
  },
  {
    id: 'mixaroo', name: 'Mixaroo', icon: '🌈', hue: '#FFB13C',
    teaches: 'Everything mixed',
    levels: [
      { title: 'Warm up',        game: 'asteroid',    pool: 'MIXED' },
      { title: 'Dodge it all',   game: 'meteordodge', pool: 'MIXED' },
      { title: 'Bridge master',  game: 'starbridge',  pool: 'MIXED' },
      { title: 'Whale hello',    game: 'spacewhale',  pool: 'MIXED' },
      { title: 'Fuel frenzy',    game: 'fuelpods',    pool: 'MIXED' },
      { title: 'The big whale',  game: 'spacewhale',  pool: 'MIXED' },
    ],
  },
]

export function planetById(id){ return PLANETS.find(p => p.id === id) }

export function planetPool(p){
  return uniq(p.levels.flatMap(l => Array.isArray(l.pool) ? l.pool : []))
}

// Mixaroo draws on everything mastered-or-nearly (spec §4).
export function mixedPool(){
  const all = uniq(PLANETS.slice(0, 5).flatMap(planetPool))
  const nearly = all.filter(id => (state.facts[id]?.box ?? 0) >= 2)
  if (nearly.length >= 8) return nearly
  const seen = all.filter(id => (state.facts[id]?.seen ?? 0) > 0)
  return seen.length >= 8 ? seen : all
}

export function levelPool(planet, levelIndex){
  const pool = planet.levels[levelIndex].pool
  return pool === 'MIXED' ? mixedPool() : pool
}

export function planetRecords(p){
  return planetPool(p).map(id => getFact(id))
}

export function planetMastery(p){ return masteredFraction(planetRecords(p)) }

// A planet unlocks at 80% mastered of the previous planet — or parent force-unlock.
export function isUnlocked(idx){
  if (idx === 0) return true
  const prev = PLANETS[idx - 1]
  if (state.planets[PLANETS[idx].id]?.forced) return true
  return planetMastery(prev) >= 0.8
}

export function planetStars(p){
  const rec = state.planets[p.id]?.stars ?? {}
  return Object.values(rec).reduce((a, b) => a + b, 0)
}

export function levelStars(p, levelIndex){
  return state.planets[p.id]?.stars?.[levelIndex] ?? 0
}

export function setLevelStars(p, levelIndex, stars){
  const rec = state.planets[p.id] ?? (state.planets[p.id] = { stars: {}, forced: false })
  if (!rec.stars) rec.stars = {}
  rec.stars[levelIndex] = Math.max(rec.stars[levelIndex] ?? 0, stars)
}

// A gentler pool for the kind restart after all hearts are lost (spec §13.1):
// the same level's facts sorted easiest-first, trimmed to the easier half.
export function easierPool(ids){
  const score = id => {
    const f = state.facts[id]
    const boxBias = f ? -f.box * 10 : 0        // solid facts count as easy
    const size = id.replace(/\D+/g, ' ').trim().split(' ').map(Number).reduce((a, b) => a + b, 0)
    return boxBias + size
  }
  const sorted = [...ids].sort((a, b) => score(a) - score(b))
  return sorted.slice(0, Math.max(4, Math.ceil(sorted.length / 2)))
}

// ── Table Tower (spec §4, phase 7): 2,5,10 then 3,4; 6–12 locked until those are solid ──
export const TOWER_ORDER = [2, 5, 10, 3, 4, 6, 7, 8, 9, 11, 12]
export const CORE_TABLES = [2, 5, 10, 3, 4]

export function tableRecords(t){ return table(t).map(id => getFact(id)) }
export function tableMastery(t){ return masteredFraction(tableRecords(t)) }
export function towerUnlocked(t){
  if (CORE_TABLES.includes(t)) return true
  return CORE_TABLES.every(ct => tableMastery(ct) >= 0.8)
}
export function towerPool(t){ return table(t) }

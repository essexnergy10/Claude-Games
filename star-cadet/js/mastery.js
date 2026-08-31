// The Leitner mastery engine (spec §5). Pure — operates on fact records, no DOM/state.

export function grade(f, correct){
  if (correct){ f.box = Math.min(5, f.box + 1); f.streak++ }
  else        { f.box = Math.max(0, f.box - 2); f.streak = 0 }   // −2 is deliberate
  f.recent = [...f.recent, correct].slice(-5)
  f.seen++
  correct ? f.right++ : f.wrong++
  f.lastSeen = Date.now()
}

export const MASTERED = f =>
  f.box >= 4 && f.streak >= 3 &&
  f.recent.filter(Boolean).length >= 4        // 4 of last 5

// Review intervals per box (ms) — spaced repetition
export const DUE = [0, 60e3, 10 * 60e3, 24 * 3600e3, 3 * 24 * 3600e3, 7 * 24 * 3600e3]
export const isDue = (f, now = Date.now()) => now - f.lastSeen >= DUE[f.box]

// The 70/30 rule: 70% learning (box ≤ 2), 30% due review (box ≥ 3).
export function nextFact(pool, lastId){
  const learning = pool.filter(f => f.box <= 2 && f.id !== lastId)
  const review   = pool.filter(f => f.box >= 3 && isDue(f) && f.id !== lastId)
  const bank = (Math.random() < 0.7 && learning.length) ? learning
             : (review.length ? review : learning.length ? learning : pool)
  bank.sort((a, b) => (a.box - b.box) || (a.streak - b.streak))
  const k = Math.floor(Math.pow(Math.random(), 1.6) * bank.length)   // bias to front
  return bank[k]
}

export function masteredFraction(records){
  if (!records.length) return 0
  return records.filter(MASTERED).length / records.length
}

// A guaranteed win: the child's most solid fact (frustration guard step 2).
export function pickWin(records, lastId){
  const c = records.filter(f => f.id !== lastId)
  const bank = c.length ? c : records
  return [...bank].sort((a, b) => (b.box - a.box) || (b.streak - a.streak))[0]
}

// Facts for the SUPER SPEED bonus round: solid ones only.
export function bonusPool(records){
  const solid = records.filter(f => f.box >= 4)
  return solid.length >= 3 ? solid : records.filter(f => f.box >= 3)
}

// ── Session guards (spec §5) — pure state machines, owned by the level shell ──

// Never four consecutive failures: after 3 wrongs → teach, then a guaranteed win.
export class FrustrationGuard {
  constructor(){ this.wrongRun = 0; this.injectWin = false }
  record(correct){
    if (correct){ this.wrongRun = 0; return false }
    this.wrongRun++
    if (this.wrongRun >= 3){ this.wrongRun = 0; return true }   // caller: open teach, then set injectWin
    return false
  }
}

// Five correct in a row, each under 3s → 20s double-coin bonus round.
export class FlowGuard {
  constructor(){ this.run = 0 }
  record(correct, ms){
    if (correct && ms < 3000) this.run++
    else this.run = 0
    if (this.run >= 5){ this.run = 0; return true }
    return false
  }
}

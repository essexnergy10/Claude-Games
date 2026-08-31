// Star Cadet unit tests — plain node asserts (spec phase 1). Run: node tests/run.mjs
import assert from 'node:assert'
import { parseFact, answerOf, distractors, buildOptions, makeInstance, numWords, mulId, addId, spokenQuestion, spokenFact } from '../js/facts.js'
import { grade, MASTERED, DUE, isDue, nextFact, masteredFraction, FrustrationGuard, FlowGuard, pickWin } from '../js/mastery.js'
import { migrate, freshSave } from '../js/state.js'

let passed = 0, failed = 0
function test(name, fn){
  try { fn(); passed++; console.log(`  ✓ ${name}`) }
  catch (e){ failed++; console.error(`  ✗ ${name}\n    ${e.message}`) }
}
const fresh = (id = 'mul:3x4') => ({ id, box: 0, streak: 0, seen: 0, right: 0, wrong: 0, lastSeen: 0, recent: [] })

console.log('facts.js')
test('parses every fact kind', () => {
  assert.deepEqual(parseFact('add:7+8'), { id: 'add:7+8', op: 'add', a: 7, b: 8 })
  assert.deepEqual(parseFact('sub:14-6'), { id: 'sub:14-6', op: 'sub', a: 14, b: 6 })
  assert.deepEqual(parseFact('mul:3x4'), { id: 'mul:3x4', op: 'mul', a: 3, b: 4 })
  assert.deepEqual(parseFact('array:3x4'), { id: 'array:3x4', op: 'array', r: 3, c: 4 })
  assert.equal(parseFact('count:12').n, 12)
  assert.equal(parseFact('skip:5').n, 5)
})
test('commutative ids store smaller factor first', () => {
  assert.equal(mulId(4, 3), 'mul:3x4')
  assert.equal(mulId(3, 4), 'mul:3x4')
  assert.equal(addId(9, 2), 'add:2+9')
})
test('answers are right', () => {
  assert.equal(answerOf(parseFact('add:7+8')), 15)
  assert.equal(answerOf(parseFact('sub:14-6')), 8)
  assert.equal(answerOf(parseFact('mul:3x4')), 12)
  assert.equal(answerOf(parseFact('array:3x4')), 12)
  assert.equal(answerOf(parseFact('order:7')), 8)
  assert.equal(answerOf(parseFact('count:12')), 12)
})
test('skip instances are consistent', () => {
  for (let i = 0; i < 200; i++){
    const f = parseFact('skip:5')
    const inst = makeInstance(f)
    assert.equal(inst.seq.length, 4)
    assert.equal(inst.seq[1] - inst.seq[0], 5)
    assert.equal(inst.answer, inst.seq[inst.blank])
    assert.equal(answerOf(f, inst), inst.answer)
  }
})
test('number words', () => {
  assert.equal(numWords(0), 'zero')
  assert.equal(numWords(15), 'fifteen')
  assert.equal(numWords(40), 'forty')
  assert.equal(numWords(97), 'ninety seven')
  assert.equal(numWords(144), 'one hundred and forty four')
})
test('spoken forms use words, never symbols', () => {
  const pool = ['add:7+8', 'sub:14-6', 'mul:3x4', 'array:3x4', 'count:12', 'order:7', 'skip:5', 'subitise:4']
  for (const id of pool){
    const f = parseFact(id)
    const inst = makeInstance(f)
    for (const s of [spokenQuestion(f, inst), spokenFact(f, inst)]){
      assert.ok(!/[+×*÷=−]/.test(s) && !/\d/.test(s), `symbol/digit leaked in: "${s}"`)
    }
  }
})
test('distractors: plausible, never negative/zero/duplicate, always n (500 rounds)', () => {
  const ids = ['add:7+8', 'add:1+1', 'sub:14-6', 'sub:3-2', 'mul:3x4', 'mul:1x1', 'mul:10x12',
               'count:1', 'count:20', 'order:1', 'array:2x2', 'subitise:1']
  for (let i = 0; i < 500; i++){
    const f = parseFact(ids[i % ids.length])
    const inst = makeInstance(f)
    const ans = answerOf(f, inst)
    const d = distractors(f, ans, 3)
    assert.equal(d.length, 3, `wanted 3, got ${d.length} for ${f.id}`)
    assert.equal(new Set(d).size, 3, `duplicates for ${f.id}: ${d}`)
    for (const v of d){
      assert.ok(v > 0, `non-positive distractor ${v} for ${f.id}`)
      assert.ok(v <= 144, `overlarge distractor ${v} for ${f.id}`)
      assert.notEqual(v, ans, `distractor equals answer for ${f.id}`)
    }
  }
})
test('buildOptions contains the answer exactly once', () => {
  for (let i = 0; i < 200; i++){
    const f = parseFact('mul:3x4')
    const opts = buildOptions(f, {}, 4)
    assert.equal(opts.length, 4)
    assert.equal(opts.filter(v => v === 12).length, 1)
  }
})

console.log('mastery.js')
test('promotion and demotion', () => {
  const f = fresh()
  grade(f, true); assert.equal(f.box, 1); assert.equal(f.streak, 1)
  grade(f, true); grade(f, true); grade(f, true); grade(f, true)
  assert.equal(f.box, 5)
  grade(f, true); assert.equal(f.box, 5, 'box caps at 5')
  grade(f, false); assert.equal(f.box, 3, 'wrong demotes by two'); assert.equal(f.streak, 0)
  const g = fresh(); grade(g, false); assert.equal(g.box, 0, 'box floors at 0')
})
test('MASTERED needs box≥4, streak≥3, 4 of last 5', () => {
  const f = fresh()
  for (let i = 0; i < 5; i++) grade(f, true)
  assert.ok(MASTERED(f))
  const g = fresh()
  grade(g, true); grade(g, true); grade(g, false)      // box 2 → 0
  for (let i = 0; i < 4; i++) grade(g, true)           // box 4, streak 4, last5 = [F,T,T,T,T]
  assert.ok(MASTERED(g), '4 of last 5 with streak 4 and box 4')
  const h = fresh(); h.box = 5; h.streak = 2; h.recent = [true, true, true, true, true]
  assert.ok(!MASTERED(h), 'streak 2 is not mastered')
})
test('isDue at each box', () => {
  const now = Date.now()
  for (let box = 0; box <= 5; box++){
    const f = fresh(); f.box = box
    f.lastSeen = now - DUE[box] - 1
    assert.ok(isDue(f, now), `box ${box} due after interval`)
    if (box > 0){
      f.lastSeen = now - DUE[box] / 2
      assert.ok(!isDue(f, now), `box ${box} not due at half interval`)
    }
  }
})
test('70/30 rule over 1000 draws', () => {
  const now = Date.now()
  const learning = Array.from({ length: 10 }, (_, i) => ({ ...fresh(`l${i}`), box: 1 }))
  const review = Array.from({ length: 10 }, (_, i) => ({ ...fresh(`r${i}`), box: 4, lastSeen: now - DUE[4] - 1000 }))
  const pool = [...learning, ...review]
  let l = 0
  for (let i = 0; i < 1000; i++){
    const f = nextFact(pool, null)
    if (f.box <= 2) l++
  }
  assert.ok(l > 600 && l < 800, `expected ~700 learning picks, got ${l}`)
})
test('nextFact never repeats lastId when alternatives exist', () => {
  const pool = [fresh('a'), fresh('b'), fresh('c')]
  for (let i = 0; i < 200; i++) assert.notEqual(nextFact(pool, 'a').id, 'a')
})
test('frustration guard fires on the 3rd consecutive wrong, then resets', () => {
  const g = new FrustrationGuard()
  assert.ok(!g.record(false)); assert.ok(!g.record(false)); assert.ok(g.record(false))
  assert.ok(!g.record(false), 'counter reset after firing')
  assert.ok(!g.record(true))
})
test('flow guard fires on 5 fast correct in a row', () => {
  const g = new FlowGuard()
  for (let i = 0; i < 4; i++) assert.ok(!g.record(true, 1000))
  assert.ok(g.record(true, 1000))
  for (let i = 0; i < 4; i++) g.record(true, 1000)
  assert.ok(!g.record(true, 5000), 'slow answer breaks the run')
})
test('pickWin returns the most solid fact', () => {
  const pool = [{ ...fresh('weak'), box: 1 }, { ...fresh('strong'), box: 5, streak: 8 }]
  assert.equal(pickWin(pool, null).id, 'strong')
})

console.log('state.js')
test('migrate: corrupt input falls back to fresh', () => {
  for (const bad of [null, undefined, 'hello', 42, [], {}, { v: 'x' }, { v: 99 }]){
    const s = migrate(bad)
    assert.equal(s.v, 1)
    assert.ok(s.settings && s.facts !== undefined)
  }
})
test('migrate: fills missing keys, keeps existing data', () => {
  const partial = { v: 1, coins: 77, facts: { 'mul:3x4': fresh() } }
  const s = migrate(partial)
  assert.equal(s.coins, 77)
  assert.ok(s.facts['mul:3x4'])
  assert.equal(s.settings.dailyLimitMin, 20)
  assert.ok(Array.isArray(s.stickers))
  assert.ok(s.totals && typeof s.totals.correct === 'number')
})

console.log('property: synthetic child, 5000 answers at 80% accuracy (spec §15)')
test('mastery converges, no fact starved, never 4 consecutive failures', () => {
  const pool = []
  for (const t of [2, 5, 10]) for (let n = 1; n <= 12; n++){
    const id = t <= n ? `mul:${t}x${n}` : `mul:${n}x${t}`
    if (!pool.find(f => f.id === id)) pool.push(fresh(id))
  }
  const guard = new FrustrationGuard()
  let lastId = null, maxWrongRun = 0, wrongRun = 0, teaches = 0
  for (let i = 0; i < 5000; i++){
    let f
    if (guard.injectWin){ guard.injectWin = false; f = pickWin(pool, lastId) }
    else f = nextFact(pool, lastId)
    lastId = f.id
    // A guaranteed-win pick is answered with the child's real strength: box 5 ≈ 97%
    const p = f.box >= 4 ? 0.95 : 0.75
    const correct = Math.random() < p
    grade(f, correct)
    if (guard.record(correct)){ teaches++; guard.injectWin = true; grade(f, true) /* helped win */ }
    if (correct) wrongRun = 0
    else { wrongRun++; maxWrongRun = Math.max(maxWrongRun, wrongRun) }
    if (guard.injectWin) wrongRun = 0
  }
  const frac = masteredFraction(pool)
  assert.ok(frac > 0.5, `mastery should converge; got ${(frac * 100).toFixed(0)}%`)
  const starved = pool.filter(f => f.seen === 0)
  assert.equal(starved.length, 0, `${starved.length} facts never seen`)
  assert.ok(maxWrongRun <= 3, `frustration guard allowed ${maxWrongRun} consecutive failures`)
  console.log(`    (mastered ${(frac * 100).toFixed(0)}%, ${teaches} teach interventions)`)
})

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed ? 1 : 0)

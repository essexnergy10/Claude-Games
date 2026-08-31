// Fact catalogue, parsing, spoken word-forms and distractor generation (spec §4, §5, §8).
// Pure module — no DOM, no state. Unit-tested in node.

export function parseFact(id){
  const i = id.indexOf(':')
  const kind = id.slice(0, i), rest = id.slice(i + 1)
  switch (kind){
    case 'count':
    case 'subitise':
    case 'order':
    case 'skip': return { id, op: kind, n: +rest }
    case 'add': { const [a, b] = rest.split('+').map(Number); return { id, op: 'add', a, b } }
    case 'sub': { const [a, b] = rest.split('-').map(Number); return { id, op: 'sub', a, b } }
    case 'mul': { const [a, b] = rest.split('x').map(Number); return { id, op: 'mul', a, b } }
    case 'array': { const [r, c] = rest.split('x').map(Number); return { id, op: 'array', r, c } }
    default: throw new Error(`unknown fact id: ${id}`)
  }
}

// Commutative pairs share one id, smaller factor first (spec §4).
export const mulId = (a, b) => a <= b ? `mul:${a}x${b}` : `mul:${b}x${a}`
export const addId = (a, b) => a <= b ? `add:${a}+${b}` : `add:${b}+${a}`

const rnd = n => Math.floor(Math.random() * n)

// Some question types (skip counting) vary per ask; the instance pins the concrete ask.
export function makeInstance(f){
  switch (f.op){
    case 'skip': {
      const s = 1 + rnd(3)                       // sequence starts at n·s
      const seq = [0, 1, 2, 3].map(k => f.n * (s + k))
      return { seq, blank: 3, answer: seq[3] }
    }
    case 'count':    return { n: f.n, emoji: THINGS[rnd(THINGS.length)] }
    case 'subitise': return { n: f.n }
    case 'array':    return { r: f.r, c: f.c }
    default:         return {}
  }
}

export function answerOf(f, inst){
  switch (f.op){
    case 'count':
    case 'subitise': return f.n
    case 'order':    return f.n + 1
    case 'add':      return f.a + f.b
    case 'sub':      return f.a - f.b
    case 'mul':      return f.a * f.b
    case 'array':    return f.r * f.c
    case 'skip':     return inst ? inst.answer : f.n * 4
  }
}

const THINGS = ['⭐', '🚀', '👾', '🛸', '🌙', '☄️', '🪐']

// ── Numbers as words (0–199 covers every answer ≤ 144) ──
const ONES = ['zero','one','two','three','four','five','six','seven','eight','nine','ten',
  'eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen']
const TENS = ['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety']
export function numWords(n){
  if (n < 0) return 'minus ' + numWords(-n)
  if (n < 20) return ONES[n]
  if (n < 100){
    const t = Math.floor(n / 10), o = n % 10
    return TENS[t] + (o ? ' ' + ONES[o] : '')
  }
  const h = Math.floor(n / 100), r = n % 100
  return ONES[h] + ' hundred' + (r ? ' and ' + numWords(r) : '')
}

// ── Spoken forms — words, never symbols (spec §8) ──
export function spokenQuestion(f, inst){
  switch (f.op){
    case 'count':    return `How many ${inst && inst.n === 1 ? 'do' : 'can'} you count?`
    case 'subitise': return 'Quick! How many dots do you see?'
    case 'order':    return `What number comes after ${numWords(f.n)}?`
    case 'add':      return `What does ${numWords(f.a)} plus ${numWords(f.b)} make?`
    case 'sub':      return `What does ${numWords(f.a)} take away ${numWords(f.b)} make?`
    case 'mul':      return `What is ${numWords(f.a)} times ${numWords(f.b)}?`
    case 'array':    return `${cap(numWords(f.r))} rows, with ${numWords(f.c)} in each row. How many altogether?`
    case 'skip':     return `We are counting in ${numWords(f.n)}s! What number comes next?`
  }
}

export function spokenFact(f, inst){
  const ans = answerOf(f, inst)
  switch (f.op){
    case 'count':
    case 'subitise': return `There are ${numWords(ans)}!`
    case 'order':    return `${cap(numWords(ans))} comes after ${numWords(f.n)}!`
    case 'add':      return `${cap(numWords(f.a))} plus ${numWords(f.b)} makes ${numWords(ans)}!`
    case 'sub':      return `${cap(numWords(f.a))} take away ${numWords(f.b)} makes ${numWords(ans)}!`
    case 'mul':      return `${cap(numWords(f.a))} times ${numWords(f.b)} makes ${numWords(ans)}!`
    case 'array':    return `${cap(numWords(f.r))} rows of ${numWords(f.c)} makes ${numWords(ans)}!`
    case 'skip':     return `After ${numWords(inst.seq[2])} comes ${numWords(ans)}!`
  }
}

const cap = s => s.charAt(0).toUpperCase() + s.slice(1)

// Short display string for the question card ('' means purely visual).
export function displayText(f, inst){
  switch (f.op){
    case 'add':   return `${f.a} + ${f.b} = ?`
    case 'sub':   return `${f.a} − ${f.b} = ?`
    case 'mul':   return `${f.a} × ${f.b} = ?`
    case 'order': return `${f.n} → ?`
    default:      return ''
  }
}

// ── Distractors (spec §5) — plausible, never negative/zero/duplicate, always n ──
export function distractors(fact, answer, n = 3){
  const c = new Set()
  c.add(answer + 1); c.add(answer - 1)          // off-by-one — the commonest slip
  c.add(answer + 2); c.add(answer - 2)
  const op = fact.op === 'array' ? 'mul' : fact.op
  const a = fact.op === 'array' ? fact.r : fact.a
  const b = fact.op === 'array' ? fact.c : fact.b
  if (op === 'mul'){
    c.add(answer + b); c.add(answer - b)        // adjacent multiples
    c.add(a + b)                                // "added instead of timesed"
  }
  if (op === 'add') c.add(Math.abs(a - b))      // "took away instead"
  if (op === 'sub') c.add(a + b)
  c.delete(answer)
  let out = [...c].filter(v => v > 0 && v <= 144)
  for (let k = 3; out.length < n && k < 20; k++){       // top up (spec: ±3, ±4…)
    for (const v of [answer + k, answer - k]){
      if (v > 0 && v <= 144 && v !== answer && !out.includes(v)) out.push(v)
    }
  }
  return out.sort(() => Math.random() - .5).slice(0, n)
}

export function buildOptions(f, inst, n = 4){
  const ans = answerOf(f, inst)
  const opts = [ans, ...distractors(f, ans, n - 1)]
  return opts.sort(() => Math.random() - .5)
}

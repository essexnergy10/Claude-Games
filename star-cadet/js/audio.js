// SFX synth + speech (spec §8). All three iOS gotchas handled here.
import { state } from './state.js'

// ── Speech ──
let voice = null
function pickVoice(){
  const v = speechSynthesis.getVoices()
  voice = v.find(x => /en-GB/i.test(x.lang) && /female|Serena|Kate|Martha/i.test(x.name))
       || v.find(x => /en-GB/i.test(x.lang))
       || v.find(x => /^en/i.test(x.lang)) || null
}
if ('speechSynthesis' in window){
  speechSynthesis.onvoiceschanged = pickVoice
  pickVoice()
}

export function say(text, { rate = 0.85, pitch = 1.25, queue = false } = {}){
  if (!state.settings.soundOn || !('speechSynthesis' in window)) return
  if (!queue) speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.voice = voice; u.rate = rate; u.pitch = pitch; u.lang = 'en-GB'
  speechSynthesis.speak(u)
}

export function stopSpeech(){
  if ('speechSynthesis' in window) speechSynthesis.cancel()
}

// ── SFX — synthesised, no files ──
let _ctx = null
function ctx(){
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)()
  return _ctx
}
function blip(freq, dur = .12, type = 'sine', gain = .18){
  if (!state.settings.soundOn) return
  try {
    const c = ctx()
    const o = c.createOscillator(), g = c.createGain()
    o.type = type; o.frequency.value = freq
    g.gain.setValueAtTime(gain, c.currentTime)
    g.gain.exponentialRampToValueAtTime(.001, c.currentTime + dur)
    o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime + dur)
  } catch { /* audio unavailable */ }
}

export const sfx = {
  correct: () => [523, 659, 784].forEach((f, i) => setTimeout(() => blip(f, .12), i * 70)),
  wrong:   () => blip(200, .18, 'triangle', .12),          // soft and low, never a buzzer
  coin:    () => blip(1046, .08, 'square', .10),
  star:    () => [784, 988, 1318].forEach((f, i) => setTimeout(() => blip(f, .16), i * 90)),
  tap:     () => blip(660, .05, 'sine', .07),
  tick:    () => blip(880, .05, 'sine', .06),
  boing:   () => { blip(300, .1, 'sine', .12); setTimeout(() => blip(200, .16, 'sine', .1), 80) },
  whoosh:  () => [400, 300, 220].forEach((f, i) => setTimeout(() => blip(f, .1, 'sine', .06), i * 60)),
}

// ── iOS unlock: first speak() and ctx.resume() must happen inside a user gesture ──
let unlocked = false
export function installAudioUnlock(){
  const unlock = () => {
    if (unlocked) return
    unlocked = true
    try { ctx().resume() } catch { /* no audio */ }
    if ('speechSynthesis' in window){
      const u = new SpeechSynthesisUtterance(' ')
      u.volume = 0
      speechSynthesis.speak(u)
    }
    removeEventListener('pointerdown', unlock, true)
  }
  addEventListener('pointerdown', unlock, true)
}

// ── Praise / gentle lines ──
const PRAISE = ['Brilliant!', 'You got it!', 'Super!', 'Amazing!', "That's right!", 'Wonderful!', "You're a star!"]
const GENTLE = ['Try again!', 'Nearly! Have another go!', "Ooh, so close! Try again!"]
let praiseIx = Math.floor(Math.random() * PRAISE.length)
export function praiseLine(){ praiseIx = (praiseIx + 1) % PRAISE.length; return PRAISE[praiseIx] }
export function gentleLine(){ return GENTLE[Math.floor(Math.random() * GENTLE.length)] }

// Long-press (400ms) on any button speaks its label (spec §8).
export function speakOnHold(el, text){
  let t = null
  el.addEventListener('pointerdown', () => { t = setTimeout(() => say(text), 400) })
  const cancel = () => { clearTimeout(t); t = null }
  el.addEventListener('pointerup', cancel)
  el.addEventListener('pointercancel', cancel)
  el.addEventListener('pointerleave', cancel)
}

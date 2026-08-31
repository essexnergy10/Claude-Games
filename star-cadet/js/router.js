// Screen mount/unmount. A screen module is a function (rootEl, params) => { destroy() }.
import { stopSpeech } from './audio.js'

const screens = {}
let current = null
let root = null

export function initRouter(rootEl){ root = rootEl }

export function register(name, mountFn){ screens[name] = mountFn }

export function show(name, params = {}){
  try { current?.destroy?.() } catch { /* a dying screen must not block the next */ }
  stopSpeech()
  root.innerHTML = ''
  const mountFn = screens[name]
  current = mountFn(root, params) || {}
}

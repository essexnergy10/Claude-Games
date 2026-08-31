// One-line feedback bubbles, optionally with Zibby.
let activeToast = null

export function toast(text, { emoji = '', ms = 2600 } = {}){
  activeToast?.remove()
  const t = document.createElement('div')
  t.className = 'toast'
  t.innerHTML = `${emoji ? `<span style="font-size:30px">${emoji}</span>` : ''}<span></span>`
  t.lastElementChild.textContent = text
  document.getElementById('overlay-root').appendChild(t)
  activeToast = t
  setTimeout(() => {
    t.classList.add('out')
    setTimeout(() => { t.remove(); if (activeToast === t) activeToast = null }, 320)
  }, ms)
}

export const zibbySays = (text, ms) => toast(text, { emoji: '👽', ms })

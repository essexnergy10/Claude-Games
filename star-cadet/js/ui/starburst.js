// Star particle bursts. x/y in canvas coordinates (1024×768).
const overlayRoot = () => document.getElementById('overlay-root')

export function burst(x, y, { count = 8, emoji = '⭐' } = {}){
  if (document.documentElement.classList.contains('reduce-motion')) return
  const root = overlayRoot()
  for (let i = 0; i < count; i++){
    const s = document.createElement('span')
    s.className = 'burst-star'
    s.textContent = emoji
    const ang = (i / count) * Math.PI * 2 + Math.random() * .5
    const dist = 70 + Math.random() * 90
    s.style.left = `${x}px`; s.style.top = `${y}px`
    s.style.setProperty('--bx', `${Math.cos(ang) * dist}px`)
    s.style.setProperty('--by', `${Math.sin(ang) * dist}px`)
    root.appendChild(s)
    setTimeout(() => s.remove(), 900)
  }
}

export function celebrate(){
  const spots = [[256, 300], [512, 220], [768, 300], [380, 480], [644, 480]]
  spots.forEach(([x, y], i) => setTimeout(() => burst(x, y, { count: 10 }), i * 160))
}

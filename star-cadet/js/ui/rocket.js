// The rocket SVG (composed from equipped garage parts), Zibby the alien, and the
// garage catalogue. Single source of truth for every part shape and price.
import { state } from '../state.js'

// ── Colour palettes (the 'color' slot) ──
export const PALETTES = {
  'color.default': { body: '#D9D4E8', trim: '#FF5D73', fin: '#A98CE8', window: '#3FE0D0' },
  'color.sunny':   { body: '#FFB13C', trim: '#E8890F', fin: '#FFD98A', window: '#14102B' },
  'color.aqua':    { body: '#3FE0D0', trim: '#17A99C', fin: '#BFF7F0', window: '#14102B' },
  'color.coral':   { body: '#FF5D73', trim: '#C23B50', fin: '#FFB1BC', window: '#FFF4DE' },
  'color.galaxy':  { body: '#4B3383', trim: '#A98CE8', fin: '#2E1F58', window: '#3FE0D0' },
  'color.gold':    { body: '#F5C64F', trim: '#B8860B', fin: '#FFE9A8', window: '#14102B' },
}

export const CATALOG = {
  nose: [
    { id: 'nose.default', name: 'Classic Cone', price: 0,   emoji: '🔺' },
    { id: 'nose.dome',    name: 'Bubble Dome',  price: 60,  emoji: '🫧' },
    { id: 'nose.spike',   name: 'Star Spike',   price: 90,  emoji: '📍' },
    { id: 'nose.radar',   name: 'Radar Dish',   price: 150, emoji: '📡' },
    { id: 'nose.crown',   name: 'Royal Crown',  price: 240, emoji: '👑' },
    { id: 'nose.flower',  name: 'Moon Flower',  price: 320, emoji: '🌸' },
  ],
  body: [
    { id: 'body.default', name: 'Trusty Tube',  price: 0,   emoji: '🚀' },
    { id: 'body.round',   name: 'Roly Pod',     price: 80,  emoji: '🥚' },
    { id: 'body.tall',    name: 'Sky Tower',    price: 120, emoji: '🗼' },
    { id: 'body.stripe',  name: 'Zoom Stripes', price: 180, emoji: '🦓' },
    { id: 'body.star',    name: 'Star Belly',   price: 260, emoji: '⭐' },
    { id: 'body.whale',   name: 'Whale Shape',  price: 400, emoji: '🐋' },
  ],
  wings: [
    { id: 'wings.default', name: 'Little Fins', price: 0,   emoji: '🐟' },
    { id: 'wings.delta',   name: 'Delta Wings', price: 70,  emoji: '✈️' },
    { id: 'wings.curvy',   name: 'Curvy Fins',  price: 110, emoji: '🌊' },
    { id: 'wings.rings',   name: 'Saturn Rings',price: 200, emoji: '🪐' },
    { id: 'wings.flames',  name: 'Flame Fins',  price: 300, emoji: '🔥' },
    { id: 'wings.angel',   name: 'Angel Wings', price: 500, emoji: '🕊️' },
  ],
  color: [
    { id: 'color.default', name: 'Moon Silver', price: 0,   emoji: '🌕' },
    { id: 'color.sunny',   name: 'Sunny Amber', price: 60,  emoji: '🌟' },
    { id: 'color.aqua',    name: 'Aqua Splash', price: 90,  emoji: '💧' },
    { id: 'color.coral',   name: 'Coral Pop',   price: 130, emoji: '🪸' },
    { id: 'color.galaxy',  name: 'Galaxy Plum', price: 220, emoji: '🌌' },
    { id: 'color.gold',    name: 'Solid Gold',  price: 500, emoji: '🏆' },
  ],
  hat: [
    { id: 'hat.none',    name: 'No Hat',       price: 0,   emoji: '👽' },
    { id: 'hat.cap',     name: 'Space Cap',    price: 60,  emoji: '🧢' },
    { id: 'hat.party',   name: 'Party Cone',   price: 100, emoji: '🥳' },
    { id: 'hat.crown',   name: 'Tiny Crown',   price: 180, emoji: '👑' },
    { id: 'hat.wizard',  name: 'Wizard Hat',   price: 260, emoji: '🧙' },
    { id: 'hat.helmet',  name: 'Hero Helmet',  price: 400, emoji: '⛑️' },
  ],
}

// ── Rocket SVG builder ──
export function rocketSVG(size = 200, equipped = state.equipped){
  const pal = PALETTES[equipped.color] ?? PALETTES['color.default']
  const nose = {
    'nose.default': `<path d="M100 8 L128 74 L72 74 Z" fill="${pal.trim}"/>`,
    'nose.dome':    `<path d="M72 74 A28 34 0 0 1 128 74 Z" fill="${pal.trim}"/>`,
    'nose.spike':   `<path d="M100 0 L112 74 L88 74 Z" fill="${pal.trim}"/><circle cx="100" cy="10" r="7" fill="${pal.fin}"/>`,
    'nose.radar':   `<path d="M80 74 L120 74 L112 48 L88 48 Z" fill="${pal.trim}"/><ellipse cx="100" cy="40" rx="24" ry="9" fill="${pal.fin}"/><line x1="100" y1="40" x2="100" y2="18" stroke="${pal.trim}" stroke-width="5"/><circle cx="100" cy="16" r="6" fill="${pal.window}"/>`,
    'nose.crown':   `<path d="M76 74 L76 44 L88 58 L100 38 L112 58 L124 44 L124 74 Z" fill="#F5C64F"/>`,
    'nose.flower':  `<circle cx="100" cy="50" r="14" fill="#F5C64F"/><g fill="${pal.trim}"><circle cx="100" cy="28" r="11"/><circle cx="80" cy="42" r="11"/><circle cx="120" cy="42" r="11"/><circle cx="84" cy="64" r="11"/><circle cx="116" cy="64" r="11"/></g>`,
  }[equipped.nose] ?? ''
  const bodyShape = {
    'body.default': `<rect x="72" y="72" width="56" height="104" rx="16" fill="${pal.body}"/>`,
    'body.round':   `<ellipse cx="100" cy="124" rx="34" ry="54" fill="${pal.body}"/>`,
    'body.tall':    `<rect x="78" y="60" width="44" height="118" rx="12" fill="${pal.body}"/>`,
    'body.stripe':  `<rect x="72" y="72" width="56" height="104" rx="16" fill="${pal.body}"/><rect x="72" y="100" width="56" height="12" fill="${pal.trim}"/><rect x="72" y="126" width="56" height="12" fill="${pal.trim}"/>`,
    'body.star':    `<rect x="72" y="72" width="56" height="104" rx="16" fill="${pal.body}"/><text x="100" y="150" font-size="26" text-anchor="middle">⭐</text>`,
    'body.whale':   `<ellipse cx="100" cy="128" rx="40" ry="50" fill="${pal.body}"/><path d="M100 176 Q86 190 76 184 Q88 176 90 168 Z" fill="${pal.fin}"/>`,
  }[equipped.body] ?? ''
  const wings = {
    'wings.default': `<path d="M72 130 L44 176 L72 168 Z" fill="${pal.fin}"/><path d="M128 130 L156 176 L128 168 Z" fill="${pal.fin}"/>`,
    'wings.delta':   `<path d="M74 110 L30 180 L74 164 Z" fill="${pal.fin}"/><path d="M126 110 L170 180 L126 164 Z" fill="${pal.fin}"/>`,
    'wings.curvy':   `<path d="M72 120 Q34 150 46 184 Q66 170 72 156 Z" fill="${pal.fin}"/><path d="M128 120 Q166 150 154 184 Q134 170 128 156 Z" fill="${pal.fin}"/>`,
    'wings.rings':   `<ellipse cx="100" cy="140" rx="74" ry="16" fill="none" stroke="${pal.fin}" stroke-width="9"/>`,
    'wings.flames':  `<path d="M72 126 L40 156 L58 158 L36 182 L72 166 Z" fill="#FFB13C"/><path d="M128 126 L160 156 L142 158 L164 182 L128 166 Z" fill="#FFB13C"/>`,
    'wings.angel':   `<path d="M72 112 Q20 116 26 168 Q52 160 72 140 Z" fill="#FFF4DE"/><path d="M128 112 Q180 116 174 168 Q148 160 128 140 Z" fill="#FFF4DE"/>`,
  }[equipped.wings] ?? ''
  return `<svg width="${size}" height="${size}" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    ${wings}
    ${bodyShape}
    ${nose}
    <circle cx="100" cy="104" r="15" fill="${pal.window}" stroke="${pal.trim}" stroke-width="4"/>
    <path d="M84 176 L100 198 L116 176 Z" fill="#FFB13C"/>
    <path d="M92 176 L100 189 L108 176 Z" fill="#FF5D73"/>
  </svg>`
}

// ── Zibby the alien (wears the equipped hat) ──
export function zibbySVG(size = 150, hat = state.equipped.hat){
  const hats = {
    'hat.none':   '',
    'hat.cap':    `<path d="M40 34 A35 26 0 0 1 110 34 L110 40 L40 40 Z" fill="#3FE0D0"/><rect x="100" y="30" width="34" height="10" rx="5" fill="#3FE0D0"/>`,
    'hat.party':  `<path d="M75 -4 L96 38 L54 38 Z" fill="#FF5D73"/><circle cx="75" cy="-2" r="7" fill="#FFB13C"/>`,
    'hat.crown':  `<path d="M52 38 L52 16 L64 28 L75 10 L86 28 L98 16 L98 38 Z" fill="#F5C64F"/>`,
    'hat.wizard': `<path d="M75 -12 L100 40 L50 40 Z" fill="#4B3383"/><text x="70" y="26" font-size="16">✨</text>`,
    'hat.helmet': `<path d="M38 40 A37 34 0 0 1 112 40 Z" fill="#D9D4E8"/><rect x="38" y="36" width="74" height="8" rx="4" fill="#FF5D73"/>`,
  }[hat] ?? ''
  return `<svg width="${size}" height="${size}" viewBox="0 0 150 150" xmlns="http://www.w3.org/2000/svg">
    <line x1="58" y1="30" x2="50" y2="10" stroke="#3FE0D0" stroke-width="4"/>
    <circle cx="49" cy="8" r="6" fill="#FFB13C"/>
    <line x1="92" y1="30" x2="100" y2="10" stroke="#3FE0D0" stroke-width="4"/>
    <circle cx="101" cy="8" r="6" fill="#FFB13C"/>
    <ellipse cx="75" cy="78" rx="44" ry="48" fill="#3FE0D0"/>
    <ellipse cx="60" cy="68" rx="10" ry="13" fill="#FFF4DE"/>
    <ellipse cx="90" cy="68" rx="10" ry="13" fill="#FFF4DE"/>
    <circle cx="62" cy="71" r="5" fill="#14102B"/>
    <circle cx="88" cy="71" r="5" fill="#14102B"/>
    <circle cx="52" cy="90" r="7" fill="#FF5D73" opacity=".7"/>
    <circle cx="98" cy="90" r="7" fill="#FF5D73" opacity=".7"/>
    <path d="M60 98 Q75 112 90 98" stroke="#14102B" stroke-width="4" fill="none" stroke-linecap="round"/>
    <ellipse cx="52" cy="128" rx="12" ry="8" fill="#3FE0D0"/>
    <ellipse cx="98" cy="128" rx="12" ry="8" fill="#3FE0D0"/>
    ${hats}
  </svg>`
}

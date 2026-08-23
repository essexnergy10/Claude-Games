import { useState, useEffect, useRef } from 'react'
import './App.css'

// ── Audio ─────────────────────────────────────────────────────────────────────
let _ac = null
const ac = () => {
  if (!_ac) _ac = new (window.AudioContext || window.webkitAudioContext)()
  if (_ac.state === 'suspended') _ac.resume()
  return _ac
}
let _soundOn = (() => { try { return (localStorage.getItem('walli-sound') ?? 'on') === 'on' } catch { return true } })()
function tone(freq, dur, type = 'sine', vol = 0.25, delay = 0) {
  if (!_soundOn) return
  const c = ac(), t = c.currentTime + delay
  const o = c.createOscillator(), g = c.createGain()
  o.type = type; o.frequency.value = freq
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur)
  o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + 0.01)
}
const playCorrect = () => { tone(523,0.08,'sine',0.3); tone(659,0.09,'sine',0.25,0.07); tone(784,0.18,'sine',0.2,0.15) }
const playWrong   = () => { tone(220,0.12,'sawtooth',0.3); tone(180,0.25,'sawtooth',0.25,0.1) }
const playClick   = () => { tone(600,0.06,'sine',0.15); ensureMusic() }

// Gentle generative background music: slow pentatonic notes over a soft pad
const MUSIC_NOTES = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25]
let _musicTimer = null
function musicStep() {
  if (!_soundOn) return
  const n = MUSIC_NOTES[Math.floor(Math.random() * MUSIC_NOTES.length)]
  tone(n, 3.2, 'sine', 0.035)
  tone(n / 2, 4.0, 'sine', 0.025, 0.4)
  if (Math.random() < 0.4) tone(n * 1.5, 2.6, 'sine', 0.018, 1.1)
}
function ensureMusic() {
  if (!_soundOn || _musicTimer) return
  musicStep()
  _musicTimer = setInterval(musicStep, 2600)
}
function setSoundOn(on) {
  _soundOn = on
  try { localStorage.setItem('walli-sound', on ? 'on' : 'off') } catch { /* private mode */ }
  if (!on && _musicTimer) { clearInterval(_musicTimer); _musicTimer = null }
  if (on) ensureMusic()
}
const isSoundOn = () => _soundOn

function SoundToggle() {
  const [on, setOn] = useState(isSoundOn())
  return (
    <button className="sound-toggle" title={on ? 'Mute sound & music' : 'Turn on sound & music'}
      onClick={() => { const next = !on; setSoundOn(next); setOn(next); if (next) playClick() }}>
      {on ? '🔊' : '🔇'}
    </button>
  )
}

// ── Sun data ───────────────────────────────────────────────────────────────────
const SUN = {
  id:'sun', name:'The Sun', nickname:'Our Star', order:0,
  img:'https://upload.wikimedia.org/wikipedia/commons/b/b4/The_Sun_by_the_Atmospheric_Imaging_Assembly_of_NASA%27s_Solar_Dynamics_Observatory_-_20100819.jpg',
  color:'#ffd740', size:120,
  diameter:'1,392,700 km', moons:'N/A', distanceSun:'Center of Solar System',
  orbitalPeriod:'N/A (others orbit it)', type:'G-type Main-sequence Star',
  tempRange:'5,500°C (surface) / 15M°C (core)',
  facts:[
    'The Sun contains 99.86% of all mass in the entire solar system',
    'Over 1.3 million Earths could fit inside the Sun',
    'The Sun is 4.6 billion years old — roughly halfway through its life',
    'Light from the Sun takes about 8 minutes 20 seconds to reach Earth',
    'The Sun\'s outer atmosphere (corona) is hotter than its surface — a mystery scientists are still solving',
  ],
  funFact:'The Sun loses 4 million tonnes of mass every second — converted to energy by nuclear fusion!',
}

// ── Planet data with real NASA/Wikimedia images ───────────────────────────────
const PLANETS = [
  {
    id:'mercury', name:'Mercury', nickname:'The Swift Planet', order:1,
    img:'https://upload.wikimedia.org/wikipedia/commons/4/4a/Mercury_in_true_color.jpg',
    color:'#a8a8a8', size:38,
    diameter:'4,879 km', moons:0, distanceSun:'57.9M km',
    orbitalPeriod:'88 Earth days', type:'Rocky / Terrestrial',
    tempRange:'-180°C to 430°C',
    facts:[
      'Smallest planet in our solar system — barely bigger than our Moon',
      'Has no atmosphere, causing extreme temperature swings of 600°C',
      'A single day on Mercury lasts 59 Earth days',
      'Its surface is heavily cratered, like our Moon',
      'Orbits the Sun faster than any other planet',
    ],
    funFact:'Despite being closest to the Sun, Mercury is NOT the hottest planet!',
  },
  {
    id:'venus', name:'Venus', nickname:'The Evening Star', order:2,
    img:'https://upload.wikimedia.org/wikipedia/commons/e/e5/Venus-real_color.jpg',
    color:'#e8c94c', size:56,
    diameter:'12,104 km', moons:0, distanceSun:'108.2M km',
    orbitalPeriod:'225 Earth days', type:'Rocky / Terrestrial',
    tempRange:'~465°C (constant)',
    facts:[
      'Hottest planet in the solar system due to its thick atmosphere',
      'Covered in thick clouds of sulfuric acid',
      'A day on Venus is longer than its entire year',
      'Rotates backwards — the Sun rises in the west here',
      'Atmospheric pressure is 90× that of Earth — crushing!',
    ],
    funFact:'Venus is the brightest object in the sky after the Sun and Moon!',
  },
  {
    id:'earth', name:'Earth', nickname:'The Blue Marble', order:3,
    img:'https://upload.wikimedia.org/wikipedia/commons/9/97/The_Earth_seen_from_Apollo_17.jpg',
    color:'#4fc3f7', size:58,
    diameter:'12,742 km', moons:1, distanceSun:'149.6M km',
    orbitalPeriod:'365.25 days', type:'Rocky / Terrestrial',
    tempRange:'-89°C to 58°C',
    facts:[
      'The only known planet with life',
      '71% of the surface is covered by water',
      'Has a powerful magnetic field that protects us from solar wind',
      'Our Moon is unusually large compared to Earth',
      'Earth is not perfectly round — it bulges at the equator',
    ],
    funFact:'Earth is the densest planet in the solar system!',
  },
  {
    id:'mars', name:'Mars', nickname:'The Red Planet', order:4,
    img:'https://upload.wikimedia.org/wikipedia/commons/0/02/OSIRIS_Mars_true_color.jpg',
    color:'#e57373', size:44,
    diameter:'6,779 km', moons:2, distanceSun:'227.9M km',
    orbitalPeriod:'687 Earth days', type:'Rocky / Terrestrial',
    tempRange:'-125°C to 20°C',
    facts:[
      'Has the tallest volcano in the solar system — Olympus Mons (21km high)',
      'Two small moons: Phobos and Deimos',
      'Has the longest canyon system — Valles Marineris (4,000 km long)',
      'Dust storms can engulf the entire planet for months',
      'A Martian day is just 40 minutes longer than an Earth day',
    ],
    funFact:'Mars is red because its soil is full of iron oxide — rust!',
  },
  {
    id:'jupiter', name:'Jupiter', nickname:'The Giant', order:5,
    img:'https://upload.wikimedia.org/wikipedia/commons/2/2b/Jupiter_and_its_shrunken_Great_Red_Spot.jpg',
    color:'#e8a87c', size:100,
    diameter:'139,820 km', moons:95, distanceSun:'778.5M km',
    orbitalPeriod:'12 Earth years', type:'Gas Giant',
    tempRange:'-110°C (cloud tops)',
    facts:[
      'Largest planet — so big, 1,300 Earths could fit inside',
      'The Great Red Spot is a storm larger than Earth that has raged for 350+ years',
      'Has 95 known moons — the most of any planet',
      'Its moon Europa may have a liquid water ocean under the ice',
      'Jupiter acts as a "cosmic vacuum cleaner," protecting Earth from asteroids',
    ],
    funFact:'Jupiter has the shortest day of all planets — just 10 hours!',
  },
  {
    id:'saturn', name:'Saturn', nickname:'The Ringed Beauty', order:6,
    img:'https://upload.wikimedia.org/wikipedia/commons/c/c7/Saturn_during_Equinox.jpg',
    color:'#f0d080', size:90,
    diameter:'116,460 km', moons:146, distanceSun:'1.43B km',
    orbitalPeriod:'29 Earth years', type:'Gas Giant',
    tempRange:'-140°C (cloud tops)',
    facts:[
      'Famous for its spectacular ring system made of ice and rock',
      'The least dense planet — it would float on water!',
      'Has 146 known moons — more than any other planet',
      'Its moon Titan has a thick atmosphere and liquid methane lakes',
      'Winds on Saturn can reach 1,800 km/h',
    ],
    funFact:'Saturn\'s rings are incredibly thin — just 10 meters to 1 km thick, but 282,000 km wide!',
  },
  {
    id:'uranus', name:'Uranus', nickname:'The Ice Giant', order:7,
    img:'https://upload.wikimedia.org/wikipedia/commons/3/3d/Uranus2.jpg',
    color:'#80d8ff', size:62,
    diameter:'50,724 km', moons:28, distanceSun:'2.87B km',
    orbitalPeriod:'84 Earth years', type:'Ice Giant',
    tempRange:'-224°C (coldest planet)',
    facts:[
      'Rotates completely on its side with an axial tilt of 98°',
      'The coldest planetary atmosphere in the solar system',
      'Has faint rings that were only discovered in 1977',
      'A season on Uranus lasts 21 years due to its tilt',
      'Its blue-green color comes from methane gas in the atmosphere',
    ],
    funFact:'Uranus was the first planet discovered with a telescope, in 1781!',
  },
  {
    id:'neptune', name:'Neptune', nickname:'The Windy World', order:8,
    img:'https://upload.wikimedia.org/wikipedia/commons/5/56/Neptune_Full.jpg',
    color:'#3d7ebf', size:58,
    diameter:'49,244 km', moons:16, distanceSun:'4.5B km',
    orbitalPeriod:'165 Earth years', type:'Ice Giant',
    tempRange:'-214°C',
    facts:[
      'Has the fastest winds in the solar system — up to 2,100 km/h!',
      'Was discovered using math before it was even observed through a telescope',
      'The Great Dark Spot was a storm as large as Earth',
      'Its moon Triton orbits backwards and may be a captured object from the Kuiper Belt',
      'One year on Neptune = 165 Earth years',
    ],
    funFact:'Neptune has only completed one full orbit since its discovery in 1846!',
  },
]

// ── Galaxy & Hubble data ──────────────────────────────────────────────────────
const GALAXIES = [
  {
    id:'milky-way', name:'Milky Way', nickname:'Our Home Galaxy',
    type:'Barred Spiral Galaxy',
    thumb:'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/ESO-VLT-Laser-phot-33a-07.jpg/500px-ESO-VLT-Laser-phot-33a-07.jpg',
    thumbLg:'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/ESO-VLT-Laser-phot-33a-07.jpg/1280px-ESO-VLT-Laser-phot-33a-07.jpg',
    img:'https://upload.wikimedia.org/wikipedia/commons/4/43/ESO-VLT-Laser-phot-33a-07.jpg',
    color:'#90caf9',
    distance:'We are inside it', diameter:'~100,000 light-years',
    stars:'200–400 billion', constellation:'Sagittarius (core)', age:'~13.6 billion years',
    hubble:false,
    facts:[
      'We are located ~26,000 light-years from the galactic center',
      'The Milky Way is a barred spiral galaxy with 4 major spiral arms',
      'The supermassive black hole at its center is called Sagittarius A* — 4 million solar masses',
      'The Sun takes 225–250 million years to complete one orbit of the galaxy',
      'The Milky Way is part of a group of over 50 galaxies called the Local Group',
    ],
    funFact:'The Milky Way is on a collision course with the Andromeda Galaxy — they\'ll merge in ~4.5 billion years!',
  },
  {
    id:'andromeda', name:'Andromeda Galaxy', nickname:'Our Nearest Neighbor',
    type:'Barred Spiral Galaxy',
    thumb:'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Andromeda_Galaxy_2025.png/500px-Andromeda_Galaxy_2025.png',
    thumbLg:'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Andromeda_Galaxy_2025.png/1280px-Andromeda_Galaxy_2025.png',
    img:'https://upload.wikimedia.org/wikipedia/commons/0/05/Andromeda_Galaxy_2025.png',
    color:'#b39ddb',
    distance:'2.537 million light-years', diameter:'~220,000 light-years',
    stars:'~1 trillion', constellation:'Andromeda', age:'~10 billion years',
    hubble:true,
    facts:[
      'Largest galaxy in our Local Group — twice the size of the Milky Way',
      'Visible to the naked eye from a dark sky as a faint fuzzy patch',
      'Approaching us at ~110 km/s — it will collide with the Milky Way in ~4.5 billion years',
      'Contains approximately 1 trillion stars',
      'Has two satellite dwarf galaxies: M32 and M110',
    ],
    funFact:'When Andromeda collides with the Milky Way, the Sun is unlikely to hit another star — space is mostly empty!',
  },
  {
    id:'whirlpool', name:'Whirlpool Galaxy', nickname:'The Interacting Pair',
    type:'Grand Design Spiral Galaxy',
    thumb:'https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Messier51_sRGB.jpg/500px-Messier51_sRGB.jpg',
    thumbLg:'https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Messier51_sRGB.jpg/1280px-Messier51_sRGB.jpg',
    img:'https://upload.wikimedia.org/wikipedia/commons/d/db/Messier51_sRGB.jpg',
    color:'#80cbc4',
    distance:'23 million light-years', diameter:'~76,000 light-years',
    stars:'~160 billion', constellation:'Canes Venatici', age:'~400M years (interaction)',
    hubble:true,
    facts:[
      'Also known as M51 — catalogued by Charles Messier in 1773',
      'Actively interacting with its companion galaxy NGC 5195',
      'The collision is triggering massive bursts of new star formation',
      'One of the most photographed objects in astronomy',
      'The Hubble Space Telescope captured one of its most famous images in 2005',
    ],
    funFact:'The Whirlpool Galaxy\'s spiral arms were the first ever observed in any galaxy, back in 1845!',
  },
  {
    id:'sombrero', name:'Sombrero Galaxy', nickname:'The Cosmic Hat',
    type:'Spiral Galaxy',
    thumb:'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Sombrero_Galaxy_%28heic2506a%29.jpg/500px-Sombrero_Galaxy_%28heic2506a%29.jpg',
    thumbLg:'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Sombrero_Galaxy_%28heic2506a%29.jpg/1280px-Sombrero_Galaxy_%28heic2506a%29.jpg',
    img:'https://upload.wikimedia.org/wikipedia/commons/c/cc/Sombrero_Galaxy_%28heic2506a%29.jpg',
    color:'#f48fb1',
    distance:'28 million light-years', diameter:'~50,000 light-years',
    stars:'~100 billion', constellation:'Virgo', age:'~13 billion years',
    hubble:true,
    facts:[
      'Named for its resemblance to a Mexican sombrero hat',
      'Also known as Messier 104 or NGC 4594',
      'Features a bright bulge and a very prominent dark dust lane',
      'Its central black hole is 1 billion times the mass of our Sun',
      'The Hubble image of it is one of the most downloaded space telescope images ever',
    ],
    funFact:'The Sombrero Galaxy\'s central black hole is one of the most massive known — 1 billion solar masses!',
  },
  {
    id:'pinwheel', name:'Pinwheel Galaxy', nickname:'Face-On Spiral',
    type:'Grand Design Spiral Galaxy',
    thumb:'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/M101_hires_STScI-PRC2006-10a.jpg/500px-M101_hires_STScI-PRC2006-10a.jpg',
    thumbLg:'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/M101_hires_STScI-PRC2006-10a.jpg/1280px-M101_hires_STScI-PRC2006-10a.jpg',
    img:'https://upload.wikimedia.org/wikipedia/commons/c/c5/M101_hires_STScI-PRC2006-10a.jpg',
    color:'#80deea',
    distance:'21 million light-years', diameter:'~170,000 light-years',
    stars:'~1 trillion', constellation:'Ursa Major', age:'~13 billion years',
    hubble:true,
    facts:[
      'Also known as M101 or NGC 5457',
      'Nearly twice the diameter of our Milky Way galaxy',
      'Viewed nearly face-on, making it ideal for studying spiral structure',
      'Contains very bright HII regions with ongoing massive star formation',
      'NASA\'s 2006 Hubble mosaic was composed of 51 separate images',
    ],
    funFact:'The Pinwheel Galaxy is almost exactly face-on to us — giving astronomers a perfect top-down view!',
  },
  {
    id:'cartwheel', name:'Cartwheel Galaxy', nickname:'The Ring Galaxy',
    type:'Ring Galaxy',
    thumb:'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Cartwheel_Galaxy_JWST_NIRCam%2BMIRI_Full_Res.png/500px-Cartwheel_Galaxy_JWST_NIRCam%2BMIRI_Full_Res.png',
    thumbLg:'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Cartwheel_Galaxy_JWST_NIRCam%2BMIRI_Full_Res.png/1280px-Cartwheel_Galaxy_JWST_NIRCam%2BMIRI_Full_Res.png',
    img:'https://upload.wikimedia.org/wikipedia/commons/f/f0/Cartwheel_Galaxy_JWST_NIRCam%2BMIRI_Full_Res.png',
    color:'#ffcc80',
    distance:'500 million light-years', diameter:'~150,000 light-years',
    stars:'Several billion', constellation:'Sculptor', age:'Impact ~200M years ago',
    hubble:true,
    facts:[
      'Formed when a smaller galaxy passed directly through a larger spiral galaxy',
      'The collision sent a shockwave outward, creating the distinctive ring of star birth',
      'The outer ring is expanding at roughly 200,000 mph',
      'The James Webb Space Telescope captured a stunning new infrared image in 2022',
      'It is one of the most dramatic galaxy collisions visible from Earth',
    ],
    funFact:'The Cartwheel Galaxy\'s expanding ring is producing millions of new stars as it spreads outward!',
  },
  {
    id:'pillars', name:'Pillars of Creation', nickname:'Stellar Nursery',
    type:'Nebula (Eagle Nebula / M16)',
    thumb:'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Eagle_nebula_pillars.jpg/500px-Eagle_nebula_pillars.jpg',
    thumbLg:'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Eagle_nebula_pillars.jpg/1280px-Eagle_nebula_pillars.jpg',
    img:'https://upload.wikimedia.org/wikipedia/commons/b/b2/Eagle_nebula_pillars.jpg',
    color:'#ce93d8',
    distance:'6,500–7,000 light-years', diameter:'Tallest pillar ~4 light-years high',
    stars:'Thousands being born', constellation:'Serpens', age:'~2 million years',
    hubble:true,
    facts:[
      'One of the most iconic photos ever taken by the Hubble Space Telescope (1995)',
      'These towering columns of gas and dust are active star-forming regions',
      'The pillars are slowly being eroded by intense UV radiation from nearby hot stars',
      'Hubble re-photographed them in 2014 at far higher resolution',
      'The James Webb Space Telescope revealed hidden stars inside in 2022',
    ],
    funFact:'The Pillars of Creation may already be destroyed — the light we see left them 7,000 years ago!',
  },
  {
    id:'deep-field', name:'Hubble Deep Field', nickname:'The Universe in a Pinpoint',
    type:'Ultra-Deep Space Image',
    thumb:'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/HubbleDeepField.800px.jpg/500px-HubbleDeepField.800px.jpg',
    thumbLg:'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/HubbleDeepField.800px.jpg/1280px-HubbleDeepField.800px.jpg',
    img:'https://upload.wikimedia.org/wikipedia/commons/5/5f/HubbleDeepField.800px.jpg',
    color:'#ffe082',
    distance:'Billions of light-years', diameter:'2.6 arcminutes of sky',
    stars:'~3,000 galaxies visible', constellation:'Ursa Major', age:'Galaxies from 800M years after Big Bang',
    hubble:true,
    facts:[
      'Created by pointing Hubble at an apparently "empty" patch of sky for 10 days in 1995',
      'Revealed nearly 3,000 entire galaxies — the universe is full of them',
      'Each spot of light is an entire galaxy containing billions of stars',
      'One of the most important images in the history of astronomy',
      'The Hubble Ultra Deep Field (2004) reached galaxies from just 800M years after the Big Bang',
    ],
    funFact:'That tiny patch of sky is the size of a tennis ball held 100 metres away — yet contains thousands of galaxies!',
  },
  {
    id:'ngc1300', name:'NGC 1300', nickname:'The Classic Barred Spiral',
    type:'Barred Spiral Galaxy',
    thumb:'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Hubble2005-01-barred-spiral-galaxy-NGC1300.jpg/500px-Hubble2005-01-barred-spiral-galaxy-NGC1300.jpg',
    thumbLg:'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Hubble2005-01-barred-spiral-galaxy-NGC1300.jpg/1280px-Hubble2005-01-barred-spiral-galaxy-NGC1300.jpg',
    img:'https://upload.wikimedia.org/wikipedia/commons/5/52/Hubble2005-01-barred-spiral-galaxy-NGC1300.jpg',
    color:'#a5d6a7',
    distance:'61 million light-years', diameter:'~110,000 light-years',
    stars:'Several hundred billion', constellation:'Eridanus', age:'~10–12 billion years',
    hubble:true,
    facts:[
      'Considered a prototype "grand design" barred spiral galaxy',
      'Its bar does not connect to a ring — unusual among barred spirals',
      'Blue spiral arms show active regions of massive young star formation',
      'At its very center is a tiny spiral just 3,300 light-years across',
      'The Hubble portrait of NGC 1300 is one of the largest, clearest galaxy images ever made',
    ],
    funFact:'NGC 1300 hides a tiny "grand design" spiral at its very center — a galaxy within a galaxy!',
  },
  {
    id:'triangulum', name:'Triangulum Galaxy', nickname:'The Third Musketeer',
    type:'Spiral Galaxy',
    thumb:'https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/VST_snaps_a_very_detailed_view_of_the_Triangulum_Galaxy.jpg/500px-VST_snaps_a_very_detailed_view_of_the_Triangulum_Galaxy.jpg',
    thumbLg:'https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/VST_snaps_a_very_detailed_view_of_the_Triangulum_Galaxy.jpg/1280px-VST_snaps_a_very_detailed_view_of_the_Triangulum_Galaxy.jpg',
    img:'https://upload.wikimedia.org/wikipedia/commons/6/64/VST_snaps_a_very_detailed_view_of_the_Triangulum_Galaxy.jpg',
    color:'#ef9a9a',
    distance:'2.73 million light-years', diameter:'~60,000 light-years',
    stars:'~40 billion', constellation:'Triangulum', age:'~13 billion years',
    hubble:true,
    facts:[
      'Third largest galaxy in our Local Group, after the Milky Way and Andromeda',
      'Also known as M33 or NGC 598',
      'One of the most distant objects visible to the naked eye under perfect dark skies',
      'Gravitationally linked to Andromeda and may orbit it as a satellite',
      'Contains NGC 604 — a star-forming region 40× larger than the Orion Nebula',
    ],
    funFact:'The Triangulum Galaxy is the most distant object a human eye can see without any telescope!',
  },
]

// ── Observable Universe data ──────────────────────────────────────────────────
const UNIVERSE_ITEMS = [
  {
    id:'observable-universe', name:'The Observable Universe', nickname:'Everything We Can See',
    type:'Observable Universe',
    thumb:'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Observable_Universe_with_Measurements_01.png/500px-Observable_Universe_with_Measurements_01.png',
    thumbLg:'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Observable_Universe_with_Measurements_01.png/1280px-Observable_Universe_with_Measurements_01.png',
    img:'https://upload.wikimedia.org/wikipedia/commons/9/98/Observable_Universe_with_Measurements_01.png',
    color:'#82b1ff',
    distance:'46.5 billion light-years (radius)', diameter:'93 billion light-years across',
    stars:'~1 septillion (10²⁴)', constellation:'All of them', age:'~13.8 billion years',
    hubble:false,
    facts:[
      'The observable universe is a sphere ~93 billion light-years in diameter centred on Earth',
      'It contains an estimated 2 trillion galaxies — 10× more than scientists thought before 2016',
      'The universe is 13.8 billion years old, but is far larger because space itself has expanded',
      'Light from the edge of the observable universe has been travelling since 380,000 years after the Big Bang',
      'The universe is not the same as the total universe — we can only see as far as light has had time to reach us',
    ],
    funFact:'The total universe may be 250 times larger than the observable part — or even infinite!',
  },
  {
    id:'cmb', name:'Cosmic Microwave Background', nickname:'The Afterglow of the Big Bang',
    type:'Electromagnetic Radiation Map',
    thumb:'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Cosmic_Microwave_Background_%28CMB%29.jpeg/500px-Cosmic_Microwave_Background_%28CMB%29.jpeg',
    thumbLg:'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Cosmic_Microwave_Background_%28CMB%29.jpeg/1280px-Cosmic_Microwave_Background_%28CMB%29.jpeg',
    img:'https://upload.wikimedia.org/wikipedia/commons/0/04/Cosmic_Microwave_Background_%28CMB%29.jpeg',
    color:'#ffab40',
    distance:'46.5 billion light-years', diameter:'The full sky',
    stars:'N/A (pre-dates stars)', constellation:'The entire sky', age:'380,000 years after Big Bang',
    hubble:false,
    facts:[
      'The CMB is ancient light — the oldest light in the universe, emitted just 380,000 years after the Big Bang',
      'It is detected as faint microwave radiation coming equally from every direction in the sky',
      'The temperature variations (just 0.00001°C) reveal the seeds that grew into today\'s galaxies and clusters',
      'First accidentally discovered in 1965 by Penzias and Wilson, earning them the Nobel Prize',
      'NASA\'s WMAP and ESA\'s Planck satellites mapped it in extraordinary detail',
    ],
    funFact:'Your microwave oven uses the same frequency of radiation as the Cosmic Microwave Background!',
  },
  {
    id:'ultra-deep-field', name:'Hubble Ultra Deep Field', nickname:'The Deepest View Ever',
    type:'Ultra-Deep Hubble Image',
    thumb:'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Hubble_ultra_deep_field_high_rez_edit1.jpg/500px-Hubble_ultra_deep_field_high_rez_edit1.jpg',
    thumbLg:'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Hubble_ultra_deep_field_high_rez_edit1.jpg/1280px-Hubble_ultra_deep_field_high_rez_edit1.jpg',
    img:'https://upload.wikimedia.org/wikipedia/commons/0/0d/Hubble_ultra_deep_field_high_rez_edit1.jpg',
    color:'#ffe082',
    distance:'Galaxies from 13+ billion light-years away', diameter:'Covers 3.1 arcminutes of sky',
    stars:'~10,000 galaxies visible', constellation:'Fornax', age:'Galaxies as old as 400–800M years after Big Bang',
    hubble:true,
    facts:[
      'Created by pointing Hubble at a tiny patch of apparently empty sky for 11.3 days in 2003–2004',
      'Revealed nearly 10,000 galaxies in a speck of sky — the most detailed view of the early universe',
      'Some galaxies shown are seen as they were only 400–800 million years after the Big Bang',
      'The patch of sky is equivalent to a 1mm × 1mm square held 1 metre from your eye',
      'The James Webb Space Telescope\'s JWST Deep Field (2022) went even deeper and further back in time',
    ],
    funFact:'If you covered the entire night sky with Ultra Deep Field images, you\'d find 100–200 billion galaxies!',
  },
  {
    id:'laniakea', name:'Laniakea Supercluster', nickname:'Our Cosmic Home',
    type:'Galactic Supercluster',
    thumb:'https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/07-Laniakea_%28LofE07240%29.png/500px-07-Laniakea_%28LofE07240%29.png',
    thumbLg:'https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/07-Laniakea_%28LofE07240%29.png/1280px-07-Laniakea_%28LofE07240%29.png',
    img:'https://upload.wikimedia.org/wikipedia/commons/8/81/07-Laniakea_%28LofE07240%29.png',
    color:'#80cbc4',
    distance:'250 million light-years across', diameter:'520 million light-years',
    stars:'Hundreds of trillions', constellation:'Spans many constellations', age:'~13.8 billion years',
    hubble:false,
    facts:[
      'Laniakea means "immeasurable heaven" in Hawaiian — named by discoverer Brent Tully in 2014',
      'The Milky Way is a tiny speck on the outer edge of this vast supercluster',
      'It contains 100,000 large galaxies and has the mass of 100 quadrillion Suns',
      'Everything within Laniakea flows gravitationally toward the Great Attractor — a mysterious dense region',
      'Laniakea is itself just one of millions of superclusters in the observable universe',
    ],
    funFact:'Our "home address" in the universe: Earth → Solar System → Milky Way → Local Group → Virgo Cluster → Laniakea!',
  },
  {
    id:'cosmic-web', name:'The Cosmic Web', nickname:'The Skeleton of the Universe',
    type:'Large-Scale Structure',
    thumb:'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/WMAP_2012.png/500px-WMAP_2012.png',
    thumbLg:'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/WMAP_2012.png/1280px-WMAP_2012.png',
    img:'https://upload.wikimedia.org/wikipedia/commons/e/ed/WMAP_2012.png',
    color:'#b39ddb',
    distance:'Spans the entire observable universe', diameter:'93 billion light-years',
    stars:'All stars in the universe', constellation:'All constellations', age:'~13.8 billion years',
    hubble:false,
    facts:[
      'The cosmic web is the largest known structure in the universe — a vast network of filaments and voids',
      'Galaxies cluster along the filaments like beads on a string, while vast empty voids separate them',
      'The web formed from tiny density fluctuations in the early universe amplified by dark matter and gravity',
      'Simulations like the Millennium Simulation reproduce the cosmic web from basic physics alone',
      'Dark matter forms the scaffolding of the cosmic web — ordinary matter clumps along it',
    ],
    funFact:'Strikingly, the cosmic web looks almost identical to the neural networks in a human brain!',
  },
]

// ── Black Holes ────────────────────────────────────────────────────────────────
const BLACK_HOLES = [
  {
    id:'m87-bh', name:'M87* Black Hole', nickname:'The First Ever Photographed',
    type:'Supermassive Black Hole',
    thumb:'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Black_hole_-_Messier_87_crop_max_res.jpg/500px-Black_hole_-_Messier_87_crop_max_res.jpg',
    thumbLg:'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Black_hole_-_Messier_87_crop_max_res.jpg/1280px-Black_hole_-_Messier_87_crop_max_res.jpg',
    img:'https://upload.wikimedia.org/wikipedia/commons/4/4f/Black_hole_-_Messier_87_crop_max_res.jpg',
    color:'#ffab40',
    distance:'55 million light-years', diameter:'Event horizon ~38 billion km',
    stars:'6.5 billion solar masses', constellation:'Virgo', age:'Ancient — billions of years',
    hubble:false,
    facts:[
      'This is the FIRST black hole ever photographed — the historic image was released in April 2019',
      'Captured by the Event Horizon Telescope: 8 radio telescopes around the world working as one Earth-sized telescope',
      'It weighs as much as 6.5 billion Suns',
      'The glowing orange ring is superheated gas swirling around the event horizon at near light-speed',
      'The dark centre is the black hole\'s "shadow" — the point of no return for light itself',
    ],
    funFact:'The photo took 2 years to process and needed half a tonne of hard drives to store all the data!',
  },
  {
    id:'sgr-a', name:'Sagittarius A*', nickname:'Our Own Black Hole',
    type:'Supermassive Black Hole',
    thumb:'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/EHT_Saggitarius_A_black_hole.tif/lossy-page1-500px-EHT_Saggitarius_A_black_hole.tif.jpg',
    thumbLg:'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/EHT_Saggitarius_A_black_hole.tif/lossy-page1-1280px-EHT_Saggitarius_A_black_hole.tif.jpg',
    img:'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/EHT_Saggitarius_A_black_hole.tif/lossy-page1-3840px-EHT_Saggitarius_A_black_hole.tif.jpg',
    color:'#ff7043',
    distance:'26,000 light-years', diameter:'Event horizon ~24 million km',
    stars:'4.15 million solar masses', constellation:'Sagittarius', age:'~13 billion years',
    hubble:false,
    facts:[
      'This is the supermassive black hole at the centre of OUR galaxy, the Milky Way',
      'Photographed by the Event Horizon Telescope in 2022 — the second black hole ever imaged',
      'It weighs about 4.15 million times more than our Sun',
      'Stars near it orbit at up to 24,000 km per second — the fastest-moving stars known',
      'Two astronomers won the 2020 Nobel Prize for proving it exists by tracking those stars',
    ],
    funFact:'Don\'t worry — at 26,000 light-years away, it\'s far too distant to ever pull Earth in!',
  },
  {
    id:'cygnus-x1', name:'Cygnus X-1', nickname:'The First Black Hole Discovered',
    type:'Stellar-Mass Black Hole',
    thumb:'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Black_hole_Cygnus_X-1.jpg/500px-Black_hole_Cygnus_X-1.jpg',
    thumbLg:'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Black_hole_Cygnus_X-1.jpg/1280px-Black_hole_Cygnus_X-1.jpg',
    img:'https://upload.wikimedia.org/wikipedia/commons/9/98/Black_hole_Cygnus_X-1.jpg',
    color:'#4fc3f7',
    distance:'7,200 light-years', diameter:'Event horizon ~124 km',
    stars:'21 solar masses', constellation:'Cygnus', age:'~5 million years',
    hubble:false,
    facts:[
      'The first object widely accepted to be a black hole — discovered in 1964',
      'It formed when a giant star collapsed at the end of its life',
      'It\'s stealing gas from a blue supergiant companion star orbiting right next to it (shown in this artist\'s illustration)',
      'The stolen gas heats to millions of degrees and blasts out X-rays we can detect from Earth',
      'Famous physicist Stephen Hawking bet it was NOT a black hole — and happily lost the bet in 1990',
    ],
    funFact:'Cygnus X-1 spins about 800 times per second — one of the fastest-spinning black holes known!',
  },
  {
    id:'ton-618', name:'TON 618', nickname:'The Ultramassive Monster',
    type:'Ultramassive Black Hole / Quasar',
    thumb:'https://upload.wikimedia.org/wikipedia/commons/e/e1/TON_618_SDSS9_version_3.jpg',
    thumbLg:'https://upload.wikimedia.org/wikipedia/commons/e/e1/TON_618_SDSS9_version_3.jpg',
    img:'https://upload.wikimedia.org/wikipedia/commons/e/e1/TON_618_SDSS9_version_3.jpg',
    color:'#ce93d8',
    distance:'18.2 billion light-years', diameter:'Event horizon ~390 billion km',
    stars:'~40 billion solar masses', constellation:'Canes Venatici', age:'Over 10 billion years',
    hubble:false,
    facts:[
      'One of the most massive black holes ever found — about 40 BILLION solar masses',
      'Its event horizon is so big that our entire solar system would be a tiny dot inside it',
      'It powers a quasar — a beam of light 140 trillion times brighter than the Sun',
      'Light takes about 3 weeks just to cross its event horizon',
      'It\'s so far away that the light we see left it before Earth even existed',
    ],
    funFact:'TON 618 is so enormous that 1,000 of our Milky Way\'s central black holes (Sgr A*) would fit inside it — with room to spare!',
  },
]

// ── James Webb Space Telescope images ──────────────────────────────────────────
const JWST_ITEMS = [
  {
    id:'webb-deep', name:'Webb\'s First Deep Field', nickname:'The Deepest Infrared View Ever',
    type:'Galaxy Cluster SMACS 0723', chip:'🛰️ JWST',
    thumb:'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Webb%27s_First_Deep_Field.jpg/500px-Webb%27s_First_Deep_Field.jpg',
    thumbLg:'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Webb%27s_First_Deep_Field.jpg/1280px-Webb%27s_First_Deep_Field.jpg',
    img:'https://upload.wikimedia.org/wikipedia/commons/b/bf/Webb%27s_First_Deep_Field.jpg',
    color:'#ffcc80',
    distance:'4.6 billion light-years (cluster)', diameter:'A patch of sky the size of a sand grain at arm\'s length',
    stars:'Thousands of galaxies', constellation:'Volans', age:'Some galaxies over 13 billion years old',
    facts:[
      'The very first science image released from the James Webb Space Telescope, unveiled in July 2022',
      'The galaxy cluster\'s gravity bends light like a lens, magnifying galaxies far behind it',
      'Some galaxies here appear as they were over 13 billion years ago — near the dawn of the universe',
      'This entire field covers a patch of sky the size of a grain of sand held at arm\'s length',
      'Webb captured in hours what took Hubble weeks — its mirror is 6 times larger',
    ],
    funFact:'The curved orange streaks are real galaxies stretched by gravity — Einstein predicted this "lensing" a century before Webb photographed it!',
  },
  {
    id:'cosmic-cliffs', name:'Cosmic Cliffs', nickname:'Mountains of Starbirth',
    type:'Carina Nebula (NGC 3324)', chip:'🛰️ JWST',
    thumb:'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/NASA%E2%80%99s_Webb_Reveals_Cosmic_Cliffs%2C_Glittering_Landscape_of_Star_Birth.jpg/500px-NASA%E2%80%99s_Webb_Reveals_Cosmic_Cliffs%2C_Glittering_Landscape_of_Star_Birth.jpg',
    thumbLg:'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/NASA%E2%80%99s_Webb_Reveals_Cosmic_Cliffs%2C_Glittering_Landscape_of_Star_Birth.jpg/1280px-NASA%E2%80%99s_Webb_Reveals_Cosmic_Cliffs%2C_Glittering_Landscape_of_Star_Birth.jpg',
    img:'https://upload.wikimedia.org/wikipedia/commons/4/44/NASA%E2%80%99s_Webb_Reveals_Cosmic_Cliffs%2C_Glittering_Landscape_of_Star_Birth.jpg',
    color:'#ffb74d',
    distance:'7,600 light-years', diameter:'The tallest "cliffs" are ~7 light-years high',
    stars:'Hundreds of newborn stars', constellation:'Carina', age:'Stars just 1–2 million years old',
    facts:[
      'What looks like mountains at sunset is actually the glowing edge of a giant gas cavity in the Carina Nebula',
      'The "cliffs" are being carved by scorching ultraviolet radiation from massive young stars above them',
      'Webb\'s infrared vision reveals hundreds of baby stars completely hidden from normal telescopes',
      'The tallest peaks in this image are about 7 light-years high — 65 trillion kilometres',
      'The "steam" rising from the cliffs is hot gas escaping the nebula under intense radiation',
    ],
    funFact:'Some of the baby stars here shoot out jets of gas millions of kilometres long — cosmic sneezes from stars younger than humanity\'s oldest cave paintings are old!',
  },
  {
    id:'southern-ring', name:'Southern Ring Nebula', nickname:'A Dying Star\'s Last Dance',
    type:'Planetary Nebula (NGC 3132)', chip:'🛰️ JWST',
    thumb:'https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Southern_Ring_Nebula_%28NIRCam_Image%29.png/500px-Southern_Ring_Nebula_%28NIRCam_Image%29.png',
    thumbLg:'https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Southern_Ring_Nebula_%28NIRCam_Image%29.png/1280px-Southern_Ring_Nebula_%28NIRCam_Image%29.png',
    img:'https://upload.wikimedia.org/wikipedia/commons/2/29/Southern_Ring_Nebula_%28NIRCam_Image%29.png',
    color:'#80deea',
    distance:'2,500 light-years', diameter:'~0.5 light-years across',
    stars:'Two stars at the centre', constellation:'Vela', age:'Shells expanding for ~10,000 years',
    facts:[
      'These glowing shells are layers of gas puffed off by a dying star over thousands of years',
      'Webb revealed there are actually TWO stars at the centre, orbiting each other',
      'The dimmer star is a white dwarf — the leftover core of a star that ran out of fuel',
      'Our own Sun will create a nebula like this in about 5 billion years',
      'The expanding gas shells travel outward at about 15 km every second',
    ],
    funFact:'This is a preview of our Sun\'s far future — but don\'t worry, it has 5 billion years of fuel left in the tank!',
  },
  {
    id:'stephans-quintet', name:'Stephan\'s Quintet', nickname:'The Galactic Dance',
    type:'Compact Galaxy Group', chip:'🛰️ JWST',
    thumb:'https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Sonify7_stephansquintet.jpg/500px-Sonify7_stephansquintet.jpg',
    thumbLg:'https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Sonify7_stephansquintet.jpg/1280px-Sonify7_stephansquintet.jpg',
    img:'https://upload.wikimedia.org/wikipedia/commons/d/db/Sonify7_stephansquintet.jpg',
    color:'#b39ddb',
    distance:'290 million light-years (4 of 5)', diameter:'Group spans ~500,000 light-years',
    stars:'5 galaxies, trillions of stars', constellation:'Pegasus', age:'Colliding for millions of years',
    facts:[
      'Five galaxies locked in a cosmic dance — four of them are slowly colliding with each other',
      'Webb\'s mosaic of this group is built from almost 1,000 separate image files',
      'One galaxy is a photobomber — it\'s 250 million light-years closer than the other four',
      'Shockwaves from the collisions heat gas to millions of degrees, triggering bursts of new stars',
      'This group was discovered in 1877 — Webb finally showed it in dazzling infrared detail',
    ],
    funFact:'Stephan\'s Quintet appears in the classic film "It\'s a Wonderful Life" — as the place where the angels have their meeting!',
  },
]

// ── The Multiverse ─────────────────────────────────────────────────────────────
// These are IDEAS, not photographed objects — so the cards use portal art, never
// a photo. `real` (0-100) drives the "Is it real?" meter and keeps kids honest
// about which of these scientists actually take seriously.
const MULTIVERSE = [
  {
    id:'bubbles', emoji:'🫧', name:'Bubble Universes', nickname:'The Foamy Multiverse',
    type:'Eternal Inflation', color:'#64b5f6', real:60,
    realLabel:'Quite likely — lots of scientists take this one seriously',
    imagine:'Imagine blowing bubbles in the bath. Each bubble is a whole universe — and ours is just one little bubble floating in a giant foam!',
    facts:[
      'Right after the Big Bang, space stretched faster than anything you can imagine — that is called inflation',
      'Some scientists think the stretching never stopped, and it keeps blowing new bubbles',
      'Each bubble grows into its own universe, with its own space and its own time',
      'The bubbles rush apart so fast that they can never bump into each other',
      'Our entire universe would be just one tiny bubble in an endless foam',
    ],
    visit:'No — the bubbles fly apart faster than light can travel, so no rocket could ever catch one.',
    funFact:'If bubble universes are real, brand-new ones might be popping into existence right now — far too fast to ever count!',
  },
  {
    id:'many-worlds', emoji:'🌿', name:'Many Worlds', nickname:'Every Choice Grows a New World',
    type:'Quantum Many-Worlds', color:'#81c784', real:45,
    realLabel:'Possible — but scientists argue about this one a lot',
    imagine:'Imagine you pick chocolate ice cream. In another world, that you picked strawberry! Every choice grows a new branch, like a giant tree.',
    facts:[
      'Tiny particles can do two things at once — scientists have really watched this happen',
      'One idea says the universe splits so that BOTH things happen, in two different worlds',
      'A student named Hugh Everett thought this up in 1957, and almost nobody believed him',
      'It would mean there are copies of you doing all the things you decided not to do',
      'The worlds cannot talk to each other, so you would never feel the split',
    ],
    visit:'No — the branches separate completely, so there is no door from one to the other.',
    funFact:'If Many Worlds is true, somewhere out there is a you who became an astronaut and is walking on Mars right now!',
  },
  {
    id:'branes', emoji:'🍞', name:'Universes Side by Side', nickname:'Slices of Cosmic Bread',
    type:'Brane Worlds', color:'#ba68c8', real:35,
    realLabel:'A big maybe — very hard to test',
    imagine:'Imagine a loaf of sliced bread. Each slice is a whole universe, sitting right beside ours — closer than your own shadow!',
    facts:[
      'Some scientists think space has extra hidden directions that we cannot see or point at',
      'Our universe might be one flat sheet floating inside a much bigger space',
      'Other sheets could be right next to us, but light cannot cross between them',
      'Gravity might be the only thing that can leak from one sheet to another',
      'That could explain why gravity feels so weak — a fridge magnet beats the whole Earth!',
    ],
    visit:'Not by rocket — you cannot fly there, because "there" is in a direction nobody can point at.',
    funFact:'Another universe could be less than a millimetre away from the tip of your nose — and you would never know!',
  },
  {
    id:'babies', emoji:'🕳️', name:'Baby Universes', nickname:'Born Inside Black Holes',
    type:'Black Hole Cosmology', color:'#ff8a65', real:30,
    realLabel:'A long shot — fun to think about',
    imagine:'Imagine every black hole is an egg. Squeeze enough stuff inside, and a brand-new baby universe hatches out the other side!',
    facts:[
      'Black holes squash matter into an unbelievably tiny space',
      'Some scientists wonder if that squashed matter bounces and blossoms into a new universe',
      'If so, our universe might have been born inside a black hole in somebody else\'s universe',
      'Each new baby universe would grow up with slightly different rules',
      'Nobody can see inside a black hole, which makes this idea very hard to check',
    ],
    visit:'Definitely not — falling into a black hole is a one-way trip, and nothing ever comes back out.',
    funFact:'Our galaxy holds millions of black holes. If this idea is right, that is millions of baby universes!',
  },
  {
    id:'repeat', emoji:'🔁', name:'The Repeating Universe', nickname:'A Copy of You, Far Far Away',
    type:'Infinite Space', color:'#4dd0e1', real:50,
    realLabel:'Maybe! It follows from ideas we already trust',
    imagine:'Shuffle a deck of cards long enough and the same order comes up again. If space goes on forever, the same YOU comes up again too!',
    facts:[
      'There are only so many ways to arrange the tiny bits that make up a person',
      'If space truly never ends, every arrangement has to appear again somewhere',
      'That means there could be another Earth out there, exactly like ours',
      'Your copy would be so far away that its light will never, ever reach us',
      'This one needs no magic at all — just ordinary physics and endless space',
    ],
    visit:'No — your copy sits far beyond the edge of everything we can ever see.',
    funFact:'Scientists guess your nearest exact copy is so far away that writing the distance down would take more zeros than there are atoms in your body!',
  },
  {
    id:'rules', emoji:'🎛️', name:'Different Rules Universes', nickname:'Where Physics Works Differently',
    type:'Different Constants', color:'#ffd54f', real:40,
    realLabel:'Possible — it would explain a real puzzle',
    imagine:'Imagine a universe where gravity is enormously strong, so everything is squished flat. Or one so weak that stars never switch on at all!',
    facts:[
      'Our universe has "settings" — how strong gravity is, how heavy each particle is',
      'If those settings were even a tiny bit different, stars and planets could not exist',
      'Some scientists think other universes got all the other settings',
      'Most of them would be dark and empty, with no stars and nobody to look at them',
      'We live in one that works — because we could not live in one that does not!',
    ],
    visit:'No — and you would not want to. In almost all of them you could not survive a single second.',
    funFact:'If gravity were just a little bit stronger, the whole universe would have crunched back together long before Earth was born.',
  },
  {
    id:'bounce', emoji:'⏪', name:'The Bouncing Universe', nickname:'The Universe Before Ours',
    type:'Big Bounce', color:'#f06292', real:35,
    realLabel:'A big maybe — scientists are still searching for clues',
    imagine:'Imagine a bouncy ball. It squashes all the way down, then springs straight back up. The universe might do that too — over and over, forever!',
    facts:[
      'Most scientists agree our universe began with the Big Bang, 13.8 billion years ago',
      'But some wonder what — if anything — happened before that',
      'The Big Bounce idea says an older universe shrank down and bounced into ours',
      'Universes would come one after another, like beads threaded on a string',
      'There could have been countless universes before this one',
    ],
    visit:'No — that universe is in the past, and nobody has ever built a time machine.',
    funFact:'If the Big Bounce is real, our Big Bang was not a beginning at all — it was somebody else\'s ending!',
  },
  {
    id:'simulation', emoji:'🖥️', name:'The Simulated Universe', nickname:'Is Everything a Giant Computer Game?',
    type:'Simulation Idea', color:'#90a4ae', real:20,
    realLabel:'Just a what-if — this one is not really science yet',
    imagine:'Imagine the whole universe is a super-advanced video game, and we are the characters inside it. Would we even be able to tell?',
    facts:[
      'Computers can already build worlds that look astonishingly real',
      'Some people wonder whether a very advanced civilisation could simulate a whole universe',
      'A few scientists hunt for "glitches" — tiny clues that space is made of pixels',
      'So far nobody has found a single glitch anywhere',
      'Most scientists say this is a fun question, not a proper theory',
    ],
    visit:'You would already be there! But there would be no way to walk out of the game.',
    funFact:'This is the least scientific idea on this page — it is really a big "what if?" rather than a real theory.',
  },
]

// ── Space Facts for Kids ───────────────────────────────────────────────────────
const SPACE_FACTS = [
  {
    id:'sun-size', emoji:'☀️', category:'scale', color:'#ffd740',
    title:'The Sun Could Swallow 1.3 Million Earths',
    body:'The Sun is so enormous that 1.3 million planet Earths could fit inside it. It contains 99.86% of all the mass in our entire solar system — everything else is just a tiny fraction!',
    wow:'Imagine filling a football stadium with 1.3 million grapes — that\'s how many Earths fit inside the Sun!',
  },
  {
    id:'light-speed', emoji:'⚡', category:'time', color:'#ffeb3b',
    title:'Sunlight Takes 8 Minutes to Reach Us',
    body:'Light travels at 300,000 km every second — so fast it could circle Earth 7.5 times in just one second! But the Sun is so far away that even light takes 8 minutes 20 seconds to arrive.',
    wow:'If the Sun suddenly disappeared, we wouldn\'t know about it for over 8 minutes — the sky would still be bright!',
  },
  {
    id:'stardust', emoji:'✨', category:'universe', color:'#ce93d8',
    title:'You Are Literally Made of Stardust!',
    body:'Almost every atom in your body — the carbon in your skin, the iron in your blood, the calcium in your bones — was forged inside a dying star billions of years ago. When that star exploded, it scattered atoms into space.',
    wow:'You are a child of the stars! Every time you look up at the night sky, you\'re looking at your ancient relatives.',
  },
  {
    id:'universe-age', emoji:'⏰', category:'time', color:'#82b1ff',
    title:'The Universe is 13.8 Billion Years Old',
    body:'The universe began with the Big Bang 13.8 billion years ago. Our Solar System only formed 4.6 billion years ago. Modern humans only appeared just 300,000 years ago — a tiny blip in cosmic history!',
    wow:'If all of time were squeezed into one year, humans only appeared in the last 10 seconds of December 31st!',
  },
  {
    id:'stars-count', emoji:'⭐', category:'scale', color:'#ffe082',
    title:'More Stars Than Grains of Sand on Earth',
    body:'The observable universe has an estimated 1 septillion stars — that\'s a 1 followed by 24 zeros! Scientists believe this is more than all the grains of sand on every beach on Earth combined.',
    wow:'Every grain of sand on every beach represents about 10,000 stars — and there are 2 trillion galaxies, each with billions more!',
  },
  {
    id:'saturn-float', emoji:'🪐', category:'planets', color:'#f0d080',
    title:'Saturn Would Float on Water!',
    body:'Saturn is made mostly of gases like hydrogen and helium, making it the least dense planet in our solar system. It\'s so light for its size that it would actually float if placed in a giant enough ocean!',
    wow:'Saturn is the only planet in our solar system that is less dense than water — it\'s like a giant, gorgeous balloon!',
  },
  {
    id:'silent-space', emoji:'🤫', category:'space', color:'#80deea',
    title:'Space is Completely and Totally Silent',
    body:'Sound needs air (or some material) to travel through. Since space is almost completely empty, there is absolutely no sound. Giant star explosions, galaxies colliding — all completely, eerily silent!',
    wow:'The biggest explosions in the universe happen in total silence. A supernova — billions of times brighter than the Sun — produces no sound at all!',
  },
  {
    id:'venus-day', emoji:'🌍', category:'planets', color:'#e8c94c',
    title:'A Day on Venus Lasts Longer Than Its Year',
    body:'Venus spins so slowly that one full rotation (one "day") takes 243 Earth days. But Venus completes its orbit around the Sun in just 225 Earth days — so its day is actually longer than its year!',
    wow:'On Venus, the Sun rises in the WEST and sets in the EAST because Venus spins backwards compared to most other planets!',
  },
  {
    id:'black-holes', emoji:'🕳️', category:'universe', color:'#b39ddb',
    title:'Black Holes Are Invisible But Incredibly Powerful',
    body:'A black hole has gravity so strong that nothing — not even light — can escape. This is why they\'re invisible! Scientists detect them by watching nearby stars being flung around at incredible speeds.',
    wow:'The black hole at the centre of the Milky Way — Sagittarius A* — is 4 million times heavier than our Sun. It\'s sitting right in our own galaxy!',
  },
  {
    id:'neptune-wind', emoji:'🌪️', category:'planets', color:'#3d7ebf',
    title:'Neptune Has the Fastest Winds in the Solar System',
    body:'Winds on Neptune can reach 2,100 km per hour — that\'s faster than the speed of sound on Earth! The most powerful hurricane ever recorded on Earth only reached about 305 km/h.',
    wow:'A Neptune wind would make the world\'s fastest jet aircraft look like it\'s standing still. Imagine a storm 7× faster than any storm on Earth!',
  },
  {
    id:'andromeda-crash', emoji:'💫', category:'universe', color:'#90caf9',
    title:'Our Galaxy is Going to Crash into Andromeda!',
    body:'The Andromeda Galaxy is heading straight toward the Milky Way at 110 km per second. In about 4.5 billion years, the two galaxies will slowly merge into one giant new galaxy.',
    wow:'Don\'t panic! Galaxies are so spread out that almost no stars will actually collide — it\'s like two swarms of fireflies flying through each other!',
  },
  {
    id:'moon-footprints', emoji:'👟', category:'space', color:'#90a4ae',
    title:'Moon Footprints Have Lasted Over 55 Years',
    body:'The Moon has no wind, no rain, and almost no atmosphere — so nothing wears things away. The footprints left by Apollo 11 astronauts in 1969 are still there today, perfectly preserved in the dust!',
    wow:'Those footprints could last for millions of years unless a meteor hits that exact spot. The Moon is the universe\'s greatest time capsule!',
  },
  {
    id:'jupiter-shield', emoji:'🛡️', category:'planets', color:'#e8a87c',
    title:'Jupiter is Earth\'s Mighty Bodyguard',
    body:'Jupiter is so massive that its powerful gravity acts like a shield for Earth. It attracts and captures asteroids and comets that might otherwise smash into our planet, preventing many catastrophic impacts.',
    wow:'Without Jupiter\'s protective gravity, scientists think Earth would be hit by asteroids up to 1,000 times more often. We might not even exist!',
  },
  {
    id:'big-bang', emoji:'💥', category:'universe', color:'#ffab40',
    title:'The Big Bang Wasn\'t Actually a Bang!',
    body:'The universe didn\'t start with an explosion in existing space. It started as an impossibly tiny, super-hot point, and space itself has been stretching and expanding ever since. There was no sound because there was no space yet!',
    wow:'Everything that exists — all 2 trillion galaxies, all the stars, Earth, you — was once squished into something smaller than a grain of sand!',
  },
  {
    id:'mars-volcano', emoji:'🌋', category:'planets', color:'#e57373',
    title:'Mars Has the Tallest Volcano in the Solar System',
    body:'Olympus Mons on Mars stands 21 km tall — almost 3 times the height of Mount Everest! It\'s 600 km wide, so if you stood on its slopes you wouldn\'t even know you\'re on a volcano because it\'s beyond the horizon.',
    wow:'Olympus Mons is so wide and flat that from the surface it just looks like a gentle hill — you\'d never guess you\'re standing on the solar system\'s largest volcano!',
  },
  {
    id:'galaxies-count', emoji:'🌌', category:'scale', color:'#b2ebf2',
    title:'There Are 2 Trillion Galaxies in the Universe',
    body:'In 2016, scientists revised their count upward from 200 billion to 2 trillion galaxies in the observable universe alone. Each galaxy contains hundreds of billions of stars. The numbers are almost beyond imagination!',
    wow:'If you counted one galaxy every second without stopping, it would take you over 63,000 years just to count all 2 trillion galaxies!',
  },
  {
    id:'light-past', emoji:'🔭', category:'time', color:'#a5d6a7',
    title:'Looking at Stars Means Looking Back in Time',
    body:'Light takes time to travel across space. When you look at a star 100 light-years away, you\'re seeing it as it looked 100 years ago. The Andromeda Galaxy is 2.5 million light-years away — we see it as it was 2.5 million years ago!',
    wow:'Some stars you see tonight might not even exist anymore — they could have exploded thousands of years ago, but the news just hasn\'t reached us yet!',
  },
  {
    id:'space-cold', emoji:'🥶', category:'space', color:'#80d8ff',
    title:'Space is Incredibly Cold — Colder Than You Can Imagine',
    body:'The background temperature of empty space is -270°C — just 3 degrees above absolute zero, the coldest temperature that is physically possible. But near stars, it can be millions of degrees hot!',
    wow:'At absolute zero (-273°C), atoms almost completely stop moving. The background of space is only 3 degrees warmer than that extreme — space is basically a giant freezer!',
  },
]

// ── Facts Quiz Questions ───────────────────────────────────────────────────────
const FACT_QUESTIONS = [
  { q:'How many Earths could fit inside the Sun?', type:'text-to-name', textChoices:true,
    choices:['1.3 million','10,000','100 billion','50,000'],
    answer:'1.3 million', hint:'The Sun contains 99.86% of all mass in the solar system!' },
  { q:'How long does sunlight take to travel from the Sun to Earth?', type:'text-to-name', textChoices:true,
    choices:['8 minutes','1 second','1 hour','24 hours'],
    answer:'8 minutes', hint:'Light travels 300,000 km per second but the Sun is 150 million km away!' },
  { q:'What are the atoms in your body mostly made from?', type:'text-to-name', textChoices:true,
    choices:['Stardust from exploded stars','Earth rocks and minerals','Ocean water molecules','Oxygen from the Sun'],
    answer:'Stardust from exploded stars', hint:'Every atom in you was forged inside a dying star billions of years ago!' },
  { q:'How old is the universe?', type:'text-to-name', textChoices:true,
    choices:['13.8 billion years','4.6 billion years','1 million years','100 billion years'],
    answer:'13.8 billion years', hint:'The Big Bang happened 13.8 billion years ago — our Solar System only formed 4.6 billion years ago.' },
  { q:'Which planet is the ONLY one in the solar system less dense than water (so it could float)?', type:'text-to-name', textChoices:true,
    choices:['Saturn','Jupiter','Neptune','Uranus'],
    answer:'Saturn', hint:'Saturn is made mostly of gas, making it lighter than you\'d expect for its huge size!' },
  { q:'Why is space completely silent?', type:'text-to-name', textChoices:true,
    choices:['No air to carry sound waves','It\'s too cold for sound','Stars absorb all sound','Black holes silence everything'],
    answer:'No air to carry sound waves', hint:'Sound needs a material — like air or water — to travel through. Space is almost completely empty!' },
  { q:'On Venus, in which direction does the Sun rise each morning?', type:'text-to-name', textChoices:true,
    choices:['The West','The East','The North','It doesn\'t rise on Venus'],
    answer:'The West', hint:'Venus spins backwards compared to most planets, so sunrises are in the west and sunsets are in the east!' },
  { q:'What sits at the centre of our Milky Way galaxy?', type:'text-to-name', textChoices:true,
    choices:['A supermassive black hole','Our Sun','A giant nebula','Another galaxy'],
    answer:'A supermassive black hole', hint:'It\'s called Sagittarius A* and it weighs 4 million times more than our Sun!' },
  { q:'Which planet has the fastest winds in the entire solar system — up to 2,100 km/h?', type:'text-to-name', textChoices:true,
    choices:['Neptune','Saturn','Jupiter','Uranus'],
    answer:'Neptune', hint:'Neptune\'s winds are actually faster than the speed of sound on Earth!' },
  { q:'In how many years will the Andromeda Galaxy collide with the Milky Way?', type:'text-to-name', textChoices:true,
    choices:['4.5 billion years','1 million years','50,000 years','100 trillion years'],
    answer:'4.5 billion years', hint:'Don\'t panic — the galaxies are so spread out that almost no individual stars will actually collide!' },
  { q:'Why are the Apollo Moon footprints from 1969 still perfectly preserved today?', type:'text-to-name', textChoices:true,
    choices:['No wind or rain on the Moon','The astronauts used special boots','NASA sprayed a protective coat','The Moon\'s temperature preserves them'],
    answer:'No wind or rain on the Moon', hint:'The Moon has almost no atmosphere, so nothing can erode the footprints — they could last millions of years!' },
  { q:'Why is Jupiter called Earth\'s bodyguard?', type:'text-to-name', textChoices:true,
    choices:['Its gravity attracts asteroids away from Earth','It generates Earth\'s magnetic field','It blocks harmful solar rays','It produces Earth\'s oxygen'],
    answer:'Its gravity attracts asteroids away from Earth', hint:'Without Jupiter\'s protection, Earth would be struck by asteroids up to 1,000 times more often!' },
  { q:'What was the size of everything in the universe just before the Big Bang?', type:'text-to-name', textChoices:true,
    choices:['Smaller than a grain of sand','The size of our Solar System','The size of the Milky Way','The size of Earth'],
    answer:'Smaller than a grain of sand', hint:'All 2 trillion galaxies, every star, and even you — once compressed into a point smaller than a grain of sand!' },
  { q:'How tall is Olympus Mons, the tallest volcano in the solar system, on Mars?', type:'text-to-name', textChoices:true,
    choices:['21 km','8.8 km','55 km','3 km'],
    answer:'21 km', hint:'It\'s nearly 3 times the height of Mount Everest! It\'s so wide (600km) that from the surface you can\'t see the top.' },
  { q:'How many galaxies are in the observable universe?', type:'text-to-name', textChoices:true,
    choices:['2 trillion','200 million','10 billion','500 billion'],
    answer:'2 trillion', hint:'Scientists revised this estimate in 2016 — there are 10 times more galaxies than previously thought!' },
  { q:'When you look at a star 100 light-years away, what are you actually seeing?', type:'text-to-name', textChoices:true,
    choices:['The star as it looked 100 years ago','The star as it looks right now','A reflection of the star','The star\'s future light'],
    answer:'The star as it looked 100 years ago', hint:'Light takes 100 years to travel 100 light-years — so you\'re always looking back in time when you look at stars!' },
  { q:'What is the background temperature of empty space?', type:'text-to-name', textChoices:true,
    choices:['-270°C','-10°C','0°C','-100°C'],
    answer:'-270°C', hint:'This is just 3 degrees above absolute zero — the coldest temperature that is physically possible in the universe!' },
  { q:'What is the number of stars in the observable universe compared to Earth\'s sand grains?', type:'text-to-name', textChoices:true,
    choices:['More stars than sand grains','Fewer stars than sand grains','Exactly the same number','About twice as many sand grains'],
    answer:'More stars than sand grains', hint:'There are about 10²⁴ stars — more than every grain of sand on every beach on Earth combined!' },
]

// ── Little Explorer questions (ages ~4-6) ─────────────────────────────────────
// Designed for pre-readers: 3 choices, big picture clues, and answers a young
// child can get from looking rather than reading. Planet-name answers omit
// `textChoices` on purpose so the buttons show planet photos as visual hints.
const EASY_QUESTIONS = [
  { q:'Which planet do we live on?', type:'text-to-name',
    choices:['Earth','Mars','Jupiter'], answer:'Earth',
    hint:'Earth is our home — the blue and green one!' },
  { q:'Which planet is red?', type:'text-to-name',
    choices:['Mars','Earth','Neptune'], answer:'Mars',
    hint:'Mars is covered in rusty red dust, like a big red desert!' },
  { q:'Which planet has big beautiful rings?', type:'text-to-name',
    choices:['Saturn','Earth','Mercury'], answer:'Saturn',
    hint:'Saturn wears rings made of ice and rock, like a hula hoop!' },
  { q:'Which planet is the BIGGEST?', type:'text-to-name',
    choices:['Jupiter','Earth','Mercury'], answer:'Jupiter',
    hint:'Jupiter is so big that all the other planets could fit inside it!' },
  { q:'Which planet is the SMALLEST?', type:'text-to-name',
    choices:['Mercury','Jupiter','Saturn'], answer:'Mercury',
    hint:'Mercury is the littlest planet — about the size of our Moon!' },
  { q:'What is this planet?', type:'image-to-name', planet:'earth',
    choices:['Earth','Mars','Saturn'] },
  { q:'What is this planet?', type:'image-to-name', planet:'saturn',
    choices:['Saturn','Earth','Mercury'] },
  { q:'What is this planet?', type:'image-to-name', planet:'mars',
    choices:['Mars','Neptune','Venus'] },
  { q:'What is this planet?', type:'image-to-name', planet:'jupiter',
    choices:['Jupiter','Mercury','Earth'] },
  { q:'What gives us light and warmth in the daytime?', type:'text-to-name', textChoices:true,
    choices:['☀️ The Sun','🌙 The Moon','⭐ A star at night'], answer:'☀️ The Sun',
    hint:'The Sun is our very own star, and it keeps us warm every day!' },
  { q:'What do we see in the sky at night?', type:'text-to-name', textChoices:true,
    choices:['⭐ Stars and the Moon','🌈 Rainbows','🌻 Flowers'], answer:'⭐ Stars and the Moon',
    hint:'When the Sun goes down, the stars and Moon come out to say hello!' },
  { q:'What colour is the Earth from space?', type:'text-to-name', textChoices:true,
    choices:['💙 Blue','💜 Purple','🖤 Black'], answer:'💙 Blue',
    hint:'Earth looks blue because most of it is covered in water!' },
  { q:'What do we ride to fly into space?', type:'text-to-name', textChoices:true,
    choices:['🚀 A rocket','🚌 A bus','🚲 A bicycle'], answer:'🚀 A rocket',
    hint:'Rockets are super fast and push all the way up past the sky!' },
  { q:'What do we call someone who travels into space?', type:'text-to-name', textChoices:true,
    choices:['👩‍🚀 An astronaut','👩‍🍳 A chef','👩‍🏫 A teacher'], answer:'👩‍🚀 An astronaut',
    hint:'Astronauts wear special white suits and float around!' },
  { q:'Why do astronauts wear a space suit?', type:'text-to-name', textChoices:true,
    choices:['🌬️ There is no air in space','🎉 To look pretty','❄️ To go swimming'], answer:'🌬️ There is no air in space',
    hint:'There is no air in space, so the suit carries air for them to breathe!' },
  { q:'How many moons does the Earth have?', type:'text-to-name', textChoices:true,
    choices:['1️⃣ One','🔟 Ten','0️⃣ None'], answer:'1️⃣ One',
    hint:'We have exactly one Moon, and it goes round and round the Earth!' },
  { q:'Is the Moon bigger or smaller than the Earth?', type:'text-to-name', textChoices:true,
    choices:['🌙 Smaller','🌍 Bigger','⚖️ Exactly the same'], answer:'🌙 Smaller',
    hint:'The Moon is much smaller — Earth is about 4 times wider!' },
  { q:'What is the Moon made of?', type:'text-to-name', textChoices:true,
    choices:['🪨 Rock and dust','🧀 Cheese','🍦 Ice cream'], answer:'🪨 Rock and dust',
    hint:'It is grey rock and dust — not cheese, even though it looks a bit like it!' },
  { q:'Which is hotter?', type:'text-to-name', textChoices:true,
    choices:['☀️ The Sun','🧊 An ice cube','❄️ Snow'], answer:'☀️ The Sun',
    hint:'The Sun is the hottest thing around — far hotter than anything on Earth!' },
  { q:'What shape is the Earth?', type:'text-to-name', textChoices:true,
    choices:['⚪ Round like a ball','⬛ Flat like a pancake','🔺 Pointy like a triangle'], answer:'⚪ Round like a ball',
    hint:'Earth is round like a giant ball spinning in space!' },
  { q:'Can you hear a sound in space?', type:'text-to-name', textChoices:true,
    choices:['🤫 No, space is silent','📣 Yes, very loudly','🎵 Only music'], answer:'🤫 No, space is silent',
    hint:'Sound needs air to travel, and space has no air — so it is totally quiet!' },
  { q:'How many planets go around our Sun?', type:'text-to-name', textChoices:true,
    choices:['8️⃣ Eight','2️⃣ Two','💯 One hundred'], answer:'8️⃣ Eight',
    hint:'Eight planets! Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus and Neptune.' },
  { q:'Which planet is closest to the Sun?', type:'text-to-name',
    choices:['Mercury','Neptune','Earth'], answer:'Mercury',
    hint:'Mercury sits nearest the Sun, so it gets very toasty!' },
  { q:'What happens to astronauts inside a spaceship?', type:'text-to-name', textChoices:true,
    choices:['🎈 They float around','🛌 They fall asleep','🏃 They run fast'], answer:'🎈 They float around',
    hint:'In space everything floats — even their food and water!' },
]

// ── Quiz questions ─────────────────────────────────────────────────────────────
const QUESTIONS = [
  { q:'What is this planet?', type:'image-to-name', planet:'mercury', choices:['Mercury','Venus','Mars','Earth'] },
  { q:'What is this planet?', type:'image-to-name', planet:'saturn', choices:['Jupiter','Saturn','Uranus','Neptune'] },
  { q:'What is this planet?', type:'image-to-name', planet:'earth', choices:['Venus','Mars','Earth','Mercury'] },
  { q:'What is this planet?', type:'image-to-name', planet:'jupiter', choices:['Jupiter','Saturn','Neptune','Uranus'] },
  { q:'What is this planet?', type:'image-to-name', planet:'mars', choices:['Mercury','Venus','Mars','Jupiter'] },
  { q:'Which is the HOTTEST planet in our solar system?', type:'text-to-name', choices:['Venus','Mercury','Jupiter','Mars'], answer:'Venus', hint:'Its thick atmosphere traps heat like a greenhouse.' },
  { q:'Which planet has the Great Red Spot — a storm lasting over 350 years?', type:'text-to-name', choices:['Saturn','Neptune','Jupiter','Uranus'], answer:'Jupiter', hint:'This storm alone is larger than Earth!' },
  { q:'Which planet is called the Red Planet?', type:'text-to-name', choices:['Mars','Mercury','Venus','Saturn'], answer:'Mars', hint:'Its iron-rich soil gives it a rusty red color.' },
  { q:'Which is the LARGEST planet in our solar system?', type:'text-to-name', choices:['Jupiter','Saturn','Neptune','Uranus'], answer:'Jupiter', hint:'Over 1,300 Earths could fit inside this planet!' },
  { q:'Which planet rotates completely on its side?', type:'text-to-name', choices:['Uranus','Neptune','Saturn','Venus'], answer:'Uranus', hint:'Its axial tilt is almost 98 degrees!' },
  { q:'Which planet is the SMALLEST in our solar system?', type:'text-to-name', choices:['Mercury','Mars','Venus','Neptune'], answer:'Mercury', hint:'It\'s only slightly bigger than our Moon.' },
  { q:'Which planet has the most moons (146 confirmed)?', type:'text-to-name', choices:['Saturn','Jupiter','Uranus','Neptune'], answer:'Saturn', hint:'It recently overtook Jupiter for the most moons!' },
  { q:'Which planet has the fastest winds in the solar system?', type:'text-to-name', choices:['Neptune','Uranus','Saturn','Jupiter'], answer:'Neptune', hint:'Winds can reach a staggering 2,100 km/h!' },
  { q:'Which planet would FLOAT on water because it\'s so light?', type:'text-to-name', choices:['Saturn','Uranus','Neptune','Jupiter'], answer:'Saturn', hint:'It\'s less dense than water — the only planet that could do this.' },
  { q:'Which planet is closest to the Sun?', type:'text-to-name', choices:['Mercury','Venus','Earth','Mars'], answer:'Mercury', hint:'It completes an orbit in just 88 days!' },
  { q:'What percentage of the solar system\'s mass does the Sun contain?', type:'text-to-name', choices:['99.86%','75%','50%','88%'], answer:'99.86%', hint:'Almost everything in the solar system is the Sun!', textChoices:true },
  { q:'How long does sunlight take to travel from the Sun to Earth?', type:'text-to-name', choices:['8 minutes','1 hour','1 second','1 day'], answer:'8 minutes', hint:'Light travels at 300,000 km/s — and it still takes over 8 minutes!', textChoices:true },
  { q:'Stephenson 2-18 is approximately how many times wider than our Sun?', type:'text-to-name', choices:['2,150 times','10 times','500 times','50,000 times'], answer:'2,150 times', hint:'If placed in our solar system, it would extend beyond Saturn\'s orbit!', textChoices:true },
  { q:'What type of star is Stephenson 2-18?', type:'text-to-name', choices:['Red Supergiant','White Dwarf','Blue Giant','Neutron Star'], answer:'Red Supergiant', hint:'Its reddish colour comes from its relatively cool surface temperature of ~3,200 K.', textChoices:true },
  { q:'What is this planet?', type:'image-to-name', planet:'uranus', choices:['Uranus','Neptune','Saturn','Jupiter'] },
  { q:'What is this planet?', type:'image-to-name', planet:'neptune', choices:['Neptune','Uranus','Earth','Mars'] },
  { q:'What is this planet?', type:'image-to-name', planet:'venus', choices:['Venus','Mercury','Mars','Saturn'] },
  { q:'Which planet has a volcano called Olympus Mons — the tallest in the solar system?', type:'text-to-name', choices:['Mars','Venus','Mercury','Earth'], answer:'Mars', hint:'Olympus Mons stands 21 km tall — nearly 3× the height of Mount Everest!' },
  { q:'Which planet\'s day is longer than its year?', type:'text-to-name', choices:['Venus','Mercury','Mars','Jupiter'], answer:'Venus', hint:'Venus rotates so slowly that one day lasts 243 Earth days but its year is only 225!' },
  { q:'Which planet has a canyon system 4,000 km long — 10× longer than the Grand Canyon?', type:'text-to-name', choices:['Mars','Jupiter','Venus','Saturn'], answer:'Mars', hint:'Valles Marineris stretches across a quarter of the planet!' },
  { q:'Which planet\'s moon, Europa, may have a liquid water ocean under its icy surface?', type:'text-to-name', choices:['Jupiter','Saturn','Neptune','Uranus'], answer:'Jupiter', hint:'Europa is one of the best candidates in our solar system for extraterrestrial life!' },
  { q:'Which planet is known as the "Evening Star" visible just after sunset?', type:'text-to-name', choices:['Venus','Mars','Mercury','Jupiter'], answer:'Venus', hint:'It\'s the brightest object in the night sky after the Moon!' },
  { q:'Which planet has winds reaching 1,800 km/h in its atmosphere?', type:'text-to-name', choices:['Saturn','Jupiter','Neptune','Uranus'], answer:'Saturn', hint:'Saturn\'s powerful winds make it one of the most dynamic weather systems in the solar system.' },
  { q:'Which planet rotates backwards — meaning the Sun rises in the west there?', type:'text-to-name', choices:['Venus','Uranus','Neptune','Mars'], answer:'Venus', hint:'Venus spins in the opposite direction to most planets!' },
  { q:'Which planet\'s moon Triton orbits in the OPPOSITE direction to the planet\'s rotation?', type:'text-to-name', choices:['Neptune','Saturn','Uranus','Jupiter'], answer:'Neptune', hint:'Triton is unique — it may have been a captured object from the Kuiper Belt.' },
  { q:'Which planet has a season that lasts 21 years due to its extreme tilt?', type:'text-to-name', choices:['Uranus','Neptune','Saturn','Mars'], answer:'Uranus', hint:'Its 98° axial tilt means each pole gets 42 years of sunlight followed by 42 years of darkness!' },
  { q:'Which is the only planet in our solar system confirmed to have life?', type:'text-to-name', choices:['Earth','Mars','Venus','Europa'], answer:'Earth', hint:'So far, Earth is uniquely special in the solar system!' },
  { q:'How many planets are in our solar system?', type:'text-to-name', choices:['8','9','7','10'], answer:'8', hint:'Pluto was reclassified as a dwarf planet in 2006, leaving 8 official planets.', textChoices:true },
  { q:'Which planet takes 165 Earth years to orbit the Sun once?', type:'text-to-name', choices:['Neptune','Uranus','Saturn','Jupiter'], answer:'Neptune', hint:'It has only completed one full orbit since it was discovered in 1846!' },
  { q:'Which planet is the densest in the solar system?', type:'text-to-name', choices:['Earth','Venus','Mercury','Mars'], answer:'Earth', hint:'Despite not being the largest rocky planet, Earth is the most densely packed.' },
  { q:'On which planet would you weigh the most due to strongest gravity?', type:'text-to-name', choices:['Jupiter','Saturn','Neptune','Uranus'], answer:'Jupiter', hint:'Jupiter\'s gravity is 2.5× that of Earth — you\'d feel very heavy there!' },
  { q:'How old is our Sun?', type:'text-to-name', choices:['4.6 billion years','1 billion years','10 billion years','500 million years'], answer:'4.6 billion years', hint:'The Sun is roughly halfway through its 10-billion-year lifespan!', textChoices:true },
  { q:'What is the core temperature of our Sun?', type:'text-to-name', choices:['15 million °C','5,500 °C','1 million °C','100,000 °C'], answer:'15 million °C', hint:'Nuclear fusion at the core requires incredibly extreme temperatures!', textChoices:true },
  { q:'How many Earths could fit inside the Sun?', type:'text-to-name', choices:['1.3 million','10,000','100 million','50,000'], answer:'1.3 million', hint:'The Sun is absolutely enormous compared to our planet!', textChoices:true },
  { q:'In which constellation is Stephenson 2-18 located?', type:'text-to-name', choices:['Scutum','Orion','Andromeda','Sagittarius'], answer:'Scutum', hint:'It sits in the constellation Scutum, about 19,000 light-years from Earth.', textChoices:true },
  { q:'How many times more luminous is Stephenson 2-18 than our Sun?', type:'text-to-name', choices:['440,000×','10×','1 million×','2,000×'], answer:'440,000×', hint:'Despite being so luminous, it appears reddish because its surface is relatively cool.', textChoices:true },
  { q:'If Stephenson 2-18 replaced our Sun, which planet\'s orbit would it extend beyond?', type:'text-to-name', choices:['Saturn','Mars','Jupiter','Neptune'], answer:'Saturn', hint:'Its radius of ~2,150 solar radii would swallow Mercury, Venus, Earth, Mars, and Jupiter!', textChoices:true },

  // ── Galaxy questions ─────────────────────────────────────────────────────
  { q:'Which galaxy is closest to our Milky Way?', type:'text-to-name', choices:['Andromeda Galaxy','Sombrero Galaxy','Triangulum Galaxy','Pinwheel Galaxy'], answer:'Andromeda Galaxy', hint:'It is 2.5 million light-years away and visible to the naked eye!', textChoices:true },
  { q:'Which galaxy is nicknamed "The Cosmic Hat" due to its distinctive shape?', type:'text-to-name', choices:['Sombrero Galaxy','Cartwheel Galaxy','Pinwheel Galaxy','Whirlpool Galaxy'], answer:'Sombrero Galaxy', hint:'Its prominent dust lane and large bulge create a hat-like silhouette!', textChoices:true },
  { q:'The iconic "Pillars of Creation" image was taken by which space telescope?', type:'text-to-name', choices:['Hubble Space Telescope','James Webb Telescope','Chandra Observatory','Spitzer Telescope'], answer:'Hubble Space Telescope', hint:'The original photograph was taken in 1995 and became one of the most famous images ever.', textChoices:true },
  { q:'What type of galaxy is the Milky Way?', type:'text-to-name', choices:['Barred Spiral Galaxy','Elliptical Galaxy','Ring Galaxy','Irregular Galaxy'], answer:'Barred Spiral Galaxy', hint:'It has a central bar-shaped structure from which the spiral arms extend!', textChoices:true },
  { q:'Which ring-shaped galaxy was formed by a smaller galaxy crashing directly through it?', type:'text-to-name', choices:['Cartwheel Galaxy','Sombrero Galaxy','Triangulum Galaxy','NGC 1300'], answer:'Cartwheel Galaxy', hint:'The collision sent shockwaves outward, creating its distinctive ring of star formation!', textChoices:true },
  { q:'When Hubble pointed at an apparently "empty" patch of sky, it revealed nearly 3,000 of what?', type:'text-to-name', choices:['Galaxies','Asteroids','Stars','Planets'], answer:'Galaxies', hint:'This was the famous Hubble Deep Field image taken in 1995!', textChoices:true },
  { q:'In approximately how many years will the Andromeda Galaxy collide with the Milky Way?', type:'text-to-name', choices:['4.5 billion years','1 million years','100 billion years','500,000 years'], answer:'4.5 billion years', hint:'By then, our Sun will be nearing the end of its life as well!', textChoices:true },
  { q:'Which galaxy is the third largest in our Local Group of galaxies?', type:'text-to-name', choices:['Triangulum Galaxy','Sombrero Galaxy','Cartwheel Galaxy','Pinwheel Galaxy'], answer:'Triangulum Galaxy', hint:'Also known as M33, it is the most distant object visible to the naked eye!', textChoices:true },
  { q:'What is the name of the supermassive black hole at the center of the Milky Way?', type:'text-to-name', choices:['Sagittarius A*','Cygnus X-1','M87*','NGC 1277'], answer:'Sagittarius A*', hint:'It weighs approximately 4 million times the mass of our Sun!', textChoices:true },
  { q:'Which galaxy\'s spiral arms were the first ever observed in any galaxy (1845)?', type:'text-to-name', choices:['Whirlpool Galaxy','Pinwheel Galaxy','Andromeda Galaxy','NGC 1300'], answer:'Whirlpool Galaxy', hint:'Also known as M51, it was studied by the Earl of Rosse using his giant telescope!', textChoices:true },
  { q:'How long does it take our Sun to orbit the center of the Milky Way once?', type:'text-to-name', choices:['225–250 million years','1 million years','10 billion years','500 years'], answer:'225–250 million years', hint:'This is sometimes called a "galactic year" or "cosmic year"!', textChoices:true },
  { q:'Which famous image shows the Pillars of Creation for the first time?', type:'text-to-name', choices:['Hubble Space Telescope (1995)','James Webb (2022)','Voyager 1 (1990)','Spitzer (2003)'], answer:'Hubble Space Telescope (1995)', hint:'The image became one of the most recognizable photographs in astronomy history.', textChoices:true },

  // ── Image-to-name: Galaxies ───────────────────────────────────────────────
  { q:'Which galaxy is this?', type:'image-to-name', galaxy:'andromeda', choices:['Andromeda Galaxy','Whirlpool Galaxy','Triangulum Galaxy','Sombrero Galaxy'], answer:'Andromeda Galaxy' },
  { q:'Which galaxy is this?', type:'image-to-name', galaxy:'whirlpool', choices:['Whirlpool Galaxy','Pinwheel Galaxy','Cartwheel Galaxy','NGC 1300'], answer:'Whirlpool Galaxy' },
  { q:'Which galaxy is this?', type:'image-to-name', galaxy:'sombrero', choices:['Sombrero Galaxy','Cartwheel Galaxy','Andromeda Galaxy','NGC 1300'], answer:'Sombrero Galaxy' },
  { q:'What is this iconic Hubble image called?', type:'image-to-name', galaxy:'pillars', choices:['Pillars of Creation','Hubble Deep Field','Cat\'s Eye Nebula','Crab Nebula'], answer:'Pillars of Creation' },
  { q:'What famous image is this?', type:'image-to-name', galaxy:'deep-field', choices:['Hubble Deep Field','Pillars of Creation','Andromeda Galaxy','Triangulum Galaxy'], answer:'Hubble Deep Field' },
  { q:'Which galaxy is this?', type:'image-to-name', galaxy:'pinwheel', choices:['Pinwheel Galaxy','Whirlpool Galaxy','Triangulum Galaxy','NGC 1300'], answer:'Pinwheel Galaxy' },

  // ── Black hole questions ──────────────────────────────────────────────────
  { q:'What was the first black hole ever photographed (in 2019)?', type:'text-to-name', choices:['M87*','Sagittarius A*','Cygnus X-1','TON 618'], answer:'M87*', hint:'The Event Horizon Telescope captured this historic image in the galaxy Messier 87!', textChoices:true },
  { q:'What is the name of the supermassive black hole at the centre of our Milky Way?', type:'text-to-name', choices:['Sagittarius A*','M87*','Cygnus X-1','TON 618'], answer:'Sagittarius A*', hint:'It sits 26,000 light-years away in the constellation Sagittarius.', textChoices:true },
  { q:'Why are black holes invisible?', type:'text-to-name', choices:['Not even light can escape their gravity','They are too small to see','They are hidden behind dust','They only exist in other galaxies'], answer:'Not even light can escape their gravity', hint:'Anything crossing the event horizon — including light — can never come back out!', textChoices:true },
  { q:'How massive is TON 618, one of the largest black holes known?', type:'text-to-name', choices:['~40 billion solar masses','~100 solar masses','~1 million solar masses','~21 solar masses'], answer:'~40 billion solar masses', hint:'It\'s an ultramassive monster — thousands of times heavier than our galaxy\'s central black hole!', textChoices:true },
  { q:'Which black hole is this — the first ever photographed?', type:'image-to-name', galaxy:'m87-bh', choices:['M87* Black Hole','Sagittarius A*','Cygnus X-1','TON 618'], answer:'M87* Black Hole' },
  { q:'Which black hole is this — at the centre of OUR galaxy?', type:'image-to-name', galaxy:'sgr-a', choices:['Sagittarius A*','M87* Black Hole','Cygnus X-1','TON 618'], answer:'Sagittarius A*' },
]

// ── Stephenson 2-18 data ──────────────────────────────────────────────────────
const ST2_18 = {
  id:'st2-18', name:'Stephenson 2-18', nickname:'The Largest Known Star',
  img:'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Comparison_of_planets_and_stars_%28sheet_by_sheet%29_%28Jan_2021%29.png/800px-Comparison_of_planets_and_stars_%28sheet_by_sheet%29_%28Jan_2021%29.png',
  clusterImg:'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Comparison_of_planets_and_stars_%28sheet_by_sheet%29_%28Jan_2021%29.png/800px-Comparison_of_planets_and_stars_%28sheet_by_sheet%29_%28Jan_2021%29.png',
  color:'#ff6e40',
  type:'Red Supergiant Star',
  constellation:'Scutum',
  distanceFromEarth:'~19,000 light-years',
  radius:'~2,150 Solar Radii',
  diameter:'~2,990,000,000 km',
  luminosity:'~440,000× the Sun',
  temperature:'~3,200 K (surface)',
  mass:'~12–15 Solar Masses',
  sunComparison: 2150,
  facts:[
    'If placed at the center of our solar system, it would swallow everything up to and beyond Saturn\'s orbit',
    'Its radius is estimated at ~2,150 times that of our Sun',
    'Located ~19,000 light-years away in the constellation Scutum',
    'It is part of an open star cluster called Stephenson 2 (RSGC2)',
    'It is so large that light takes about 8 hours just to travel from one side to the other',
    'Named after American astronomer Charles Bruce Stephenson who catalogued it',
    'Despite being 440,000× more luminous than the Sun, it appears reddish because it\'s relatively cool',
  ],
  funFact:'Stephenson 2-18 is so enormous that over 10 billion of our Suns could fit inside it by volume!',
}

// ── Stephenson 2-18 Modal ────────────────────────────────────────────────────
function ST2Modal({ onClose }) {
  useEffect(() => {
    const onKey = e => { if(e.key==='Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal st2-modal" onClick={e=>e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="st2-header">
          <div className="st2-badge">🌌 MEGA STAR</div>
          <h2 className="st2-title" style={{color:ST2_18.color}}>{ST2_18.name}</h2>
          <p className="st2-nick">"{ST2_18.nickname}"</p>
        </div>
        <div className="st2-compare">
          <div className="st2-compare-title">Size Comparison</div>
          <div className="st2-orbs">
            <div className="st2-orb-item">
              <div className="st2-sun-dot"/>
              <div className="st2-orb-label">☀️ Our Sun<br/><span>1,392,700 km</span></div>
            </div>
            <div className="st2-arrow">→</div>
            <div className="st2-orb-item">
              <div className="st2-giant-orb"><span>St2-18</span></div>
              <div className="st2-orb-label">🔴 Stephenson 2-18<br/><span>~2,990,000,000 km</span></div>
            </div>
          </div>
          <div className="st2-ratio">Our Sun fits inside Stephenson 2-18 <strong style={{color:ST2_18.color}}>2,150 times</strong> across</div>
        </div>
        <div className="modal-stats" style={{marginBottom:20}}>
          <div className="stat"><span className="stat-label">Type</span><span>{ST2_18.type}</span></div>
          <div className="stat"><span className="stat-label">Radius</span><span>{ST2_18.radius}</span></div>
          <div className="stat"><span className="stat-label">Diameter</span><span>{ST2_18.diameter}</span></div>
          <div className="stat"><span className="stat-label">Distance</span><span>{ST2_18.distanceFromEarth}</span></div>
          <div className="stat"><span className="stat-label">Luminosity</span><span>{ST2_18.luminosity}</span></div>
          <div className="stat"><span className="stat-label">Temperature</span><span>{ST2_18.temperature}</span></div>
          <div className="stat"><span className="stat-label">Mass</span><span>{ST2_18.mass}</span></div>
          <div className="stat"><span className="stat-label">Constellation</span><span>{ST2_18.constellation}</span></div>
        </div>
        <div className="modal-facts">
          <h3>🔭 Key Facts</h3>
          <ul>{ST2_18.facts.map((f,i)=><li key={i}>{f}</li>)}</ul>
        </div>
        <div className="modal-funfact">
          <span>💡</span><span>{ST2_18.funFact}</span>
        </div>
      </div>
    </div>
  )
}

// ── Utility ───────────────────────────────────────────────────────────────────
function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5) }

// ── Stars background ──────────────────────────────────────────────────────────
function Stars() {
  const stars = useRef(Array.from({length:180}, () => ({
    x: Math.random()*100, y: Math.random()*100,
    r: Math.random()*2+0.5,
    op: 0.3+Math.random()*0.7,
    dur: 2+Math.random()*4,
  }))).current
  return (
    <div className="stars" aria-hidden>
      {stars.map((s,i) => (
        <div key={i} className="star" style={{
          left:`${s.x}%`, top:`${s.y}%`, width:s.r*2, height:s.r*2,
          opacity:s.op, animationDuration:`${s.dur}s`, animationDelay:`${Math.random()*4}s`
        }}/>
      ))}
    </div>
  )
}

// ── Planet Detail Modal ───────────────────────────────────────────────────────
function PlanetModal({ planet, onClose }) {
  useEffect(() => {
    const onKey = e => { if(e.key==='Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-top">
          <div className="modal-img-wrap">
            <img src={planet.img} alt={planet.name} className="modal-img" loading="lazy"/>
            <div className="modal-img-label">NASA / ESA Real Photo</div>
          </div>
          <div className="modal-info">
            <div className="modal-order">#{planet.order} from the Sun</div>
            <h2 className="modal-name" style={{color:planet.color}}>{planet.name}</h2>
            <p className="modal-nick">"{planet.nickname}"</p>
            <div className="modal-stats">
              <div className="stat"><span className="stat-label">Type</span><span>{planet.type}</span></div>
              <div className="stat"><span className="stat-label">Diameter</span><span>{planet.diameter}</span></div>
              <div className="stat"><span className="stat-label">Moons</span><span>{planet.moons}</span></div>
              <div className="stat"><span className="stat-label">From Sun</span><span>{planet.distanceSun}</span></div>
              <div className="stat"><span className="stat-label">Year Length</span><span>{planet.orbitalPeriod}</span></div>
              <div className="stat"><span className="stat-label">Temperature</span><span>{planet.tempRange}</span></div>
            </div>
          </div>
        </div>
        <div className="modal-facts">
          <h3>🔭 Key Facts</h3>
          <ul>{planet.facts.map((f,i) => <li key={i}>{f}</li>)}</ul>
        </div>
        <div className="modal-funfact">
          <span>💡</span><span>{planet.funFact}</span>
        </div>
      </div>
    </div>
  )
}

// ── Galaxy Detail Modal ───────────────────────────────────────────────────────
function GalaxyModal({ galaxy, onClose }) {
  useEffect(() => {
    const onKey = e => { if(e.key==='Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal galaxy-modal" onClick={e=>e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        <div className="galaxy-modal-hero">
          <img src={galaxy.thumbLg} alt={galaxy.name} className="galaxy-modal-img" loading="lazy" decoding="async"/>
          <div className="galaxy-modal-overlay">
            {galaxy.hubble && <div className="hubble-badge">🔭 Hubble Space Telescope</div>}
            <h2 className="galaxy-modal-name" style={{color:galaxy.color}}>{galaxy.name}</h2>
            <p className="galaxy-modal-nick">"{galaxy.nickname}"</p>
            <div className="galaxy-type-chip">{galaxy.type}</div>
          </div>
        </div>

        <div className="modal-stats galaxy-stats">
          <div className="stat"><span className="stat-label">Distance</span><span>{galaxy.distance}</span></div>
          <div className="stat"><span className="stat-label">Size</span><span>{galaxy.diameter}</span></div>
          <div className="stat"><span className="stat-label">Stars / Objects</span><span>{galaxy.stars}</span></div>
          <div className="stat"><span className="stat-label">Location</span><span>{galaxy.constellation}</span></div>
          <div className="stat"><span className="stat-label">Age</span><span>{galaxy.age}</span></div>
          <div className="stat"><span className="stat-label">Type</span><span>{galaxy.type}</span></div>
        </div>

        <div className="modal-facts">
          <h3>🌌 Key Facts</h3>
          <ul>{galaxy.facts.map((f,i) => <li key={i}>{f}</li>)}</ul>
        </div>
        <div className="modal-funfact">
          <span>💡</span><span>{galaxy.funFact}</span>
        </div>

        <a
          href={galaxy.img}
          target="_blank"
          rel="noopener noreferrer"
          className="full-img-btn"
          onClick={e => e.stopPropagation()}
        >
          🔍 View Full Resolution Image
        </a>
      </div>
    </div>
  )
}

// ── Explore Screen ─────────────────────────────────────────────────────────────
function ExploreScreen({ onBack }) {
  const [selected, setSelected] = useState(null)
  const [showST2, setShowST2] = useState(false)

  return (
    <div className="explore">
      <div className="explore-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h2 className="explore-title">☀️ Our Solar System</h2>
        <p className="explore-sub">Tap the Sun or any planet to explore it</p>
      </div>

      {/* Solar system row */}
      <div className="solar-row">
        <button className="sun-wrap" onClick={() => { playClick(); setSelected(SUN) }}>
          <img src={SUN.img} alt="The Sun" className="sun-orb-img" loading="eager"/>
          <div className="sun-label">☀️ The Sun</div>
        </button>
        <div className="orbit-line"/>
        <div className="planets-row">
          {PLANETS.map(p => (
            <div key={p.id} className="planet-column">
              <button
                className="planet-orb-btn"
                onClick={() => { playClick(); setSelected(p) }}
                title={p.name}
                style={{ '--pc': p.color }}
              >
                <img
                  src={p.img} alt={p.name} className="planet-orb-img"
                  style={{ width: p.size, height: p.size }}
                  loading="lazy"
                />
                {p.id === 'saturn' && <div className="saturn-ring"/>}
              </button>
              <div className="planet-label" style={{color:p.color}}>{p.name}</div>
              <div className="planet-order">#{p.order}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Cards grid */}
      <div className="planet-cards">
        <button
          className="planet-card sun-card"
          style={{ '--pc': SUN.color, '--pb': '#ffd74018' }}
          onClick={() => { playClick(); setSelected(SUN) }}
        >
          <img src={SUN.img} alt="The Sun" className="card-img" loading="eager"/>
          <div className="card-body">
            <div className="card-name" style={{color:SUN.color}}>☀️ {SUN.name}</div>
            <div className="card-nick">{SUN.nickname}</div>
            <div className="card-row">
              <span>🌡️ 5,500°C surface</span>
              <span>⭐ G-type Star</span>
            </div>
            <div className="card-type">Star · 1.39M km wide</div>
          </div>
        </button>
        {PLANETS.map(p => (
          <button
            key={p.id}
            className="planet-card"
            style={{ '--pc': p.color, '--pb': p.color+'22' }}
            onClick={() => { playClick(); setSelected(p) }}
          >
            <img src={p.img} alt={p.name} className="card-img" loading="lazy"/>
            <div className="card-body">
              <div className="card-name" style={{color:p.color}}>{p.name}</div>
              <div className="card-nick">{p.nickname}</div>
              <div className="card-row">
                <span>🌙 {p.moons} moon{p.moons!==1?'s':''}</span>
                <span>📏 {p.diameter}</span>
              </div>
              <div className="card-type">{p.type}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Stephenson 2-18 */}
      <div className="st2-section">
        <div className="st2-section-label">🌌 Beyond Our Solar System</div>
        <button className="st2-feature-card" onClick={() => { playClick(); setShowST2(true) }}>
          <div className="st2-feature-left">
            <div className="st2-feature-giant"/>
            <div className="st2-feature-sun-dot"/>
          </div>
          <div className="st2-feature-info">
            <div className="st2-feature-tag">LARGEST KNOWN STAR</div>
            <div className="st2-feature-name">Stephenson 2-18</div>
            <div className="st2-feature-sub">2,150× wider than our Sun • Red Supergiant • 19,000 light-years away</div>
            <div className="st2-feature-cta">Tap to explore →</div>
          </div>
        </button>
      </div>

      {selected && <PlanetModal planet={selected} onClose={() => setSelected(null)}/>}
      {showST2 && <ST2Modal onClose={() => setShowST2(false)}/>}
    </div>
  )
}

// ── Galaxies Screen ────────────────────────────────────────────────────────────
function GalaxiesScreen({ onBack }) {
  const [selected, setSelected] = useState(null)

  const GalaxyCard = ({ g }) => (
    <button
      className="galaxy-card"
      style={{ '--gc': g.color }}
      onClick={() => { playClick(); setSelected(g) }}
    >
      <div className="galaxy-card-img-wrap">
        <img src={g.thumb} alt={g.name} className="galaxy-card-img" loading="lazy" decoding="async"
          onLoad={e => e.currentTarget.classList.add('loaded')}
        />
        {(g.chip || g.hubble) && <div className="galaxy-hubble-chip">{g.chip || '🔭 Hubble'}</div>}
      </div>
      <div className="card-body">
        <div className="card-name" style={{color:g.color}}>{g.name}</div>
        <div className="card-nick">{g.nickname}</div>
        <div className="card-row"><span>📍 {g.distance}</span></div>
        <div className="card-type">{g.type}</div>
      </div>
    </button>
  )

  return (
    <div className="explore galaxies-screen">
      <div className="explore-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h2 className="explore-title">🌌 Galaxies &amp; Hubble</h2>
        <p className="explore-sub">Real images from the Hubble Space Telescope</p>
      </div>

      {/* Hubble intro banner */}
      <div className="hubble-banner">
        <div className="hubble-banner-icon">🔭</div>
        <div className="hubble-banner-text">
          <div className="hubble-banner-title">Hubble Space Telescope</div>
          <div className="hubble-banner-sub">
            Launched in 1990, Hubble has captured stunning images of galaxies billions of light-years away —
            revolutionising our understanding of the universe.
          </div>
        </div>
      </div>

      {/* Galaxy cards grid */}
      <div className="galaxy-cards">
        {GALAXIES.map(g => <GalaxyCard key={g.id} g={g}/>)}
      </div>

      {/* James Webb section */}
      <div className="universe-section jwst-section">
        <div className="universe-section-header">
          <div className="universe-section-icon">🛰️</div>
          <div>
            <div className="universe-section-title">James Webb Space Telescope</div>
            <div className="universe-section-sub">The newest, most powerful space telescope — seeing the universe in infrared since 2022</div>
          </div>
        </div>
        <div className="galaxy-cards">
          {JWST_ITEMS.map(g => <GalaxyCard key={g.id} g={g}/>)}
        </div>
      </div>

      {/* Black Holes section */}
      <div className="universe-section blackholes-section">
        <div className="universe-section-header">
          <div className="universe-section-icon">🕳️</div>
          <div>
            <div className="universe-section-title">Black Holes</div>
            <div className="universe-section-sub">Real photographed black holes — where gravity is so strong that even light cannot escape</div>
          </div>
        </div>
        <div className="galaxy-cards">
          {BLACK_HOLES.map(g => <GalaxyCard key={g.id} g={g}/>)}
        </div>
      </div>

      {/* Observable Universe section */}
      <div className="universe-section">
        <div className="universe-section-header">
          <div className="universe-section-icon">🌐</div>
          <div>
            <div className="universe-section-title">The Observable Universe</div>
            <div className="universe-section-sub">The full scale of everything we can see — from superclusters to the cosmic web</div>
          </div>
        </div>
        <div className="galaxy-cards">
          {UNIVERSE_ITEMS.map(g => <GalaxyCard key={g.id} g={g}/>)}
        </div>
      </div>

      {selected && <GalaxyModal galaxy={selected} onClose={() => setSelected(null)}/>}
    </div>
  )
}

// ── Multiverse ─────────────────────────────────────────────────────────────────
function MultiverseModal({ uni, onClose }) {
  useEffect(() => {
    const onKey = e => { if(e.key==='Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal mv-modal" style={{'--mc':uni.color}} onClick={e=>e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        <div className="mv-modal-hero">
          <div className="mv-portal mv-portal-lg">
            <span className="mv-portal-emoji">{uni.emoji}</span>
          </div>
          <h2 className="mv-modal-name" style={{color:uni.color}}>{uni.name}</h2>
          <p className="mv-modal-nick">"{uni.nickname}"</p>
          <div className="galaxy-type-chip">{uni.type}</div>
        </div>

        <div className="mv-imagine">
          <span className="mv-imagine-icon">🌈</span>
          <div>
            <div className="mv-imagine-head">Imagine this...</div>
            <p className="mv-imagine-body">{uni.imagine}</p>
          </div>
        </div>

        <div className="mv-meter-block">
          <div className="mv-meter-head">🔬 Is it real?</div>
          <div className="mv-meter"><div className="mv-meter-fill" style={{width:`${uni.real}%`}}/></div>
          <div className="mv-meter-label">{uni.realLabel}</div>
        </div>

        <div className="modal-facts">
          <h3>🌌 What scientists think</h3>
          <ul>{uni.facts.map((f,i) => <li key={i}>{f}</li>)}</ul>
        </div>

        <div className="mv-visit">
          <span>🚀</span>
          <div><strong>Could we visit?</strong> {uni.visit}</div>
        </div>

        <div className="modal-funfact">
          <span>💡</span><span>{uni.funFact}</span>
        </div>
      </div>
    </div>
  )
}

function MultiverseScreen({ onBack }) {
  const [selected, setSelected] = useState(null)

  return (
    <div className="explore multiverse-screen">
      <div className="explore-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h2 className="explore-title">🌀 The Multiverse</h2>
        <p className="explore-sub">What if ours isn't the only universe?</p>
      </div>

      <div className="hubble-banner mv-banner">
        <div className="hubble-banner-icon">🌀</div>
        <div className="hubble-banner-text">
          <div className="hubble-banner-title">Could there be other universes?</div>
          <div className="hubble-banner-sub">
            Our universe is unbelievably huge — but some scientists think it might not be the only one!
            Here are 8 big ideas about other universes. Tap any portal to explore it, and check the
            "Is it real?" meter to see how seriously scientists take it.
          </div>
        </div>
      </div>

      <div className="galaxy-cards mv-cards">
        {MULTIVERSE.map(u => (
          <button key={u.id} className="galaxy-card mv-card" style={{'--mc':u.color, '--gc':u.color}}
            onClick={() => { playClick(); setSelected(u) }}>
            <div className="mv-card-art">
              <div className="mv-portal"><span className="mv-portal-emoji">{u.emoji}</span></div>
              <div className="mv-card-chip">{u.type}</div>
            </div>
            <div className="card-body">
              <div className="card-name" style={{color:u.color}}>{u.name}</div>
              <div className="card-nick">{u.nickname}</div>
              <div className="mv-mini-meter"><div className="mv-mini-fill" style={{width:`${u.real}%`}}/></div>
              <div className="card-type">Tap to explore →</div>
            </div>
          </button>
        ))}
      </div>

      <div className="mv-honesty">
        <div className="mv-honesty-icon">🔭</div>
        <div>
          <div className="mv-honesty-title">Remember, Explorer!</div>
          <div className="mv-honesty-body">
            Nobody has ever proved that ANY of these other universes exist. Scientists have not seen one,
            photographed one, or visited one — these are clever ideas built from the maths and the clues we
            have so far. That is what makes them so exciting: one day, someone might find the answer.
            Maybe it will be you!
          </div>
        </div>
      </div>

      {selected && <MultiverseModal uni={selected} onClose={() => setSelected(null)}/>}
    </div>
  )
}

// ── Quiz Screen ────────────────────────────────────────────────────────────────
// Pick 10 random questions and shuffle each one's choices so the correct
// answer never sits in a predictable spot.
const prepQuestions = pool =>
  shuffle(pool).slice(0, Math.min(10, pool.length)).map(q => ({ ...q, choices: shuffle(q.choices) }))

// `questionPool` pins the quiz to one pool (used by the Facts quiz). Left null,
// the player first picks a difficulty.
function QuizScreen({ onBack, questionPool = null }) {
  const [level, setLevel] = useState(questionPool ? 'preset' : null)
  const [questions, setQuestions] = useState(
    () => questionPool ? prepQuestions(questionPool) : []
  )
  const [mode, setMode] = useState(null)          // null (choosing) | 1 | 2
  const [qi, setQi] = useState(0)
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useState(0)
  const [scores, setScores] = useState([0, 0])    // two-player scores
  const [done, setDone] = useState(false)
  const [streak, setStreak] = useState(0)
  const [handoff, setHandoff] = useState(false)   // "pass the device" screen (2P)

  const twoP = mode === 2
  const player = qi % 2                           // whose turn (2P): 0 = P1, 1 = P2
  const easy = level === 'easy'

  function chooseLevel(l) {
    playClick()
    const pool = l === 'easy' ? EASY_QUESTIONS : QUESTIONS
    setQuestions(prepQuestions(pool))
    setLevel(l)
  }

  if (level === null) {
    return (
      <div className="quiz">
        <Stars/>
        <div className="quiz-top">
          <button className="back-btn" onClick={onBack}>← Back</button>
        </div>
        <div className="quiz-card quiz-mode-card-select">
          <h3 className="quiz-question">🧠 Pick your level</h3>
          <div className="quiz-mode-btns">
            <button className="quiz-mode-btn level-easy" onClick={() => chooseLevel('easy')}>
              <div className="qm-icon">🧸</div>
              <div className="qm-name">Little Explorer</div>
              <div className="qm-desc">Ages 4–6 · big pictures, 3 easy choices</div>
            </button>
            <button className="quiz-mode-btn" onClick={() => chooseLevel('normal')}>
              <div className="qm-icon">🔭</div>
              <div className="qm-name">Space Cadet</div>
              <div className="qm-desc">Ages 7+ · the full planet &amp; galaxy quiz</div>
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (mode === null) {
    return (
      <div className="quiz">
        <Stars/>
        <div className="quiz-top">
          <button className="back-btn" onClick={() => { playClick(); if (level === 'preset') onBack(); else setLevel(null) }}>← Back</button>
        </div>
        <div className="quiz-card quiz-mode-card-select">
          {easy && <div className="quiz-level-tag">🧸 Little Explorer</div>}
          <h3 className="quiz-question">🧠 How do you want to play?</h3>
          <div className="quiz-mode-btns">
            <button className="quiz-mode-btn" onClick={() => { playClick(); setMode(1) }}>
              <div className="qm-icon">🧑‍🚀</div>
              <div className="qm-name">1 Player</div>
              <div className="qm-desc">{questions.length} questions, beat your best!</div>
            </button>
            <button className="quiz-mode-btn" onClick={() => { playClick(); setMode(2) }}>
              <div className="qm-icon">🧑‍🚀🧑‍🚀</div>
              <div className="qm-name">2 Players</div>
              <div className="qm-desc">Pass &amp; play — take turns, {questions.length / 2} questions each!</div>
            </button>
          </div>
        </div>
      </div>
    )
  }

  const q = questions[qi]
  const _raw = PLANETS.find(p => p.id === q.planet) || GALAXIES.find(g => g.id === q.galaxy) || BLACK_HOLES.find(b => b.id === q.galaxy)
  const imgData = _raw && q.galaxy ? { ..._raw, img: _raw.thumb } : _raw
  const correctAnswer = q.answer ?? (q.planet ? q.planet.charAt(0).toUpperCase()+q.planet.slice(1) : '')

  function pick(choice) {
    if (picked) return
    setPicked(choice)
    const isRight = choice === correctAnswer
    if (isRight) {
      playCorrect()
      if (twoP) setScores(s => { const n = [...s]; n[player]++; return n })
      else { setScore(s=>s+1); setStreak(s=>s+1) }
    } else { playWrong(); setStreak(0) }
  }

  function next() {
    playClick()
    if (qi+1 >= questions.length) setDone(true)
    else {
      setQi(q=>q+1); setPicked(null)
      // Hide the next question behind a handoff card so the other player
      // can take the device without seeing it early.
      if (twoP) setHandoff(true)
    }
  }

  function restart() {
    playClick()
    const pool = level === 'preset' ? questionPool : easy ? EASY_QUESTIONS : QUESTIONS
    setQuestions(prepQuestions(pool))
    setQi(0); setPicked(null); setScore(0); setScores([0,0])
    setDone(false); setStreak(0); setMode(null); setHandoff(false)
    // Level is kept so a rematch stays at the same difficulty; the mode
    // screen's Back button returns to the level picker.
  }

  if (done && twoP) {
    const [a, b] = scores
    const winner = a === b ? null : a > b ? 1 : 2
    return (
      <div className="quiz-result">
        <Stars/>
        <div className="result-box">
          <div className="result-grade">{winner ? `🏆 Player ${winner} Wins!` : '🤝 It\'s a Tie!'}</div>
          <div className="quiz-2p-final">
            <div className={`quiz-2p-score${winner===1?' won':''}`}>🔵 Player 1<strong>{a}</strong></div>
            <div className={`quiz-2p-score${winner===2?' won':''}`}>🟣 Player 2<strong>{b}</strong></div>
          </div>
          <p className="result-msg">{winner ? 'Amazing space knowledge! Rematch to defend the title?' : 'Two equally brilliant explorers! Play again to settle it!'}</p>
          <div className="result-btns">
            <button className="quiz-btn primary" onClick={restart}>🔄 Rematch</button>
            <button className="quiz-btn secondary" onClick={onBack}>🏠 Home</button>
          </div>
        </div>
      </div>
    )
  }

  if (done) {
    const pct = Math.round((score/questions.length)*100)
    const grade = easy
      ? (pct>=80?'🌟 Super Star!':pct>=50?'🚀 Great Job!':'🧸 Well Done!')
      : (pct>=90?'🏆 Astronaut!':pct>=70?'🚀 Explorer!':pct>=50?'🌟 Cadet!':'🌙 Beginner!')
    const msg = easy
      ? (pct>=80?'Wow! You know so much about space. Walli is proud of you!'
        : pct>=50?'Nice work, little explorer! Want to play one more?'
        : 'Great trying! Every explorer learns a bit more each time. Play again!')
      : (pct>=90?'Incredible! You know the cosmos better than most astronomers!'
        : pct>=70?'Great job! You\'re a true space explorer!'
        : pct>=50?'Good effort! Keep studying the planets and galaxies!'
        : 'Keep exploring! Visit the Planet and Galaxy sections to learn more.')
    return (
      <div className="quiz-result">
        <Stars/>
        <div className="result-box">
          <div className="result-grade">{grade}</div>
          <div className="result-score">{score}/{questions.length}</div>
          <div className="result-pct">{pct}% correct</div>
          <p className="result-msg">{msg}</p>
          <div className="result-btns">
            <button className="quiz-btn primary" onClick={restart}>🔄 Try Again</button>
            <button className="quiz-btn secondary" onClick={onBack}>🏠 Home</button>
          </div>
        </div>
      </div>
    )
  }

  if (handoff) {
    return (
      <div className="quiz">
        <Stars/>
        <div className="quiz-top">
          <button className="back-btn" onClick={onBack}>← Back</button>
          <div className="quiz-score-live">🔵 {scores[0]} · 🟣 {scores[1]}</div>
        </div>
        <div className={`quiz-card quiz-handoff${player === 1 ? ' p2' : ''}`}>
          <div className="handoff-icon">🤝</div>
          <h3 className="quiz-question">Pass the device to {player === 0 ? '🔵 Player 1' : '🟣 Player 2'}</h3>
          <p className="handoff-sub">No peeking! Tap when you&apos;re holding it.</p>
          <button className="next-btn" onClick={() => { playClick(); setHandoff(false) }}>
            I&apos;m ready — show my question →
          </button>
        </div>
      </div>
    )
  }

  const isGalaxyImg = !!q.galaxy
  const imgLabel = isGalaxyImg ? '🔭 Real Hubble / NASA Photo' : '🔭 Real NASA Photo'

  return (
    <div className="quiz">
      <Stars/>
      <div className="quiz-top">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <div className="quiz-progress">
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{width:`${((qi)/questions.length)*100}%`}}/>
          </div>
          <span className="progress-label">Q{qi+1} / {questions.length}</span>
        </div>
        <div className="quiz-score-live">{twoP ? `🔵 ${scores[0]} · 🟣 ${scores[1]}` : `⭐ ${score}`}</div>
      </div>

      {twoP && (
        <div className={`quiz-turn-banner${player === 1 ? ' p2' : ''}`}>
          {player === 0 ? '🔵 Player 1' : '🟣 Player 2'} — your question!
        </div>
      )}
      {!twoP && streak >= 2 && <div className="streak-badge">🔥 {streak} streak!</div>}

      <div className={`quiz-card${easy ? ' quiz-easy' : ''}`}>
        {q.type === 'image-to-name' && (
          <div className="quiz-img-wrap">
            <img
              src={imgData?.img} alt="Mystery object"
              className={`quiz-planet-img${isGalaxyImg ? ' quiz-galaxy-img' : ''}`}
              loading="lazy"
            />
            <div className="quiz-img-label">{imgLabel}</div>
          </div>
        )}

        <h3 className="quiz-question">{q.q}</h3>

        {q.type === 'text-to-name' && picked && (
          <div className={`quiz-hint ${picked===correctAnswer?'hint-right':'hint-wrong'}`}>
            {picked===correctAnswer ? '✅ Correct! ' : `❌ The answer is ${correctAnswer}. `}
            {q.hint}
          </div>
        )}
        {q.type === 'image-to-name' && picked && picked !== correctAnswer && (
          <div className="quiz-hint hint-wrong">
            ❌ That's {picked}. This is actually <strong>{correctAnswer}</strong>!
          </div>
        )}
        {q.type === 'image-to-name' && picked && picked === correctAnswer && (
          <div className="quiz-hint hint-right">
            ✅ Correct! That's <strong>{correctAnswer}</strong>!{' '}
            {PLANETS.find(p=>p.name===correctAnswer)?.facts[0] ||
             GALAXIES.find(g=>g.name===correctAnswer)?.facts[0]}
          </div>
        )}

        <div className="quiz-choices">
          {q.choices.map(choice => {
            const cp = PLANETS.find(p=>p.name===choice)
            const isCorrect = choice === correctAnswer
            const isPicked = choice === picked
            let cls = 'choice-btn'
            if (picked) cls += isCorrect ? ' correct' : isPicked ? ' wrong' : ' dimmed'
            return (
              <button key={choice} className={cls} onClick={() => pick(choice)} disabled={!!picked}>
                {(q.type === 'image-to-name' || q.textChoices) ? (
                  <span>{choice}</span>
                ) : (
                  <>
                    {cp && <img src={cp.img} alt={choice} className="choice-planet-img" loading="lazy"/>}
                    <span>{choice}</span>
                  </>
                )}
              </button>
            )
          })}
        </div>

        {picked && (
          <button className="next-btn" onClick={next}>
            {qi+1 >= questions.length ? '🏁 See Results' : 'Next Question →'}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Walli's Space World: Galaxy Quest ─────────────────────────────────────────
// Story adventure: 12 worlds, Nova the robot companion, crystals & coins,
// badges, stickers, ship unlocks, saved progress, certificate ending.

const WW_SHIPS = [
  { id:'explorer1', name:'Explorer One',   emoji:'🚀', unlock:0,  desc:'Your trusty starter rocket' },
  { id:'lander',    name:'Lunar Lander',   emoji:'🛸', unlock:2,  desc:'Perfect for gentle moon landings' },
  { id:'rover',     name:'Mars Rover',     emoji:'🛞', unlock:4,  desc:'Six wheels for red-planet dust' },
  { id:'nova',      name:'Nova Rocket',    emoji:'🛰️', unlock:6,  desc:'Built by Nova — twice the speed!' },
  { id:'cruiser',   name:'Galaxy Cruiser', emoji:'✨', unlock:9,  desc:'Crosses light-years in comfort' },
  { id:'voyager',   name:'Star Voyager',   emoji:'🌟', unlock:12, desc:'The legendary explorer\'s ship' },
]

const WW_RANKS = [
  { min:0,  title:'Space Cadet' }, { min:3, title:'Rocket Pilot' },
  { min:6,  title:'Star Navigator' }, { min:9, title:'Mission Commander' },
  { min:12, title:'Master Space Explorer' },
]

const WW_WORLDS = [
  {
    id:'earth', name:'Earth Launch Base', emoji:'🌍', color:'#4fc3f7',
    tag:'Astronaut Training',
    intro:[
      { who:'walli', text:'A message from Space Academy! Strange signals are coming from all across the Solar System... and they picked US to investigate!' },
      { who:'nova',  text:'Beep-boop! Mission accepted, Walli! But first — every great explorer completes launch training. Let\'s get you ready!' },
    ],
    mini:{ type:'checklist', title:'Complete astronaut training', items:[
      { id:'suit',   emoji:'👨‍🚀', label:'Put on the spacesuit' },
      { id:'oxygen', emoji:'🫧',  label:'Pack oxygen tanks' },
      { id:'nav',    emoji:'🧭',  label:'Switch on the nav computer' },
      { id:'fuel',   emoji:'⛽',  label:'Fuel the rocket' },
      { id:'belt',   emoji:'🔒',  label:'Fasten your seatbelt' },
    ]},
    fact:'Rockets must reach about 28,000 km/h to stay in orbit around Earth — that\'s 40 times faster than a passenger jet!',
    badge:'Cadet Wings', sticker:'🌍',
  },
  {
    id:'moon', name:'The Moon', emoji:'🌙', color:'#cfd8dc',
    tag:'Rock Collector',
    intro:[
      { who:'walli', text:'We\'ve landed on the Moon! Whoa... I can jump SO high here!' },
      { who:'nova',  text:'That\'s because Moon gravity is 6 times weaker than Earth\'s! Quick — the signal left glowing moon rocks scattered around. Collect them all!' },
    ],
    mini:{ type:'collect', title:'Collect the glowing items', items:[
      { id:'r1', emoji:'🌑', x:14, y:30 }, { id:'r2', emoji:'🌑', x:70, y:55 },
      { id:'r3', emoji:'🌑', x:40, y:75 }, { id:'s1', emoji:'⭐', x:24, y:62 },
      { id:'s2', emoji:'⭐', x:80, y:25 }, { id:'f1', emoji:'🔋', x:55, y:40 },
    ]},
    fact:'The footprints Apollo astronauts left on the Moon in 1969 are still there — no wind or rain exists to wipe them away!',
    badge:'Moon Explorer', sticker:'🌙',
  },
  {
    id:'mars', name:'Mars', emoji:'🔴', color:'#ff7043',
    tag:'Red Planet Detective',
    intro:[
      { who:'walli', text:'The Red Planet! The signal is coming from under these rocks somewhere...' },
      { who:'nova',  text:'My sensors agree! Mars looks red because its soil is full of rust — iron oxide. Search under the rocks, Walli!' },
    ],
    mini:{ type:'reveal', title:'Search under the rocks', cover:'🪨', finds:[
      { id:'water',   emoji:'💧', label:'Frozen Water' },
      { id:'crystal', emoji:'💎', label:'Rare Crystal' },
      { id:'signal',  emoji:'📻', label:'Signal Beacon' },
    ]},
    fact:'Mars has the tallest volcano in the Solar System — Olympus Mons is 21 km high, almost 3 times taller than Mount Everest!',
    badge:'Mars Discoverer', sticker:'🔴',
  },
  {
    id:'belt', name:'Asteroid Belt', emoji:'☄️', color:'#bcaaa4',
    tag:'Space Pilot',
    intro:[
      { who:'nova',  text:'Warning, beep-beep! We\'re entering the Asteroid Belt between Mars and Jupiter. Millions of space rocks ahead!' },
      { who:'walli', text:'Don\'t worry Nova — watch my flying! Pick the safe lane each time!' },
    ],
    mini:{ type:'dodge', title:'Dodge the asteroids', rounds:5, obstacles:['☄️','🪨','☄️','🪨','☄️'] },
    fact:'Despite the movies, the Asteroid Belt is mostly empty space — spacecraft fly through it safely all the time!',
    badge:'Belt Runner', sticker:'☄️',
  },
  {
    id:'jupiter', name:'Jupiter', emoji:'🟠', color:'#e8a87c',
    tag:'Storm Chaser',
    intro:[
      { who:'walli', text:'Jupiter! It\'s GIGANTIC — more than 1,300 Earths could fit inside!' },
      { who:'nova',  text:'And see that giant red spot? A storm bigger than Earth that\'s been raging for 350 years! Fly around the storms, Walli!' },
    ],
    mini:{ type:'dodge', title:'Fly around the giant storms', rounds:5, obstacles:['🌪️','⚡','🌪️','⚡','🌪️'] },
    fact:'Jupiter acts like Earth\'s bodyguard — its huge gravity catches asteroids and comets that might otherwise hit our planet!',
    badge:'Jupiter Pilot', sticker:'🌪️',
  },
  {
    id:'saturn', name:'Saturn', emoji:'🪐', color:'#f0d080',
    tag:'Ring Master',
    intro:[
      { who:'walli', text:'Saturn\'s rings! They\'re even more beautiful up close!' },
      { who:'nova',  text:'They\'re made of billions of pieces of ice and rock — some tiny as dust, some big as houses! Fly through the gaps carefully!' },
    ],
    mini:{ type:'rings', title:'Fly through the ring gaps', total:5 },
    fact:'Saturn\'s rings are 282,000 km wide but only about 1 km thick — like a sheet of paper the size of a football field!',
    badge:'Ring Champion', sticker:'🪐',
  },
  {
    id:'neptune', name:'Neptune', emoji:'🔵', color:'#5c9dff',
    tag:'Wind Rider',
    intro:[
      { who:'nova',  text:'Brrr! Neptune — the windiest place in the Solar System. Winds here reach 2,100 km per hour!' },
      { who:'walli', text:'The wind is blowing space crystals everywhere! Help me catch them before they fly away!' },
    ],
    mini:{ type:'collect', title:'Catch the wind-blown crystals', items:[
      { id:'c1', emoji:'💎', x:18, y:28 }, { id:'c2', emoji:'💎', x:72, y:60 },
      { id:'c3', emoji:'🔷', x:45, y:74 }, { id:'c4', emoji:'🔷', x:30, y:52 },
      { id:'c5', emoji:'💠', x:82, y:30 }, { id:'c6', emoji:'💠', x:58, y:38 },
    ]},
    fact:'Neptune\'s winds are faster than the speed of sound on Earth — the strongest storms our planet has ever seen would feel gentle there!',
    badge:'Wind Rider', sticker:'💨',
  },
  {
    id:'station', name:'Space Station', emoji:'🛰️', color:'#90caf9',
    tag:'Repair Engineer',
    intro:[
      { who:'nova',  text:'Beep! Distress call from the Space Station — a meteor shower damaged their systems!' },
      { who:'walli', text:'Engineers to the rescue! Nova, hand me the tools — let\'s fix every broken part!' },
    ],
    mini:{ type:'repair', title:'Repair the station', parts:[
      { id:'solar',  emoji:'🔆', label:'Solar Panel' },
      { id:'antenna',emoji:'📡', label:'Antenna' },
      { id:'airlock',emoji:'🚪', label:'Airlock' },
      { id:'oxygen', emoji:'🫧', label:'Oxygen System' },
    ]},
    fact:'The International Space Station circles the whole Earth every 90 minutes — astronauts see 16 sunrises and 16 sunsets every day!',
    badge:'Star Engineer', sticker:'🛰️',
  },
  {
    id:'nebula', name:'Nebula Kingdom', emoji:'🌈', color:'#ce93d8',
    tag:'Star Gardener',
    intro:[
      { who:'walli', text:'Wooooah... the colours! It\'s like swimming inside a rainbow cloud!' },
      { who:'nova',  text:'This is a nebula — a giant cloud of gas and dust where baby stars are born! Gather the newborn stars gently!' },
    ],
    mini:{ type:'collect', title:'Gather the newborn stars', items:[
      { id:'n1', emoji:'✨', x:20, y:30 }, { id:'n2', emoji:'⭐', x:70, y:25 },
      { id:'n3', emoji:'🌟', x:45, y:60 }, { id:'n4', emoji:'✨', x:78, y:65 },
      { id:'n5', emoji:'⭐', x:28, y:70 }, { id:'n6', emoji:'🌟', x:55, y:35 },
    ]},
    fact:'Nebulae are star nurseries — the famous Pillars of Creation nebula is making brand-new stars right now, and our own Sun was born in one!',
    badge:'Star Gardener', sticker:'✨',
  },
  {
    id:'blackhole', name:'Black Hole Zone', emoji:'🕳️', color:'#b39ddb',
    tag:'Great Escape',
    intro:[
      { who:'nova',  text:'DANGER, beep-beep-BEEP! A black hole is pulling us in! Its gravity is so strong even light can\'t escape!' },
      { who:'walli', text:'Full power, Nova! Tap the thrusters as fast as you can — we\'re breaking free!' },
    ],
    mini:{ type:'tapfast', title:'Escape the black hole!', taps:15 },
    fact:'Don\'t worry — the nearest black hole is about 1,500 light-years away. Black holes don\'t wander around "eating" planets; they follow orbits just like stars!',
    badge:'Escape Artist', sticker:'🕳️',
  },
  {
    id:'alienx', name:'Alien Planet X', emoji:'👽', color:'#69f0ae',
    tag:'First Contact',
    intro:[
      { who:'walli', text:'The mystery signal... it was coming from HERE! Look — a friendly little alien! Hello, I\'m Walli!' },
      { who:'nova',  text:'Translating... the alien\'s name is ZIP! Zip wants to be friends. Listen to the clues and pick the perfect gift!' },
    ],
    mini:{ type:'gift', title:'Make friends with Zip', roundsData:[
      { clue:'Zip says: "I love things that SPARKLE and shine!"', options:['💎','🥕','⚽'], answer:'💎' },
      { clue:'Zip says: "I love things that play beautiful SOUNDS!"', options:['🧦','🎵','🥄'], answer:'🎵' },
      { clue:'Zip says: "I love things that GROW into flowers!"', options:['🌱','🧊','🔩'], answer:'🌱' },
    ]},
    fact:'Astronomers have already discovered more than 5,000 planets around other stars — they\'re called exoplanets, and some might have the right conditions for life!',
    badge:'Alien Ambassador', sticker:'👽',
  },
  {
    id:'colony', name:'Future Space Colony', emoji:'🏠', color:'#ffab40',
    tag:'Colony Builder',
    intro:[
      { who:'nova',  text:'Final mission, Walli! Space Academy wants us to build humanity\'s first Mars colony!' },
      { who:'walli', text:'Then let\'s build it right — with clean solar power, a greenhouse for fresh food, and water recycling! Every drop counts in space!' },
    ],
    mini:{ type:'checklist', title:'Build the Mars colony', items:[
      { id:'dome',   emoji:'🏠', label:'Raise the habitat dome' },
      { id:'solar',  emoji:'🔆', label:'Install solar panels' },
      { id:'green',  emoji:'🌱', label:'Plant the greenhouse' },
      { id:'water',  emoji:'💧', label:'Connect the water recycler' },
      { id:'flag',   emoji:'🚩', label:'Plant the explorer flag!' },
    ]},
    fact:'Future Mars colonies will run on solar energy and recycle almost 100% of their water — the same green technology that helps protect Earth today!',
    badge:'Colony Founder', sticker:'🏠',
  },
]

// ── Small shared pieces ────────────────────────────────────────────────────────
function Speech({ who, text }) {
  const isNova = who === 'nova'
  const name = getExplorerName()
  const personalised = name ? text.replace(/\bExplorer\b/g, name) : text
  return (
    <div className={`walli-says-wrap${isNova ? ' nova' : ''}`}>
      <div className="walli-char-icon">{isNova ? '🤖' : '🧑‍🚀'}</div>
      <div className="walli-bubble">
        <span className={`walli-name-chip${isNova ? ' nova-chip' : ''}`}>{isNova ? 'Nova' : 'Walli'}</span>
        <p>{personalised}</p>
      </div>
    </div>
  )
}

function Dialogue({ lines, onDone }) {
  const [i, setI] = useState(0)
  const next = () => { playClick(); i < lines.length - 1 ? setI(i + 1) : onDone() }
  return (
    <div className="ww-dialogue" onClick={next}>
      <Speech who={lines[i].who} text={lines[i].text}/>
      <div className="tap-hint">👆 Tap to continue</div>
      <div className="scene-dots">
        {lines.map((_, d) => <span key={d} className={`scene-dot ${d === i ? 'active' : d < i ? 'done' : ''}`}/>)}
      </div>
    </div>
  )
}

// ── Mini-game engines ──────────────────────────────────────────────────────────
function MiniChecklist({ cfg, onDone }) {
  const [got, setGot] = useState([])
  const tick = id => { if (got.includes(id)) return; playCorrect(); const n = [...got, id]; setGot(n); if (n.length === cfg.items.length) setTimeout(onDone, 700) }
  return (
    <div>
      <div className="checklist">
        {cfg.items.map(it => (
          <button key={it.id} className={`checklist-item${got.includes(it.id) ? ' checked' : ''}`} onClick={() => tick(it.id)}>
            <span className="cl-emoji">{it.emoji}</span>
            <span className="cl-label">{it.label}</span>
            <span className="cl-tick">{got.includes(it.id) ? '✅' : '⬜'}</span>
          </button>
        ))}
      </div>
      <div className="mission-prog">{got.length}/{cfg.items.length} complete</div>
    </div>
  )
}

function MiniCollect({ cfg, onDone }) {
  const [got, setGot] = useState([])
  const grab = id => { if (got.includes(id)) return; playCorrect(); const n = [...got, id]; setGot(n); if (n.length === cfg.items.length) setTimeout(onDone, 700) }
  return (
    <div className="collect-arena">
      {cfg.items.map(it => !got.includes(it.id) && (
        <button key={it.id} className="collect-btn" style={{ left:`${it.x}%`, top:`${it.y}%` }} onClick={() => grab(it.id)}>{it.emoji}</button>
      ))}
      <div className="collect-counter">{got.length}/{cfg.items.length} collected</div>
    </div>
  )
}

function MiniReveal({ cfg, onDone }) {
  const [found, setFound] = useState([])
  const dig = id => { if (found.includes(id)) return; playCorrect(); const n = [...found, id]; setFound(n); if (n.length === cfg.finds.length) setTimeout(onDone, 700) }
  return (
    <div className="search-grid">
      {cfg.finds.map(it => (
        <button key={it.id} className={`search-rock${found.includes(it.id) ? ' revealed' : ''}`} onClick={() => dig(it.id)}>
          {found.includes(it.id)
            ? <><div className="found-emoji">{it.emoji}</div><div className="found-label">{it.label}</div></>
            : <><div className="rock-emoji">{cfg.cover}</div><div className="rock-tap">Tap to search!</div></>}
        </button>
      ))}
    </div>
  )
}

function MiniDodge({ cfg, onDone }) {
  const [round, setRound] = useState(0)
  const [danger, setDanger] = useState(() => Math.floor(Math.random() * 3))
  const [phase, setPhase] = useState('choose')
  const [dodged, setDodged] = useState(0)
  const LABELS = ['⬅️ Left', '⬆️ Centre', '➡️ Right']
  const pick = lane => {
    if (phase !== 'choose') return
    playClick()
    const safe = lane !== danger
    if (safe) { playCorrect(); setDodged(d => d + 1) } else playWrong()
    setPhase(safe ? 'safe' : 'hit')
    setTimeout(() => {
      if (round + 1 >= cfg.rounds) { onDone(); return }
      setRound(r => r + 1); setDanger(Math.floor(Math.random() * 3)); setPhase('choose')
    }, 900)
  }
  return (
    <div>
      <div className="dodge-board"><span>Round {round+1}/{cfg.rounds}</span><span>✅ {dodged} dodged</span></div>
      <div className="dodge-status">
        {phase === 'choose' && <div className="dodge-warning">⚠️ INCOMING! Pick a safe lane!</div>}
        {phase === 'safe'   && <div className="dodge-ok">✅ Dodged it!</div>}
        {phase === 'hit'    && <div className="dodge-bad">💥 Bumped! Keep going...</div>}
      </div>
      <div className="dodge-lanes">
        {[0,1,2].map(i => (
          <button key={i} className={`dodge-lane${phase !== 'choose' && i === danger ? ' is-danger' : ''}${phase !== 'choose' ? ' no-click' : ''}`} onClick={() => pick(i)}>
            <div className="dodge-top">{i === danger ? cfg.obstacles[round] : '🌟'}</div>
            <div className="dodge-lbl">{LABELS[i]}</div>
            <div className="dodge-rocket">{i !== danger ? '🚀' : ''}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

function MiniRings({ cfg, onDone }) {
  const [gaps] = useState(() => Array.from({ length: cfg.total }, () => Math.random() > 0.5 ? 'left' : 'right'))
  const [ring, setRing] = useState(0)
  const [phase, setPhase] = useState('choose')
  const fly = side => {
    if (phase !== 'choose') return
    playClick()
    if (side === gaps[ring]) {
      playCorrect(); setPhase('pass')
      setTimeout(() => { ring + 1 >= cfg.total ? onDone() : (setRing(r => r + 1), setPhase('choose')) }, 700)
    } else {
      playWrong(); setPhase('crash')
      setTimeout(() => setPhase('choose'), 800)
    }
  }
  return (
    <div>
      <div className="ring-stats">Ring {ring+1}/{cfg.total}</div>
      <div className="ring-visual-wrap">
        <div className="ring-bar">
          {gaps[ring] === 'left'
            ? <><div className="ring-gap"/><div className="ring-solid" style={{flex:1}}/></>
            : <><div className="ring-solid" style={{flex:1}}/><div className="ring-gap"/></>}
        </div>
        {phase === 'pass'  && <div className="ring-result pass-r">✅ Through the gap!</div>}
        {phase === 'crash' && <div className="ring-result crash-r">💥 Bounced off! Try again</div>}
        <div className="ring-rocket">🚀</div>
      </div>
      {phase === 'choose' && (
        <div className="ring-controls">
          <p>Which side has the gap?</p>
          <div className="ring-btns">
            <button className="ring-btn" onClick={() => fly('left')}>⬅️ Left</button>
            <button className="ring-btn" onClick={() => fly('right')}>Right ➡️</button>
          </div>
        </div>
      )}
    </div>
  )
}

function MiniRepair({ cfg, onDone }) {
  const [fixed, setFixed] = useState([])
  const fix = id => { if (fixed.includes(id)) return; playCorrect(); const n = [...fixed, id]; setFixed(n); if (n.length === cfg.parts.length) setTimeout(onDone, 700) }
  return (
    <div>
      <div className="bh-warning">🛠️ {fixed.length}/{cfg.parts.length} systems repaired</div>
      <div className="repair-grid">
        {cfg.parts.map(p => (
          <button key={p.id} className={`repair-part${fixed.includes(p.id) ? ' fixed' : ' broken'}`} onClick={() => fix(p.id)}>
            <div className="repair-emoji">{fixed.includes(p.id) ? '✅' : p.emoji}</div>
            <div className="repair-label">{p.label}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

function MiniTapFast({ cfg, onDone }) {
  const [thrust, setThrust] = useState(0)
  const [pull, setPull] = useState(0)
  const [failed, setFailed] = useState(false)
  const doneRef = useRef(false)

  useEffect(() => {
    if (failed) return
    const iv = setInterval(() => {
      setPull(p => {
        if (doneRef.current) return p
        const np = p + 1.2
        if (np >= 100) { setFailed(true); playWrong() }
        return Math.min(100, np)
      })
    }, 120)
    return () => clearInterval(iv)
  }, [failed])

  const tap = () => {
    if (failed || doneRef.current) return
    tone(500 + thrust * 6, 0.05, 'square', 0.1)
    setThrust(t => {
      const nt = t + 100 / cfg.taps
      if (nt >= 100 && !doneRef.current) { doneRef.current = true; playCorrect(); setTimeout(onDone, 600) }
      return Math.min(100, nt)
    })
  }
  const retry = () => { playClick(); setThrust(0); setPull(0); setFailed(false) }

  return (
    <div className="ww-tapfast">
      <div className="ww-bar-row">🕳️ Black hole pull
        <div className="ww-bar"><div className="ww-bar-fill pull" style={{ width:`${pull}%` }}/></div>
      </div>
      <div className="ww-bar-row">🔥 Thruster power
        <div className="ww-bar"><div className="ww-bar-fill thrust" style={{ width:`${thrust}%` }}/></div>
      </div>
      {!failed ? (
        <button className="ww-thrust-btn" onClick={tap}>🚀 TAP! TAP! TAP!</button>
      ) : (
        <div className="ww-tapfail">
          <p>😱 The pull was too strong! Try again!</p>
          <button className="game-btn" onClick={retry}>🔄 Retry Escape</button>
        </div>
      )}
    </div>
  )
}

function MiniGift({ cfg, onDone }) {
  const [round, setRound] = useState(0)
  const [feedback, setFeedback] = useState(null)
  const r = cfg.roundsData[round]
  const give = opt => {
    if (feedback === 'yes') return
    if (opt === r.answer) {
      playCorrect(); setFeedback('yes')
      setTimeout(() => {
        setFeedback(null)
        round + 1 >= cfg.roundsData.length ? onDone() : setRound(x => x + 1)
      }, 900)
    } else { playWrong(); setFeedback('no'); setTimeout(() => setFeedback(null), 700) }
  }
  return (
    <div className="ww-gift">
      <div className="ww-gift-zip">👽</div>
      <div className="ww-gift-clue">{r.clue}</div>
      <div className="ww-gift-row">
        {r.options.map(o => <button key={o} className="ww-gift-btn" onClick={() => give(o)}>{o}</button>)}
      </div>
      {feedback === 'yes' && <div className="dodge-ok">💚 Zip LOVES it!</div>}
      {feedback === 'no'  && <div className="dodge-bad">🤔 Zip shakes their head... try another!</div>}
      <div className="mission-prog">Gift {round+1}/{cfg.roundsData.length}</div>
    </div>
  )
}

const WW_MINIS = { checklist:MiniChecklist, collect:MiniCollect, reveal:MiniReveal, dodge:MiniDodge, rings:MiniRings, repair:MiniRepair, tapfast:MiniTapFast, gift:MiniGift }

// ── Save helpers ───────────────────────────────────────────────────────────────
function getExplorerName() {
  try { return localStorage.getItem('walli-name') || '' } catch { return '' }
}

const WW_KEY = 'walli-world-save'
function wwLoad() {
  try { return JSON.parse(localStorage.getItem(WW_KEY)) || { done:{}, crystals:0, coins:0 } }
  catch { return { done:{}, crystals:0, coins:0 } }
}

// ── Main game ──────────────────────────────────────────────────────────────────
function WalliGame({ onBack }) {
  const [save, setSave] = useState(wwLoad)
  const [scene, setScene] = useState('map')   // map | intro | play | reward | cert
  const [worldIdx, setWorldIdx] = useState(0)

  useEffect(() => {
    try { localStorage.setItem(WW_KEY, JSON.stringify(save)) } catch { /* private mode */ }
  }, [save])

  const doneCount = Object.keys(save.done).length
  const rank = [...WW_RANKS].reverse().find(r => doneCount >= r.min)
  const unlockedIdx = WW_WORLDS.findIndex(w => !save.done[w.id])
  const allDone = doneCount >= WW_WORLDS.length
  const world = WW_WORLDS[worldIdx]

  const openWorld = i => {
    if (i > (unlockedIdx === -1 ? WW_WORLDS.length : unlockedIdx)) { playWrong(); return }
    playClick(); setWorldIdx(i); setScene('intro')
  }

  const finishWorld = () => {
    playCorrect()
    setSave(s => s.done[world.id] ? s : ({
      done: { ...s.done, [world.id]: true },
      crystals: s.crystals + 5,
      coins: s.coins + 10,
    }))
    setScene('reward')
  }

  // ── Map ──
  if (scene === 'map') {
    return (
      <div className="ww-screen">
        <Stars/>
        <div className="ww-inner">
          <div className="blaster-top">
            <button className="back-btn" onClick={onBack}>← Back</button>
            <h2 className="blaster-title">🗺️ Galaxy Quest</h2>
          </div>

          <div className="ww-hud">
            <span className="bh-chip">🎖️ <strong>{rank.title}</strong></span>
            <span className="bh-chip">💎 <strong>{save.crystals}</strong></span>
            <span className="bh-chip">🪙 <strong>{save.coins}</strong></span>
            <span className="bh-chip">🌍 <strong>{doneCount}/{WW_WORLDS.length}</strong></span>
          </div>

          {allDone && (
            <button className="ww-cert-banner" onClick={() => { playClick(); setScene('cert') }}>
              🏆 ALL MISSIONS COMPLETE — Tap to receive your Master Explorer Certificate!
            </button>
          )}

          <div className="ww-map">
            {WW_WORLDS.map((w, i) => {
              const done = !!save.done[w.id]
              const locked = i > (unlockedIdx === -1 ? WW_WORLDS.length : unlockedIdx)
              return (
                <button key={w.id} className={`ww-node${done ? ' done' : ''}${locked ? ' locked' : ''}`}
                  style={{ '--wc': w.color }} onClick={() => openWorld(i)}>
                  <div className="ww-node-orb">{locked ? '🔒' : w.emoji}</div>
                  <div className="ww-node-name">{w.name}</div>
                  <div className="ww-node-tag">{done ? `✅ ${w.sticker} collected` : locked ? 'Locked' : w.tag}</div>
                </button>
              )
            })}
          </div>

          <div className="ww-hangar">
            <div className="ww-hangar-title">🛠️ Spaceship Hangar</div>
            <div className="ww-hangar-row">
              {WW_SHIPS.map(sh => {
                const has = doneCount >= sh.unlock
                return (
                  <div key={sh.id} className={`ww-ship${has ? '' : ' locked'}`} title={sh.desc}>
                    <div className="ww-ship-emoji">{has ? sh.emoji : '🔒'}</div>
                    <div className="ww-ship-name">{sh.name}</div>
                    <div className="ww-ship-req">{has ? 'Unlocked!' : `${sh.unlock} worlds`}</div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="ww-motto">"Explore. Learn. Discover. Dream Beyond the Stars." ✨</div>
        </div>
      </div>
    )
  }

  // ── Certificate ──
  if (scene === 'cert') {
    const explorerName = getExplorerName()
    return (
      <div className="ww-screen">
        <Stars/>
        <div className="ww-inner">
          <div className="ww-cert">
            <div className="ww-cert-stars">⭐ ⭐ ⭐</div>
            <div className="ww-cert-head">SPACE ACADEMY CERTIFICATE</div>
            <div className="ww-cert-walli">🧑‍🚀🤖</div>
            <div className="ww-cert-line">This certifies that</div>
            <div className="ww-cert-name">{explorerName ? `${explorerName.toUpperCase()} & WALLI` : 'WALLI & YOU'}</div>
            <div className="ww-cert-line">have completed all 12 missions and earned the rank of</div>
            <div className="ww-cert-rank">🏆 MASTER SPACE EXPLORER 🏆</div>
            <div className="ww-cert-stickers">{WW_WORLDS.map(w => <span key={w.id}>{w.sticker}</span>)}</div>
            <div className="ww-cert-motto">"Explore. Learn. Discover. Dream Beyond the Stars."</div>
            <div className="ww-cert-btns">
              <button className="game-btn" onClick={() => { playClick(); window.print() }}>🖨️ Print Certificate</button>
              <button className="game-btn" onClick={() => { playClick(); setScene('map') }}>🗺️ Back to Star Map</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── World scenes: intro → play → reward ──
  const Mini = WW_MINIS[world.mini.type]
  return (
    <div className="ww-screen">
      <Stars/>
      <div className="ww-inner">
        <div className="blaster-top">
          <button className="back-btn" onClick={() => { playClick(); setScene('map') }}>← Star Map</button>
          <h2 className="blaster-title" style={{ color: world.color }}>{world.emoji} {world.name}</h2>
        </div>

        {scene === 'intro' && (
          <>
            <div className="ww-world-banner" style={{ '--wc': world.color }}>
              <div className="ww-world-emoji">{world.emoji}</div>
              <div>
                <div className="ww-world-name">{world.name}</div>
                <div className="ww-world-tag">Mission: {world.tag}</div>
              </div>
            </div>
            <Dialogue lines={world.intro} onDone={() => setScene('play')}/>
          </>
        )}

        {scene === 'play' && (
          <>
            <div className="ww-mini-title">🎯 {world.mini.title}</div>
            <Mini cfg={world.mini} onDone={finishWorld}/>
          </>
        )}

        {scene === 'reward' && (
          <div className="badge-screen">
            <div className="badge-glow">🏅</div>
            <div className="badge-name">{world.badge} Badge!</div>
            <div className="ww-reward-row">
              <span className="ww-reward-chip">+5 💎</span>
              <span className="ww-reward-chip">+10 🪙</span>
              <span className="ww-reward-chip">Sticker {world.sticker}</span>
            </div>
            <div className="game-fact-box" style={{ textAlign:'left', maxWidth:440 }}>
              <span className="gfb-icon">💡</span>
              <span className="gfb-text"><strong>Space Fact: </strong>{world.fact}</span>
            </div>
            <button className="game-btn" style={{ marginTop:18 }} onClick={() => { playClick(); setScene('map') }}>
              {worldIdx < WW_WORLDS.length - 1 ? '🚀 Next Adventure' : '🏆 Claim Your Certificate'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Space Blaster Arcade (round-based) ────────────────────────────────────────
const BLASTER_W = 420, BLASTER_H = 560

function roundConfig(round) {
  return {
    total: 6 + round * 2,                        // asteroids this round
    spawnEvery: Math.max(24, 60 - round * 5),    // frames between spawns
    speedMin: 1.0 + round * 0.22,
    speedMax: 1.8 + round * 0.32,
  }
}

function SpaceBlaster({ onBack }) {
  const canvasRef = useRef(null)
  const stageRef = useRef(null)
  const [hud, setHud] = useState({ phase:'ready', round:1, score:0, lives:3, destroyed:0, total:roundConfig(1).total, combo:0, shield:false, rapid:false })
  const g = useRef(null)

  const makeAsteroid = (cfg, big = true, x, y) => {
    const r = big ? 16 + Math.random() * 12 : 9 + Math.random() * 4
    const verts = Array.from({ length: 9 }, () => 0.72 + Math.random() * 0.4)
    return {
      x: x ?? 28 + Math.random() * (BLASTER_W - 56),
      y: y ?? -30,
      v: cfg.speedMin + Math.random() * (cfg.speedMax - cfg.speedMin) * (big ? 1 : 1.5),
      vx: (Math.random() - 0.5) * 0.7,
      r, big, verts,
      spin: Math.random() * Math.PI * 2,
      spinV: (Math.random() - 0.5) * 0.05,
      hue: 18 + Math.random() * 20,
    }
  }

  const initRound = (round, score, lives, shield) => {
    const cfg = roundConfig(round)
    g.current = {
      round, score, lives, cfg,
      shipX: BLASTER_W / 2, shipVX: 0,
      targetX: null,
      keys: { left:false, right:false },
      lasers: [], asteroids: [], particles: [], pops: [], powerups: [], rings: [],
      spawned: 0, destroyed: 0, escaped: 0,
      frame: 0, spawnAcc: 0, cooldown: 0,
      invuln: 0, shake: 0, redFlash: 0,
      shield: !!shield, rapidT: 0,
      combo: 0, comboT: 0,
      lastT: performance.now(),
      running: true,
    }
    setHud({ phase:'playing', round, score, lives, destroyed:0, total:cfg.total, combo:0, shield:!!shield, rapid:false })
  }

  const startGame = () => { playClick(); initRound(1, 0, 3, false) }
  const nextRound = () => { playClick(); const s = g.current; initRound(s.round + 1, s.score, s.lives, s.shield) }

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    let raf

    const onKey = (e, down) => {
      if (!g.current?.running) return
      if (e.key === 'ArrowLeft')  { g.current.keys.left  = down; g.current.targetX = null; e.preventDefault() }
      if (e.key === 'ArrowRight') { g.current.keys.right = down; g.current.targetX = null; e.preventDefault() }
    }
    const kd = e => onKey(e, true), ku = e => onKey(e, false)
    window.addEventListener('keydown', kd)
    window.addEventListener('keyup', ku)

    // pointer drag: ship follows finger / mouse x
    const toGameX = e => {
      const rect = cv.getBoundingClientRect()
      return ((e.clientX - rect.left) / rect.width) * BLASTER_W
    }
    let dragging = false
    const pd = e => { dragging = true; if (g.current) g.current.targetX = toGameX(e); e.preventDefault() }
    const pm = e => { if (dragging && g.current) g.current.targetX = toGameX(e) }
    const pu = () => { dragging = false }
    cv.addEventListener('pointerdown', pd)
    window.addEventListener('pointermove', pm)
    window.addEventListener('pointerup', pu)

    const burst = (s, x, y, hue, n, speed) => {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, sp = (0.5 + Math.random()) * speed
        s.particles.push({ x, y, vx: Math.cos(a)*sp, vy: Math.sin(a)*sp, life: 26 + Math.random()*14, max: 40, hue: hue + Math.random()*30 - 15, r: 1.5 + Math.random()*2 })
      }
    }

    const loop = () => {
      raf = requestAnimationFrame(loop)
      const s = g.current
      const t = performance.now() / 1000

      // ── background: deep-space gradient + nebula + parallax stars ──
      const bg = ctx.createLinearGradient(0, 0, 0, BLASTER_H)
      bg.addColorStop(0, '#040918'); bg.addColorStop(0.6, '#081026'); bg.addColorStop(1, '#120a2a')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, BLASTER_W, BLASTER_H)
      const neb = ctx.createRadialGradient(BLASTER_W*0.75, BLASTER_H*0.25, 20, BLASTER_W*0.75, BLASTER_H*0.25, 260)
      neb.addColorStop(0, 'rgba(124,77,255,0.10)'); neb.addColorStop(1, 'rgba(124,77,255,0)')
      ctx.fillStyle = neb; ctx.fillRect(0, 0, BLASTER_W, BLASTER_H)
      const neb2 = ctx.createRadialGradient(BLASTER_W*0.2, BLASTER_H*0.7, 10, BLASTER_W*0.2, BLASTER_H*0.7, 220)
      neb2.addColorStop(0, 'rgba(0,150,200,0.08)'); neb2.addColorStop(1, 'rgba(0,150,200,0)')
      ctx.fillStyle = neb2; ctx.fillRect(0, 0, BLASTER_W, BLASTER_H)

      const scrollBase = s ? s.frame : t * 60
      for (let layer = 0; layer < 3; layer++) {
        const speed = [0.25, 0.6, 1.2][layer]
        ctx.fillStyle = ['rgba(255,255,255,0.25)','rgba(200,220,255,0.45)','rgba(255,255,255,0.8)'][layer]
        for (let i = 0; i < 18; i++) {
          const sx = ((i * 137 + layer * 61) % BLASTER_W)
          const sy = (i * 83 + scrollBase * speed) % BLASTER_H
          const sz = layer + 1
          ctx.fillRect(sx, sy, sz, sz)
        }
      }
      if (!s || !s.running) return

      const now = performance.now()
      const dt = Math.min((now - s.lastT) / 16.667, 2.5)
      s.lastT = now
      s.frame += dt

      // camera shake
      ctx.save()
      if (s.shake > 0) {
        s.shake -= dt
        ctx.translate((Math.random()-0.5) * s.shake, (Math.random()-0.5) * s.shake)
      }

      // ── ship movement: pointer-follow (smooth) or arrow keys ──
      const KEY_SPEED = 6
      if (s.targetX != null) {
        const dx = s.targetX - s.shipX
        s.shipVX = dx * 0.18 * dt
        s.shipX += s.shipVX
      } else {
        s.shipVX = (s.keys.left ? -KEY_SPEED : 0) + (s.keys.right ? KEY_SPEED : 0)
        s.shipX += s.shipVX * dt
      }
      s.shipX = Math.max(20, Math.min(BLASTER_W - 20, s.shipX))
      const shipY = BLASTER_H - 54

      // ── auto-fire ──
      if (s.cooldown > 0) s.cooldown -= dt
      if (s.cooldown <= 0) {
        s.lasers.push({ x: s.shipX, y: shipY - 18 })
        s.cooldown = s.rapidT > 0 ? 6 : 13
        tone(s.rapidT > 0 ? 1100 : 920, 0.045, 'square', 0.05)
      }
      if (s.rapidT > 0) { s.rapidT -= dt; if (s.rapidT <= 0) setHud(h => ({ ...h, rapid:false })) }

      // ── spawn ──
      s.spawnAcc += dt
      if (s.spawned < s.cfg.total && s.spawnAcc >= s.cfg.spawnEvery) {
        s.spawnAcc = 0; s.spawned++
        s.asteroids.push(makeAsteroid(s.cfg))
      }

      // combo timer
      if (s.comboT > 0) { s.comboT -= dt; if (s.comboT <= 0 && s.combo > 0) { s.combo = 0; setHud(h => ({ ...h, combo:0 })) } }

      // ── lasers ──
      s.lasers = s.lasers.filter(l => { l.prevY = l.y; return (l.y -= 10 * dt) > -20 })

      // ── power-ups ──
      s.powerups = s.powerups.filter(p => {
        p.y += 1.6 * dt; p.pulse = (p.pulse || 0) + dt
        if (Math.abs(p.x - s.shipX) < 26 && Math.abs(p.y - shipY) < 26) {
          playCorrect()
          if (p.kind === 'shield') { s.shield = true; setHud(h => ({ ...h, shield:true })) }
          else { s.rapidT = 480; setHud(h => ({ ...h, rapid:true })) }
          s.rings.push({ x: s.shipX, y: shipY, r: 6, max: 46, hue: p.kind === 'shield' ? 190 : 45 })
          return false
        }
        return p.y < BLASTER_H + 20
      })

      // ── asteroids ──
      const spawnChildren = []
      s.asteroids = s.asteroids.filter(a => {
        a.y += a.v * dt
        a.x += a.vx * dt
        if (a.x < a.r || a.x > BLASTER_W - a.r) a.vx *= -1
        a.spin += a.spinV * dt

        // laser hit (swept)
        for (let i = 0; i < s.lasers.length; i++) {
          const l = s.lasers[i]
          if (Math.abs(l.x - a.x) < a.r + 3 && a.y > l.y - (a.r + 8) && a.y < (l.prevY ?? l.y) + (a.r + 8)) {
            s.lasers.splice(i, 1)
            s.combo++; s.comboT = 90
            const mult = Math.min(5, 1 + Math.floor(s.combo / 3))
            const pts = 10 * s.round * mult
            s.score += pts
            s.pops.push({ x: a.x, y: a.y, txt: `+${pts}`, life: 40, mult })
            burst(s, a.x, a.y, a.big ? 28 : 200, a.big ? 14 : 9, a.big ? 2.6 : 2)
            s.rings.push({ x: a.x, y: a.y, r: 4, max: a.r * 2.2, hue: 28 })
            tone(a.big ? 220 : 330, 0.12, 'sawtooth', 0.1)
            if (a.big) {
              s.destroyed++  // wave progress tracks original rocks only; fragments are bonus
              spawnChildren.push(makeAsteroid(s.cfg, false, a.x - 8, a.y), makeAsteroid(s.cfg, false, a.x + 8, a.y))
            }
            if (!a.big && Math.random() < 0.14)
              s.powerups.push({ x: a.x, y: a.y, kind: Math.random() < 0.5 ? 'shield' : 'rapid' })
            setHud(h => ({ ...h, score: s.score, destroyed: s.destroyed, combo: s.combo }))
            return false
          }
        }

        // ship collision — tight, fair hitbox + i-frames after a hit
        if (s.invuln <= 0) {
          const dx = a.x - s.shipX, dy = a.y - shipY
          if (dx*dx + dy*dy < Math.pow(a.r * 0.72 + 12, 2)) {
            burst(s, s.shipX, shipY, 200, 20, 3.2)
            s.rings.push({ x: s.shipX, y: shipY, r: 8, max: 60, hue: 0 })
            s.shake = 14; s.invuln = 110
            if (s.shield) {
              s.shield = false
              tone(180, 0.2, 'square', 0.15)
              setHud(h => ({ ...h, shield:false }))
            } else {
              s.lives--; s.redFlash = 16
              playWrong()
              setHud(h => ({ ...h, lives: s.lives }))
              if (s.lives <= 0) { s.running = false; setHud(h => ({ ...h, phase:'gameover' })) }
            }
            if (a.big) s.destroyed++  // resolved by impact
            return false
          }
        }

        // escaped off the bottom — dodging works: NO life lost
        if (a.y > BLASTER_H + a.r + 6) {
          s.escaped++
          if (a.big) s.destroyed++  // counts toward wave completion
          setHud(h => ({ ...h, destroyed: s.destroyed }))
          return false
        }
        return true
      })
      if (spawnChildren.length) s.asteroids.push(...spawnChildren)

      // wave complete: all big asteroids resolved and no fragments left
      if (s.running && s.spawned === s.cfg.total && s.asteroids.length === 0 && s.destroyed >= s.cfg.total) {
        s.running = false
        playCorrect()
        setHud(h => ({ ...h, phase:'roundclear', score: s.score }))
      }

      if (s.invuln > 0) s.invuln -= dt
      if (s.redFlash > 0) s.redFlash -= dt

      // ── draw: additive glow pass ──
      ctx.globalCompositeOperation = 'lighter'

      // lasers with glow trail
      s.lasers.forEach(l => {
        const lg = ctx.createLinearGradient(l.x, l.y + 22, l.x, l.y - 4)
        lg.addColorStop(0, 'rgba(0,255,170,0)'); lg.addColorStop(1, 'rgba(120,255,210,0.95)')
        ctx.strokeStyle = lg; ctx.lineWidth = 3.5; ctx.lineCap = 'round'
        ctx.beginPath(); ctx.moveTo(l.x, l.y + 22); ctx.lineTo(l.x, l.y); ctx.stroke()
        ctx.fillStyle = 'rgba(190,255,230,0.9)'
        ctx.beginPath(); ctx.arc(l.x, l.y, 2.4, 0, Math.PI*2); ctx.fill()
      })

      // particles
      s.particles = s.particles.filter(p => {
        p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 0.02 * dt
        p.life -= dt
        if (p.life <= 0) return false
        const al = p.life / p.max
        ctx.fillStyle = `hsla(${p.hue}, 100%, 62%, ${al})`
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * al + 0.4, 0, Math.PI*2); ctx.fill()
        return true
      })

      // shockwave rings
      s.rings = s.rings.filter(r => {
        r.r += (r.max - r.r) * 0.16 * dt
        const al = 1 - r.r / r.max
        if (al <= 0.04) return false
        ctx.strokeStyle = `hsla(${r.hue}, 100%, 65%, ${al})`
        ctx.lineWidth = 2
        ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, Math.PI*2); ctx.stroke()
        return true
      })

      ctx.globalCompositeOperation = 'source-over'

      // ── asteroids: shaded procedural rocks ──
      s.asteroids.forEach(a => {
        ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(a.spin)
        const grad = ctx.createRadialGradient(-a.r*0.35, -a.r*0.35, a.r*0.15, 0, 0, a.r*1.15)
        grad.addColorStop(0, `hsl(${a.hue}, 18%, 52%)`)
        grad.addColorStop(0.65, `hsl(${a.hue}, 20%, 30%)`)
        grad.addColorStop(1, `hsl(${a.hue}, 24%, 14%)`)
        ctx.fillStyle = grad
        ctx.beginPath()
        a.verts.forEach((vr, i) => {
          const ang = (i / a.verts.length) * Math.PI * 2
          const px = Math.cos(ang) * a.r * vr, py = Math.sin(ang) * a.r * vr
          i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
        })
        ctx.closePath(); ctx.fill()
        ctx.strokeStyle = 'rgba(255,190,120,0.18)'; ctx.lineWidth = 1.2; ctx.stroke()
        // crater
        ctx.fillStyle = 'rgba(0,0,0,0.25)'
        ctx.beginPath(); ctx.arc(a.r*0.25, a.r*0.1, a.r*0.28, 0, Math.PI*2); ctx.fill()
        ctx.restore()
      })

      // ── power-ups ──
      s.powerups.forEach(p => {
        const pl = 1 + Math.sin(p.pulse * 0.25) * 0.15
        ctx.save(); ctx.translate(p.x, p.y); ctx.scale(pl, pl)
        const hue = p.kind === 'shield' ? 190 : 45
        ctx.globalCompositeOperation = 'lighter'
        const pg = ctx.createRadialGradient(0, 0, 2, 0, 0, 16)
        pg.addColorStop(0, `hsla(${hue},100%,70%,0.9)`); pg.addColorStop(1, `hsla(${hue},100%,60%,0)`)
        ctx.fillStyle = pg
        ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI*2); ctx.fill()
        ctx.globalCompositeOperation = 'source-over'
        ctx.strokeStyle = `hsl(${hue},100%,72%)`; ctx.lineWidth = 2
        ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI*2); ctx.stroke()
        ctx.fillStyle = '#fff'; ctx.font = 'bold 11px sans-serif'
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText(p.kind === 'shield' ? 'S' : 'R', 0, 0.5)
        ctx.restore()
      })

      // ── ship: neon vector fighter ──
      const tilt = Math.max(-0.35, Math.min(0.35, s.shipVX * 0.045))
      ctx.save()
      ctx.translate(s.shipX, shipY)
      ctx.rotate(tilt)
      if (s.invuln > 0 && Math.floor(s.invuln / 6) % 2 === 0) ctx.globalAlpha = 0.35

      // engine flame (additive)
      ctx.globalCompositeOperation = 'lighter'
      const fl = 15 + Math.sin(s.frame * 0.6) * 4 + Math.random() * 3
      const fg2 = ctx.createLinearGradient(0, 12, 0, 12 + fl)
      fg2.addColorStop(0, 'rgba(120,200,255,0.95)')
      fg2.addColorStop(0.4, 'rgba(255,170,60,0.8)')
      fg2.addColorStop(1, 'rgba(255,80,0,0)')
      ctx.fillStyle = fg2
      ctx.beginPath(); ctx.moveTo(-4.5, 12); ctx.lineTo(4.5, 12); ctx.lineTo(0, 12 + fl); ctx.closePath(); ctx.fill()
      ctx.globalCompositeOperation = 'source-over'

      // wings
      ctx.fillStyle = '#20355c'
      ctx.beginPath(); ctx.moveTo(-4, -2); ctx.lineTo(-17, 11); ctx.lineTo(-5, 10); ctx.closePath(); ctx.fill()
      ctx.beginPath(); ctx.moveTo(4, -2); ctx.lineTo(17, 11); ctx.lineTo(5, 10); ctx.closePath(); ctx.fill()
      ctx.strokeStyle = 'rgba(90,160,255,0.7)'; ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(-4, -2); ctx.lineTo(-17, 11); ctx.moveTo(4, -2); ctx.lineTo(17, 11); ctx.stroke()

      // hull
      const hull = ctx.createLinearGradient(0, -18, 0, 12)
      hull.addColorStop(0, '#dff1ff'); hull.addColorStop(0.45, '#5b8dff'); hull.addColorStop(1, '#23306b')
      ctx.fillStyle = hull
      ctx.beginPath()
      ctx.moveTo(0, -18); ctx.quadraticCurveTo(7, -4, 6, 10); ctx.lineTo(-6, 10); ctx.quadraticCurveTo(-7, -4, 0, -18)
      ctx.closePath(); ctx.fill()
      ctx.strokeStyle = 'rgba(160,210,255,0.8)'; ctx.lineWidth = 1.2; ctx.stroke()

      // cockpit glow
      ctx.globalCompositeOperation = 'lighter'
      const cp = ctx.createRadialGradient(0, -5, 0.5, 0, -5, 5)
      cp.addColorStop(0, 'rgba(160,255,255,0.95)'); cp.addColorStop(1, 'rgba(0,140,255,0)')
      ctx.fillStyle = cp
      ctx.beginPath(); ctx.arc(0, -5, 5, 0, Math.PI*2); ctx.fill()
      ctx.globalCompositeOperation = 'source-over'

      // shield bubble
      if (s.shield) {
        ctx.globalCompositeOperation = 'lighter'
        ctx.strokeStyle = `rgba(80,220,255,${0.5 + Math.sin(s.frame*0.15)*0.2})`
        ctx.lineWidth = 2
        ctx.beginPath(); ctx.arc(0, -3, 24, 0, Math.PI*2); ctx.stroke()
        ctx.globalCompositeOperation = 'source-over'
      }
      ctx.restore()

      // ── floating score pops ──
      s.pops = s.pops.filter(p => {
        p.y -= 0.8 * dt; p.life -= dt
        if (p.life <= 0) return false
        ctx.globalAlpha = Math.min(1, p.life / 20)
        ctx.fillStyle = p.mult > 1 ? '#ffd740' : '#b9f6ca'
        ctx.font = `bold ${p.mult > 1 ? 15 : 13}px sans-serif`
        ctx.textAlign = 'center'
        ctx.fillText(p.txt, p.x, p.y)
        ctx.globalAlpha = 1
        return true
      })

      // combo banner
      if (s.combo >= 3) {
        const mult = Math.min(5, 1 + Math.floor(s.combo / 3))
        ctx.fillStyle = 'rgba(255,215,64,0.9)'
        ctx.font = 'bold 15px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(`🔥 COMBO ×${mult}`, BLASTER_W / 2, 30)
      }

      ctx.restore() // shake

      // red damage vignette
      if (s.redFlash > 0) {
        ctx.fillStyle = `rgba(255,40,40,${s.redFlash / 60})`
        ctx.fillRect(0, 0, BLASTER_W, BLASTER_H)
      }
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', kd)
      window.removeEventListener('keyup', ku)
      cv.removeEventListener('pointerdown', pd)
      window.removeEventListener('pointermove', pm)
      window.removeEventListener('pointerup', pu)
    }
  }, [])

  return (
    <div className="blaster-screen">
      <Stars/>
      <div className="blaster-inner">
        <div className="blaster-top">
          <button className="back-btn" onClick={onBack}>← Back</button>
          <h2 className="blaster-title">🛸 Space Blaster</h2>
        </div>

        <div className="blaster-hud">
          <span className="bh-chip">Wave <strong>{hud.round}</strong></span>
          <span className="bh-chip">⭐ <strong>{hud.score.toLocaleString()}</strong></span>
          <span className="bh-chip">{'❤️'.repeat(Math.max(0, hud.lives))}{'🖤'.repeat(Math.max(0, 3 - hud.lives))}</span>
          <span className="bh-chip">☄️ <strong>{hud.destroyed}/{hud.total}</strong></span>
          {hud.shield && <span className="bh-chip bh-buff">🛡 Shield</span>}
          {hud.rapid && <span className="bh-chip bh-buff">⚡ Rapid</span>}
        </div>

        <div className="blaster-stage" ref={stageRef}>
          <canvas ref={canvasRef} width={BLASTER_W} height={BLASTER_H} className="blaster-canvas"/>

          {hud.phase === 'ready' && (
            <div className="blaster-overlay">
              <div className="bo-emoji">🛸</div>
              <div className="bo-title">Space Blaster</div>
              <div className="bo-text">Waves of asteroids incoming! Your ship fires automatically — just steer. Big rocks split in two. Chain kills for combo multipliers, grab 🛡 shields and ⚡ rapid-fire drops. Dodging works: rocks that pass you don't hurt.</div>
              <div className="bo-keys">🖱️ Drag on the field (or ⌨️ arrow keys) to fly</div>
              <button className="game-btn" onClick={startGame}>🚀 Launch Wave 1</button>
            </div>
          )}

          {hud.phase === 'roundclear' && (
            <div className="blaster-overlay">
              <div className="bo-emoji">🎉</div>
              <div className="bo-title">Wave {hud.round} Cleared!</div>
              <div className="bo-text">Score: <strong>{hud.score.toLocaleString()}</strong> · Lives: {hud.lives}{hud.shield ? ' · 🛡 shield carried over' : ''}<br/>Wave {hud.round + 1}: more rocks, more speed.</div>
              <button className="game-btn" onClick={nextRound}>▶️ Launch Wave {hud.round + 1}</button>
            </div>
          )}

          {hud.phase === 'gameover' && (
            <div className="blaster-overlay">
              <div className="bo-emoji">💥</div>
              <div className="bo-title">Game Over</div>
              <div className="bo-text">You survived to <strong>Wave {hud.round}</strong> and scored <strong>{hud.score.toLocaleString()}</strong> points!</div>
              <button className="game-btn" onClick={startGame}>🔄 Play Again</button>
            </div>
          )}
        </div>

        <div className="blaster-hint">🖱️ Drag to steer · fires automatically · big rocks split in two</div>
      </div>
    </div>
  )
}

// ── Space Scout: Data Hunter (information-gathering game) ─────────────────────
const SCOUT_RANKS = [
  { min: 0,  title: 'Space Cadet',      icon: '🎒' },
  { min: 10, title: 'Junior Scout',     icon: '🔭' },
  { min: 22, title: 'Data Analyst',     icon: '📡' },
  { min: 36, title: 'Star Navigator',   icon: '🧭' },
  { min: 50, title: 'Mission Commander',icon: '🎖️' },
  { min: 62, title: 'Cosmic Master',    icon: '👑' },
]

function getScoutStops() {
  return [
    { id: SUN.id, name: SUN.name, img: SUN.img, color: SUN.color, facts: SUN.facts, funFact: SUN.funFact, tag: 'Our Star' },
    ...PLANETS.map(p => ({ id: p.id, name: p.name, img: p.img, color: p.color, facts: p.facts, funFact: p.funFact, tag: p.nickname })),
    { id: 'st2-18', name: 'Stephenson 2-18', img: null, color: '#ff6e40', facts: ST2_18.facts, funFact: ST2_18.funFact, tag: 'Deep Space Bonus' },
  ]
}

function SpaceScout({ onBack }) {
  const stops = useRef(getScoutStops()).current
  const [codex, setCodex] = useState(() => {
    try { return JSON.parse(localStorage.getItem('walli-codex')) || {} } catch { return {} }
  })
  const [view, setView] = useState('map')          // 'map' | 'scan'
  const [stopIdx, setStopIdx] = useState(0)
  const [lastFact, setLastFact] = useState(null)   // index of most recently downloaded fact
  const [downloading, setDownloading] = useState(null) // orb index mid-download

  useEffect(() => {
    try { localStorage.setItem('walli-codex', JSON.stringify(codex)) } catch { /* private mode */ }
  }, [codex])

  const gotFor = stop => codex[stop.id] || []
  const isComplete = stop => gotFor(stop).length >= stop.facts.length
  const totalData = stops.reduce((n, s) => n + gotFor(s).length, 0)
  const maxData = stops.reduce((n, s) => n + s.facts.length, 0)
  const rank = [...SCOUT_RANKS].reverse().find(r => totalData >= r.min)
  const nextRank = SCOUT_RANKS.find(r => r.min > totalData)

  // a stop is unlocked if it's first or the previous stop is fully scanned
  const isUnlocked = i => i === 0 || isComplete(stops[i - 1])

  const openStop = i => {
    if (!isUnlocked(i)) { playWrong(); return }
    playClick()
    setStopIdx(i); setLastFact(null); setDownloading(null)
    setView('scan')
  }

  const download = orbIdx => {
    const stop = stops[stopIdx]
    const got = gotFor(stop)
    if (got.includes(orbIdx) || downloading != null) return
    setDownloading(orbIdx)
    tone(700, 0.08, 'square', 0.08); tone(950, 0.08, 'square', 0.08, 0.09); tone(1200, 0.1, 'square', 0.08, 0.18)
    setTimeout(() => {
      setDownloading(null)
      setLastFact(orbIdx)
      playCorrect()
      setCodex(c => ({ ...c, [stop.id]: [...(c[stop.id] || []), orbIdx] }))
    }, 650)
  }

  // ── Map view ──
  if (view === 'map') {
    return (
      <div className="scout-screen">
        <Stars/>
        <div className="scout-inner">
          <div className="blaster-top">
            <button className="back-btn" onClick={onBack}>← Back</button>
            <h2 className="blaster-title">📡 Space Scout</h2>
          </div>

          <div className="scout-rank-card">
            <div className="scout-rank-icon">{rank.icon}</div>
            <div className="scout-rank-info">
              <div className="scout-rank-title">{rank.title}</div>
              <div className="scout-rank-sub">
                {totalData}/{maxData} data fragments collected
                {nextRank && <> · {nextRank.min - totalData} more to reach {nextRank.icon} {nextRank.title}</>}
              </div>
              <div className="scout-rank-bar">
                <div className="scout-rank-fill" style={{ width: `${(totalData / maxData) * 100}%` }}/>
              </div>
            </div>
          </div>

          <p className="scout-mission-brief">
            🛰️ <strong>Mission:</strong> Fly your probe from world to world. Scan each one by downloading
            every data fragment — real facts beamed back to Earth. Fully scan a world to unlock the next!
          </p>

          <div className="scout-map">
            {stops.map((s, i) => {
              const got = gotFor(s).length
              const done = isComplete(s)
              const locked = !isUnlocked(i)
              return (
                <button key={s.id}
                  className={`scout-stop${done ? ' done' : ''}${locked ? ' locked' : ''}`}
                  style={{ '--sc': s.color }}
                  onClick={() => openStop(i)}
                >
                  <div className="scout-stop-img-wrap">
                    {s.img
                      ? <img src={s.img} alt={s.name} className="scout-stop-img" loading="lazy"/>
                      : <div className="scout-stop-giant" style={{ background: `radial-gradient(circle at 35% 35%, #ff8a65, ${s.color} 60%, #7f1d00)` }}/>}
                    {locked && <div className="scout-lock">🔒</div>}
                    {done && <div className="scout-done-stamp">✅</div>}
                  </div>
                  <div className="scout-stop-name" style={{ color: s.color }}>{s.name}</div>
                  <div className="scout-stop-tag">{s.tag}</div>
                  <div className="scout-stop-prog">
                    {locked ? 'Scan previous world' : `📥 ${got}/${s.facts.length} fragments`}
                  </div>
                </button>
              )
            })}
          </div>

          {totalData >= maxData && (
            <div className="scout-complete-banner">
              👑 <strong>CODEX COMPLETE!</strong> You've collected every data fragment in the solar system.
              You are a true Cosmic Master!
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Scan view ──
  const stop = stops[stopIdx]
  const got = gotFor(stop)
  const done = isComplete(stop)
  const R = 118
  const orbPos = i => {
    const ang = (i / stop.facts.length) * Math.PI * 2 - Math.PI / 2
    return { left: `calc(50% + ${Math.cos(ang) * R}px)`, top: `calc(50% + ${Math.sin(ang) * R}px)` }
  }

  return (
    <div className="scout-screen">
      <Stars/>
      <div className="scout-inner">
        <div className="blaster-top">
          <button className="back-btn" onClick={() => { playClick(); setView('map') }}>← Star Map</button>
          <h2 className="blaster-title" style={{ color: stop.color }}>{stop.name}</h2>
        </div>

        <div className="scout-scan-status">
          <span>📥 {got.length}/{stop.facts.length} downloaded</span>
          <div className="scout-scan-bar"><div className="scout-scan-fill" style={{ width: `${(got.length / stop.facts.length) * 100}%`, background: stop.color }}/></div>
        </div>

        <div className="scout-orbit-arena">
          <div className="scout-orbit-ring"/>
          {stop.img
            ? <img src={stop.img} alt={stop.name} className="scout-planet-img" style={{ boxShadow: `0 0 60px ${stop.color}55` }}/>
            : <div className="scout-planet-img scout-stop-giant" style={{ background: `radial-gradient(circle at 35% 35%, #ff8a65, ${stop.color} 60%, #7f1d00)`, boxShadow: `0 0 60px ${stop.color}55` }}/>}
          {stop.facts.map((_, i) => {
            const collected = got.includes(i)
            const busy = downloading === i
            return (
              <button key={i}
                className={`scout-orb${collected ? ' got' : ''}${busy ? ' busy' : ''}`}
                style={{ ...orbPos(i), animationDelay: `${i * 0.35}s` }}
                onClick={() => download(i)}
                disabled={collected}
              >
                {collected ? '✓' : busy ? '⇣' : '📡'}
              </button>
            )
          })}
        </div>

        <div className="scout-terminal">
          <div className="scout-terminal-head">
            <span className="scout-terminal-dot"/> DATA TERMINAL — {stop.name.toUpperCase()}
          </div>
          {downloading != null && <div className="scout-terminal-line downloading">⇣ Receiving transmission...</div>}
          {lastFact != null && downloading == null && (
            <div className="scout-terminal-line fresh">
              <span className="scout-data-chip">DATA #{String(lastFact + 1).padStart(2, '0')}</span> {stop.facts[lastFact]}
            </div>
          )}
          {lastFact == null && downloading == null && !done && (
            <div className="scout-terminal-line hint">Tap a 📡 satellite to download a data fragment...</div>
          )}
          {got.filter(i => i !== lastFact).sort((a, b) => a - b).map(i => (
            <div key={i} className="scout-terminal-line dim">
              <span className="scout-data-chip dim">#{String(i + 1).padStart(2, '0')}</span> {stop.facts[i]}
            </div>
          ))}
          {done && (
            <div className="scout-bonus">
              <div className="scout-bonus-head">🌟 SCAN COMPLETE — BONUS INTEL UNLOCKED</div>
              <div className="scout-bonus-fact">{stop.funFact}</div>
              <button className="game-btn" style={{ marginTop: 14 }} onClick={() => { playClick(); setView('map') }}>
                {stopIdx < stops.length - 1 ? `🚀 Fly to next world` : '👑 Return to Star Map'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Facts Screen ───────────────────────────────────────────────────────────────
const FACT_CATEGORIES = [
  { key:'all', label:'All Facts', emoji:'🌠' },
  { key:'planets', label:'Planets', emoji:'🌍' },
  { key:'universe', label:'Universe', emoji:'💫' },
  { key:'scale', label:'Scale', emoji:'📏' },
  { key:'time', label:'Time', emoji:'⏰' },
  { key:'space', label:'Space', emoji:'🚀' },
]

function FactsScreen({ onBack, onQuiz }) {
  const [filter, setFilter] = useState('all')
  const visible = filter === 'all' ? SPACE_FACTS : SPACE_FACTS.filter(f => f.category === filter)

  return (
    <div className="facts-screen">
      <div className="explore-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h2 className="explore-title">📖 Fun Space Facts</h2>
        <p className="explore-sub">Mind-blowing facts about the universe — for curious minds!</p>
      </div>

      <div className="facts-banner">
        <div className="facts-banner-emoji">🌠</div>
        <div className="facts-banner-text">
          <div className="facts-banner-title">Did You Know?</div>
          <div className="facts-banner-sub">
            The universe is so vast and strange that even the most incredible-sounding facts are completely true.
            Read them all, then take the quiz to see how much you remember!
          </div>
        </div>
      </div>

      <div className="fact-filters">
        {FACT_CATEGORIES.map(cat => (
          <button
            key={cat.key}
            className={`fact-filter-btn${filter===cat.key?' active':''}`}
            onClick={() => { playClick(); setFilter(cat.key) }}
          >
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      <div className="facts-count">{visible.length} fact{visible.length!==1?'s':''}</div>

      <div className="facts-grid">
        {visible.map(fact => (
          <div key={fact.id} className="fact-card" style={{ '--fc': fact.color }}>
            <div className="fact-card-top">
              <div className="fact-card-emoji">{fact.emoji}</div>
              <div className="fact-card-cat-chip">{FACT_CATEGORIES.find(c=>c.key===fact.category)?.label}</div>
            </div>
            <div className="fact-card-title" style={{ color: fact.color }}>{fact.title}</div>
            <div className="fact-card-body">{fact.body}</div>
            <div className="fact-wow">
              <span className="fact-wow-icon">💡</span>
              <span className="fact-wow-text"><strong>Think About It: </strong>{fact.wow}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="facts-quiz-footer">
        <div className="facts-quiz-footer-text">Finished reading? Test what you remember!</div>
        <button className="facts-quiz-btn" onClick={() => { playClick(); onQuiz() }}>
          🧠 Take the Universe Quiz!
        </button>
      </div>
    </div>
  )
}

// ── Memory Match ───────────────────────────────────────────────────────────────
function MemoryMatch({ onBack }) {
  const makeDeck = () => {
    const chosen = shuffle(PLANETS).slice(0, 8)
    return shuffle(chosen.flatMap(p => [
      { key: p.id + '-a', pid: p.id, img: p.img, name: p.name },
      { key: p.id + '-b', pid: p.id, img: p.img, name: p.name },
    ]))
  }
  const [deck, setDeck] = useState(makeDeck)
  const [flipped, setFlipped] = useState([])      // keys currently face-up (unmatched)
  const [matched, setMatched] = useState([])      // pids matched
  const [moves, setMoves] = useState(0)
  const [lock, setLock] = useState(false)

  const won = matched.length === 8
  const stars = won ? (moves <= 12 ? 3 : moves <= 18 ? 2 : 1) : 0

  const flip = card => {
    if (lock || flipped.includes(card.key) || matched.includes(card.pid)) return
    playClick()
    const nf = [...flipped, card.key]
    setFlipped(nf)
    if (nf.length === 2) {
      setMoves(m => m + 1)
      setLock(true)
      const [a, b] = nf.map(k => deck.find(c => c.key === k))
      if (a.pid === b.pid) {
        setTimeout(() => { playCorrect(); setMatched(m => [...m, a.pid]); setFlipped([]); setLock(false) }, 500)
      } else {
        setTimeout(() => { playWrong(); setFlipped([]); setLock(false) }, 900)
      }
    }
  }

  const restart = () => { playClick(); setDeck(makeDeck()); setFlipped([]); setMatched([]); setMoves(0); setLock(false) }

  return (
    <div className="memory-screen">
      <Stars/>
      <div className="memory-inner">
        <div className="blaster-top">
          <button className="back-btn" onClick={onBack}>← Back</button>
          <h2 className="blaster-title">🃏 Planet Memory Match</h2>
        </div>
        <div className="blaster-hud">
          <span className="bh-chip">🔄 <strong>{moves}</strong> moves</span>
          <span className="bh-chip">✅ <strong>{matched.length}/8</strong> pairs</span>
        </div>

        {won ? (
          <div className="badge-screen">
            <div className="badge-glow">{'⭐'.repeat(stars)}</div>
            <div className="badge-name">You matched all 8 planets!</div>
            <div className="badge-msg">Finished in {moves} moves — {stars === 3 ? 'PERFECT memory!' : stars === 2 ? 'great memory!' : 'good job, try for fewer moves!'}</div>
            <button className="game-btn" onClick={restart}>🔄 Play Again</button>
          </div>
        ) : (
          <div className="memory-grid">
            {deck.map(card => {
              const up = flipped.includes(card.key) || matched.includes(card.pid)
              return (
                <button key={card.key} className={`memory-card${up ? ' up' : ''}${matched.includes(card.pid) ? ' matched' : ''}`} onClick={() => flip(card)}>
                  {up
                    ? <img src={card.img} alt={card.name} className="memory-card-img" loading="lazy"/>
                    : <span className="memory-card-back">✨</span>}
                </button>
              )
            })}
          </div>
        )}
        <p className="games-sub">Flip two cards to find matching planets!</p>
      </div>
    </div>
  )
}

// ── Rocket Builder ─────────────────────────────────────────────────────────────
const RB_PARTS = {
  nose: [
    { id:'red',    name:'Classic Red',   cost:0,  color:'#ef5350' },
    { id:'gold',   name:'Golden Peak',   cost:15, color:'#ffd740' },
    { id:'violet', name:'Nebula Violet', cost:30, color:'#b388ff' },
  ],
  body: [
    { id:'white',  name:'Classic White', cost:0,  color:'#eceff1' },
    { id:'blue',   name:'Sky Blue',      cost:15, color:'#81d4fa' },
    { id:'mint',   name:'Alien Mint',    cost:30, color:'#a5ffd6' },
  ],
  fins: [
    { id:'grey',   name:'Steel Fins',    cost:0,  color:'#78909c' },
    { id:'orange', name:'Flame Orange',  cost:15, color:'#ff9800' },
    { id:'pink',   name:'Comet Pink',    cost:30, color:'#f48fb1' },
  ],
}
const RB_KEY = 'walli-rocket'

function RocketBuilder({ onBack }) {
  const [wallet, setWallet] = useState(wwLoad)
  const [rocket, setRocket] = useState(() => {
    try { return JSON.parse(localStorage.getItem(RB_KEY)) || { owned:['nose:red','body:white','fins:grey'], sel:{ nose:'red', body:'white', fins:'grey' } } }
    catch { return { owned:['nose:red','body:white','fins:grey'], sel:{ nose:'red', body:'white', fins:'grey' } } }
  })
  const [launching, setLaunching] = useState(false)

  useEffect(() => {
    try { localStorage.setItem(RB_KEY, JSON.stringify(rocket)) } catch { /* private mode */ }
  }, [rocket])

  const partOf = slot => RB_PARTS[slot].find(p => p.id === rocket.sel[slot])
  const ownedKey = (slot, id) => `${slot}:${id}`

  const pickPart = (slot, part) => {
    const key = ownedKey(slot, part.id)
    if (rocket.owned.includes(key)) {
      playClick()
      setRocket(r => ({ ...r, sel: { ...r.sel, [slot]: part.id } }))
      return
    }
    if (wallet.coins < part.cost) { playWrong(); return }
    // buy it: deduct from the shared Galaxy Quest wallet
    playCorrect()
    const newWallet = { ...wallet, coins: wallet.coins - part.cost }
    setWallet(newWallet)
    try { localStorage.setItem(WW_KEY, JSON.stringify(newWallet)) } catch { /* private mode */ }
    setRocket(r => ({ ...r, owned:[...r.owned, key], sel:{ ...r.sel, [slot]: part.id } }))
  }

  const launch = () => {
    if (launching) return
    setLaunching(true)
    tone(180, 1.6, 'sawtooth', 0.12); tone(240, 1.6, 'sawtooth', 0.08, 0.15)
    tone(523, 0.15, 'sine', 0.2, 1.4); tone(659, 0.15, 'sine', 0.2, 1.55); tone(784, 0.3, 'sine', 0.2, 1.7)
    setTimeout(() => setLaunching(false), 2600)
  }

  const SLOT_LABEL = { nose:'🔺 Nose Cone', body:'🚀 Body', fins:'🪽 Fins' }

  return (
    <div className="rb-screen">
      <Stars/>
      <div className="rb-inner">
        <div className="blaster-top">
          <button className="back-btn" onClick={onBack}>← Back</button>
          <h2 className="blaster-title">🛠️ Rocket Builder</h2>
        </div>
        <div className="blaster-hud">
          <span className="bh-chip">🪙 <strong>{wallet.coins}</strong> coins</span>
          <span className="bh-chip rb-earn-hint">Earn coins in Galaxy Quest!</span>
        </div>

        <div className="rb-stage">
          <div className={`rb-rocket${launching ? ' launching' : ''}`}>
            <div className="rb-nose" style={{ borderBottomColor: partOf('nose').color }}/>
            <div className="rb-body" style={{ background: `linear-gradient(90deg, ${partOf('body').color}, color-mix(in srgb, ${partOf('body').color} 60%, #263238))` }}>
              <div className="rb-window"/>
            </div>
            <div className="rb-fins">
              <div className="rb-fin left"  style={{ borderTopColor: partOf('fins').color }}/>
              <div className="rb-fin right" style={{ borderTopColor: partOf('fins').color }}/>
            </div>
            {launching && <div className="rb-flame">🔥</div>}
          </div>
          {launching && <div className="rb-launch-text">🚀 LIFT OFF!!</div>}
        </div>

        <button className="game-btn" onClick={launch} disabled={launching}>
          {launching ? '🌌 Flying...' : '🚀 LAUNCH!'}
        </button>

        {Object.keys(RB_PARTS).map(slot => (
          <div key={slot} className="rb-slot">
            <div className="rb-slot-title">{SLOT_LABEL[slot]}</div>
            <div className="rb-slot-row">
              {RB_PARTS[slot].map(part => {
                const owned = rocket.owned.includes(ownedKey(slot, part.id))
                const selected = rocket.sel[slot] === part.id
                const affordable = wallet.coins >= part.cost
                return (
                  <button key={part.id}
                    className={`rb-part${selected ? ' selected' : ''}${!owned && !affordable ? ' cant' : ''}`}
                    onClick={() => pickPart(slot, part)}>
                    <span className="rb-part-swatch" style={{ background: part.color }}/>
                    <span className="rb-part-name">{part.name}</span>
                    <span className="rb-part-cost">{owned ? (selected ? '✅ On' : 'Owned') : `🪙 ${part.cost}`}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Games Hub ──────────────────────────────────────────────────────────────────
function GamesScreen({ onBack, onGame, onArcade, onScout, onMemory, onRocket }) {
  const GAMES = [
    { icon:'🎮', cls:'game-mode-card',   name:'Walli\'s Space World: Galaxy Quest', desc:'Story mode! Walli & Nova the robot explore 12 worlds — earn badges, stickers & crystals, and unlock 6 spaceships', tag:'Story · 12 worlds · saves progress', go:onGame },
    { icon:'🛸', cls:'arcade-mode-card', name:'Space Blaster',      desc:'Arcade action! Steer your fighter, blast splitting asteroids, chain combos, grab power-ups', tag:'Arcade · endless waves', go:onArcade },
    { icon:'📡', cls:'scout-mode-card',  name:'Space Scout: Data Hunter', desc:'Exploration! Scan every world, download 52 real space facts & rank up to Cosmic Master', tag:'Explore · collect & learn', go:onScout },
    { icon:'🃏', cls:'facts-mode-card',  name:'Planet Memory Match', desc:'Flip the cards and find all 8 matching planet pairs — fewer moves, more stars!', tag:'Puzzle · ages 4+', go:onMemory },
    { icon:'🛠️', cls:'game-mode-card',  name:'Rocket Builder', desc:'Spend the coins you earned in Galaxy Quest on nose cones, colours & fins — then LAUNCH your creation!', tag:'Creative · uses your coins', go:onRocket },
  ]
  return (
    <div className="games-screen">
      <Stars/>
      <div className="games-inner">
        <div className="blaster-top">
          <button className="back-btn" onClick={onBack}>← Back</button>
          <h2 className="blaster-title">🎮 Games</h2>
        </div>
        <p className="games-sub">Three ways to play — pick your mission, Explorer!</p>
        {GAMES.map(g => (
          <button key={g.name} className={`mode-card games-hub-card ${g.cls}`} onClick={() => { playClick(); g.go() }}>
            <div className="galaxy-mode-inner">
              <div className="mode-icon">{g.icon}</div>
              <div>
                <div className="mode-name">{g.name}</div>
                <div className="mode-desc">{g.desc}</div>
                <div className="games-hub-tag">{g.tag}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Home Screen ────────────────────────────────────────────────────────────────
function HomeScreen({ onExplore, onQuiz, onGalaxies, onFacts, onGames, onMultiverse }) {
  const [name, setName] = useState(getExplorerName)
  const [editingName, setEditingName] = useState(false)
  const [draft, setDraft] = useState('')

  const saveName = () => {
    const clean = draft.trim().slice(0, 16)
    if (!clean) return
    try { localStorage.setItem('walli-name', clean) } catch { /* private mode */ }
    playCorrect(); setName(clean); setEditingName(false)
  }

  // progress pulled from the Galaxy Quest save
  const wwSave = wwLoad()
  const wwDone = Object.keys(wwSave.done).length
  const wwRank = [...WW_RANKS].reverse().find(r => wwDone >= r.min)
  const stickers = WW_WORLDS.filter(w => wwSave.done[w.id]).map(w => w.sticker)

  // fact of the day rotates through the kids' fact library by date
  const dayN = Math.floor(Date.now() / 86400000)
  const dailyFact = SPACE_FACTS[dayN % SPACE_FACTS.length]

  return (
    <div className="home">
      <Stars/>
      <SoundToggle/>
      <div className="home-content">
        <div className="home-hero">
          <div className="home-planets-preview">
            {PLANETS.map((p,i) => (
              <img key={p.id} src={p.img} alt={p.name} className="preview-planet"
                style={{ width:p.size*0.55, height:p.size*0.55, animationDelay:`${i*0.18}s` }}
                loading="eager"
              />
            ))}
          </div>
        </div>
        <h1 className="home-title">🚀 Walli's Space World</h1>
        <p className="home-sub">Discover New Worlds with Walli!</p>

        {!name && !editingName && (
          <button className="home-name-invite" onClick={() => { playClick(); setEditingName(true) }}>
            👋 What's your explorer name? Tap to tell Walli!
          </button>
        )}
        {editingName && (
          <div className="home-name-form">
            <input className="home-name-input" autoFocus maxLength={16} placeholder="Type your name..."
              value={draft} onChange={e => setDraft(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveName()}
            />
            <button className="home-name-save" onClick={saveName}>🚀 Go!</button>
          </div>
        )}
        {name && !editingName && (
          <div className="home-greeting">
            👋 Welcome back, <strong>{name}</strong>!
            <button className="home-name-edit" title="Change name" onClick={() => { playClick(); setDraft(name); setEditingName(true) }}>✏️</button>
          </div>
        )}

        {wwDone > 0 && (
          <div className="home-progress">
            <span className="home-progress-rank">🎖️ {wwRank.title}</span>
            <span className="home-progress-stickers">{stickers.join(' ')}</span>
            <span className="home-progress-count">💎 {wwSave.crystals} · 🪙 {wwSave.coins}</span>
          </div>
        )}

        <div className="home-daily-fact">
          <div className="home-daily-head">🌠 Space Fact of the Day</div>
          <div className="home-daily-title">{dailyFact.emoji} {dailyFact.title}</div>
          <div className="home-daily-body">{dailyFact.body}</div>
        </div>

        <div className="home-story">
          <p>Join Walli on an exciting journey across the universe! Travel to distant planets, solve puzzles, rescue friendly aliens, collect space crystals, and discover amazing facts about our solar system and beyond. Every mission brings a new adventure and a chance to become the greatest space explorer in the galaxy.</p>
        </div>
        <button className="mode-card game-mode-card" onClick={() => { playClick(); onGames() }}>
          <div className="galaxy-mode-inner">
            <div className="mode-icon">🎮</div>
            <div>
              <div className="mode-name">Games</div>
              <div className="mode-desc">5 space games: Galaxy Quest, Space Blaster, Space Scout, Memory Match &amp; Rocket Builder!</div>
            </div>
          </div>
        </button>
        <div className="home-modes">
          <button className="mode-card" onClick={() => { playClick(); onExplore() }}>
            <div className="mode-icon">🔭</div>
            <div className="mode-name">Explore Planets</div>
            <div className="mode-desc">Browse all 8 planets with real photos, facts &amp; stats</div>
          </button>
          <button className="mode-card quiz" onClick={() => { playClick(); onQuiz() }}>
            <div className="mode-icon">🧠</div>
            <div className="mode-name">Space Quiz</div>
            <div className="mode-desc">Test your knowledge with 10 fun questions!</div>
          </button>
        </div>
        <button className="mode-card galaxy-mode-card" onClick={() => { playClick(); onGalaxies() }}>
          <div className="galaxy-mode-inner">
            <div className="mode-icon">🌌</div>
            <div>
              <div className="mode-name">Explore Galaxies &amp; Hubble</div>
              <div className="mode-desc">Real Hubble Space Telescope images of galaxies, nebulae &amp; deep space</div>
            </div>
          </div>
        </button>
        <button className="mode-card mv-mode-card" onClick={() => { playClick(); onMultiverse() }}>
          <div className="galaxy-mode-inner">
            <div className="mode-icon">🌀</div>
            <div>
              <div className="mode-name">The Multiverse</div>
              <div className="mode-desc">What if ours isn't the only universe? 8 mind-bending ideas — with an "Is it real?" meter</div>
            </div>
          </div>
        </button>
        <button className="mode-card facts-mode-card" onClick={() => { playClick(); onFacts() }}>
          <div className="galaxy-mode-inner">
            <div className="mode-icon">📖</div>
            <div>
              <div className="mode-name">Fun Space Facts for Kids</div>
              <div className="mode-desc">18 mind-blowing universe facts with fun comparisons — then take the quiz!</div>
            </div>
          </div>
        </button>
        <p className="home-footer">All photos courtesy of NASA · ESA · Hubble Space Telescope</p>
      </div>
    </div>
  )
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState('home')
  return (
    <div className="app">
      {screen === 'home'      && <HomeScreen onExplore={() => setScreen('explore')} onQuiz={() => setScreen('quiz')} onGalaxies={() => setScreen('galaxies')} onFacts={() => setScreen('facts')} onGames={() => setScreen('games')} onMultiverse={() => setScreen('multiverse')}/>}
      {screen === 'games'     && <GamesScreen onBack={() => setScreen('home')} onGame={() => setScreen('game')} onArcade={() => setScreen('arcade')} onScout={() => setScreen('scout')} onMemory={() => setScreen('memory')} onRocket={() => setScreen('rocket')}/>}
      {screen === 'game'      && <WalliGame onBack={() => setScreen('games')}/>}
      {screen === 'arcade'    && <SpaceBlaster onBack={() => setScreen('games')}/>}
      {screen === 'scout'     && <SpaceScout onBack={() => setScreen('games')}/>}
      {screen === 'memory'    && <MemoryMatch onBack={() => setScreen('games')}/>}
      {screen === 'rocket'    && <RocketBuilder onBack={() => setScreen('games')}/>}
      {screen === 'explore'   && <ExploreScreen onBack={() => setScreen('home')}/>}
      {screen === 'quiz'      && <QuizScreen onBack={() => setScreen('home')}/>}
      {screen === 'galaxies'  && <GalaxiesScreen onBack={() => setScreen('home')}/>}
      {screen === 'multiverse'&& <MultiverseScreen onBack={() => setScreen('home')}/>}
      {screen === 'facts'     && <FactsScreen onBack={() => setScreen('home')} onQuiz={() => setScreen('factsquiz')}/>}
      {screen === 'factsquiz' && <QuizScreen onBack={() => setScreen('facts')} questionPool={FACT_QUESTIONS}/>}
    </div>
  )
}

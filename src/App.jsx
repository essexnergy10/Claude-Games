import { useState, useEffect, useRef } from 'react'
import './App.css'

// ── Audio ─────────────────────────────────────────────────────────────────────
let _ac = null
const ac = () => {
  if (!_ac) _ac = new (window.AudioContext || window.webkitAudioContext)()
  if (_ac.state === 'suspended') _ac.resume()
  return _ac
}
function tone(freq, dur, type = 'sine', vol = 0.25, delay = 0) {
  const c = ac(), t = c.currentTime + delay
  const o = c.createOscillator(), g = c.createGain()
  o.type = type; o.frequency.value = freq
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur)
  o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + 0.01)
}
const playCorrect = () => { tone(523,0.08,'sine',0.3); tone(659,0.09,'sine',0.25,0.07); tone(784,0.18,'sine',0.2,0.15) }
const playWrong   = () => { tone(220,0.12,'sawtooth',0.3); tone(180,0.25,'sawtooth',0.25,0.1) }
const playClick   = () => tone(600,0.06,'sine',0.15)

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
    img:'https://upload.wikimedia.org/wikipedia/commons/9/98/Andromeda_Galaxy_%28with_h-alpha%29.jpg',
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
    img:'https://upload.wikimedia.org/wikipedia/commons/5/5e/M104_ngc4594_sombrero_galaxy_hi-res.jpg',
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
    img:'https://upload.wikimedia.org/wikipedia/commons/6/63/Cartwheel_Galaxy.jpg',
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
    img:'https://upload.wikimedia.org/wikipedia/commons/6/68/Pillars_of_creation_2014_HST_WFC3-UVIS_full-res_denoised.jpg',
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
    img:'https://upload.wikimedia.org/wikipedia/commons/5/5b/Hubble_Deep_Field.jpg',
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
    img:'https://upload.wikimedia.org/wikipedia/commons/c/c1/Hubble_ngc1300_istST.jpg',
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
    img:'https://upload.wikimedia.org/wikipedia/commons/6/64/Triangulum_Galaxy_HST.jpg',
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
          <img src={galaxy.img} alt={galaxy.name} className="galaxy-modal-img" loading="lazy"/>
          <div className="galaxy-modal-overlay">
            {galaxy.hubble && <div className="hubble-badge">🔭 Hubble Space Telescope</div>}
            <h2 className="galaxy-modal-name" style={{color:galaxy.color}}>{galaxy.name}</h2>
            <p className="galaxy-modal-nick">"{galaxy.nickname}"</p>
            <div className="galaxy-type-chip">{galaxy.type}</div>
          </div>
        </div>

        <div className="modal-stats galaxy-stats">
          <div className="stat"><span className="stat-label">Distance</span><span>{galaxy.distance}</span></div>
          <div className="stat"><span className="stat-label">Diameter</span><span>{galaxy.diameter}</span></div>
          <div className="stat"><span className="stat-label">Stars</span><span>{galaxy.stars}</span></div>
          <div className="stat"><span className="stat-label">Constellation</span><span>{galaxy.constellation}</span></div>
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
        {GALAXIES.map(g => (
          <button
            key={g.id}
            className="galaxy-card"
            style={{ '--gc': g.color }}
            onClick={() => { playClick(); setSelected(g) }}
          >
            <div className="galaxy-card-img-wrap">
              <img src={g.img} alt={g.name} className="galaxy-card-img" loading="lazy"/>
              {g.hubble && <div className="galaxy-hubble-chip">🔭 Hubble</div>}
            </div>
            <div className="card-body">
              <div className="card-name" style={{color:g.color}}>{g.name}</div>
              <div className="card-nick">{g.nickname}</div>
              <div className="card-row">
                <span>📍 {g.distance}</span>
              </div>
              <div className="card-type">{g.type}</div>
            </div>
          </button>
        ))}
      </div>

      {selected && <GalaxyModal galaxy={selected} onClose={() => setSelected(null)}/>}
    </div>
  )
}

// ── Quiz Screen ────────────────────────────────────────────────────────────────
function QuizScreen({ onBack }) {
  const [questions] = useState(() => shuffle(QUESTIONS).slice(0, 10))
  const [qi, setQi] = useState(0)
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  const [streak, setStreak] = useState(0)

  const q = questions[qi]
  const imgData = PLANETS.find(p => p.id === q.planet) || GALAXIES.find(g => g.id === q.galaxy)
  const correctAnswer = q.answer ?? (q.planet ? q.planet.charAt(0).toUpperCase()+q.planet.slice(1) : '')

  function pick(choice) {
    if (picked) return
    setPicked(choice)
    const isRight = choice === correctAnswer
    if (isRight) { playCorrect(); setScore(s=>s+1); setStreak(s=>s+1) }
    else { playWrong(); setStreak(0) }
  }

  function next() {
    playClick()
    if (qi+1 >= questions.length) setDone(true)
    else { setQi(q=>q+1); setPicked(null) }
  }

  function restart() { playClick(); setQi(0); setPicked(null); setScore(0); setDone(false); setStreak(0) }

  if (done) {
    const pct = Math.round((score/questions.length)*100)
    const grade = pct>=90?'🏆 Astronaut!':pct>=70?'🚀 Explorer!':pct>=50?'🌟 Cadet!':'🌙 Beginner!'
    const msg = pct>=90?'Incredible! You know the cosmos better than most astronomers!'
              : pct>=70?'Great job! You\'re a true space explorer!'
              : pct>=50?'Good effort! Keep studying the planets and galaxies!'
              : 'Keep exploring! Visit the Planet and Galaxy sections to learn more.'
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
        <div className="quiz-score-live">⭐ {score}</div>
      </div>

      {streak >= 2 && <div className="streak-badge">🔥 {streak} streak!</div>}

      <div className="quiz-card">
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

// ── Home Screen ────────────────────────────────────────────────────────────────
function HomeScreen({ onExplore, onQuiz, onGalaxies }) {
  return (
    <div className="home">
      <Stars/>
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
        <h1 className="home-title">🚀 Space Explorer</h1>
        <p className="home-sub">Discover our solar system and the cosmos with real NASA &amp; Hubble photos!</p>
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
      {screen === 'home'     && <HomeScreen onExplore={() => setScreen('explore')} onQuiz={() => setScreen('quiz')} onGalaxies={() => setScreen('galaxies')}/>}
      {screen === 'explore'  && <ExploreScreen onBack={() => setScreen('home')}/>}
      {screen === 'quiz'     && <QuizScreen onBack={() => setScreen('home')}/>}
      {screen === 'galaxies' && <GalaxiesScreen onBack={() => setScreen('home')}/>}
    </div>
  )
}

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
        {g.hubble && <div className="galaxy-hubble-chip">🔭 Hubble</div>}
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

// ── Quiz Screen ────────────────────────────────────────────────────────────────
function QuizScreen({ onBack, questionPool = QUESTIONS }) {
  const [questions] = useState(() => shuffle(questionPool).slice(0, Math.min(10, questionPool.length)))
  const [qi, setQi] = useState(0)
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  const [streak, setStreak] = useState(0)

  const q = questions[qi]
  const _raw = PLANETS.find(p => p.id === q.planet) || GALAXIES.find(g => g.id === q.galaxy)
  const imgData = _raw && q.galaxy ? { ..._raw, img: _raw.thumb } : _raw
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

// ── Walli's Adventure Game ────────────────────────────────────────────────────

function WalliSays({ text }) {
  return (
    <div className="walli-says-wrap">
      <div className="walli-char-icon">🧑‍🚀</div>
      <div className="walli-bubble">
        <span className="walli-name-chip">Walli</span>
        <p>{text}</p>
      </div>
    </div>
  )
}

function GameFact({ icon, text }) {
  return (
    <div className="game-fact-box">
      <span className="gfb-icon">{icon}</span>
      <span className="gfb-text"><strong>Fun Fact: </strong>{text}</span>
    </div>
  )
}

function BadgeScreen({ badge, message, onNext }) {
  return (
    <div className="badge-screen">
      <div className="badge-glow">🏅</div>
      <div className="badge-name">{badge}</div>
      <div className="badge-msg">{message}</div>
      <button className="game-btn" onClick={() => { playClick(); onNext() }}>Continue →</button>
    </div>
  )
}

// ── Scene: Opening Intro ───────────────────────────────────────────────────────
function IntroScene({ onDone }) {
  const LINES = [
    { type:'narrator', text:'Welcome to Walli\'s Space World!' },
    { type:'walli',    text:'Hi, Explorer! My name is Walli, and today we\'re going on the greatest adventure ever!' },
    { type:'walli',    text:'Have you ever wondered what it\'s like to walk on the Moon, fly past Saturn\'s rings, or discover a brand-new planet?' },
    { type:'walli',    text:'Well... today is your chance!' },
    { type:'walli',    text:'Together, we\'ll travel through space, meet amazing friends, solve exciting missions, and learn incredible facts about our universe.' },
    { type:'walli',    text:'Are you ready? Let\'s count down together! 🚀' },
  ]
  const [idx, setIdx] = useState(0)

  const advance = () => {
    playClick()
    if (idx < LINES.length - 1) setIdx(i => i + 1)
    else onDone()
  }

  const line = LINES[idx]
  return (
    <div className="intro-scene" onClick={advance}>
      <div className="intro-rocket-art">
        <div className="intro-stars-bg">{'✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧'}</div>
        <div className="intro-rocket-emoji">🚀</div>
        <div className="intro-launch-pad">▬▬▬▬▬</div>
      </div>
      {line.type === 'narrator'
        ? <div className="narrator-box"><p>{line.text}</p></div>
        : <WalliSays text={line.text} />
      }
      <div className="tap-hint">👆 Tap anywhere to continue</div>
      <div className="scene-dots">
        {LINES.map((_,i) => <span key={i} className={`scene-dot ${i === idx ? 'active' : i < idx ? 'done' : ''}`}/>)}
      </div>
    </div>
  )
}

// ── Scene: Countdown ──────────────────────────────────────────────────────────
function CountdownScene({ onDone }) {
  const [num, setNum] = useState(10)
  const [blastOff, setBlastOff] = useState(false)

  useEffect(() => {
    if (blastOff) {
      const t = setTimeout(onDone, 2200)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => {
      if (num > 1) {
        tone(260 + num * 28, 0.25, 'sine', 0.2)
        setNum(n => n - 1)
      } else {
        tone(880, 0.4, 'sine', 0.3)
        tone(1100, 0.6, 'sine', 0.2, 0.1)
        setBlastOff(true)
      }
    }, 750)
    return () => clearTimeout(t)
  }, [num, blastOff, onDone])

  return (
    <div className="countdown-scene">
      {!blastOff ? (
        <>
          <div className="countdown-label">🚀 Launching in...</div>
          <div className="countdown-num" key={num}>{num}</div>
          <div className="countdown-rocket">🚀</div>
        </>
      ) : (
        <div className="blastoff-wrap">
          <div className="blastoff-rocket">🚀</div>
          <div className="blastoff-text">BLAST OFF!!</div>
          <div className="blastoff-sub">Hold on, Explorer!</div>
        </div>
      )}
    </div>
  )
}

// ── Scene: Travel ─────────────────────────────────────────────────────────────
function TravelScene({ to, walliText, factIcon, factText, onDone }) {
  return (
    <div className="travel-scene">
      <div className="travel-header">Travelling to {to}...</div>
      <div className="travel-rocket">🚀</div>
      <WalliSays text={walliText} />
      <GameFact icon={factIcon} text={factText} />
      <button className="game-btn" style={{marginTop:28}} onClick={() => { playClick(); onDone() }}>
        Arrive at {to} →
      </button>
    </div>
  )
}

// ── Mission 1: Earth Launch Base ──────────────────────────────────────────────
function Mission1({ onDone }) {
  const ITEMS = [
    { id:'suit',    emoji:'👨‍🚀', label:'Put on the astronaut suit' },
    { id:'oxygen',  emoji:'🫧',  label:'Pack oxygen tanks' },
    { id:'fuel',    emoji:'⛽',  label:'Fuel the rocket' },
    { id:'belt',    emoji:'🔒',  label:'Fasten your seatbelt' },
  ]
  const [checked, setChecked] = useState([])
  const tick = id => {
    if (checked.includes(id)) return
    playCorrect(); setChecked(c => [...c, id])
  }
  if (checked.length === ITEMS.length)
    return <BadgeScreen badge="🏅 Official Space Explorer!" message="Excellent! You're now an official Space Explorer!" onNext={onDone} />

  return (
    <div className="game-mission">
      <div className="mission-hdr"><span className="mission-planet-icon">🌍</span><span className="mission-title-text">Mission 1 · Earth Launch Base</span></div>
      <WalliSays text="Before we leave Earth, every astronaut must complete their training. Can you help me?" />
      <div className="checklist">
        {ITEMS.map(it => (
          <button key={it.id} className={`checklist-item${checked.includes(it.id) ? ' checked' : ''}`} onClick={() => tick(it.id)}>
            <span className="cl-emoji">{it.emoji}</span>
            <span className="cl-label">{it.label}</span>
            <span className="cl-tick">{checked.includes(it.id) ? '✅' : '⬜'}</span>
          </button>
        ))}
      </div>
      <div className="mission-prog">{checked.length}/{ITEMS.length} complete</div>
    </div>
  )
}

// ── Mission 2: The Moon ───────────────────────────────────────────────────────
function Mission2({ onDone }) {
  const ITEMS = [
    { id:'r1', emoji:'🌑', x:12, y:28 }, { id:'r2', emoji:'🌑', x:68, y:52 },
    { id:'r3', emoji:'🌑', x:38, y:72 }, { id:'s1', emoji:'⭐', x:22, y:60 },
    { id:'s2', emoji:'⭐', x:78, y:22 }, { id:'fu', emoji:'🔋', x:54, y:42 },
  ]
  const [got, setGot] = useState([])
  const collect = id => { if (got.includes(id)) return; playCorrect(); setGot(g => [...g, id]) }
  if (got.length === ITEMS.length)
    return <BadgeScreen badge="🏅 Moon Explorer Badge!" message="Amazing! You collected everything on the Moon!" onNext={onDone} />

  return (
    <div className="game-mission moon-mission">
      <div className="mission-hdr"><span className="mission-planet-icon">🌙</span><span className="mission-title-text">Mission 2 · The Moon</span></div>
      <WalliSays text="We've landed on the Moon! Help me collect the moon rocks, stars, and rocket fuel!" />
      <GameFact icon="🌙" text="The Moon has much weaker gravity than Earth — you can jump much higher here!" />
      <div className="collect-arena">
        {ITEMS.map(it => !got.includes(it.id) && (
          <button key={it.id} className="collect-btn" style={{left:`${it.x}%`,top:`${it.y}%`}} onClick={() => collect(it.id)}>
            {it.emoji}
          </button>
        ))}
        <div className="collect-counter">{got.length}/{ITEMS.length} collected</div>
      </div>
    </div>
  )
}

// ── Mission 3: Mars ───────────────────────────────────────────────────────────
function Mission3({ onDone }) {
  const FINDS = [
    { id:'water',   emoji:'💧', label:'Frozen Water' },
    { id:'crystal', emoji:'💎', label:'Rare Crystal' },
    { id:'alien',   emoji:'👽', label:'Friendly Alien' },
  ]
  const [found, setFound] = useState([])
  const search = id => { if (found.includes(id)) return; playCorrect(); setFound(f => [...f, id]) }
  if (found.length === FINDS.length)
    return <BadgeScreen badge="🏅 Mars Discoverer Badge!" message="Incredible! You found everything hidden on Mars!" onNext={onDone} />

  return (
    <div className="game-mission mars-mission">
      <div className="mission-hdr"><span className="mission-planet-icon">🔴</span><span className="mission-title-text">Mission 3 · Mars</span></div>
      <WalliSays text="Welcome to the Red Planet! Search under the rocks to find hidden items!" />
      <GameFact icon="🔴" text="Mars looks red because its soil contains iron oxide — basically rust!" />
      <div className="search-grid">
        {FINDS.map(it => (
          <button key={it.id} className={`search-rock${found.includes(it.id) ? ' revealed' : ''}`} onClick={() => search(it.id)}>
            {found.includes(it.id)
              ? <><div className="found-emoji">{it.emoji}</div><div className="found-label">{it.label}</div></>
              : <><div className="rock-emoji">🪨</div><div className="rock-tap">Tap to search!</div></>}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Mission 4: Jupiter Dodge ──────────────────────────────────────────────────
function Mission4({ onDone }) {
  const OBSTACLES = ['🌪️','⚡','☄️','🌪️','⚡']
  const TOTAL = 5
  const [round, setRound] = useState(0)
  const [danger, setDanger] = useState(() => Math.floor(Math.random() * 3))
  const [phase, setPhase] = useState('choose') // choose | safe | hit | done
  const [dodged, setDodged] = useState(0)

  const pickLane = lane => {
    if (phase !== 'choose') return
    playClick()
    const safe = lane !== danger
    if (safe) setDodged(d => d + 1)
    setPhase(safe ? 'safe' : 'hit')
    setTimeout(() => {
      const next = round + 1
      if (next >= TOTAL) { setPhase('done'); return }
      setRound(next)
      setDanger(Math.floor(Math.random() * 3))
      setPhase('choose')
    }, 1000)
  }

  if (phase === 'done')
    return <BadgeScreen badge="🏅 Jupiter Pilot Badge!" message={`You dodged ${dodged}/${TOTAL} obstacles — amazing flying!`} onNext={onDone} />

  const LABELS = ['⬅️ Left', '⬆️ Centre', '➡️ Right']
  return (
    <div className="game-mission jupiter-mission">
      <div className="mission-hdr"><span className="mission-planet-icon">🪐</span><span className="mission-title-text">Mission 4 · Jupiter</span></div>
      <WalliSays text="Jupiter is the biggest planet! Dodge into a safe lane — avoid the storms!" />
      <GameFact icon="🪐" text="More than 1,300 Earths could fit inside Jupiter!" />
      <div className="dodge-board">
        <span>Round {round+1}/{TOTAL}</span><span>✅ {dodged} dodged</span>
      </div>
      <div className="dodge-status">
        {phase === 'choose' && <div className="dodge-warning">⚠️ INCOMING! Choose a safe lane!</div>}
        {phase === 'safe'   && <div className="dodge-ok">✅ Dodged it!</div>}
        {phase === 'hit'    && <div className="dodge-bad">💥 Hit! Keep going...</div>}
      </div>
      <div className="dodge-lanes">
        {[0,1,2].map(i => (
          <button key={i} className={`dodge-lane${phase !== 'choose' && i === danger ? ' is-danger' : ''}${phase !== 'choose' ? ' no-click' : ''}`} onClick={() => pickLane(i)}>
            <div className="dodge-top">{i === danger ? OBSTACLES[round] : '🌟'}</div>
            <div className="dodge-lbl">{LABELS[i]}</div>
            <div className="dodge-rocket">{i !== danger ? '🚀' : ''}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Mission 5: Saturn Rings ───────────────────────────────────────────────────
function Mission5({ onDone }) {
  const TOTAL = 5
  const [gaps] = useState(() => Array.from({length:TOTAL}, () => Math.random() > 0.5 ? 'left' : 'right'))
  const [ring, setRing] = useState(0)
  const [phase, setPhase] = useState('choose') // choose | pass | crash
  const [lives, setLives] = useState(3)
  const [passed, setPassed] = useState(0)

  const fly = side => {
    if (phase !== 'choose') return
    playClick()
    if (side === gaps[ring]) {
      playCorrect(); setPassed(p => p + 1); setPhase('pass')
      setTimeout(() => {
        if (ring + 1 >= TOTAL) setPhase('done')
        else { setRing(r => r + 1); setPhase('choose') }
      }, 700)
    } else {
      playWrong()
      const nl = lives - 1; setLives(nl); setPhase('crash')
      setTimeout(() => {
        if (nl <= 0) { setRing(0); setLives(3); setPassed(0) }
        setPhase('choose')
      }, 900)
    }
  }

  if (phase === 'done')
    return <BadgeScreen badge="🏅 Saturn Ring Champion!" message="You flew through all 5 rings without crashing!" onNext={onDone} />

  const gap = gaps[ring]
  return (
    <div className="game-mission saturn-mission">
      <div className="mission-hdr"><span className="mission-planet-icon">🪐</span><span className="mission-title-text">Mission 5 · Saturn's Rings</span></div>
      <WalliSays text="Look at those beautiful rings! Fly through the gap — choose left or right!" />
      <GameFact icon="💫" text="Saturn's rings are made from billions of pieces of ice and rock!" />
      <div className="ring-stats">Ring {ring+1}/{TOTAL} · ❤️×{lives}</div>

      <div className="ring-visual-wrap">
        <div className="ring-bar">
          {gap === 'left'
            ? <><div className="ring-gap"/><div className="ring-solid" style={{flex:1}}/></>
            : <><div className="ring-solid" style={{flex:1}}/><div className="ring-gap"/></>
          }
        </div>
        {phase === 'pass'  && <div className="ring-result pass-r">✅ Through the gap!</div>}
        {phase === 'crash' && <div className="ring-result crash-r">💥 Hit the ring! Try again</div>}
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

// ── Mission 6: Black Hole Repair ──────────────────────────────────────────────
function Mission6({ onDone }) {
  const PARTS = [
    { id:'engine', emoji:'⚙️', label:'Engine' },
    { id:'wing-l', emoji:'🔧', label:'Left Wing' },
    { id:'wing-r', emoji:'🔧', label:'Right Wing' },
    { id:'hull',   emoji:'🔩', label:'Hull' },
  ]
  const [fixed, setFixed] = useState([])
  const repair = id => { if (fixed.includes(id)) return; playCorrect(); setFixed(f => [...f, id]) }
  if (fixed.length === PARTS.length)
    return <BadgeScreen badge="🏅 Rocket Repair Champion!" message="You repaired the rocket just in time and escaped the black hole!" onNext={onDone} />

  return (
    <div className="game-mission blackhole-mission">
      <div className="mission-hdr"><span className="mission-planet-icon">🕳️</span><span className="mission-title-text">Mission 6 · Black Hole!</span></div>
      <WalliSays text="Oh no! A black hole is pulling us in! Repair the rocket before it's too late — tap every glowing part!" />
      <GameFact icon="🕳️" text="A black hole has gravity so strong that even light cannot escape!" />
      <div className="bh-warning">🕳️ Black hole getting closer! {fixed.length}/{PARTS.length} parts repaired</div>
      <div className="repair-grid">
        {PARTS.map(p => (
          <button key={p.id} className={`repair-part${fixed.includes(p.id) ? ' fixed' : ' broken'}`} onClick={() => repair(p.id)}>
            <div className="repair-emoji">{fixed.includes(p.id) ? '✅' : p.emoji}</div>
            <div className="repair-label">{p.label}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Game Complete ─────────────────────────────────────────────────────────────
function GameComplete({ onBack }) {
  return (
    <div className="game-complete">
      <div className="gc-stars">⭐ ⭐ ⭐</div>
      <div className="gc-walli">🧑‍🚀</div>
      <div className="gc-title">You Did It, Explorer!</div>
      <div className="gc-walli-speech">
        <p>"You did it! You're becoming an amazing Space Explorer."</p>
        <p>"But our adventure has only just begun... There are still thousands of planets waiting to be discovered."</p>
      </div>
      <div className="gc-final">
        <p>"Remember...</p>
        <p>Every astronaut starts with <strong>curiosity.</strong></p>
        <p>Every scientist starts by <strong>asking questions.</strong></p>
        <p>And every explorer starts with <strong>one small step."</strong></p>
        <p className="gc-keep">Keep dreaming... Keep exploring...</p>
        <p className="gc-universe">The universe is waiting for you! 🚀</p>
      </div>
      <div className="gc-badges">
        {['🏅 Space Explorer','🏅 Moon Explorer','🏅 Mars Discoverer','🏅 Jupiter Pilot','🏅 Saturn Champion','🏅 Rocket Repair'].map(b => (
          <div key={b} className="gc-badge">{b}</div>
        ))}
      </div>
      <button className="game-btn" style={{marginTop:28}} onClick={onBack}>🏠 Back to Home</button>
    </div>
  )
}

// ── Walli Game Main ───────────────────────────────────────────────────────────
function WalliGame({ onBack }) {
  const [scene, setScene] = useState('intro')
  const go = s => setScene(s)

  return (
    <div className="walli-game">
      <Stars/>
      <button className="back-btn game-exit-btn" onClick={onBack}>✕ Exit</button>
      {scene==='intro'     && <IntroScene      onDone={() => go('countdown')}/>}
      {scene==='countdown' && <CountdownScene  onDone={() => go('m1')}/>}
      {scene==='m1'        && <Mission1        onDone={() => go('t1')}/>}
      {scene==='t1'        && <TravelScene to="the Moon"   walliText="Wow! Look outside the window. Can you see all those stars? Did you know there are billions of stars in our galaxy?"  factIcon="⭐" factText="The Sun is actually a star — and there are billions more in our galaxy!" onDone={() => go('m2')}/>}
      {scene==='m2'        && <Mission2        onDone={() => go('t2')}/>}
      {scene==='t2'        && <TravelScene to="Mars"       walliText="We're leaving the Moon! Next stop — the Red Planet! Can you see it glowing red in the distance?"                   factIcon="🔴" factText="Mars is named after the ancient Roman god of war because of its blood-red colour." onDone={() => go('m3')}/>}
      {scene==='m3'        && <Mission3        onDone={() => go('t3')}/>}
      {scene==='t3'        && <TravelScene to="Jupiter"    walliText="Mars was incredible! Now we're heading to the giant of our solar system — Jupiter! Hold on tight!"                  factIcon="🪐" factText="Jupiter has a massive storm called the Great Red Spot that has been raging for over 350 years!" onDone={() => go('m4')}/>}
      {scene==='m4'        && <Mission4        onDone={() => go('t4')}/>}
      {scene==='t4'        && <TravelScene to="Saturn"     walliText="Jupiter was wild! Now look ahead — can you see those beautiful glowing rings? That's Saturn!"                        factIcon="💫" factText="Saturn's rings are incredibly thin — only about 1 km thick but 282,000 km wide!" onDone={() => go('m5')}/>}
      {scene==='m5'        && <Mission5        onDone={() => go('t5')}/>}
      {scene==='t5'        && <TravelScene to="a Black Hole" walliText="Oh no! Something's pulling us off course... I'm detecting a massive gravity source ahead. A Black Hole!"          factIcon="🕳️" factText="The nearest black hole to Earth is about 1,500 light-years away — safely far from us!" onDone={() => go('m6')}/>}
      {scene==='m6'        && <Mission6        onDone={() => go('complete')}/>}
      {scene==='complete'  && <GameComplete    onBack={onBack}/>}
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

// ── Home Screen ────────────────────────────────────────────────────────────────
function HomeScreen({ onExplore, onQuiz, onGalaxies, onFacts, onGame }) {
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
        <h1 className="home-title">🚀 Walli's Space World</h1>
        <p className="home-sub">Discover New Worlds with Walli!</p>
        <div className="home-story">
          <p>Join Walli on an exciting journey across the universe! Travel to distant planets, solve puzzles, rescue friendly aliens, collect space crystals, and discover amazing facts about our solar system and beyond. Every mission brings a new adventure and a chance to become the greatest space explorer in the galaxy.</p>
        </div>
        <button className="mode-card game-mode-card" onClick={() => { playClick(); onGame() }}>
          <div className="galaxy-mode-inner">
            <div className="mode-icon">🎮</div>
            <div>
              <div className="mode-name">Play Walli's Adventure</div>
              <div className="mode-desc">6 missions across the solar system — collect, dodge, explore &amp; save the day!</div>
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
      {screen === 'home'      && <HomeScreen onExplore={() => setScreen('explore')} onQuiz={() => setScreen('quiz')} onGalaxies={() => setScreen('galaxies')} onFacts={() => setScreen('facts')} onGame={() => setScreen('game')}/>}
      {screen === 'game'      && <WalliGame onBack={() => setScreen('home')}/>}
      {screen === 'explore'   && <ExploreScreen onBack={() => setScreen('home')}/>}
      {screen === 'quiz'      && <QuizScreen onBack={() => setScreen('home')}/>}
      {screen === 'galaxies'  && <GalaxiesScreen onBack={() => setScreen('home')}/>}
      {screen === 'facts'     && <FactsScreen onBack={() => setScreen('home')} onQuiz={() => setScreen('factsquiz')}/>}
      {screen === 'factsquiz' && <QuizScreen onBack={() => setScreen('facts')} questionPool={FACT_QUESTIONS}/>}
    </div>
  )
}

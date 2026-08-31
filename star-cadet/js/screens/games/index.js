// Registry of the eight mini-games (spec §7).
import * as asteroid from './asteroid.js'
import * as fuelpods from './fuelpods.js'
import * as feedalien from './feedalien.js'
import * as starbridge from './starbridge.js'
import * as meteordodge from './meteordodge.js'
import * as constellation from './constellation.js'
import * as towerclimb from './towerclimb.js'
import * as spacewhale from './spacewhale.js'

export const GAMES = {
  asteroid, fuelpods, feedalien, starbridge,
  meteordodge, constellation, towerclimb, spacewhale,
}

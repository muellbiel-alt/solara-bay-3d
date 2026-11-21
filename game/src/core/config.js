// Solara Bay 3D: Heatline — world constants, districts, missions, vehicles, weapons.
// Every name, place and character here is original. No Rockstar / GTA asset is used.
export const WORLD = {
  seed: 20261121,
  cityWidth: 760,
  cityDepth: 560,
  roadGap: 95,
  goldenHour: { skyTop: 0x7a4fd0, skyMid: 0xff8a3d, skyLow: 0xffc46b, sun: 0xffb36b, fog: 0xf2a35e },
};

export const DISTRICTS = [
  { id: 'downtown', name: 'Downtown Neon', center: [-190, -110], color: 0x2e4a7a, rep: 0, blurb: 'Glass towers, neon signs, the Heatline starts here.' },
  { id: 'harbor', name: 'Harbor Docks', center: [210, -140], color: 0x274b5f, rep: 0, blurb: 'Cranes, freighters and the Neon Vault.' },
  { id: 'palm', name: 'Palm Strip', center: [80, 190], color: 0x3d7a5a, rep: 0, blurb: 'Beachfront highway, palms, sunset chases.' },
  { id: 'industrial', name: 'Industrial Yard', center: [-280, 120], color: 0x6b4a2e, rep: 0, blurb: 'Warehouses, chop shops and quiet deals.' },
];

export const VEHICLES = [
  { id: 'solara', name: 'Solara V8', cls: 'Sports', top: 62, accel: 26, grip: 0.94, color: 0xff5a2a, price: 0 },
  { id: 'kestrel', name: 'Kestrel GT', cls: 'Super', top: 74, accel: 32, grip: 0.97, color: 0xffc21c, price: 4200 },
  { id: 'atlas', name: 'Atlas Hauler', cls: 'Truck', top: 44, accel: 16, grip: 0.88, color: 0x3f6fb5, price: 2600 },
  { id: 'meridian', name: 'Meridian Interceptor', cls: 'Police', top: 68, accel: 30, grip: 0.96, color: 0x1c2733, price: 0 },
  { id: 'bastion', name: 'Bastion Vault Truck', cls: 'Armored', top: 40, accel: 14, grip: 0.86, color: 0x5a6068, price: 9800 },
  { id: 'comet', name: 'Comet Cabrio', cls: 'Muscle', top: 58, accel: 24, grip: 0.9, color: 0x19b5a6, price: 3100 },
];

export const WEAPONS = [
  { id: 'pistol', name: 'Harbor Pistol', slot: 1, damage: 34, rate: 320, range: 90, ammo: 120 },
  { id: 'smg', name: 'Strip SMG', slot: 2, damage: 18, rate: 90, range: 70, ammo: 300 },
  { id: 'shotgun', name: 'Dockside Shotgun', slot: 3, damage: 22, rate: 650, range: 42, ammo: 48 },
  { id: 'rifle', name: 'Neon Rifle', slot: 4, damage: 46, rate: 140, range: 160, ammo: 180 },
];

export const CREW = [
  { id: 'emp', name: 'EMP Jammer', key: 'Z', cooldown: 45, blurb: 'Kills police radar and roadblock lights for 8s.' },
  { id: 'boost', name: 'Getaway Boost', key: 'X', cooldown: 30, blurb: 'Nitrous surge: +55% top speed for 5s.' },
  { id: 'smoke', name: 'Smoke Screen', key: 'C', cooldown: 25, blurb: 'Thick smoke breaks the helicopter spotlight.' },
];

export const RADIO = [
  { id: 'heatwave', name: 'HEATWAVE 98.5', genre: 'Synthwave', bpm: 112 },
  { id: 'palmfm', name: 'PALM FM 101.1', genre: 'Coastal Pop', bpm: 98 },
  { id: 'dockside', name: 'DOCKSIDE 88.0', genre: 'Night Drive', bpm: 124 },
];

export const MISSIONS = [
  { id: 1, name: 'Dockside Ignition', district: 'harbor', reward: 1200, blurb: 'Steal the Kestrel GT from Pier 4 and lose the patrol.' },
  { id: 2, name: 'Neon Alley Run', district: 'downtown', reward: 1800, blurb: 'Three checkpoints through Downtown Neon before the light turns.' },
  { id: 3, name: 'Palm Strip Getaway', district: 'palm', reward: 2400, blurb: 'Outrun a 3-star pursuit down the beachfront highway.' },
  { id: 4, name: 'Foundry Bounty', district: 'industrial', reward: 3100, blurb: 'Collect the debt from the Yard boss, quietly or loudly.' },
  { id: 5, name: 'Harbor Cargo Heist', district: 'harbor', reward: 4200, blurb: 'Lift the vault truck from the freighter dock.' },
  { id: 6, name: 'Midnight Heatline Race', district: 'downtown', reward: 5500, blurb: 'Street race across all four districts at golden hour.' },
  { id: 7, name: 'Air Support Down', district: 'palm', reward: 6800, blurb: 'Break the helicopter lock with smoke and the EMP.' },
  { id: 8, name: 'Costa Customs Job', district: 'industrial', reward: 7900, blurb: 'Deliver the tuned Comet to the garage without a scratch.' },
  { id: 9, name: 'Neon Vault Heist', district: 'harbor', reward: 12500, blurb: 'Crack the Neon Vault, hold the docks, drive out rich.' },
  { id: 10, name: 'Pier Endgame', district: 'palm', reward: 18500, blurb: 'The final run: five stars, one pier, no way back.' },
];

export const SIDE_JOBS = [
  { id: 'race', name: 'Street Race', reward: 900 },
  { id: 'taxi', name: 'Sunset Taxi', reward: 450 },
  { id: 'bounty', name: 'Street Bounty', reward: 1400 },
];

export const CONTROLS = {
  drive: 'W A S D steer & throttle, Space handbrake drift, Shift boost',
  onFoot: 'W A S D move, Shift sprint, mouse aim, click fire',
  interact: 'E enter / exit / carjack, 1-4 weapons, wheel weapon wheel',
  crew: 'Z EMP Jammer, X Getaway Boost, C Smoke Screen',
  menus: 'B Armory, G Costa Customs garage, N mission, M mute, P pause & save',
};

export function missionById(id) { return MISSIONS.find((m) => m.id === id) || MISSIONS[0]; }
export function districtById(id) { return DISTRICTS.find((d) => d.id === id) || DISTRICTS[0]; }
export function vehicleById(id) { return VEHICLES.find((v) => v.id === id) || VEHICLES[0]; }
export function weaponBySlot(slot) { return WEAPONS.find((w) => w.slot === slot) || WEAPONS[0]; }

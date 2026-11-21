// Solara Bay 3D: Heatline — bootstrap, game loop, cameras, driving, combat,
// missions, saves. Original open-world crime game, Three.js r128, offline.
import { WORLD, DISTRICTS, RADIO, missionById, vehicleById } from './core/config.js';
import { makeRandom, hashSeed } from './core/random.js';
import { Input } from './core/input.js';
import { defaultSave, loadSlot, saveSlot } from './core/storage.js';
import { buildCity } from './world/city3d.js';
import { buildLighting } from './world/lighting.js';
import { DriveState, buildVehicleMesh } from './entities/vehicles3d.js';
import { PlayerCharacter, Pedestrian } from './entities/characters3d.js';
import { Traffic } from './systems/traffic.js';
import { Police } from './systems/police.js';
import { Crew } from './systems/crew.js';
import { Combat } from './systems/combat.js';
import { Missions } from './systems/missions.js';
import { Economy } from './systems/economy.js';
import { Hud } from './ui/hud.js';
import { Menus } from './ui/menus.js';
import { shotFromUrl, stageShot } from './ui/shots.js';
import { Synth } from './audio/synth.js';

const params = new URLSearchParams(window.location.search);
const seed = Number(params.get('seed') || WORLD.seed) || WORLD.seed;
const rng = makeRandom(hashSeed('solara-bay-3d') ^ seed);

const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.5, 2200);
camera.position.set(-30, 9, 140);

const city = buildCity(scene, rng);
const lighting = buildLighting(scene);
const input = new Input(canvas);
const synth = new Synth();

// --- Game state -------------------------------------------------------------
const saved = loadSlot('autosave') || defaultSave();
const state = {
  ...saved,
  mode: 'title', shot: null, px: 0, pz: 150, heading: Math.PI,
  inCar: true, prompt: '', hudFlash: null, playMinutes: saved.playMinutes || 0,
  radio: saved.radio || 0, radioName: RADIO[saved.radio || 0].name,
  districtName: 'PALM STRIP', policeBlips: [], trafficBlips: [],
};
const player = new PlayerCharacter(scene);
const traffic = new Traffic(scene, rng);
const police = new Police(scene);
const crew = new Crew();
crew.attachSmoke(scene);
const combat = new Combat(scene);
combat.ammo = { ...state.weapons };
const missions = new Missions(state);
missions.attachMarker(scene);
const economy = new Economy(state);
const hud = new Hud(document.getElementById('hud'));
const pedestrians = [];
for (let i = 0; i < 12; i++) {
  pedestrians.push(new Pedestrian(scene, rng, rng.range(-340, 340), rng.range(-240, 300)));
}

let car = new DriveState(state.vehicle || 'solara', 0, 150, Math.PI / 2);
scene.add(car.mesh);
state.car = car;

const menus = new Menus(document.getElementById('menus'), {
  state: () => state,
  onTitle(act) {
    synth.unlock();
    if (act === 'play' || act === 'continue' || act === 'resume' || act === 'restart') {
      if (act === 'restart') Object.assign(state, defaultSave());
      state.mode = 'play';
      menus.showTitle(false); menus.hidePanel();
      hud.el.objective.style.display = '';
      synth.startRadio();
    }
    if (act === 'garage') menus.showGarage(state);
  },
  onSave(slot) { saveSlot(slot, state); state.hudFlash = 'Saved to ' + slot; },
  onBuyMod(id) { if (economy.buyMod(id)) state.hudFlash = 'Upgrade installed'; },
  onBuyCar(id) {
    if (state.owned.includes(id)) { state.vehicle = id; swapCar(id); }
    else if (economy.buyVehicle(id)) { swapCar(id); state.hudFlash = 'New ride: ' + vehicleById(id).name; }
  },
  onBuyAmmo(id) { if (economy.buyAmmo(id)) { combat.ammo = { ...state.weapons }; state.hudFlash = 'Ammo restocked'; } },
});
state.police = police; state.missions = missions; state.crew = crew; state.combat = combat;

function swapCar(id) {
  scene.remove(car.mesh);
  car = new DriveState(id, state.px, state.pz, state.heading);
  scene.add(car.mesh);
  state.car = car; state.inCar = true;
}

let cameraMode = 'chase';
function setCameraMode(mode) { cameraMode = mode; }
function placeCar(id, x, z, heading) {
  scene.remove(car.mesh);
  car = new DriveState(id, x, z, heading);
  scene.add(car.mesh);
  state.car = car; state.inCar = true;
  state.px = x; state.pz = z; state.heading = heading;
  player.mesh.visible = false;
}
function placeOnFoot(x, z, heading) {
  state.inCar = false;
  state.px = x; state.pz = z; state.heading = heading;
  player.x = x; player.z = z; player.heading = heading;
  player.mesh.visible = true;
  player.mesh.position.set(x, 0, z);
}

function hudState() {
  return {
    ...state,
    police, missions, crew, combat,
    px: state.px, pz: state.pz, heading: state.heading,
    policeBlips: police.cruisers.filter((c) => c.active).map((c) => ({ x: c.x, z: c.z })),
    trafficBlips: traffic.cars.slice(0, 8).map((c) => ({ x: c.mesh.position.x, z: c.mesh.position.z })),
  };
}

function updateCamera(dt, t) {
  const fwdX = Math.sin(state.heading), fwdZ = Math.cos(state.heading);
  // Right-hand side vector, for a three-quarter chase view of the car.
  const rightX = fwdZ, rightZ = -fwdX;
  let tx = state.px, tz = state.pz, cx, cz, cy;
  if (cameraMode === 'cinematic') {
    // High over the highway, looking east down Palm Strip: towers left,
    // palms and ocean right, the whole coast behind the results card.
    camera.position.set(-140, 36, 120);
    camera.lookAt(200, 2, 210);
    return;
  }
  if (cameraMode === 'over-shoulder') {
    cx = state.px - fwdX * 7.5 + rightX * 2.6; cz = state.pz - fwdZ * 7.5 + rightZ * 2.6; cy = 3.4;
    tx = state.px + fwdX * 12; tz = state.pz + fwdZ * 12;
  } else if (cameraMode === 'chase-high') {
    cx = state.px - fwdX * 15 + rightX * 5; cz = state.pz - fwdZ * 15 + rightZ * 5; cy = 8;
    tx = state.px + fwdX * 18; tz = state.pz + fwdZ * 18;
  } else {
    cx = state.px - fwdX * 11.5 + rightX * 4.2; cz = state.pz - fwdZ * 11.5 + rightZ * 4.2; cy = 4.6;
    tx = state.px + fwdX * 16; tz = state.pz + fwdZ * 16;
  }
  // Shot mode snaps exactly onto the staged pose; live play smooth-follows.
  if (state.mode === 'shot') { camera.position.set(cx, cy, cz); camera.lookAt(tx, 2.2, tz); return; }
  const k = state.mode === 'title' ? 0.02 : 1 - Math.pow(0.001, dt);
  camera.position.x += (cx - camera.position.x) * k;
  camera.position.y += (cy - camera.position.y) * k;
  camera.position.z += (cz - camera.position.z) * k;
  if (state.mode === 'title') {
    const a = t * 0.07;
    camera.position.set(state.px - Math.sin(a) * 26, 7 + Math.sin(t * 0.3) * 1.5, state.pz - Math.cos(a) * 26);
  }
  camera.lookAt(tx, 2.2, tz);
}

function districtAt(x, z) {
  let best = DISTRICTS[0], bd = Infinity;
  for (const d of DISTRICTS) {
    const dd = (d.center[0] - x) ** 2 + (d.center[1] - z) ** 2;
    if (dd < bd) { bd = dd; best = d; }
  }
  return best.name.toUpperCase();
}

function tickWorld(dt, t) {
  city.update(t);
  const danger = combat.lastShot > t - 1;
  traffic.update(dt, t, { x: state.px, z: state.pz }, danger);
  for (const p of pedestrians) p.update(dt, danger);
  police.update(dt, t, state.px, state.pz, car.speed, state.heading);
  crew.update(dt, { police, px: state.px, pz: state.pz });
  combat.update(dt);
  lighting.update(t, police.cruisers.find((c) => c.active)?.mesh.position, police.wanted);
  state.districtName = districtAt(state.px, state.pz);
}

function playStep(dt, t, now) {
  const throttle = input.axis('KeyS', 'KeyW');
  const steer = input.axis('KeyA', 'KeyD');
  if (state.inCar) {
    car.update(dt, throttle, steer, input.down('Space'));
    state.px = car.x; state.pz = car.z; state.heading = car.heading;
    synth.engine(Math.abs(car.speed) / car.topSpeed());
    if (input.wasPressed('KeyE')) {
      placeOnFoot(car.x - 3, car.z, car.heading);
      state.hudFlash = 'On foot — press E near a car to jack it';
    }
  } else {
    const sprint = input.down('ShiftLeft') || input.down('ShiftRight');
    const mx = input.axis('KeyA', 'KeyD'), mz = input.axis('KeyW', 'KeyS');
    player.update(dt, mx, mz, sprint);
    state.px = player.x; state.pz = player.z; state.heading = player.heading;
    const near = traffic.nearest(state.px, state.pz, 7);
    state.prompt = near ? `Press E to jack the ${near.spec.name} — ${near.spec.cls}` : '';
    if (input.wasPressed('KeyE') && near) {
      const specId = near.spec.id;
      scene.remove(near.mesh);
      traffic.cars.splice(traffic.cars.indexOf(near), 1);
      placeCar(specId, near.mesh.position.x, near.mesh.position.z, near.mesh.rotation.y);
      police.raise(12, 'Carjacking reported');
      state.hudFlash = 'Jacked the ' + near.spec.name;
    }
    synth.engine(0);
  }
  // Combat: click to fire (on foot or drive-by), wheel / 1-4 to switch.
  if (input.mouseDown) {
    const ok = combat.fire(now, { x: state.px, y: 1.6, z: state.pz },
      { x: Math.sin(state.heading), z: Math.cos(state.heading) },
      () => { police.raise(6, 'Shots fired'); synth.gunshot(); });
    if (ok) for (const p of pedestrians) p.panic = 1;
  }
  if (input.wheelDelta !== 0) combat.cycle(input.wheelDelta > 0 ? 1 : -1);
  for (let s = 1; s <= 4; s++) if (input.wasPressed('Digit' + s)) combat.slot = s;
  if (input.wasPressed('KeyZ')) crew.use('emp', { police, car, px: state.px, pz: state.pz });
  if (input.wasPressed('KeyX')) crew.use('boost', { police, car, px: state.px, pz: state.pz });
  if (input.wasPressed('KeyC')) crew.use('smoke', { police, car, px: state.px, pz: state.pz });
  if (input.wasPressed('KeyB')) { state.mode = 'pause'; menus.showArmory(state); }
  if (input.wasPressed('KeyG')) { state.mode = 'pause'; menus.showGarage(state); }
  if (input.wasPressed('KeyN')) {
    const job = missions.startSide('race');
    if (job) state.hudFlash = 'Side job: ' + job.name + ' — reach the gold marker';
  }
  if (input.wasPressed('KeyV')) { state.radioName = synth.setStation(state.radio + 1).name; state.radio = synth.station; }
  if (input.wasPressed('KeyM')) synth.setMuted(!synth.muted);
  if (input.wasPressed('KeyP') || input.wasPressed('Escape')) {
    state.mode = 'pause'; saveSlot('autosave', state); menus.showPause(state);
  }
  const done = missions.update(t, state.px, state.pz);
  if (done) {
    state.hudFlash = done.mission.name + ' complete +$' + done.reward.toLocaleString('en-US');
    menus.showResults(done);
    saveSlot('autosave', state);
  }
  synth.siren(police.wanted > 0 && state.mode === 'play');
}

// --- Shot mode vs live game --------------------------------------------------
const shot = shotFromUrl();
const ctx = {
  state, player, police, missions, crew, combat, hud, menus, camera, traffic,
  setCameraMode, placeCar, placeOnFoot, tickWorld,
  get car() { return car; },
  hudState,
};
if (shot) {
  state.mode = 'shot';
  menus.showTitle(false);
  stageShot(ctx, shot.shot);
  updateCamera(0.016, 4.2);
  renderer.render(scene, camera);
  hud.update(hudState());
  renderer.render(scene, camera);
} else {
  // Title attract scene: the chase is already staged behind the menu.
  placeCar(state.vehicle || 'solara', -40, 180, Math.PI / 2);
  police.heat = 55; police.wanted = 3;
  police.log('DISPATCH: PURSUIT — suspect fleeing down Palm Strip.');
  menus.showTitle(true);
  hud.el.objective.style.display = 'none';
  let last = performance.now();
  let elapsed = 0;
  function loop(now) {
    requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const t = now / 1000;
    elapsed += dt;
    if (state.mode === 'play') { playStep(dt, t, now / 1000); state.playMinutes = Math.floor(elapsed / 60); }
    if (state.mode !== 'pause') tickWorld(dt, t);
    updateCamera(dt, t);
    hud.update(hudState());
    renderer.render(scene, camera);
    input.endFrame();
  }
  requestAnimationFrame(loop);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
window.__solara = { state, placeCar, placeOnFoot, setCameraMode, scene, camera, renderer };

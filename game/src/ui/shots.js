// Deterministic screenshot staging (?shot=title|chase|mission|results&seed=1).
// Each shot places the player, police, helicopter and HUD in one fixed,
// seeded pose — the same pixels every run, no wall-clock randomness.
import { missionById } from '../core/config.js';

export const SHOT_NAMES = ['title', 'chase', 'mission', 'results'];

export function shotFromUrl() {
  const q = new URLSearchParams(window.location.search);
  const shot = q.get('shot');
  if (!SHOT_NAMES.includes(shot)) return null;
  const seed = Number(q.get('seed') || '1') || 1;
  return { shot, seed };
}

// ctx: { state, player, car, police, missions, crew, combat, hud, menus,
//        camera, traffic, setCameraMode, placeCar, placeOnFoot }
export function stageShot(ctx, name) {
  const s = ctx.state;
  s.mode = 'shot';
  s.shot = name;
  ctx.menus.showTitle(false);
  ctx.menus.hidePanel();
  if (name === 'title') {
    s.missionActive = 1; s.missionDone = [];
    s.cash = 1250; s.health = 100; s.armor = 50;
    ctx.placeCar('solara', -40, 180, Math.PI / 2);
    ctx.car.speed = 42;
    ctx.police.heat = 55; ctx.police.wanted = 3;
    ctx.police.log('DISPATCH: PURSUIT — suspect fleeing down Palm Strip.');
    ctx.police.log('DISPATCH: Air support CONDOR-1 is overhead.');
    ctx.police.update(0.1, 2.4, -40, 180, 30, Math.PI / 2);
    ctx.menus.showTitle(true);
    ctx.hud.el.objective.style.display = 'none';
    ctx.setCameraMode('chase');
    s.prompt = '';
  }
  if (name === 'chase') {
    s.missionActive = 3; s.missionDone = [1, 2];
    s.cash = 4850; s.health = 82; s.armor = 35;
    ctx.placeCar('kestrel', -60, 180, Math.PI / 2);
    ctx.car.speed = 48;
    ctx.car.boostTimer = 3;
    ctx.crew.abilities.find((a) => a.id === 'emp').activeFor = 5;
    ctx.police.heat = 88; ctx.police.wanted = 4;
    ctx.police.log('DISPATCH: LOCKDOWN — roadblocks on the coastal highway.');
    ctx.police.log('DISPATCH: Air support CONDOR-1 is overhead.');
    ctx.police.log('DISPATCH: EMP Jammer ACTIVE — radar down 8s.');
    ctx.police.update(0.1, 2.4, -60, 180, 48, Math.PI / 2);
    ctx.setCameraMode('chase-high');
    s.prompt = '';
  }
  if (name === 'mission') {
    s.missionActive = 9; s.missionDone = [1, 2, 3, 4, 5, 6, 7, 8];
    s.cash = 21400; s.health = 76; s.armor = 60;
    // Open container yard east of the harbor towers, facing the freighter,
    // vault truck and the parked Kestrel GT getaway car.
    ctx.placeOnFoot(350, -210, -1.95);
    ctx.combat.slot = 4;
    ctx.combat.wheelOpen = true;
    ctx.hud.showWheel(ctx.combat.wheelItems());
    ctx.police.heat = 64; ctx.police.wanted = 3;
    ctx.police.log('DISPATCH: MANHUNT — Neon Vault alarm at Harbor Docks.');
    ctx.police.log('DISPATCH: Air support CONDOR-1 is overhead.');
    ctx.police.update(0.1, 2.4, 350, -210, 0, -1.95);
    ctx.setCameraMode('over-shoulder');
    s.prompt = 'Press E to jack the Kestrel GT — Harbor Docks';
  }
  if (name === 'results') {
    s.missionActive = 10; s.missionDone = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    s.cash = 39900; s.health = 100; s.armor = 80;
    s.reputation = { downtown: 64, harbor: 88, palm: 72, industrial: 51 };
    ctx.placeCar('solara', 120, 180, Math.PI / 2);
    ctx.police.heat = 0; ctx.police.wanted = 0;
    ctx.menus.showResults({ mission: missionById(9), reward: 12500 });
    ctx.setCameraMode('cinematic');
    s.prompt = '';
  }
  // Settle traffic, pedestrians and the helicopter for a few fixed steps.
  for (let i = 0; i < 24; i++) {
    ctx.tickWorld(1 / 60, 4.2 + i / 60);
  }
  ctx.hud.update(ctx.hudState());
  window.__shotReady = true;
  document.documentElement.dataset.shot = name;
}

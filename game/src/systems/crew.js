// Crew abilities with HUD cooldowns: EMP Jammer, Getaway Boost, Smoke Screen.
// Each fires once, then recharges on its own timer.
import { CREW } from '../core/config.js';

export class Crew {
  constructor() {
    this.abilities = CREW.map((c) => ({ ...c, readyIn: 0, activeFor: 0 }));
    this.smokeGroup = null;
  }
  attachSmoke(scene) {
    const g = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({ color: 0xcccccc, transparent: true, opacity: 0.5 });
    for (let i = 0; i < 14; i++) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(2.2 + (i % 3), 8, 8), mat);
      s.position.set((i % 5 - 2) * 3.2, 1.6 + (i % 3), (Math.floor(i / 5) - 1) * 3.4);
      g.add(s);
    }
    g.visible = false;
    scene.add(g);
    this.smokeGroup = g;
  }
  ready(id) { return this.abilities.find((a) => a.id === id).readyIn <= 0; }
  use(id, state) {
    const a = this.abilities.find((x) => x.id === id);
    if (!a || a.readyIn > 0) return false;
    a.readyIn = a.cooldown;
    a.activeFor = id === 'emp' ? 8 : id === 'boost' ? 5 : 6;
    if (id === 'emp') state.police.lower(30);
    if (id === 'boost' && state.car) state.car.boostTimer = 5;
    if (id === 'smoke' && this.smokeGroup) {
      this.smokeGroup.position.set(state.px, 0, state.pz);
      this.smokeGroup.visible = true;
    }
    state.hudFlash = a.name + ' ACTIVE';
    return true;
  }
  update(dt, state) {
    for (const a of this.abilities) {
      if (a.readyIn > 0) a.readyIn -= dt;
      if (a.activeFor > 0) {
        a.activeFor -= dt;
        if (a.id === 'smoke' && this.smokeGroup && a.activeFor <= 0) this.smokeGroup.visible = false;
        if (a.id === 'emp' && state.police) state.police.lower(dt * 2);
      }
    }
  }
  hudLines() {
    return this.abilities.map((a) => ({
      id: a.id, name: a.name, key: a.key,
      pct: a.readyIn > 0 ? Math.max(0, 1 - a.readyIn / a.cooldown) : 1,
      active: a.activeFor > 0,
    }));
  }
}

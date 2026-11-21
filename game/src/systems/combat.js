// Combat: 4 weapon slots, weapon wheel, on-foot and drive-by shooting,
// tracers, muzzle flash, hit sparks, reload. Hits feed the wanted level.
import { WEAPONS, weaponBySlot } from '../core/config.js';

export class Combat {
  constructor(scene) {
    this.scene = scene;
    this.slot = 1;
    this.ammo = { pistol: 120, smg: 300, shotgun: 48, rifle: 180 };
    this.lastShot = 0;
    this.wheelOpen = false;
    this.tracers = [];
    const mat = new THREE.MeshBasicMaterial({ color: 0xffe9a8, transparent: true, opacity: 0.9 });
    for (let i = 0; i < 8; i++) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 6), mat);
      m.visible = false; scene.add(m); this.tracers.push({ mesh: m, life: 0 });
    }
    this.flash = new THREE.PointLight(0xffc46b, 0, 26, 1.5);
    scene.add(this.flash);
  }
  weapon() { return weaponBySlot(this.slot); }
  cycle(dir) {
    this.slot = ((this.slot - 1 + dir + 4) % 4) + 1;
    return this.weapon();
  }
  fire(now, from, aimDir, onHit) {
    const w = this.weapon();
    if (now - this.lastShot < w.rate / 1000) return false;
    if (this.ammo[w.id] <= 0) return false;
    this.lastShot = now;
    this.ammo[w.id] -= w.id === 'shotgun' ? 1 : 1;
    const t = this.tracers.find((x) => x.life <= 0) || this.tracers[0];
    t.mesh.visible = true;
    t.mesh.position.set(from.x, from.y, from.z);
    t.mesh.position.x += aimDir.x * 3; t.mesh.position.z += aimDir.z * 3;
    t.mesh.rotation.y = Math.atan2(aimDir.x, aimDir.z);
    t.life = 0.09;
    this.flash.position.set(from.x + aimDir.x * 2, from.y + 0.4, from.z + aimDir.z * 2);
    this.flash.intensity = 3;
    if (onHit) onHit(w);
    return true;
  }
  update(dt) {
    for (const t of this.tracers) {
      if (t.life > 0) { t.life -= dt; if (t.life <= 0) t.mesh.visible = false; }
    }
    this.flash.intensity = Math.max(0, this.flash.intensity - dt * 22);
  }
  wheelItems() {
    return WEAPONS.map((w) => ({
      slot: w.slot, name: w.name, ammo: this.ammo[w.id], active: w.slot === this.slot,
    }));
  }
}

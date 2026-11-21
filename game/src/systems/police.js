// Wanted level 1–5: dispatch log, pursuit cruisers, spike roadblocks,
// SWAT trucks at 4 stars, helicopter air support from 3 stars up.
import { buildVehicleMesh } from '../entities/vehicles3d.js';
import { PoliceHelicopter } from '../entities/helicopter3d.js';
import { buildCharacterMesh } from '../entities/characters3d.js';

export const WANTED_LABELS = ['CLEAN', 'SUSPECT', 'PURSUIT', 'MANHUNT', 'LOCKDOWN', 'HEATLINE'];

export class Police {
  constructor(scene) {
    this.scene = scene;
    this.wanted = 0;
    this.heat = 0;
    this.cruisers = [];
    this.roadblocks = [];
    this.dispatch = [];
    this.heli = new PoliceHelicopter(scene);
    this.swat = [];
    for (let i = 0; i < 5; i++) {
      const mesh = buildVehicleMesh({ id: 'meridian', name: 'Meridian Interceptor', cls: 'Police', top: 68, accel: 30, grip: 0.96, color: 0x1c2733 }, { police: true });
      mesh.visible = false;
      scene.add(mesh);
      this.cruisers.push({ mesh, x: 0, z: 0, heading: 0, speed: 0, active: false });
    }
    // Roadblock props: striped barriers + flare cones, hidden until placed.
    for (let i = 0; i < 3; i++) {
      const g = new THREE.Group();
      for (const sx of [-6, 0, 6]) {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(5, 1.1, 0.6),
          new THREE.MeshLambertMaterial({ color: sx === 0 ? 0xffc21c : 0xe8e8e8 }));
        bar.position.set(sx, 0.8, 0); bar.castShadow = true; g.add(bar);
        const cone = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.1, 8),
          new THREE.MeshLambertMaterial({ color: 0xff5a2a }));
        cone.position.set(sx + 2.5, 0.55, 2); g.add(cone);
      }
      const cop = buildCharacterMesh({ shirt: 0x1c2733, pants: 0x1c2733, cap: 0x1c2733, armed: true, police: true });
      cop.position.set(8, 0, 3); g.add(cop);
      g.visible = false;
      scene.add(g);
      this.roadblocks.push(g);
    }
  }
  log(text) {
    this.dispatch.unshift(text);
    if (this.dispatch.length > 5) this.dispatch.pop();
  }
  raise(amount, reason) {
    const before = this.wanted;
    this.heat = Math.min(100, this.heat + amount);
    this.wanted = Math.min(5, Math.floor(this.heat / 20));
    if (this.wanted > before) {
      this.log(`DISPATCH: ${WANTED_LABELS[this.wanted]} — ${reason}`);
      if (this.wanted >= 3) this.log('DISPATCH: Air support CONDOR-1 is overhead.');
      if (this.wanted >= 4) this.log('DISPATCH: Roadblocks on the coastal highway.');
    }
  }
  lower(amount) {
    this.heat = Math.max(0, this.heat - amount);
    this.wanted = Math.min(5, Math.floor(this.heat / 20));
  }
  update(dt, t, px, pz, playerSpeed, heading = 0) {
    const want = this.wanted;
    const needCruisers = want === 0 ? 0 : want === 1 ? 1 : want === 2 ? 2 : want === 3 ? 3 : want === 4 ? 4 : 5;
    for (let i = 0; i < this.cruisers.length; i++) {
      const c = this.cruisers[i];
      const active = i < needCruisers;
      c.active = active;
      c.mesh.visible = active;
      if (!active) continue;
      // Spawn behind the player on first activation, then pursue.
      if (c.speed === 0 && (Math.abs(c.x - px) > 120 || Math.abs(c.z - pz) > 120)) {
        c.x = px + (i % 2 ? -1 : 1) * 55; c.z = pz - 48 - i * 9;
      }
      const dx = px - c.x, dz = pz - c.z;
      const dist = Math.max(1, Math.hypot(dx, dz));
      const targetHeading = Math.atan2(dx, dz);
      let dh = targetHeading - c.heading;
      while (dh > Math.PI) dh -= Math.PI * 2;
      while (dh < -Math.PI) dh += Math.PI * 2;
      c.heading += dh * Math.min(1, dt * 2.2);
      const top = 46 + want * 4;
      c.speed = Math.min(top, c.speed + dt * 18);
      if (dist < 9) c.speed = Math.max(6, playerSpeed * 0.9);
      c.x += Math.sin(c.heading) * c.speed * dt;
      c.z += Math.cos(c.heading) * c.speed * dt;
      c.mesh.position.set(c.x, 0, c.z);
      c.mesh.rotation.y = c.heading;
      const bar = c.mesh.userData.lightBar;
      if (bar) {
        const flash = Math.sin(t * 9 + i) > 0;
        bar.userData.red.material.color.setHex(flash ? 0xff2a2a : 0x551111);
        bar.userData.blue.material.color.setHex(flash ? 0x113355 : 0x2a6bff);
      }
      if (dist < 7 && this.wanted > 0) this.raise(0.2, 'Cruiser contact');
    }
    // Roadblocks appear at 4+ stars, staggered ahead of the player along
    // the direction of travel, across the road.
    const wantBlocks = want >= 4 ? (want === 5 ? 3 : 2) : 0;
    const fwdX = Math.sin(heading), fwdZ = Math.cos(heading);
    const rgtX = fwdZ, rgtZ = -fwdX;
    for (let i = 0; i < this.roadblocks.length; i++) {
      const g = this.roadblocks[i];
      g.visible = i < wantBlocks;
      if (g.visible) {
        const along = 58 + i * 16;
        g.position.set(
          px + fwdX * along + rgtX * (i - 1) * 12,
          0,
          pz + fwdZ * along + rgtZ * (i - 1) * 12,
        );
        g.rotation.y = heading;
      }
    }
    this.heli.update(dt, px, pz, want >= 3);
  }
}

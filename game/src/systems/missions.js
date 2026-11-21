// Ten original story missions, from Dockside Ignition to Pier Endgame,
// plus side contracts. Progress, objective markers and payouts live here.
import { MISSIONS, SIDE_JOBS, missionById, districtById } from '../core/config.js';

export const MISSION_SPOTS = {
  1: { x: 280, z: -230, label: 'Pier 4 — steal the Kestrel GT' },
  2: { x: -190, z: -110, label: 'Downtown Neon — 3 checkpoints' },
  3: { x: 150, z: 180, label: 'Palm Strip — lose the pursuit' },
  4: { x: -210, z: 160, label: 'Industrial Yard — collect the debt' },
  5: { x: 280, z: -240, label: 'Freighter dock — lift the vault truck' },
  6: { x: 0, z: 180, label: 'Heatline Race — all four districts' },
  7: { x: 150, z: 180, label: 'Palm Strip — break the heli lock' },
  8: { x: -210, z: 160, label: 'Costa Customs — deliver the Comet' },
  9: { x: 230, z: -200, label: 'Neon Vault — crack it, hold the docks' },
  10: { x: 320, z: 200, label: 'Pier Endgame — five stars, one pier' },
};

export class Missions {
  constructor(state) {
    this.state = state;
    this.marker = null;
    this.sideActive = null;
    this.checkpoints = 0;
  }
  attachMarker(scene) {
    const geo = new THREE.ConeGeometry(2.2, 6, 4);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffc21c });
    this.marker = new THREE.Mesh(geo, mat);
    this.marker.rotation.x = Math.PI;
    scene.add(this.marker);
    const ring = new THREE.Mesh(new THREE.RingGeometry(4, 5.2, 24),
      new THREE.MeshBasicMaterial({ color: 0xffc21c, transparent: true, opacity: 0.7, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2;
    this.markerRing = ring;
    scene.add(ring);
  }
  active() { return missionById(this.state.missionActive); }
  spot() { return MISSION_SPOTS[this.state.missionActive] || MISSION_SPOTS[1]; }
  startSide(id) {
    const job = SIDE_JOBS.find((j) => j.id === id);
    if (!job || this.sideActive) return null;
    this.sideActive = { ...job, startedAt: Date.now() };
    return this.sideActive;
  }
  completeSide() {
    if (!this.sideActive) return 0;
    const pay = this.sideActive.reward;
    this.state.cash += pay;
    this.sideActive = null;
    return pay;
  }
  // Reach the marker: mission completes, payout lands, next mission unlocks.
  checkArrival(px, pz) {
    const spot = this.spot();
    const d = Math.hypot(px - spot.x, pz - spot.z);
    if (d > 16) return null;
    const m = this.active();
    if (!this.state.missionDone.includes(m.id)) this.state.missionDone.push(m.id);
    this.state.cash += m.reward;
    const rep = districtById(m.district);
    this.state.reputation[m.district] = Math.min(100, (this.state.reputation[m.district] || 0) + 14);
    const done = { mission: m, reward: m.reward };
    this.state.missionActive = Math.min(10, m.id + 1);
    this.state.completedAt = this.state.missionDone.length >= 10 ? 'Pier Endgame cleared' : null;
    return done;
  }
  update(t, px, pz) {
    const spot = this.spot();
    if (this.marker) {
      this.marker.position.set(spot.x, 14 + Math.sin(t * 2.4) * 1.6, spot.z);
      this.marker.rotation.y = t * 1.4;
      this.markerRing.position.set(spot.x, 0.15, spot.z);
      this.markerRing.scale.setScalar(1 + Math.sin(t * 2.4) * 0.12);
    }
    return this.checkArrival(px, pz);
  }
  progressText() {
    return `${this.state.missionDone.length}/10 missions — ${this.active().name}`;
  }
}

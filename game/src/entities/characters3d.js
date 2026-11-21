// Low-poly articulated characters: player, pedestrians, police.
// Blocky limbs swing while walking; police carry a rifle and a light bar glow.
export function buildCharacterMesh(opts = {}) {
  const skin = opts.skin || 0xc98d64;
  const shirt = opts.shirt || 0xff5a2a;
  const pants = opts.pants || 0x2e3a4d;
  const g = new THREE.Group();
  g.name = opts.name || 'character';
  const mat = (c) => new THREE.MeshLambertMaterial({ color: c });
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.05, 0.5), mat(shirt));
  torso.position.y = 1.45; torso.castShadow = true; g.add(torso);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.55), mat(skin));
  head.position.y = 2.25; head.castShadow = true; g.add(head);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.18, 0.6), mat(opts.cap || 0x1c2733));
  cap.position.y = 2.56; g.add(cap);
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.95, 0.36), mat(pants));
  legL.position.set(-0.22, 0.48, 0); legL.castShadow = true; g.add(legL);
  const legR = legL.clone(); legR.position.x = 0.22; g.add(legR);
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.9, 0.32), mat(shirt));
  armL.position.set(-0.6, 1.5, 0); armL.castShadow = true; g.add(armL);
  const armR = armL.clone(); armR.position.x = 0.6; g.add(armR);
  let gun = null;
  if (opts.armed) {
    gun = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.95),
      new THREE.MeshLambertMaterial({ color: 0x14161a }));
    gun.position.set(0.6, 1.35, 0.5); g.add(gun);
  }
  if (opts.police) {
    const vest = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 0.54),
      new THREE.MeshLambertMaterial({ color: 0x1c2733 }));
    vest.position.y = 1.5; g.add(vest);
  }
  g.userData = { legL, legR, armL, armR, gun, walkPhase: Math.random() * 6 };
  return g;
}

export class Pedestrian {
  constructor(scene, rng, x, z) {
    this.mesh = buildCharacterMesh({
      skin: rng.pick([0xc98d64, 0x8a5a38, 0xe8b88a]),
      shirt: rng.pick([0x3fae5a, 0x2a7fd8, 0xe8b13c, 0xd84a8a, 0x8a6fd8]),
      pants: rng.pick([0x2e3a4d, 0x3a3a3a, 0x5a4a3a]),
    });
    this.mesh.position.set(x, 0, z);
    this.heading = rng.range(0, Math.PI * 2);
    this.speed = rng.range(1.2, 2.4);
    this.panic = 0;
    scene.add(this.mesh);
  }
  update(dt, danger) {
    if (danger) this.panic = 1;
    const sp = this.panic > 0 ? this.speed * 3.2 : this.speed;
    this.mesh.position.x += Math.sin(this.heading) * sp * dt;
    this.mesh.position.z += Math.cos(this.heading) * sp * dt;
    if (Math.abs(this.mesh.position.x) > 370 || Math.abs(this.mesh.position.z) > 320) this.heading += Math.PI;
    const u = this.mesh.userData;
    u.walkPhase += dt * (this.panic > 0 ? 11 : 6);
    const swing = Math.sin(u.walkPhase) * 0.55;
    u.legL.rotation.x = swing; u.legR.rotation.x = -swing;
    u.armL.rotation.x = -swing * 0.8; u.armR.rotation.x = swing * 0.8;
    this.mesh.rotation.y = this.heading;
    if (this.panic > 0) this.panic = Math.max(0, this.panic - dt * 0.25);
  }
}

export class PlayerCharacter {
  constructor(scene) {
    this.mesh = buildCharacterMesh({ shirt: 0xff5a2a, pants: 0x22303f, cap: 0xffc21c, armed: true, name: 'player' });
    this.mesh.position.set(0, 0, 150);
    this.x = 0; this.z = 150; this.heading = Math.PI;
    this.speed = 0; this.walkPhase = 0;
    scene.add(this.mesh);
  }
  update(dt, moveX, moveZ, sprint) {
    const sp = sprint ? 9.5 : 5.2;
    this.x += moveX * sp * dt; this.z += moveZ * sp * dt;
    this.x = Math.max(-380, Math.min(380, this.x));
    this.z = Math.max(-280, Math.min(330, this.z));
    const moving = Math.abs(moveX) + Math.abs(moveZ) > 0.1;
    if (moving) {
      this.heading = Math.atan2(moveX, moveZ);
      this.walkPhase += dt * (sprint ? 13 : 8);
    }
    const u = this.mesh.userData;
    const swing = moving ? Math.sin(this.walkPhase) * 0.6 : 0;
    u.legL.rotation.x = swing; u.legR.rotation.x = -swing;
    u.armL.rotation.x = -swing * 0.7; u.armR.rotation.x = swing * 0.7;
    this.mesh.position.set(this.x, 0, this.z);
    this.mesh.rotation.y = this.heading;
  }
}

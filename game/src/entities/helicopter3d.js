// Police air support: 3D helicopter with spinning main rotor, tail rotor,
// searchlight beam and a spotlight cone that tracks the player.
export function buildHelicopterMesh() {
  const g = new THREE.Group();
  g.name = 'police-helicopter';
  const bodyMat = new THREE.MeshPhongMaterial({ color: 0x1c2733, shininess: 60 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.6, 5.2), bodyMat);
  body.castShadow = true; g.add(body);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.0, 1.6),
    new THREE.MeshPhongMaterial({ color: 0x9fd8e8, shininess: 160 }));
  glass.position.set(0, 0.3, 2.0); g.add(glass);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 5.4), bodyMat);
  tail.position.set(0, 0.3, -4.6); g.add(tail);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.6, 1.2), bodyMat);
  fin.position.set(0, 0.9, -7.0); g.add(fin);
  const skidMat = new THREE.MeshLambertMaterial({ color: 0x111318 });
  for (const sx of [-1.1, 1.1]) {
    const skid = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 4.4), skidMat);
    skid.position.set(sx, -1.05, 0.4); g.add(skid);
  }
  const rotor = new THREE.Group();
  const bladeMat = new THREE.MeshLambertMaterial({ color: 0x22242c });
  for (const a of [0, Math.PI / 2]) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(11, 0.08, 0.5), bladeMat);
    blade.rotation.y = a; rotor.add(blade);
  }
  rotor.position.y = 1.35; g.add(rotor);
  const tailRotor = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.6, 0.3), bladeMat);
  tailRotor.position.set(-0.45, 0.9, -7.0); g.add(tailRotor);
  // Searchlight cone + lamp under the nose.
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0xfff2c0, transparent: true, opacity: 0.10,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  });
  // Unit-height cone: apex at the helicopter, wide end at the street below.
  const beam = new THREE.Mesh(new THREE.ConeGeometry(4.5, 1, 16, 1, true), beamMat);
  beam.position.set(0, -15, 1);
  g.add(beam);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xfff6d8 }));
  lamp.position.set(0, -0.9, 2.2); g.add(lamp);
  g.userData = { rotor, tailRotor, beam };
  return g;
}

export class PoliceHelicopter {
  constructor(scene) {
    this.mesh = buildHelicopterMesh();
    this.mesh.position.set(30, 30, 90);
    this.x = 30; this.z = 90; this.alt = 30; this.orbit = 1.9;
    scene.add(this.mesh);
    this.spot = new THREE.SpotLight(0xfff2c0, 1.6, 160, 0.42, 0.5, 1.2);
    this.spot.position.copy(this.mesh.position);
    scene.add(this.spot);
    scene.add(this.spot.target);
  }
  update(dt, targetX, targetZ, active) {
    this.mesh.visible = active;
    this.spot.visible = active;
    if (!active) return;
    this.orbit += dt * 0.35;
    // Low enough to sit inside the chase camera's frame, high enough to read as air support.
    this.x = targetX + Math.sin(this.orbit) * 42;
    this.z = targetZ + Math.cos(this.orbit) * 42;
    this.alt = 30 + Math.sin(this.orbit * 2.3) * 3;
    this.mesh.position.set(this.x, this.alt, this.z);
    this.mesh.rotation.y = Math.atan2(targetX - this.x, targetZ - this.z);
    const u = this.mesh.userData;
    u.rotor.rotation.y += dt * 22;
    u.tailRotor.rotation.z += dt * 30;
    u.beam.scale.set(1, this.alt, 1);
    u.beam.position.set(0, -this.alt / 2, 1);
    this.spot.position.set(this.x, this.alt - 1, this.z);
    this.spot.target.position.set(targetX, 0, targetZ);
  }
}

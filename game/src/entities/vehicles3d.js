// Six low-poly 3D vehicle classes: glossy bodies, cabins, wheels, headlights,
// brake lights and police light bars. Arcade driving: throttle, steering, drift.
import { VEHICLES, vehicleById } from '../core/config.js';

const wheelGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.5, 10);
const wheelMat = new THREE.MeshLambertMaterial({ color: 0x14161a });

export function buildVehicleMesh(spec, opts = {}) {
  const g = new THREE.Group();
  g.name = 'vehicle-' + spec.id;
  const paint = new THREE.MeshPhongMaterial({ color: spec.color, shininess: 90, specular: 0xbbbbbb });
  const glass = new THREE.MeshPhongMaterial({ color: 0x1a2733, shininess: 140, specular: 0xffffff });
  const bodyH = spec.cls === 'Truck' || spec.cls === 'Armored' ? 1.5 : 1.0;
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.3, bodyH, 4.8), paint);
  body.position.y = 0.95; body.castShadow = true; body.receiveShadow = true;
  g.add(body);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.85, 2.4), glass);
  cabin.position.set(0, 1.75, -0.3); cabin.castShadow = true;
  g.add(cabin);
  if (spec.cls === 'Truck' || spec.cls === 'Armored') {
    const bed = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.1, 2.2),
      new THREE.MeshLambertMaterial({ color: 0x3a3f46 }));
    bed.position.set(0, 1.9, -1.2); bed.castShadow = true; g.add(bed);
  }
  const spoiler = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.12, 0.5), paint);
  spoiler.position.set(0, 1.55, -2.3); g.add(spoiler);
  // Headlights (front = +z in our chase setup) and red brake lights.
  const headMat = new THREE.MeshBasicMaterial({ color: 0xfff2c0 });
  const tailMat = new THREE.MeshBasicMaterial({ color: 0xff2a22 });
  for (const sx of [-0.8, 0.8]) {
    const h = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.25, 0.12), headMat);
    h.position.set(sx, 0.95, 2.42); g.add(h);
    const t = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.22, 0.12), tailMat);
    t.position.set(sx, 0.95, -2.42); g.add(t);
  }
  const wheels = [];
  for (const [wx, wz] of [[-1.05, 1.55], [1.05, 1.55], [-1.05, -1.55], [1.05, -1.55]]) {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.rotation.z = Math.PI / 2; w.position.set(wx, 0.55, wz); w.castShadow = true;
    g.add(w); wheels.push(w);
  }
  let lightBar = null;
  if (opts.police || spec.cls === 'Police') {
    lightBar = new THREE.Group();
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.22, 0.5),
      new THREE.MeshLambertMaterial({ color: 0x111318 }));
    bar.position.y = 2.3; lightBar.add(bar);
    const red = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.26, 0.52),
      new THREE.MeshBasicMaterial({ color: 0xff2a2a }));
    red.position.set(-0.42, 2.3, 0); lightBar.add(red);
    const blue = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.26, 0.52),
      new THREE.MeshBasicMaterial({ color: 0x2a6bff }));
    blue.position.set(0.42, 2.3, 0); lightBar.add(blue);
    lightBar.userData = { red, blue };
    g.add(lightBar);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.32, 0.3, 4.82),
      new THREE.MeshBasicMaterial({ color: 0xffffff }));
    stripe.position.y = 1.05; g.add(stripe);
  }
  g.userData = { spec, wheels, lightBar, headMat, tailMat, speed: 0, heading: 0 };
  return g;
}

export function listVehicleClasses() { return VEHICLES.map((v) => ({ id: v.id, name: v.name, cls: v.cls, top: v.top })); }

// Arcade car state: position, heading, speed; steering sharpens with drift.
export class DriveState {
  constructor(specId, x, z, heading) {
    this.spec = vehicleById(specId);
    this.mesh = buildVehicleMesh(this.spec, { police: this.spec.cls === 'Police' });
    this.x = x; this.z = z; this.heading = heading;
    this.speed = 0; this.steer = 0; this.boostTimer = 0; this.drift = false;
    this.mesh.position.set(x, 0, z);
    this.mesh.rotation.y = heading;
  }
  topSpeed() { return this.spec.top * (this.boostTimer > 0 ? 1.55 : 1); }
  update(dt, throttle, steerInput, handbrake) {
    const top = this.topSpeed();
    this.speed += throttle * this.spec.accel * dt;
    this.speed -= this.speed * (handbrake ? 1.6 : 0.35) * dt;
    if (this.speed > top) this.speed = top;
    if (this.speed < -14) this.speed = -14;
    this.drift = handbrake && Math.abs(this.speed) > 12;
    const grip = this.drift ? 0.55 : this.spec.grip;
    this.steer += (steerInput - this.steer) * Math.min(1, dt * 8);
    this.heading += this.steer * (this.speed / top) * 2.1 * grip * dt * (this.speed < 0 ? -1 : 1);
    this.x += Math.sin(this.heading) * this.speed * dt;
    this.z += Math.cos(this.heading) * this.speed * dt;
    // Keep the car inside the city bowl.
    this.x = Math.max(-380, Math.min(380, this.x));
    this.z = Math.max(-280, Math.min(330, this.z));
    this.mesh.position.set(this.x, 0, this.z);
    this.mesh.rotation.y = this.heading;
    this.mesh.rotation.z = -this.steer * (this.drift ? 0.22 : 0.08);
    for (const w of this.mesh.userData.wheels) w.rotation.x += this.speed * dt * 1.8;
    if (this.boostTimer > 0) this.boostTimer -= dt;
  }
  // Carjacking: snap the player into the driver's seat of a parked car.
  static jackedFrom(parkedMesh, specId) {
    const s = new DriveState(specId, parkedMesh.position.x, parkedMesh.position.z, parkedMesh.rotation.y);
    s.speed = 4;
    return s;
  }
}

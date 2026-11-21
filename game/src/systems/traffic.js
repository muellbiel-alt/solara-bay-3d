// Street traffic: seeded cars looping the coastal highway and avenues,
// stopping at the downtown signals, swerving when the player rams them.
import { buildVehicleMesh } from '../entities/vehicles3d.js';
import { VEHICLES } from '../core/config.js';

const LANES = [
  { z: 172, dir: 1 }, { z: 188, dir: -1 },
  { x: -8, dir: 1 }, { x: 8, dir: -1 },
];

export class Traffic {
  constructor(scene, rng) {
    this.cars = [];
    this.rng = rng;
    for (let i = 0; i < 12; i++) {
      const spec = rng.pick(VEHICLES.filter((v) => v.cls !== 'Police'));
      const mesh = buildVehicleMesh(spec);
      const lane = LANES[i % LANES.length];
      const car = {
        mesh, spec, lane,
        pos: rng.range(-360, 360),
        speed: rng.range(11, 19),
        stopped: 0,
      };
      if (lane.x !== undefined) { mesh.position.set(lane.x, 0, car.pos); mesh.rotation.y = lane.dir > 0 ? 0 : Math.PI; }
      else { mesh.position.set(car.pos, 0, lane.z); mesh.rotation.y = lane.dir > 0 ? Math.PI / 2 : -Math.PI / 2; }
      mesh.userData.speed = car.speed;
      scene.add(mesh);
      this.cars.push(car);
    }
  }
  update(dt, t, playerPos, danger) {
    for (const car of this.cars) {
      // Downtown signal: cars on the avenue pause on a fixed cycle.
      const atSignal = car.lane.x !== undefined && Math.abs(car.pos) < 14;
      if (atSignal && Math.sin(t * 0.5) > 0.2) car.stopped = 0.4;
      if (car.stopped > 0) { car.stopped -= dt; continue; }
      car.pos += car.lane.dir * car.speed * dt;
      if (car.pos > 380) car.pos = -380;
      if (car.pos < -380) car.pos = 380;
      const m = car.mesh;
      if (car.lane.x !== undefined) { m.position.set(car.lane.x, 0, car.pos); }
      else { m.position.set(car.pos, 0, car.lane.z); }
      // Flee the player's gunfire, swerve on a near miss.
      if (danger && playerPos) {
        const dx = m.position.x - playerPos.x, dz = m.position.z - playerPos.z;
        if (dx * dx + dz * dz < 900) car.speed = Math.min(30, car.speed + dt * 8);
      }
    }
  }
  // Nearest drivable car to a point — the carjacking target.
  nearest(x, z, maxDist) {
    let best = null, bestD = maxDist * maxDist;
    for (const car of this.cars) {
      const dx = car.mesh.position.x - x, dz = car.mesh.position.z - z;
      const d = dx * dx + dz * dz;
      if (d < bestD) { bestD = d; best = car; }
    }
    return best;
  }
}

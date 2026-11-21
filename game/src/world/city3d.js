// Solara Bay 3D city: 4 districts, coastal highway, harbor, palms, ocean.
// All geometry is procedural low-poly built from the seeded RNG — no assets.
import { WORLD, DISTRICTS, vehicleById } from '../core/config.js';
import { buildVehicleMesh } from '../entities/vehicles3d.js';

function windowTexture(base, lit, rng) {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, 128, 256);
  for (let y = 8; y < 248; y += 18) {
    for (let x = 8; x < 120; x += 16) {
      g.fillStyle = rng.next() < 0.55 ? lit : 'rgba(20,26,44,0.85)';
      g.fillRect(x, y, 10, 11);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.encoding = THREE.sRGBEncoding;
  return tex;
}

function box(w, h, d, color, x, y, z, opts = {}) {
  const mat = opts.material || new THREE.MeshLambertMaterial({ color });
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  if (opts.ry) m.rotation.y = opts.ry;
  m.castShadow = opts.shadow !== false;
  m.receiveShadow = true;
  return m;
}

export function buildCity(scene, rng) {
  const group = new THREE.Group();
  group.name = 'solara-bay-city';
  scene.add(group);
  const buildings = [];
  const palms = [];

  // Ground: warm city base, sand beach, glittering ocean.
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(WORLD.cityWidth + 220, WORLD.cityDepth + 220),
    new THREE.MeshLambertMaterial({ color: 0x9a7a58 }),
  );
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
  group.add(ground);
  const sand = new THREE.Mesh(
    new THREE.PlaneGeometry(WORLD.cityWidth + 220, 96),
    new THREE.MeshLambertMaterial({ color: 0xe8c98a }),
  );
  sand.rotation.x = -Math.PI / 2; sand.position.set(0, 0.05, 318); sand.receiveShadow = true;
  group.add(sand);
  const oceanMat = new THREE.MeshPhongMaterial({ color: 0x2a7fa8, shininess: 120, specular: 0xffd9a0 });
  const ocean = new THREE.Mesh(new THREE.PlaneGeometry(1400, 500), oceanMat);
  ocean.rotation.x = -Math.PI / 2; ocean.position.set(0, 0.02, 620);
  group.add(ocean);

  // Roads: coastal highway (Palm Strip, z=180), downtown avenue (x=0), cross streets.
  const roadMat = new THREE.MeshLambertMaterial({ color: 0x2c2f38 });
  const walkMat = new THREE.MeshLambertMaterial({ color: 0xb9a98e });
  function road(w, d, x, z) {
    const r = new THREE.Mesh(new THREE.PlaneGeometry(w, d), roadMat);
    r.rotation.x = -Math.PI / 2; r.position.set(x, 0.08, z); r.receiveShadow = true;
    group.add(r);
    const w1 = new THREE.Mesh(new THREE.PlaneGeometry(w, 6), walkMat);
    w1.rotation.x = -Math.PI / 2; w1.position.set(x, 0.07, z - d / 2 - 4); group.add(w1);
    const w2 = w1.clone(); w2.position.z = z + d / 2 + 4; group.add(w2);
  }
  road(WORLD.cityWidth, 26, 0, 180);       // coastal highway
  road(24, WORLD.cityDepth, 0, 0);         // central avenue
  road(WORLD.cityWidth, 18, 0, -60);       // downtown cross street
  road(WORLD.cityWidth, 18, 0, 40);        // mid cross street
  road(18, WORLD.cityDepth, -190, 0);      // west avenue
  road(18, WORLD.cityDepth, 210, 0);       // harbor avenue

  // Lane dashes on the coastal highway — the chase line the camera follows.
  const dashMat = new THREE.MeshBasicMaterial({ color: 0xffe9a8 });
  for (let x = -370; x < 375; x += 14) {
    const d = new THREE.Mesh(new THREE.PlaneGeometry(7, 0.7), dashMat);
    d.rotation.x = -Math.PI / 2; d.position.set(x, 0.12, 180);
    group.add(d);
  }
  const edgeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  for (let x = -370; x < 375; x += 28) {
    for (const z of [168, 192]) {
      const d = new THREE.Mesh(new THREE.PlaneGeometry(14, 0.5), edgeMat);
      d.rotation.x = -Math.PI / 2; d.position.set(x, 0.12, z);
      group.add(d);
    }
  }

  // Facades: three shared window textures keep draw calls low and windows glowing.
  const facades = [
    new THREE.MeshLambertMaterial({ map: windowTexture('#3a4a6b', '#ffd27a', rng) }),
    new THREE.MeshLambertMaterial({ map: windowTexture('#5b3a4a', '#ff9a5c', rng) }),
    new THREE.MeshLambertMaterial({ map: windowTexture('#2e4a44', '#9be8d8', rng) }),
    new THREE.MeshLambertMaterial({ map: windowTexture('#6b5a3a', '#ffe9a8', rng) }),
  ];
  // Concrete sidewalk pad under each tower so blocks never read as bare dirt.
  const padMat = new THREE.MeshLambertMaterial({ color: 0xcbbfa5 });
  function tower(x, z, w, d, h, mat) {
    const pad = new THREE.Mesh(new THREE.PlaneGeometry(w + 14, d + 14), padMat);
    pad.rotation.x = -Math.PI / 2; pad.position.set(x, 0.06, z); pad.receiveShadow = true;
    group.add(pad);
    const m = box(w, h, d, 0xffffff, x, h / 2, z, { material: mat });
    group.add(m); buildings.push(m);
    const roof = box(w * 0.7, 2, d * 0.7, 0x22242c, x, h + 1, z, { shadow: false });
    group.add(roof);
    if (h > 46) {
      const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.9, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xff3b30 }));
      beacon.position.set(x, h + 3, z); group.add(beacon);
    }
    return m;
  }
  // Downtown Neon: tall glass towers west-north.
  for (let i = 0; i < 22; i++) {
    const x = -360 + (i % 6) * 62 + rng.range(-8, 8);
    const z = -250 + Math.floor(i / 6) * 58 + rng.range(-8, 8);
    tower(x, z, rng.range(26, 40), rng.range(26, 38), rng.range(38, 84), facades[i % 4]);
  }
  // Harbor Docks: mid blocks east-north.
  for (let i = 0; i < 12; i++) {
    const x = 150 + (i % 4) * 58 + rng.range(-6, 6);
    const z = -240 + Math.floor(i / 4) * 56 + rng.range(-6, 6);
    tower(x, z, rng.range(24, 36), rng.range(24, 34), rng.range(18, 42), facades[(i + 1) % 4]);
  }
  // Palm Strip: low bright blocks NORTH of the highway, so the beach and
  // ocean stay open on the south side of the chase camera.
  for (let i = 0; i < 14; i++) {
    const x = -330 + i * 52 + rng.range(-8, 8);
    const z = 128 + rng.range(-6, 8);
    tower(x, z, rng.range(22, 32), rng.range(20, 28), rng.range(12, 26), facades[(i + 2) % 4]);
  }
  // Industrial Yard: wide low warehouses south-west.
  for (let i = 0; i < 10; i++) {
    const x = -340 + (i % 5) * 62;
    const z = 90 + Math.floor(i / 5) * 60;
    const m = box(rng.range(40, 54), rng.range(10, 16), rng.range(26, 34), 0x7a6a52, x, 6, z);
    group.add(m); buildings.push(m);
  }

  // Harbor: freighter, containers, cranes, piers over the north-east water.
  const freighter = box(120, 16, 30, 0x27313d, 280, 8, -262, { shadow: false });
  group.add(freighter);
  const contColors = [0xd84a2a, 0x2a7fd8, 0x3fae5a, 0xe8b13c];
  for (let i = 0; i < 16; i++) {
    const c = box(12, 5, 6, contColors[i % 4], 240 + (i % 8) * 13, 19 + Math.floor(i / 8) * 6, -262);
    group.add(c);
  }
  for (const cx of [180, 250, 320]) {
    const leg = box(4, 52, 4, 0xc8a03c, cx, 26, -230);
    group.add(leg);
    const arm = box(46, 4, 4, 0xc8a03c, cx + 14, 50, -230);
    group.add(arm);
    const hook = box(3, 12, 3, 0x333333, cx + 32, 44, -230, { shadow: false });
    group.add(hook);
  }
  for (const px of [170, 230, 290]) {
    const pier = box(10, 3, 70, 0x8a6f4d, px, 1.5, -235, { shadow: false });
    group.add(pier);
  }

  // Parked set dressing: the Neon Vault truck by the freighter, the Kestrel
  // GT on the pier (the heist's getaway car), and two cars on Palm Strip.
  function parked(specId, x, z, ry) {
    const v = buildVehicleMesh(vehicleById(specId));
    v.position.set(x, 0, z); v.rotation.y = ry;
    group.add(v);
    return v;
  }
  parked('bastion', 255, -248, 0.4);
  parked('kestrel', 342, -223, -1.35);
  parked('comet', -120, 196, Math.PI / 2);
  parked('atlas', 60, 164, -Math.PI / 2);

  // Street lamps along the coastal highway.
  const lampMat = new THREE.MeshLambertMaterial({ color: 0x2a2d33 });
  const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffe2a0 });
  for (let x = -360; x <= 360; x += 60) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 11, 6), lampMat);
    pole.position.set(x, 5.5, 166); pole.castShadow = true; group.add(pole);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.9, 8, 8), bulbMat);
    bulb.position.set(x, 11.2, 166); group.add(bulb);
  }

  // Coastal palms: tilted trunks, low-poly fronds.
  function palm(x, z) {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.9, 13, 6),
      new THREE.MeshLambertMaterial({ color: 0x7a5a38 }));
    trunk.position.y = 6.5; trunk.rotation.z = rng.range(-0.12, 0.12); trunk.castShadow = true;
    g.add(trunk);
    const frondMat = new THREE.MeshLambertMaterial({ color: 0x2e8a4a });
    for (let i = 0; i < 7; i++) {
      const f = new THREE.Mesh(new THREE.ConeGeometry(1.05, 5.2, 4), frondMat);
      const a = (i / 7) * Math.PI * 2;
      f.position.set(Math.cos(a) * 1.9, 13.1, Math.sin(a) * 1.9);
      f.rotation.z = Math.cos(a) * 1.35; f.rotation.x = -Math.sin(a) * 1.35;
      f.castShadow = true; g.add(f);
    }
    g.position.set(x, 0, z);
    group.add(g); palms.push(g);
    return g;
  }
  for (let x = -350; x <= 350; x += 34) { palm(x + rng.range(-4, 4), 200 + rng.range(-3, 3)); }
  for (let x = -330; x <= 330; x += 52) { palm(x, 158 + rng.range(-3, 3)); }
  for (let i = 0; i < 8; i++) { palm(rng.range(-300, 300), rng.range(230, 300)); }

  // District sign posts the minimap and HUD name.
  const districtMarkers = DISTRICTS.map((d) => ({ id: d.id, name: d.name, x: d.center[0], z: d.center[1] }));

  return {
    group, buildings, palms, oceanMat, districtMarkers,
    update(t) {
      oceanMat.color.setHSL(0.54, 0.62, 0.42 + Math.sin(t * 0.4) * 0.03);
      for (let i = 0; i < palms.length; i++) {
        palms[i].rotation.z = Math.sin(t * 0.7 + i) * 0.012;
      }
    },
  };
}

// HUD: wanted stars, health/armor, cash, minimap radar, weapon slots,
// crew cooldowns, radio, speedometer, mission objective, dispatch feed.
// DOM overlay on top of the 3D canvas — crisp when the screenshot shrinks.
export class Hud {
  constructor(root) {
    this.root = root;
    this.el = {};
    const mk = (id, cls, parent) => {
      const d = document.createElement('div');
      d.id = id; d.className = cls; (parent || root).appendChild(d); this.el[id] = d; return d;
    };
    mk('hud-top', 'hud-top');
    this.el.stars = mk('hud-stars', 'hud-stars', this.el['hud-top']);
    this.el.cash = mk('hud-cash', 'hud-cash', this.el['hud-top']);
    this.el.objective = mk('hud-objective', 'hud-objective', this.el['hud-top']);
    mk('hud-vitals', 'hud-vitals');
    this.el.health = mk('hud-health', 'hud-bar', this.el['hud-vitals']);
    this.el.armor = mk('hud-armor', 'hud-bar', this.el['hud-vitals']);
    this.el.minimapWrap = mk('hud-minimap', 'hud-minimap');
    this.minimap = document.createElement('canvas');
    this.minimap.width = 188; this.minimap.height = 188;
    this.el.minimapWrap.appendChild(this.minimap);
    this.el.mapLabel = mk('hud-maplabel', 'hud-maplabel', this.el.minimapWrap);
    mk('hud-weapons', 'hud-weapons');
    this.el.slots = mk('hud-slots', 'hud-slots', this.el['hud-weapons']);
    this.el.crew = mk('hud-crew', 'hud-crew', this.el['hud-weapons']);
    mk('hud-right', 'hud-right');
    this.el.speed = mk('hud-speed', 'hud-speed', this.el['hud-right']);
    this.el.radio = mk('hud-radio', 'hud-radio', this.el['hud-right']);
    this.el.dispatch = mk('hud-dispatch', 'hud-dispatch');
    this.el.flash = mk('hud-flash', 'hud-flash');
    this.el.prompt = mk('hud-prompt', 'hud-prompt');
    this.el.wheel = mk('hud-wheel', 'hud-wheel');
    this.el.wheel.style.display = 'none';
  }
  starsHtml(wanted) {
    let s = '';
    for (let i = 1; i <= 5; i++) s += `<span class="${i <= wanted ? 'on' : ''}">★</span>`;
    return s;
  }
  update(state) {
    const w = state.police ? state.police.wanted : 0;
    this.el.stars.innerHTML = this.starsHtml(w);
    this.el.stars.classList.toggle('hot', w >= 4);
    this.el.cash.textContent = '$' + state.cash.toLocaleString('en-US');
    const m = state.missions ? state.missions.active() : null;
    const spot = state.missions ? state.missions.spot() : null;
    this.el.objective.innerHTML = m
      ? `<b>MISSION ${m.id}/10 — ${m.name.toUpperCase()}</b><span>${spot ? spot.label : ''} · $${m.reward.toLocaleString('en-US')}</span>`
      : '';
    this.el.health.innerHTML = `<i style="width:${state.health}%"></i><b>HP ${Math.round(state.health)}</b>`;
    this.el.armor.innerHTML = `<i style="width:${state.armor}%"></i><b>ARMOR ${Math.round(state.armor)}</b>`;
    const kmh = state.car ? Math.round(Math.abs(state.car.speed) * 3.2) : 0;
    this.el.speed.innerHTML = `<b>${kmh}</b><span>KM/H · ${state.inCar && state.car ? state.car.spec.name.toUpperCase() : 'ON FOOT'}</span>`;
    this.el.radio.textContent = '♪ ' + (state.radioName || 'HEATWAVE 98.5');
    this.el.slots.innerHTML = (state.combat ? state.combat.wheelItems() : []).map((x) =>
      `<div class="slot ${x.active ? 'active' : ''}"><b>${x.slot}</b><span>${x.name}</span><em>${x.ammo}</em></div>`).join('');
    this.el.crew.innerHTML = (state.crew ? state.crew.hudLines() : []).map((a) =>
      `<div class="ability ${a.active ? 'active' : ''} ${a.pct < 1 ? 'cooling' : ''}"><b>[${a.key}] ${a.name}</b><i style="width:${Math.round(a.pct * 100)}%"></i><span>${a.pct < 1 ? Math.ceil((1 - a.pct) * 45) + 's' : 'READY'}</span></div>`).join('');
    this.el.dispatch.innerHTML = (state.police ? state.police.dispatch : []).map((d) => `<div>${d}</div>`).join('');
    if (state.hudFlash) {
      this.el.flash.textContent = state.hudFlash;
      this.el.flash.style.opacity = '1';
      state.hudFlash = null;
      setTimeout(() => { this.el.flash.style.opacity = '0'; }, 1800);
    }
    this.el.prompt.textContent = state.prompt || '';
    this.el.prompt.style.display = state.prompt ? 'block' : 'none';
    this.drawMinimap(state);
  }
  drawMinimap(state) {
    const g = this.minimap.getContext('2d');
    const S = 188, C = S / 2;
    g.clearRect(0, 0, S, S);
    g.fillStyle = 'rgba(12,16,26,0.82)';
    g.beginPath(); g.arc(C, C, C - 2, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(255,194,28,0.9)'; g.lineWidth = 2;
    g.beginPath(); g.arc(C, C, C - 2, 0, Math.PI * 2); g.stroke();
    const px = state.px || 0, pz = state.pz || 0;
    const toMap = (x, z) => [C + (x - px) * 0.22, C + (z - pz) * 0.22];
    g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(...toMap(-380, 180)); g.lineTo(...toMap(380, 180)); g.stroke();
    g.beginPath(); g.moveTo(...toMap(0, -280)); g.lineTo(...toMap(0, 330)); g.stroke();
    g.fillStyle = '#2a7fa8';
    g.fillRect(...toMap(300, 300), 60, 40);
    // Mission marker: pulsing gold diamond.
    if (state.missions) {
      const spot = state.missions.spot();
      const [mx, my] = toMap(spot.x, spot.z);
      g.fillStyle = '#ffc21c';
      g.save(); g.translate(mx, my); g.rotate(Math.PI / 4); g.fillRect(-6, -6, 12, 12); g.restore();
    }
    // Police blips red, traffic white.
    g.fillStyle = '#ff3b30';
    for (const c of (state.policeBlips || [])) { const [x, y] = toMap(c.x, c.z); g.beginPath(); g.arc(x, y, 3.5, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#ffffff';
    for (const c of (state.trafficBlips || [])) { const [x, y] = toMap(c.x, c.z); g.fillRect(x - 2, y - 2, 4, 4); }
    // Player arrow, always centered.
    g.fillStyle = '#ffc21c';
    g.save(); g.translate(C, C); g.rotate(state.heading || 0);
    g.beginPath(); g.moveTo(0, -9); g.lineTo(6, 7); g.lineTo(-6, 7); g.closePath(); g.fill(); g.restore();
    this.el.mapLabel.textContent = state.districtName || 'PALM STRIP';
  }
  showWheel(items) {
    this.el.wheel.style.display = 'flex';
    this.el.wheel.innerHTML = items.map((x) =>
      `<div class="wheel-item ${x.active ? 'active' : ''}"><b>${x.slot}</b><span>${x.name}</span><em>${x.ammo} ammo</em></div>`).join('');
  }
  hideWheel() { this.el.wheel.style.display = 'none'; }
}

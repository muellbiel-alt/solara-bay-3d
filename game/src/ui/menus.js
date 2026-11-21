// Menus: title cover (action-first, no text wall), pause + save slots,
// mission results debrief, Costa Customs garage, Armory Depot.
import { GARAGE_MODS, ARMORY_STOCK } from '../systems/economy.js';
import { VEHICLES } from '../core/config.js';
import { listSlots } from '../core/storage.js';

export class Menus {
  constructor(root, hooks) {
    this.root = root; this.hooks = hooks;
    this.title = document.createElement('div');
    this.title.id = 'menu-title'; this.title.className = 'menu-title';
    this.title.innerHTML = `
      <div class="title-sky">
        <h1>SOLARA BAY <span>3D</span></h1>
        <p class="tagline">HEATLINE — an open-world crime story at golden hour</p>
        <div class="title-buttons">
          <button data-act="play">▶ PLAY</button>
          <button data-act="continue">CONTINUE</button>
          <button data-act="garage">GARAGE</button>
        </div>
      </div>
      <div class="title-foot"><span>W A S D drive · E carjack · 1–4 weapons · Z X C crew</span><span>10 story missions · 4 districts · saves in P</span></div>`;
    root.appendChild(this.title);
    this.title.addEventListener('click', (e) => {
      const act = e.target.dataset && e.target.dataset.act;
      if (act) this.hooks.onTitle(act);
    });
    this.panel = document.createElement('div');
    this.panel.id = 'menu-panel'; this.panel.className = 'menu-panel';
    this.panel.style.display = 'none';
    root.appendChild(this.panel);
    this.results = document.createElement('div');
    this.results.id = 'menu-results'; this.results.className = 'menu-results';
    this.results.style.display = 'none';
    root.appendChild(this.results);
  }
  showTitle(show) { this.title.style.display = show ? 'flex' : 'none'; }
  showPanel(html) { this.panel.innerHTML = html; this.panel.style.display = 'block'; }
  hidePanel() { this.panel.style.display = 'none'; }
  showResults(done) {
    const s = this.hooks.state();
    this.results.innerHTML = `
      <div class="results-card">
        <p class="results-kicker">MISSION COMPLETE</p>
        <h2>${done.mission.name.toUpperCase()}</h2>
        <div class="results-pay">+$${done.reward.toLocaleString('en-US')}</div>
        <div class="results-rows">
          <div><span>Missions</span><b>${s.missionDone.length} / 10</b></div>
          <div><span>Cash</span><b>$${s.cash.toLocaleString('en-US')}</b></div>
          <div><span>District rep</span><b>${s.reputation[done.mission.district]} / 100</b></div>
          <div><span>Wanted</span><b>${s.police ? s.police.wanted : 0} ★</b></div>
        </div>
        <div class="results-progress">${s.missionDone.map((id) => `<i class="done">●</i>`).join('')}${'<i>○</i>'.repeat(10 - s.missionDone.length)}</div>
        <div class="title-buttons">
          <button data-act="continue">CONTINUE</button>
          <button data-act="garage">GARAGE</button>
          <button data-act="restart">RESTART</button>
        </div>
      </div>`;
    this.results.style.display = 'flex';
    this.results.onclick = (e) => {
      const act = e.target.dataset && e.target.dataset.act;
      if (act) { this.results.style.display = 'none'; this.hooks.onTitle(act); }
    };
  }
  showPause(state) {
    const slots = listSlots().map((s) =>
      `<div class="slot-row"><span>${s.slot}</span><b>${s.save ? '$' + s.save.cash.toLocaleString('en-US') + ' · mission ' + s.save.missionActive : 'empty'}</b><button data-slot="${s.slot}">SAVE</button></div>`).join('');
    this.showPanel(`
      <h2>PAUSED — SOLARA BAY 3D</h2>
      <p class="panel-sub">Cash $${state.cash.toLocaleString('en-US')} · ${state.missionDone.length}/10 missions · ${state.playMinutes} min played</p>
      <h3>Save slots</h3>${slots}
      <p class="panel-sub">W A S D drive &nbsp;·&nbsp; E carjack &nbsp;·&nbsp; 1–4 weapons &nbsp;·&nbsp; Z X C crew &nbsp;·&nbsp; B armory &nbsp;·&nbsp; G garage &nbsp;·&nbsp; M mute</p>
      <div class="title-buttons"><button data-act="resume">RESUME</button></div>`);
    this.panel.onclick = (e) => {
      if (e.target.dataset.act === 'resume') { this.hidePanel(); this.hooks.onTitle('resume'); }
      if (e.target.dataset.slot) { this.hooks.onSave(e.target.dataset.slot); this.showPause(state); }
    };
  }
  showGarage(state) {
    const mods = GARAGE_MODS.map((m) => {
      const lvl = state.garage[m.id] || 0;
      return `<div class="shop-row"><span>${m.name}</span><b>${m.levels[lvl]}</b><em>${lvl < m.levels.length - 1 ? '$' + m.prices[lvl + 1] : 'MAX'}</em><button data-mod="${m.id}" ${lvl >= m.levels.length - 1 ? 'disabled' : ''}>UPGRADE</button></div>`;
    }).join('');
    const cars = VEHICLES.map((v) => `<div class="shop-row"><span>${v.name} · ${v.cls}</span><b>${state.owned.includes(v.id) ? 'OWNED' : '$' + v.price}</b><button data-car="${v.id}">${state.vehicle === v.id ? 'ACTIVE' : state.owned.includes(v.id) ? 'SELECT' : 'BUY'}</button></div>`).join('');
    this.showPanel(`<h2>COSTA CUSTOMS — GARAGE</h2><p class="panel-sub">Cash $${state.cash.toLocaleString('en-US')}</p><h3>Upgrades</h3>${mods}<h3>Vehicles</h3>${cars}<div class="title-buttons"><button data-act="resume">BACK</button></div>`);
    this.panel.onclick = (e) => {
      if (e.target.dataset.act === 'resume') { this.hidePanel(); this.hooks.onTitle('resume'); }
      if (e.target.dataset.mod) { this.hooks.onBuyMod(e.target.dataset.mod); this.showGarage(state); }
      if (e.target.dataset.car) { this.hooks.onBuyCar(e.target.dataset.car); this.showGarage(state); }
    };
  }
  showArmory(state) {
    const rows = ARMORY_STOCK.map((a) => `<div class="shop-row"><span>${a.name}</span><b>${state.weapons[a.id] || 0} ammo</b><em>$${a.ammoPrice} / ${a.ammoPack}</em><button data-ammo="${a.id}">BUY AMMO</button></div>`).join('');
    this.showPanel(`<h2>ARMORY DEPOT</h2><p class="panel-sub">Cash $${state.cash.toLocaleString('en-US')}</p>${rows}<div class="title-buttons"><button data-act="resume">BACK</button></div>`);
    this.panel.onclick = (e) => {
      if (e.target.dataset.act === 'resume') { this.hidePanel(); this.hooks.onTitle('resume'); }
      if (e.target.dataset.ammo) { this.hooks.onBuyAmmo(e.target.dataset.ammo); this.showArmory(state); }
    };
  }
}

// Economy: Vega Safehouse, Costa Customs garage, Armory Depot, district
// reputation. Money earned in missions is spent on cars, mods and guns.
import { VEHICLES, WEAPONS } from '../core/config.js';

export const GARAGE_MODS = [
  { id: 'engine', name: 'Engine Tune', levels: ['Stock', 'Street', 'Race', 'Heatline'], prices: [0, 1500, 3800, 7200] },
  { id: 'armor', name: 'Armor Plating', levels: ['None', 'Light', 'Heavy', 'Vault'], prices: [0, 1200, 2900, 5400] },
  { id: 'paint', name: 'Paint — Sunset', levels: ['Factory', 'Sunset Orange', 'Neon Violet', 'Chrome Gold'], prices: [0, 600, 1400, 2600] },
];

export const ARMORY_STOCK = WEAPONS.map((w) => ({
  id: w.id, name: w.name, price: w.slot === 1 ? 0 : w.slot * 900,
  ammoPrice: 120, ammoPack: w.slot === 2 ? 150 : 60,
}));

export class Economy {
  constructor(state) { this.state = state; }
  buyVehicle(id) {
    const v = VEHICLES.find((x) => x.id === id);
    if (!v || this.state.owned.includes(id)) return false;
    if (this.state.cash < v.price) return false;
    this.state.cash -= v.price;
    this.state.owned.push(id);
    this.state.vehicle = id;
    return true;
  }
  buyMod(modId) {
    const mod = GARAGE_MODS.find((m) => m.id === modId);
    if (!mod) return false;
    const lvl = this.state.garage[modId] || 0;
    if (lvl >= mod.levels.length - 1) return false;
    const price = mod.prices[lvl + 1];
    if (this.state.cash < price) return false;
    this.state.cash -= price;
    this.state.garage[modId] = lvl + 1;
    return true;
  }
  buyAmmo(weaponId) {
    const item = ARMORY_STOCK.find((a) => a.id === weaponId);
    if (!item || this.state.cash < item.ammoPrice) return false;
    this.state.cash -= item.ammoPrice;
    this.state.weapons[weaponId] = (this.state.weapons[weaponId] || 0) + item.ammoPack;
    return true;
  }
  districtRep(id) { return this.state.reputation[id] || 0; }
  repStars(id) { return Math.min(5, Math.floor(this.districtRep(id) / 20)); }
  summary() {
    return {
      cash: this.state.cash,
      owned: this.state.owned.length,
      missions: this.state.missionDone.length,
      rep: Object.entries(this.state.reputation).map(([d, v]) => `${d} ${v}`).join(' · '),
    };
  }
}

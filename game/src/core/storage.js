// Save / Load slots in localStorage: autosave + two manual slots.
// Plain JSON, versioned, never leaves the browser.
export const SAVE_KEY = 'solara-bay-3d-save-v1';
export const SLOTS = ['autosave', 'slot1', 'slot2'];

export function defaultSave() {
  return {
    version: 1, cash: 1250, health: 100, armor: 50,
    missionDone: [1], missionActive: 2, reputation: { downtown: 12, harbor: 8, palm: 5, industrial: 3 },
    owned: ['solara'], vehicle: 'solara', garage: { engine: 1, armor: 1, paint: 0 },
    weapons: { pistol: 120, smg: 60, shotgun: 12, rifle: 0 },
    radio: 0, playMinutes: 0, completedAt: null,
  };
}

export function loadSlot(slot) {
  try {
    const raw = localStorage.getItem(SAVE_KEY + ':' + slot);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || data.version !== 1) return null;
    return Object.assign(defaultSave(), data);
  } catch { return null; }
}

export function saveSlot(slot, state) {
  try {
    const snap = {
      version: 1, cash: state.cash, health: state.health, armor: state.armor,
      missionDone: state.missionDone.slice(), missionActive: state.missionActive,
      reputation: Object.assign({}, state.reputation), owned: state.owned.slice(),
      vehicle: state.vehicle, garage: Object.assign({}, state.garage),
      weapons: Object.assign({}, state.weapons), radio: state.radio,
      playMinutes: state.playMinutes, completedAt: state.completedAt,
    };
    localStorage.setItem(SAVE_KEY + ':' + slot, JSON.stringify(snap));
    return true;
  } catch { return false; }
}

export function listSlots() {
  return SLOTS.map((slot) => ({ slot, save: loadSlot(slot) }));
}

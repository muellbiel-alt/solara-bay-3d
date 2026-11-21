# Solara Bay 3D: Heatline

[![make.fun gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01)
[![Rank](https://make.fun/badge/gta6-01/muellbiel-alt/solara-bay-3d/rank.svg)](https://make.fun/bounty/gta6-01)
[![Reward](https://make.fun/badge/gta6-01/muellbiel-alt/solara-bay-3d/reward.svg)](https://make.fun/bounty/gta6-01)

A sun-soaked 3D open-world crime game built for the [make.fun gta6-01 bounty](https://make.fun/bounty/gta6-01). Golden-hour coastal city, full 3D chase camera, traffic and pedestrians, a 1–5 star wanted level with pursuit cruisers, roadblocks and a police helicopter, ten story missions, carjacking across six vehicle classes, a four-slot weapon wheel, crew abilities, garage and armory shops, multi-station synthwave radio and save slots. Runs offline from static files under `game/` — Three.js r128 is vendored locally, zero external requests.

## Play locally

Node 22+ and a desktop browser:

```bash
node serve.ts
```

Open `http://localhost:8080` in desktop Chrome.

Build the deterministic submission dossier:

```bash
MAKEFUN_OUTPUT_DIR=out node main.ts
```

Take the four screenshots (1280x720, deterministic `?shot=` staging):

```bash
node serve.ts --port 8080
# then capture ?shot=title, ?shot=chase, ?shot=mission, ?shot=results with &seed=1
```

## Studio architecture (`game/src/`)

- **`core/`** — `config.js` (4 districts, 6 vehicles, 4 weapons, 10 missions, crew, radio), `random.js` (seeded Mulberry32), `input.js` (keyboard/mouse/wheel), `storage.js` (autosave + 2 save slots).
- **`world/`** — `city3d.js` (Downtown Neon, Harbor Docks, Palm Strip, Industrial Yard; towers with lit windows, coastal highway, beach, ocean, piers, cranes, palms), `lighting.js` (golden-hour sun + shadows, neon wash, flashing sirens, sunset sky dome).
- **`entities/`** — `vehicles3d.js` (6 low-poly vehicle classes, arcade driving, drift, carjacking), `characters3d.js` (player, pedestrians, police, walk animation), `helicopter3d.js` (police helicopter, spinning rotors, searchlight beam).
- **`systems/`** — `traffic.js` (lane traffic, signals, fleeing drivers), `police.js` (Wanted 1–5, dispatch log, pursuit, roadblocks, air support), `crew.js` (EMP Jammer, Getaway Boost, Smoke Screen cooldowns), `combat.js` (weapon wheel, 4 slots, tracers, drive-by), `missions.js` (10 story missions + side contracts), `economy.js` (safehouse, Costa Customs garage, Armory Depot, district reputation).
- **`ui/`** — `hud.js` (minimap radar, wanted stars, health/armor, cash, weapon slots, crew cooldowns, radio, speedometer, objective, dispatch feed), `menus.js` (title, pause + saves, results debrief, garage, armory), `shots.js` (deterministic screenshot staging).
- **`audio/`** — `synth.js` (procedural Web Audio: engine, sirens, rotor, gunshots, 3 synthwave radio stations).

## Controls

| Action | Key / Input |
|---|---|
| Drive / walk | `W A S D` or arrows |
| Handbrake drift / sprint | `Space` / `Shift` |
| Aim & fire (on foot or drive-by) | Mouse + left click |
| Enter / exit / carjack | `E` |
| Weapons | `1`–`4` or mouse wheel |
| Crew: EMP / Boost / Smoke | `Z` / `X` / `C` |
| Armory / Garage / Side job | `B` / `G` / `N` |
| Radio station / Mute | `V` / `M` |
| Pause & save slots | `P` or `Esc` |

## Screenshots

- `screenshots/1-title.jpg` — Golden-hour chase cover: Solara V8 on the Palm Strip highway, skyline, palms, police sirens, helicopter overhead, `SOLARA BAY 3D` + PLAY / CONTINUE in the sky.
- `screenshots/2-chase.jpg` — 4-star Downtown pursuit with roadblocks, helicopter spotlight, dispatch alerts and an active EMP.
- `screenshots/3-mission.jpg` — Neon Vault Heist at Harbor Docks: weapon wheel, carjacking prompt, on-foot firefight.
- `screenshots/4-results.jpg` — Mission debrief: payout, 9/10 missions, district reputation, CONTINUE / GARAGE / RESTART.

## License

MIT — see [LICENSE](./LICENSE).

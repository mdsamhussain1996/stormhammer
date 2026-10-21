# ⚡ STORMHAMMER

> A side-view 2D Norse-inspired action platformer that runs in modern web browsers (desktop and mobile) and deploys directly to GitHub Pages.

---

## 🎮 Play Online
- **Live Demo (GitHub Pages):** `https://<your-username>.github.io/<repo-name>/`

---

## 📖 Story & Gameplay Loop
Take up the legendary **Thunder Hammer** — an ancient Norse war weapon that returns to your hand on command. Explore three distinct realms:
1. **Whispering Canopy** (Enchanted twilight forest)
2. **Hall of Tomes** (Gothic castle library)
3. **Ember Ramparts** (Burning fortress with treacherous lava pits)

### Core Loop:
1. **Explore & Platform**: Leap across chasms and drop through wooden planks.
2. **Smash Crates & Urns**: Gather coins and game-changing power-ups.
3. **FIND THE HIDDEN KEY**: In every realm, the key is hidden inside **one random crate**. Listen and look for golden sparkles when within 5 tiles of the key crate!
4. **Defeat Enemies**: Battle Grunts, swooping Bats, horned Brutes (mini-bosses), and spellcasting Hooded Casters.
5. **Breach the Gate**: Reach the iron portcullis at the end of the realm, unlock it with your key, and march onward.

---

## 🕹 Controls

| Action | Keyboard | Gamepad | Mobile Touch |
|---|---|---|---|
| **Move Left / Right** | `←` / `→` or `A` / `D` | Left Stick / D-Pad | On-screen `◀` / `▶` buttons |
| **Jump** | `↑` / `W` / `Space` | `A` Button | On-screen `▲` (JUMP) |
| **Drop Through Planks**| `↓` + Jump (`S` + `Space`) | `Down` + `A` | Down + JUMP |
| **Swing Hammer** | `J` or `Z` | `X` Button | On-screen `⚔` (SWING) |
| **Throw Hammer** | `K` or `X` | `B` Button | On-screen `🔨` (THROW) |
| **Pause Game** | `P` or `Esc` | `Start` Button | HUD Pause Button |

---

## ⚡ Thunder Hammer Mechanics
- **Melee Swing**: Swift 0.3s strike dealing 1 damage in an arc. Deflects/smashes enemy fireballs and shatters crates.
- **Ranged Throw**: Launches forward up to 320px, pierces through enemies, breaks distant high-ledge crates, and magnetically returns to the hero's hand.
- **Anti-Stuck Guarantee**: Built-in 3.0s force-recall ensures the hammer never gets trapped behind obstacles.

---

## 🌟 Power-Ups

| Power | Icon | Effect | Duration |
|---|---|---|---|
| **Heart** | ❤️ | Restores +1 HP (converts to 3 coins if full) | Instant |
| **Storm Charge** | ⚡ | Hammer glows blue, 2× damage, longer throw, triggers **Chain Lightning** to 2 nearest foes within 230px | 15 seconds |
| **Wing Boots** | 🪽 | Unlocks Mid-Air Double Jump | Rest of run |
| **Aegis Shield** | 🛡️ | Complete invulnerability bubble; contact damages foes | 8 seconds |
| **Gold Coins** | 🪙 | Increases score (+10 each) | Permanent |

---

## 🛠 Tech Stack
- **Engine:** Phaser 3 (latest 3.87)
- **Bundler:** Vite
- **Language:** Plain JavaScript (ES Modules)
- **Physics:** Phaser Arcade Physics (2000 gravity, coyote time, jump buffering)
- **Audio:** Custom procedural Web Audio synthesis engine (zero 404s, zero missing sound files)
- **Resolution:** 960×540 internal resolution, scaled seamlessly with `Phaser.Scale.FIT`

---

## 🚀 Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Start local development server
npm run dev

# 3. Build production bundle for static hosting
npm run build
```

---

## 🌐 Deploying to GitHub Pages

This repository includes a GitHub Actions workflow at [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

1. Push this repository to GitHub on the `main` branch.
2. In your GitHub repository:
   - Go to **Settings** → **Pages**.
   - Under **Build and deployment** → **Source**, select **GitHub Actions**.
3. Every push to `main` will automatically build and publish the game to your GitHub Pages URL!

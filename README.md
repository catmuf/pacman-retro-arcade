# 🕹️ Pac-Man Retro Arcade

An arcade-accurate, browser-based **Pac-Man** game built from scratch using **TypeScript**, **HTML5 Canvas**, and procedural **Web Audio API** 8-bit sound synthesis.

![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-5.2-purple?logo=vite)
![HTML5 Canvas](https://img.shields.io/badge/HTML5-Canvas-orange?logo=html5)
![Vitest](https://img.shields.io/badge/Tested%20with-Vitest-brightgreen?logo=vitest)

---

## 🌟 Key Features

- **Authentic 1980 Ghost AI Personalities**:
  - **Blinky (Red / "Shadow")**: Directly chases Pac-Man's tile, with *Cruise Elroy* speed boosts when remaining dots drop to 20 and 10.
  - **Pinky (Pink / "Speedy")**: Ambush predator that targets 4 spaces ahead of Pac-Man's direction (including the original upward-direction offset bug).
  - **Inky (Cyan / "Bashful")**: Tactical flanker that calculates a vector reflection across Blinky and Pac-Man.
  - **Clyde (Orange / "Pokey")**: Cowardly chaser that pursues Pac-Man when $\ge 8$ tiles away, but retreats to his corner when closer.
- **Wave Cycle & Modes**:
  - Timed Scatter / Chase wave progression.
  - Frightened mode with blinking warning animation and combo multipliers (**200 → 400 → 800 → 1600 pts**).
  - Eaten mode (floating eyes returning to the ghost house to regenerate).
- **Procedural 8-Bit Web Audio Synthesizer**:
  - Real-time synthesized retro audio (waka-waka, ambient background sirens, energizer alarms, ghost munching, fruit chimes, death slide, intro melody, extra life fanfare) with zero external mp3 files required.
- **Corner Pre-Turn Buffering**:
  - Smooth cornering without getting stuck on 1-pixel misalignments.
- **Scoring & Fruit Spawns**:
  - 2 fruit spawns per level (at 70 and 170 pellets eaten) scaling from Cherry (100 pts) up to Key (5,000 pts).
  - High score saved automatically in `localStorage`.
  - Extra life awarded at 10,000 points.
- **Arcade Aesthetic & Controls**:
  - Neon cabinet bezel with toggleable vintage CRT scanlines filter.
  - Keyboard controls (Arrow keys / WASD) + touch swipe and on-screen Virtual D-Pad for mobile and tablet devices.

---

## 🎮 Controls

| Action | Controls |
| :--- | :--- |
| **Move Pac-Man** | Arrow Keys / `W`, `A`, `S`, `D` / Virtual D-Pad / Touch Swipe |
| **Pause / Resume** | `Space` or `P` |
| **Mute / Unmute** | `M` |
| **Restart Game** | `R` |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or newer)
- npm

### Installation & Run
1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   cd YOUR_REPO_NAME
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & Building

- **Run Automated Tests**:
  ```bash
  npm test
  ```
- **Build for Production**:
  ```bash
  npm run build
  ```
- **Preview Production Build**:
  ```bash
  npm run preview
  ```

---

## 📁 Project Structure

```
├── index.html                 # Main entry point with arcade bezel UI
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
├── vite.config.ts             # Vite configuration
└── src/
    ├── main.ts                # App initialization and UI button wiring
    ├── styles.css             # Arcade styling, CRT scanlines & layout
    └── game/
        ├── types.ts           # Interfaces & game state enums
        ├── constants.ts       # Speeds, grid dimensions & fruit table
        ├── map.ts             # Classic 28x36 arcade grid & tile management
        ├── audio.ts           # Procedural Web Audio API synthesizer
        ├── input.ts           # Keyboard, touch swipe & virtual D-pad controls
        ├── pacman.ts          # Pac-Man movement, cornering & animation
        ├── ghost.ts           # Ghost entity state machine & revival
        ├── ghostAi.ts         # Authentic Ghost AI targeting rules
        ├── fruit.ts           # Fruit spawner & floating score popups
        ├── score.ts           # Score manager & high score persistence
        ├── renderer.ts        # Canvas 2D renderer & CRT filter
        ├── engine.ts          # Main 60 FPS game loop & state coordinator
        └── __tests__/         # Vitest unit test suite
```

---

## 📜 License
MIT License

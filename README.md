# FindTheKey 🗝️

Developed By Bertrand, Aaron, Nigel and Yuntae
Github: https://github.com/nigel27022001/FindTheKey
Deployed on: https://spire-of-fds.vercel.app/

A gamified educational application designed to help players intuitively learn and practice database normalization concepts, specifically discovering Candidate Keys and Superkeys through relational Functional Dependencies (FDs).

### 🎮 Game Modes

*   **Practice Mode:** Work through randomly generated Functional Dependencies. Build Candidate Keys by selecting attributes and computing closures. Correct answers build your streak, while wrong answers provide helpful step-by-step hints on why your selection failed to cover the relation (`Not a Superkey`), or wasn't minimal (`Superkey — not minimal`). Test your skills from Easy schemas to Expert multi-relation puzzles.
*   **Spire of FDs:** A punishing roguelike twist on database normalization. Ascend the Spire as the rogue *Data Knight*, facing anomalies corrupted by shattered schemas! 
    *   **Combat:** Fights involve quickly solving FDs. You must deal damage by discovering candidate keys before the enemy destroys you when their action timer expires.
    *   **Procedural Maps:** Navigate branching paths through Minions, Elites, Bosses, Mystery Encounters, Merchants, and Rest Stops.
    *   **Potion Belt:** Manage your inventory with *Hint Scrolls*, *Closure Potions*, and powerful *Skip Potions* to survive the Spire.
    *   **Dynamic Scaling:** Problems hit harder and time gets tighter as you face stronger foes. 

### 🛠️ Tech Stack
- **Frontend:** React 19 (managed by Vite)
- **Language:** TypeScript 
- **Styling:** Tailwind CSS v4
- **Icons:** Lucide React
- **Testing:** Vitest

### 🚀 Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. **Open in Browser:**
   Navigate to `http://localhost:5173/` in your web browser.

### 🧪 Tests

To run the core test suite (which covers the FD algorithms, algorithms scaling, and Spire map generation):
```bash
npm test
```
To run tests in watch mode:
```bash
npm run test:watch
```

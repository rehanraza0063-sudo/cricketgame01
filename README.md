# Cricket Champions 26

A fully original, browser-based 3D-style cricket game — no Unity, no Godot, no backend,
no Python. Just HTML, CSS, JavaScript and Three.js, built to run locally from VS Code
on Windows.

All team names, players, logos, stadiums and commentary in this game are 100% fictional.
Nothing here copies World Cricket Championship, Nextwave, or any other commercial game's
branding, assets, sounds or player likenesses.

---

## 1. What's playable right now (Stage 1 — MVP)

This first build gives you a **complete, playable match from start to finish**:

- Main Menu → Play Match → pick a format (Quick Match / T20 / ODI) → pick your team,
  opponent, stadium & difficulty → Toss → full match → Result screen.
- Real batting: you time a swing with **SPACE**, aim with **A/D**, choose **W** to loft
  or **S** to defend, and get a PERFECT / GOOD / EARLY / LATE / MISS timing grade that
  actually changes the outcome (dot ball, runs, four, six, or a wicket).
- Real bowling: when your team is fielding, you choose delivery type (Fast/Medium/Spin),
  length (Yorker/Full/Good Length/Short/Bouncer) and line, then release the ball at the
  AI batsman, who reacts based on the delivery and the match situation.
- Real scoring: runs, wickets, overs, extras (wides/no-balls), run-outs on 2s and 3s,
  bowled and caught dismissals, required run-rate, and a proper 2nd-innings chase.
- A 3D stadium built from simple original geometry (pitch, stumps, floodlights, stands,
  ad boards, sky) with a bowler-camera / batter-camera / ball-follow camera system.
- Dynamic text commentary and procedurally generated sound effects (no audio files
  needed — everything is synthesized with the Web Audio API).
- **Practice Mode** (unlimited batting or bowling practice, no overs limit).
- **Tournament Mode** (a real 4-team knockout: 2 semi-finals + a final, using the same
  match engine).
- **Career Mode** (create a player, play matches, earn career points, and progress
  through Local → Club → State → National tiers).
- **Statistics** and **Settings** screens backed by your browser's local storage, so
  your career and stats persist between sessions on the same computer/browser.

### Known simplifications in this first build (planned for later stages)
- LBW and Stumped dismissals aren't implemented yet (Bowled, Caught and Run Out are).
- Fielders are not yet individually animated chasing/throwing the ball — the outcome
  (runs/four/six/catch) is calculated by the match engine and shown via ball flight
  and commentary, without a full fielding simulation.
- No slow-motion replay screen yet after boundaries/wickets.
- Only one active "bowler name" per bowling side is tracked with full figures — full
  11-player rotation and a ball-by-ball scorecard log are good next additions.
- Career/Tournament always has your team batting first, to keep the flow simple.
- Pausing the match hides the screen but doesn't freeze the in-flight ball timer —
  fine for casual play, just don't expect a truly frozen game state while paused.

None of this is placeholder — every button in the game performs a real action. These
are just the features queued for the next development stage.

---

## 2. Project structure

```
cricket-champions-26/
│
├── index.html          ← open this to play
├── style.css
├── README.md            ← you are here
│
└── js/
    ├── data.js          ← teams, stadiums, formats, difficulty settings
    ├── audio.js         ← procedural sound effects (Web Audio API)
    ├── commentary.js    ← text commentary generator
    ├── scene3d.js       ← Three.js 3D stadium, ball physics/animation, cameras
    ├── match.js         ← the cricket rules engine (scoring, wickets, AI)
    ├── stats.js         ← localStorage statistics & career persistence
    ├── ui.js            ← screen navigation & HUD rendering helpers
    └── main.js          ← wires it all together: menus, input, game flow
```

No build tools, no npm install, no bundler. Three.js is loaded from a CDN
(`cdnjs.cloudflare.com`) via a single `<script>` tag, so **you need an internet
connection the first time you load the page** (your browser will cache it after that).

---

## 3. Exact setup instructions (Windows + VS Code, beginner-friendly)

### Step 1 — Get the project onto your computer
1. Download the project folder (or the `.zip` you were given) to somewhere easy to
   find, e.g. `C:\Games\cricket-champions-26`.
2. If it came as a `.zip`, right-click it → **Extract All...** → choose a location.

### Step 2 — Open it in VS Code
1. Open **VS Code**.
2. Go to **File → Open Folder...**
3. Select the `cricket-champions-26` folder and click **Select Folder**.
4. You should see `index.html`, `style.css`, and the `js/` folder in the Explorer
   panel on the left.

### Step 3 — Install the "Live Server" extension (recommended, one-time)
Opening `index.html` directly by double-clicking works in most browsers, but using
a tiny local web server avoids occasional browser security restrictions and gives
you auto-reload while you experiment. It takes one minute:

1. In VS Code, click the **Extensions** icon on the left sidebar (four squares).
2. Search for **"Live Server"** (by Ritwick Dey).
3. Click **Install**.

### Step 4 — Run the game
**Option A — Live Server (recommended):**
1. Right-click `index.html` in the VS Code Explorer.
2. Choose **"Open with Live Server"**.
3. Your default browser opens automatically at something like
   `http://127.0.0.1:5500/index.html` — you're playing!

**Option B — Just double-click it:**
1. In Windows File Explorer, navigate to the project folder.
2. Double-click `index.html`. It opens in your default browser and works the same way.

### Step 5 — Play
- You'll see the **Cricket Champions 26** main menu.
- Click **Play Match** → pick a format → pick your team and opponent → pick a
  stadium and difficulty → **Proceed to Toss** → call Heads/Tails → choose to bat
  or bowl if you win the toss → **Start Match**.

---

## 4. Controls

| Action | Key / Input |
|---|---|
| Swing the bat | **SPACE** (timed to the ball) |
| Aim your shot left/right | **A** / **D** (hold while swinging) |
| Play a lofted shot | Hold **W** while swinging |
| Play a defensive shot | Hold **S** while swinging |
| Choose bowling type/length/line | Click the chips in the bowling panel |
| Release the ball (when bowling) | Click **Bowl** or press **SPACE** |
| Pause | The ⏸ icon, top-right of the match screen |

---

## 5. Troubleshooting

- **Blank/black screen, or "WebGL not supported":** update your graphics drivers, or
  try a different browser (Chrome and Edge both work well). Three.js needs WebGL,
  which almost all modern laptops support.
- **Nothing loads / stadium doesn't appear:** you need an internet connection the
  first time, since Three.js and the game's font load from a CDN. If you're offline,
  the page will fail to load those two external resources.
- **Sound doesn't play on the very first click:** browsers block audio until you
  interact with the page once (click any button) — this is a browser rule, not a bug.
- **Stats/Career not saving:** make sure you're not in a "Private/Incognito" browser
  window — those don't persist local storage between sessions.

---

## 6. What's next (future stages)

Planned for later updates, in rough priority order:
1. LBW and Stumped dismissals, plus a short slow-motion replay after wickets/boundaries.
2. Visible fielders that actually run, field the ball, and throw it in.
3. Full 11-player batting/bowling rotation with a ball-by-ball scorecard you can review.
4. More camera polish (cinematic boundary/six celebration cam).
5. On-screen touch controls for a future mobile/touchscreen version.

Enjoy the game — and good luck out there! 🏏

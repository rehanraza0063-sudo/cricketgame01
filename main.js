/* ===========================================================
   Main controller — wires UI, Match engine and 3D scene together
   =========================================================== */

let MatchScene = null;
let PracticeScene = null;

const Selection = { teamA: 0, teamB: 1, format: 'quick', stadium: 0, difficulty: 'MEDIUM' };
const Toss = { winner: null, decision: null };
const keysDown = new Set();
let resultReturnScreen = 'screen-menu';
let resultReturnLabel = 'Main Menu';

const Settings = {
  KEY: 'cc26_settings_v1',
  load() {
    const raw = localStorage.getItem(this.KEY);
    return raw ? JSON.parse(raw) : { sound: true, graphics: 'high', difficulty: 'MEDIUM', camera: 'bowler' };
  },
  save(s) { localStorage.setItem(this.KEY, JSON.stringify(s)); }
};

document.addEventListener('keydown', e => keysDown.add(e.code));
document.addEventListener('keyup', e => keysDown.delete(e.code));

/* ---------------- Generic navigation ---------------- */
document.querySelectorAll('[data-nav]').forEach(btn => {
  btn.addEventListener('click', () => { SFX.click(); UI.goto(btn.getAttribute('data-nav')); });
});
document.getElementById('btn-exit').addEventListener('click', () => {
  document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-family:Rajdhani,sans-serif;font-size:24px;color:#f2c14e;">Thanks for playing Cricket Champions 26!</div>';
});

/* ---------------- Format select ---------------- */
document.querySelectorAll('#screen-format .format-card').forEach(card => {
  card.addEventListener('click', () => {
    Selection.format = card.getAttribute('data-format');
    setupTeamSelectScreen();
    UI.goto('screen-teamselect');
  });
});

function setupTeamSelectScreen() {
  UI.populateStadiums();
  const pickA = idx => { Selection.teamA = idx; refreshTeamGrids(); };
  const pickB = idx => { Selection.teamB = idx; refreshTeamGrids(); };
  window._pickA = pickA; window._pickB = pickB;
  refreshTeamGrids();
  document.getElementById('select-difficulty').value = Selection.difficulty;
}
function refreshTeamGrids() {
  UI.renderTeamGrid('teamgrid-a', Selection.teamA, window._pickA);
  UI.renderTeamGrid('teamgrid-b', Selection.teamB, window._pickB);
}

document.getElementById('btn-goto-toss').addEventListener('click', () => {
  if (Selection.teamA === Selection.teamB) { alert('Choose two different teams.'); return; }
  Selection.stadium = parseInt(document.getElementById('select-stadium').value || 0);
  Selection.difficulty = document.getElementById('select-difficulty').value;
  matchContext = 'normal';
  resultReturnScreen = 'screen-menu'; resultReturnLabel = 'Main Menu';
  setupTossScreen();
  UI.goto('screen-toss');
});

/* ---------------- Toss ---------------- */
function setupTossScreen() {
  document.getElementById('toss-call-row').classList.remove('hidden');
  document.getElementById('toss-decision-row').classList.add('hidden');
  document.getElementById('btn-start-match').classList.add('hidden');
  document.getElementById('toss-result-text').textContent = '';
}
document.querySelectorAll('#screen-toss [data-call]').forEach(btn => {
  btn.addEventListener('click', () => {
    const call = btn.getAttribute('data-call');
    const coin = document.getElementById('coin');
    coin.classList.remove('flip'); void coin.offsetWidth; coin.classList.add('flip');
    const actual = Math.random() < 0.5 ? 'Heads' : 'Tails';
    setTimeout(() => {
      coin.textContent = actual === 'Heads' ? 'H' : 'T';
      const youWon = call === actual;
      Toss.winner = youWon ? 'A' : 'B';
      document.getElementById('toss-call-row').classList.add('hidden');
      if (youWon) {
        document.getElementById('toss-result-text').textContent = `It's ${actual}! You won the toss.`;
        document.getElementById('toss-decision-row').classList.remove('hidden');
      } else {
        Toss.decision = Math.random() < 0.5 ? 'bat' : 'bowl';
        document.getElementById('toss-result-text').textContent = `It's ${actual}! ${TEAMS[Selection.teamB].name} won the toss and chose to ${Toss.decision} first.`;
        document.getElementById('btn-start-match').classList.remove('hidden');
      }
    }, 700);
  });
});
document.querySelectorAll('#screen-toss [data-decision]').forEach(btn => {
  btn.addEventListener('click', () => {
    Toss.decision = btn.getAttribute('data-decision');
    document.getElementById('toss-decision-row').classList.add('hidden');
    document.getElementById('toss-result-text').textContent += ` You chose to ${Toss.decision} first.`;
    document.getElementById('btn-start-match').classList.remove('hidden');
  });
});
document.getElementById('btn-start-match').addEventListener('click', () => {
  const overs = FORMATS[Selection.format].overs;
  Match.newMatch({
    teamAIdx: Selection.teamA, teamBIdx: Selection.teamB, overs,
    difficulty: Selection.difficulty, tossWinner: Toss.winner, tossDecision: Toss.decision,
    stadiumIdx: Selection.stadium
  });
  startMatchScreen();
});

/* ---------------- Match screen ---------------- */
let matchContext = 'normal';
let battingContext = null;
let matchActive = false;
let bowlingInProgress = false;
let bowlSelection = { type: 'Medium', length: 'Good Length', line: 'Middle Stump' };

function startMatchScreen() {
  matchActive = true;
  UI.goto('screen-match');
  if (!MatchScene) { MatchScene = createScene3D(); MatchScene.init(document.getElementById('game-canvas')); }
  const s = Match.state;
  MatchScene.setTeamColors(s.teams[s.battingTeam].color, s.teams[1 - s.battingTeam].color);
  document.getElementById('innings-break').classList.add('hidden');
  document.getElementById('pause-overlay').classList.add('hidden');
  UI.updateHUD(Match);
  UI.populateBowlChips('', bowlSelection);
  document.getElementById('btn-bowl-release').onclick = releaseBowlingDelivery;
  playNextBall();
}

function showMatchControls(playerBats) {
  document.getElementById('batting-controls').classList.toggle('hidden', !playerBats);
  document.getElementById('bowling-controls').classList.toggle('hidden', playerBats);
}

function playNextBall() {
  if (!matchActive) return;
  if (Match.isInningsOver()) { handleInningsEnd(); return; }
  UI.updateHUD(Match);
  const playerBats = Match.playerControlsBatting();
  showMatchControls(playerBats);
  const extra = Match.isExtra();
  if (extra) {
    const applied = Match.applyOutcome(null, extra);
    UI.updateHUD(Match);
    UI.showCommentary('commentary-box', applied.text || Commentary.line(extra));
    setTimeout(playNextBall, 1100);
    return;
  }
  MatchScene.resetBallToBowler();
  if (playerBats) prepareBattingDelivery(MatchScene);
  else prepareBowlingSelectionUI();
}

function prepareBattingDelivery(scene) {
  const delivery = Match.prepareDelivery(null);
  scene.setCamera('batter');
  const releaseTime = performance.now();
  battingContext = { releaseTime, resolved: false };
  scene.bowlBall(delivery.duration, delivery.swing, delivery.bounceZ, () => SFX.bounce());
  battingContext.timer = setTimeout(() => resolveBatting(null, scene), delivery.duration * 1000 + 300);
}

function resolveBatting(pressTime, scene) {
  if (!matchActive || !battingContext || battingContext.resolved) return;
  battingContext.resolved = true;
  clearTimeout(battingContext.timer);
  let timingClass;
  if (pressTime === null) timingClass = 'MISS';
  else timingClass = Match.classifyTiming((pressTime - battingContext.releaseTime) - Match.idealContactDelayMs());
  const shotType = keysDown.has('KeyW') ? 'loft' : keysDown.has('KeyS') ? 'defend' : 'normal';
  const outcomeRaw = Match.resolvePlayerShot(timingClass, shotType);
  finalizeBallOutcome(outcomeRaw, timingClass, scene);
}

function prepareBowlingSelectionUI() {
  MatchScene.setCamera('bowler');
  UI.populateBowlChips('', bowlSelection);
}

function releaseBowlingDelivery() {
  if (!matchActive || bowlingInProgress || document.getElementById('bowling-controls').classList.contains('hidden')) return;
  bowlingInProgress = true;
  const delivery = Match.prepareDelivery(bowlSelection);
  MatchScene.setCamera('ball');
  MatchScene.bowlBall(delivery.duration, delivery.swing, delivery.bounceZ, () => SFX.bounce());
  setTimeout(() => {
    bowlingInProgress = false;
    if (!matchActive) return;
    const aiSkill = DIFFICULTIES[Match.state.difficulty].aiSkill;
    const outcomeRaw = Match.aiFaceDelivery(aiSkill);
    finalizeBallOutcome(outcomeRaw, outcomeRaw.timingClass, MatchScene);
  }, delivery.duration * 1000 + 200);
}

document.addEventListener('keydown', e => {
  if (e.code === 'Space') {
    e.preventDefault();
    if (document.getElementById('screen-match').classList.contains('active') && battingContext && !battingContext.resolved) {
      resolveBatting(performance.now(), MatchScene);
    } else if (document.getElementById('screen-match').classList.contains('active') && !document.getElementById('bowling-controls').classList.contains('hidden')) {
      releaseBowlingDelivery();
    } else if (document.getElementById('screen-practice').classList.contains('active')) {
      handlePracticeSpace();
    }
  }
});

function finalizeBallOutcome(outcomeRaw, timingClass, scene) {
  if (!matchActive) return;
  if (timingClass) UI.showTiming('timing-meter', 'timing-result', timingClass);
  if (outcomeRaw.wicket) SFX.wicket();
  else if (outcomeRaw.six) SFX.six();
  else if (outcomeRaw.four) SFX.boundary();
  else if (timingClass !== 'MISS') SFX.batHit();
  if (timingClass !== 'MISS') {
    const power = Math.min(1, (outcomeRaw.runs || 0) / 6 + (outcomeRaw.six ? 0.5 : 0));
    scene.hitBall(outcomeRaw.angle, power, outcomeRaw.shotType === 'loft');
  }
  const applied = Match.applyOutcome(outcomeRaw, null);
  UI.updateHUD(Match);
  UI.showCommentary('commentary-box', applied.text || Commentary.line(applied.outcome));
  battingContext = null;
  setTimeout(() => {
    if (Match.isInningsOver()) handleInningsEnd(); else playNextBall();
  }, 1500);
}

function handleInningsEnd() {
  if (Match.state.innings === 1) {
    const sc = Match.state.score[Match.state.battingTeam];
    document.getElementById('innings-break-text').textContent =
      `${Match.state.teams[Match.state.battingTeam].name} finished on ${sc.runs}/${sc.wkts}. Target for ${Match.state.teams[1 - Match.state.battingTeam].name}: ${sc.runs + 1}`;
    document.getElementById('innings-break').classList.remove('hidden');
  } else {
    finishAndShowResult();
  }
}
document.getElementById('btn-start-innings2').addEventListener('click', () => {
  Match.startSecondInnings();
  document.getElementById('innings-break').classList.add('hidden');
  MatchScene.setTeamColors(Match.state.teams[Match.state.battingTeam].color, Match.state.teams[1 - Match.state.battingTeam].color);
  playNextBall();
});

/* ---------------- Pause ---------------- */
document.getElementById('btn-pause').addEventListener('click', () => document.getElementById('pause-overlay').classList.remove('hidden'));
document.getElementById('btn-resume').addEventListener('click', () => document.getElementById('pause-overlay').classList.add('hidden'));
document.getElementById('btn-quit-match').addEventListener('click', () => {
  matchActive = false; battingContext = null; bowlingInProgress = false;
  document.getElementById('pause-overlay').classList.add('hidden');
  UI.goto('screen-menu');
});

/* ---------------- Result ---------------- */
function finishAndShowResult() {
  matchActive = false;
  Match.finishMatch();
  const s = Match.state;
  const playerBatSc = s.score[0];
  const playerBowlSc = s.score[1];
  const won = s.winner === null ? null : (s.winner === 0);
  Stats.recordMatch({
    playerBatted: true, playerBowled: true,
    batRuns: playerBatSc.runs, batBalls: playerBatSc.balls, fours: playerBatSc.fours, sixes: playerBatSc.sixes,
    wktsTaken: playerBowlSc.bowlerWkts, runsConceded: playerBowlSc.bowlerRuns, bowlBalls: playerBowlSc.bowlerBalls,
    won
  });

  if (matchContext === 'career') updateCareerAfterMatch(s, won);
  if (matchContext === 'tournament') advanceTournamentAfterMatch(s, won);

  document.getElementById('result-headline').textContent = s.resultText.toUpperCase();
  const first = s.score[s.battingFirst], second = s.score[1 - s.battingFirst];
  document.getElementById('result-body').innerHTML = `
    <p>${s.teams[s.battingFirst].name}: <strong>${first.runs}/${first.wkts}</strong></p>
    <p>${s.teams[1 - s.battingFirst].name}: <strong>${second.runs}/${second.wkts}</strong></p>
    <h3>Player of the Match</h3>
    <p>${s.pom ? s.pom.name : '—'}</p>
  `;
  document.getElementById('btn-play-again').textContent =
    matchContext === 'career' ? 'Continue Career' : matchContext === 'tournament' ? 'Continue Tournament' : 'Play Again';
  UI.goto('screen-result');
}
document.getElementById('btn-play-again').addEventListener('click', () => {
  if (matchContext === 'career') { UI.goto('screen-career'); renderCareerDashboard(); return; }
  if (matchContext === 'tournament') { UI.goto('screen-tournament'); renderBracket(); return; }
  UI.goto('screen-format');
});

/* ==================================================================
   PRACTICE MODE
   ================================================================== */
let practiceState = null;
document.querySelectorAll('#screen-practice-setup .format-card').forEach(card => {
  card.addEventListener('click', () => startPractice(card.getAttribute('data-practice')));
});
let practiceBowlSelection = { type: 'Medium', length: 'Good Length', line: 'Middle Stump' };

function startPractice(mode) {
  practiceState = { mode, runs: 0, balls: 0, wickets: 0, sessionDifficulty: 'MEDIUM' };
  UI.goto('screen-practice');
  if (!PracticeScene) { PracticeScene = createScene3D(); PracticeScene.init(document.getElementById('practice-canvas')); }
  PracticeScene.setTeamColors(TEAMS[0].color, TEAMS[1].color);
  document.getElementById('practice-batting-controls').classList.toggle('hidden', mode !== 'batting');
  document.getElementById('practice-bowling-controls').classList.toggle('hidden', mode !== 'bowling');
  UI.populateBowlChips('p-', practiceBowlSelection);
  document.getElementById('p-btn-bowl-release').onclick = practiceReleaseBowl;
  updatePracticeStats();
  practiceNextBall();
}

function updatePracticeStats() {
  document.getElementById('practice-stats').textContent =
    practiceState.mode === 'batting'
      ? `${practiceState.runs} runs • ${practiceState.balls} balls • ${practiceState.wickets} dismissals`
      : `${practiceState.wickets} wkts • ${practiceState.runs} runs conceded • ${practiceState.balls} balls`;
}

function practiceNextBall() {
  if (!practiceState) return;
  PracticeScene.resetBallToBowler();
  if (practiceState.mode === 'batting') {
    const delivery = Match.prepareDelivery(null);
    practiceState.currentDelivery = delivery;
    PracticeScene.setCamera('batter');
    const releaseTime = performance.now();
    practiceState.battingCtx = { releaseTime, resolved: false };
    PracticeScene.bowlBall(delivery.duration, delivery.swing, delivery.bounceZ, () => SFX.bounce());
    practiceState.battingCtx.timer = setTimeout(() => resolvePracticeBatting(null), delivery.duration * 1000 + 300);
  } else {
    PracticeScene.setCamera('bowler');
  }
}

function resolvePracticeBatting(pressTime) {
  if (!practiceState) return;
  const ctx = practiceState.battingCtx;
  if (!ctx || ctx.resolved) return;
  ctx.resolved = true;
  clearTimeout(ctx.timer);
  const delivery = practiceState.currentDelivery;
  let timingClass = pressTime === null ? 'MISS' : Match.classifyTiming((pressTime - ctx.releaseTime) - Match.idealContactDelayMs(delivery), practiceState.sessionDifficulty);
  const shotType = keysDown.has('KeyW') ? 'loft' : keysDown.has('KeyS') ? 'defend' : 'normal';
  const outcome = Match.resolvePlayerShot(timingClass, shotType, delivery);
  UI.showTiming('practice-timing-meter', 'practice-timing-result', timingClass);
  if (outcome.wicket) { SFX.wicket(); practiceState.wickets++; UI.showCommentary('practice-commentary', 'OUT! Ball resets — keep practicing.'); }
  else {
    if (timingClass !== 'MISS') {
      const power = Math.min(1, (outcome.runs || 0) / 6 + (outcome.six ? 0.5 : 0));
      PracticeScene.hitBall(outcome.angle, power, outcome.shotType === 'loft');
      if (outcome.six) SFX.six(); else if (outcome.four) SFX.boundary(); else SFX.batHit();
    }
    practiceState.runs += outcome.runs || 0;
    UI.showCommentary('practice-commentary', Commentary.line(outcome.four ? 'four' : outcome.six ? 'six' : outcome.runs ? 'one' : 'dot'));
  }
  practiceState.balls++;
  updatePracticeStats();
  setTimeout(practiceNextBall, 1300);
}

function handlePracticeSpace() {
  if (practiceState.mode === 'batting' && practiceState.battingCtx && !practiceState.battingCtx.resolved) {
    resolvePracticeBatting(performance.now());
  } else if (practiceState.mode === 'bowling') {
    practiceReleaseBowl();
  }
}

function practiceReleaseBowl() {
  if (practiceState._releasing) return;
  practiceState._releasing = true;
  const delivery = Match.prepareDelivery(practiceBowlSelection);
  PracticeScene.setCamera('ball');
  PracticeScene.bowlBall(delivery.duration, delivery.swing, delivery.bounceZ, () => SFX.bounce());
  setTimeout(() => {
    if (!practiceState) return;
    const outcome = Match.aiFaceDelivery(0.55, delivery);
    if (outcome.wicket) { SFX.wicket(); practiceState.wickets++; UI.showCommentary('practice-commentary', Commentary.line(outcome.wicket === 'bowled' ? 'wicket_bowled' : 'wicket_caught')); }
    else {
      if (outcome.timingClass !== 'MISS') {
        PracticeScene.hitBall(outcome.angle, Math.min(1, (outcome.runs || 0) / 6), outcome.shotType === 'loft');
        if (outcome.six) SFX.six(); else if (outcome.four) SFX.boundary(); else SFX.batHit();
      }
      practiceState.runs += outcome.runs || 0;
      UI.showCommentary('practice-commentary', Commentary.line(outcome.four ? 'four' : outcome.six ? 'six' : outcome.runs ? 'one' : 'dot'));
    }
    practiceState.balls++;
    updatePracticeStats();
    practiceState._releasing = false;
    setTimeout(practiceNextBall, 1300);
  }, delivery.duration * 1000 + 200);
}

document.getElementById('btn-end-practice').addEventListener('click', () => { practiceState = null; UI.goto('screen-menu'); });

/* ==================================================================
   TOURNAMENT MODE — 4-team knockout (semis + final)
   ================================================================== */
let Tourney = null;
function initTournament() {
  const pool = [0, 1, 2, 3, 4, 5, 6, 7].sort(() => Math.random() - 0.5).slice(0, 4);
  Tourney = { teams: pool, semis: [{ a: pool[0], b: pool[1], winner: null }, { a: pool[2], b: pool[3], winner: null }], final: { a: null, b: null, winner: null }, stage: 0 };
}
function renderBracket() {
  if (!Tourney) initTournament();
  const el = document.getElementById('bracket');
  const name = i => i === null ? 'TBD' : TEAMS[i].name;
  el.innerHTML = `
    <div class="bracket-round">
      <div class="bracket-match ${Tourney.semis[0].winner !== null ? 'winner-a' : ''}">${name(Tourney.semis[0].a)} vs ${name(Tourney.semis[0].b)}${Tourney.semis[0].winner !== null ? '<br>Winner: ' + name(Tourney.semis[0].winner) : ''}</div>
      <div class="bracket-match ${Tourney.semis[1].winner !== null ? 'winner-a' : ''}">${name(Tourney.semis[1].a)} vs ${name(Tourney.semis[1].b)}${Tourney.semis[1].winner !== null ? '<br>Winner: ' + name(Tourney.semis[1].winner) : ''}</div>
    </div>
    <div class="bracket-round">
      <div class="bracket-match">${name(Tourney.final.a)} vs ${name(Tourney.final.b)}${Tourney.final.winner !== null ? '<br>CHAMPION: ' + name(Tourney.final.winner) : ''}</div>
    </div>
  `;
  const actionBtn = document.getElementById('btn-tourney-action');
  if (Tourney.stage < 2) actionBtn.textContent = Tourney.stage === 0 ? 'Play Semi Final 1' : 'Play Semi Final 2';
  else if (Tourney.stage === 2) actionBtn.textContent = 'Play Final';
  else actionBtn.textContent = 'New Tournament';
}
document.getElementById('btn-tourney-action').addEventListener('click', () => {
  if (!Tourney) initTournament();
  if (Tourney.stage === 3) { initTournament(); renderBracket(); return; }
  matchContext = 'tournament';
  resultReturnScreen = 'screen-tournament'; resultReturnLabel = 'Back to Tournament';
  let a, b;
  if (Tourney.stage === 0) { a = Tourney.semis[0].a; b = Tourney.semis[0].b; }
  else if (Tourney.stage === 1) { a = Tourney.semis[1].a; b = Tourney.semis[1].b; }
  else { a = Tourney.final.a; b = Tourney.final.b; }
  Selection.teamA = a; Selection.teamB = b; Selection.format = 'quick'; Selection.difficulty = 'MEDIUM';
  Toss.winner = 'A'; Toss.decision = 'bat';
  Match.newMatch({ teamAIdx: a, teamBIdx: b, overs: FORMATS.quick.overs, difficulty: 'MEDIUM', tossWinner: 'A', tossDecision: 'bat', stadiumIdx: 0 });
  startMatchScreen();
});
function advanceTournamentAfterMatch(s, won) {
  const winnerIdx = won ? Selection.teamA : Selection.teamB;
  if (Tourney.stage === 0) { Tourney.semis[0].winner = winnerIdx; Tourney.final.a = winnerIdx; Tourney.stage = 1; }
  else if (Tourney.stage === 1) { Tourney.semis[1].winner = winnerIdx; Tourney.final.b = winnerIdx; Tourney.stage = 2; }
  else { Tourney.final.winner = winnerIdx; Tourney.stage = 3; }
}

/* ==================================================================
   CAREER MODE
   ================================================================== */
function renderCareerScreen() {
  const c = Stats.loadCareer();
  if (c) { document.getElementById('career-create').classList.add('hidden'); document.getElementById('career-dashboard').classList.remove('hidden'); renderCareerDashboard(); }
  else { document.getElementById('career-create').classList.remove('hidden'); document.getElementById('career-dashboard').classList.add('hidden'); }
}
document.querySelector('[data-nav="screen-career"]').addEventListener('click', renderCareerScreen);

document.getElementById('btn-create-career').addEventListener('click', () => {
  const name = document.getElementById('career-name').value.trim() || 'Player';
  const region = document.getElementById('career-region').value;
  const batStyle = document.getElementById('career-batstyle').value;
  const bowlStyle = document.getElementById('career-bowlstyle').value;
  Stats.saveCareer({ name, region, batStyle, bowlStyle, points: 0, matches: 0, runs: 0, wickets: 0 });
  renderCareerScreen();
});
function renderCareerDashboard() {
  const c = Stats.loadCareer();
  if (!c) return;
  document.getElementById('career-player-name').textContent = `${c.name} — ${c.region}`;
  document.getElementById('career-tier').textContent = Stats.careerTier(c.points);
  document.getElementById('career-stats').innerHTML = `
    <div>Matches: ${c.matches}</div><div>Runs: ${c.runs}</div>
    <div>Wickets: ${c.wickets}</div><div>Career Points: ${c.points}</div>
  `;
}
document.getElementById('btn-career-play').addEventListener('click', () => {
  const teamIdx = TEAMS.findIndex(t => t.name.startsWith(Stats.loadCareer().region));
  Selection.teamA = teamIdx >= 0 ? teamIdx : 0;
  Selection.teamB = (Selection.teamA + 1 + Math.floor(Math.random() * 6)) % 8;
  Selection.format = 'quick'; Selection.difficulty = 'MEDIUM';
  matchContext = 'career';
  resultReturnScreen = 'screen-career'; resultReturnLabel = 'Back to Career';
  setupTossScreen();
  UI.goto('screen-toss');
});
document.getElementById('btn-career-reset').addEventListener('click', () => { Stats.resetCareer(); renderCareerScreen(); });
function updateCareerAfterMatch(s, won) {
  const c = Stats.loadCareer();
  if (!c) return;
  c.matches += 1;
  c.runs += s.score[0].runs;
  c.wickets += s.score[1].bowlerWkts;
  c.points += s.score[0].runs + s.score[1].bowlerWkts * 20 + (won ? 50 : 0);
  Stats.saveCareer(c);
}

/* ==================================================================
   STATISTICS SCREEN
   ================================================================== */
document.querySelector('[data-nav="screen-statistics"]').addEventListener('click', UI.renderStats.bind(UI));

/* ==================================================================
   SETTINGS
   ================================================================== */
(function initSettings() {
  const s = Settings.load();
  document.getElementById('setting-sound').checked = s.sound;
  document.getElementById('setting-graphics').value = s.graphics;
  document.getElementById('setting-difficulty').value = s.difficulty;
  document.getElementById('setting-camera').value = s.camera;
  Selection.difficulty = s.difficulty;
  SFX.enabled = s.sound;
  ['setting-sound', 'setting-graphics', 'setting-difficulty', 'setting-camera'].forEach(id => {
    document.getElementById(id).addEventListener('change', () => {
      const ns = { sound: document.getElementById('setting-sound').checked, graphics: document.getElementById('setting-graphics').value, difficulty: document.getElementById('setting-difficulty').value, camera: document.getElementById('setting-camera').value };
      Settings.save(ns);
      SFX.enabled = ns.sound;
      Selection.difficulty = ns.difficulty;
    });
  });
})();
document.getElementById('btn-fullscreen').addEventListener('click', () => {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
  else document.exitFullscreen();
});

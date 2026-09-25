/* ===========================================================
   Match engine — ball-by-ball cricket simulation & rules
   =========================================================== */

const Match = {
  state: null,

  newMatch({ teamAIdx, teamBIdx, overs, difficulty, tossWinner, tossDecision, stadiumIdx }) {
    const teamA = TEAMS[teamAIdx];
    const teamB = TEAMS[teamBIdx];
    let battingFirst, bowlingFirst;
    if ((tossWinner === 'A' && tossDecision === 'bat') || (tossWinner === 'B' && tossDecision === 'bowl')) {
      battingFirst = 0; bowlingFirst = 1;
    } else {
      battingFirst = 1; bowlingFirst = 0;
    }
    this.state = {
      teams: [teamA, teamB],
      overs,
      difficulty,
      stadiumIdx,
      battingFirst,
      innings: 1,
      battingTeam: battingFirst,
      score: [
        { runs: 0, wkts: 0, balls: 0, batOrder: 0, batterRuns: 0, batterBalls: 0, nonStrikerName: '', batterName: '', bowlerName: '', bowlerRuns: 0, bowlerWkts: 0, bowlerBalls: 0, fours: 0, sixes: 0, history: [] },
        { runs: 0, wkts: 0, balls: 0, batOrder: 0, batterRuns: 0, batterBalls: 0, nonStrikerName: '', batterName: '', bowlerName: '', bowlerRuns: 0, bowlerWkts: 0, bowlerBalls: 0, fours: 0, sixes: 0, history: [] }
      ],
      target: null,
      matchOver: false,
      resultText: '',
      pom: null,
      playerTeamIdx: 0, // Team 1 / "Team A" is always the human-controlled side
      pendingDelivery: null,
      lastOutcome: null,
      freeHit: false,
      log: []
    };
    this._initInningsNames(this.state.score[battingFirst], teamA === teamA ? this.state.teams[battingFirst] : null);
    this._setNames(0);
    this._setNames(1);
    return this.state;
  },

  _setNames(teamSlot) {
    const s = this.state.score[teamSlot];
    const team = this.state.teams[teamSlot];
    s.batterName = team.players[0];
    s.nonStrikerName = team.players[1];
    s.batOrder = 2;
    s.bowlerName = this.state.teams[1 - teamSlot].players[6] || this.state.teams[1 - teamSlot].players[0];
  },

  _initInningsNames() {},

  playerControlsBatting() {
    return this.state.battingTeam === this.state.playerTeamIdx;
  },

  currentOversLimit() { return this.state.overs; },

  ballsPerInnings() { return this.state.overs * 6; },

  // ---------- Delivery setup ----------
  prepareDelivery(playerChoice) {
    let type, length, line, speed;
    if (playerChoice) {
      type = playerChoice.type; length = playerChoice.length; line = playerChoice.line;
    } else {
      type = DELIVERY_TYPES[Math.floor(Math.random() * DELIVERY_TYPES.length)];
      length = LENGTHS[Math.floor(Math.random() * LENGTHS.length)];
      line = LINES[Math.floor(Math.random() * LINES.length)];
    }
    speed = type === 'Fast' ? 128 + Math.random() * 20 : type === 'Medium' ? 105 + Math.random() * 15 : 78 + Math.random() * 12;
    const duration = type === 'Spin' ? 1.35 : type === 'Medium' ? 1.15 : 0.95; // seconds, slower on screen for playability
    let swing = 0;
    if (line === 'Off Stump') swing = -0.4;
    else if (line === 'Leg Stump') swing = 0.4;
    else if (line === 'Wide Outside Off') swing = -1.1;
    if (type !== 'Spin') swing += (Math.random() - 0.5) * 0.5;
    else swing += (Math.random() - 0.5) * 0.9;

    const bounceZ = length === 'Yorker' ? 8.6 : length === 'Full' ? 4 : length === 'Good Length' ? -1 : length === 'Short' ? -5 : -7.5;

    const delivery = { type, length, line, speed, duration, swing, bounceZ };
    if (this.state) this.state.pendingDelivery = delivery;
    return delivery;
  },

  isExtra() {
    const r = Math.random();
    if (r < 0.05) return 'wide';
    if (r < 0.08) return 'noball';
    return null;
  },

  idealContactDelayMs(deliveryOverride) {
    const d = deliveryOverride || (this.state && this.state.pendingDelivery);
    return d.duration * 1000 * 0.78;
  },

  // ---------- Player batting resolution ----------
  // difficultyOverride lets Practice mode use this without an active match in progress.
  classifyTiming(offsetMs, difficultyOverride) {
    const diffKey = difficultyOverride || (this.state && this.state.difficulty) || 'MEDIUM';
    const w = DIFFICULTIES[diffKey].window;
    const abs = Math.abs(offsetMs);
    if (offsetMs === null) return 'MISS';
    if (abs <= w * 0.35) return 'PERFECT';
    if (abs <= w) return 'GOOD';
    if (abs > w * 2.2) return 'MISS';
    return offsetMs < 0 ? 'EARLY' : 'LATE';
  },

  resolvePlayerShot(timingClass, shotType, deliveryOverride) {
    // shotType: 'normal' | 'loft' | 'defend'
    const d = deliveryOverride || (this.state && this.state.pendingDelivery);
    return this._resolveShot(timingClass, shotType, d, false);
  },

  aiFaceDelivery(aiSkill, deliveryOverride) {
    const d = deliveryOverride || (this.state && this.state.pendingDelivery);
    let difficulty = 0;
    if (d.length === 'Yorker' || d.length === 'Bouncer') difficulty += 60;
    if (d.type === 'Spin') difficulty += 25;
    if (Math.abs(d.swing) > 0.6) difficulty += 30;
    const variance = (1 - aiSkill) * 260 + difficulty;
    const offset = (Math.random() - 0.5) * variance;
    const timingClass = this.classifyTiming(offset, this.state && this.state.difficulty);
    const needsRunRate = this._requiredRunRate();
    const aggressive = needsRunRate !== null && needsRunRate > 9;
    const shotType = aggressive && Math.random() < 0.5 ? 'loft' : (Math.random() < 0.15 ? 'defend' : 'normal');
    return this._resolveShot(timingClass, shotType, d, true, aggressive);
  },

  _resolveShot(timingClass, shotType, delivery, isAI, aggressive) {
    const angle = (Math.random() - 0.5) * (shotType === 'defend' ? 0.6 : 2.2);
    let runs = 0, wicket = null, four = false, six = false;

    const straightLine = delivery.line === 'Middle Stump' || delivery.line === 'Off Stump';

    if (timingClass === 'MISS') {
      if (straightLine && Math.random() < 0.55) wicket = 'bowled';
      else if (Math.random() < 0.08) wicket = 'bowled';
      runs = 0;
    } else if (timingClass === 'PERFECT') {
      const roll = Math.random();
      if (shotType === 'loft') {
        if (roll < 0.55) { six = true; runs = 6; }
        else if (roll < 0.85) { four = true; runs = 4; }
        else if (roll < 0.95) { runs = [1, 2, 3][Math.floor(Math.random() * 3)]; }
        else wicket = 'caught';
      } else if (shotType === 'defend') {
        runs = Math.random() < 0.7 ? 0 : 1;
      } else {
        if (roll < 0.35) { four = true; runs = 4; }
        else if (roll < 0.55) { six = true; runs = 6; }
        else runs = [1, 1, 2, 2, 3][Math.floor(Math.random() * 5)];
      }
    } else if (timingClass === 'GOOD') {
      const roll = Math.random();
      if (shotType === 'loft') {
        if (roll < 0.25) { six = true; runs = 6; }
        else if (roll < 0.5) { four = true; runs = 4; }
        else if (roll < 0.75) runs = [1, 2][Math.floor(Math.random() * 2)];
        else wicket = 'caught';
      } else if (shotType === 'defend') {
        runs = Math.random() < 0.85 ? 0 : 1;
      } else {
        if (roll < 0.18) { four = true; runs = 4; }
        else if (roll < 0.75) runs = [0, 1, 1, 2][Math.floor(Math.random() * 4)];
        else runs = 3;
      }
    } else { // EARLY or LATE
      const roll = Math.random();
      if (shotType === 'loft') {
        if (roll < 0.35) wicket = 'caught';
        else if (roll < 0.55) runs = 1;
        else runs = 0;
      } else {
        if (roll < 0.12) wicket = straightLine ? 'bowled' : 'caught';
        else if (roll < 0.65) runs = 0;
        else runs = 1;
      }
    }

    // Run-out chance on 2s/3s (running between wickets)
    if (!wicket && (runs === 2 || runs === 3)) {
      const runOutChance = 0.06 + (delivery.length === 'Short' ? 0.02 : 0);
      if (Math.random() < runOutChance) {
        wicket = 'runout';
        runs = runs - 1; // they get caught short of the last run
      }
    }

    return { timingClass, runs, wicket, four, six, angle, shotType };
  },

  _requiredRunRate() {
    const s = this.state;
    if (!s || s.innings !== 2 || !s.target) return null;
    const sc = s.score[s.battingTeam];
    const ballsLeft = this.ballsPerInnings() - sc.balls;
    if (ballsLeft <= 0) return 999;
    const runsNeeded = s.target - sc.runs;
    return (runsNeeded / ballsLeft) * 6;
  },

  // ---------- Applying outcome to state ----------
  applyOutcome(outcome, extraType) {
    const s = this.state;
    const sc = s.score[s.battingTeam];
    const bowlTeamIdx = 1 - s.battingTeam;

    if (extraType === 'wide' || extraType === 'noball') {
      sc.runs += 1;
      sc.bowlerRuns += 1;
      s.lastOutcome = extraType;
      const text = Commentary.line(extraType);
      s.log.push({ text, extraType });
      return { ballCounts: false, outcome: extraType, text };
    }

    sc.balls += 1;
    sc.bowlerBalls += 1;
    sc.batterBalls += 1;

    let key = 'dot';
    if (outcome.wicket) {
      sc.wkts += 1;
      sc.bowlerWkts += 1;
      key = outcome.wicket === 'bowled' ? 'wicket_bowled' : outcome.wicket === 'caught' ? 'wicket_caught' : 'wicket_runout';
      sc.runs += outcome.runs || 0;
      sc.bowlerRuns += outcome.runs || 0;
      // next batter
      if (sc.batOrder < this.state.teams[s.battingTeam].players.length) {
        sc.batterName = this.state.teams[s.battingTeam].players[sc.batOrder];
        sc.batOrder += 1;
        sc.batterRuns = 0; sc.batterBalls = 0;
      } else {
        sc.batterName = '—';
      }
    } else {
      sc.runs += outcome.runs;
      sc.bowlerRuns += outcome.runs;
      sc.batterRuns += outcome.runs;
      if (outcome.four) sc.fours += 1;
      if (outcome.six) sc.sixes += 1;
      key = outcome.runs === 0 ? 'dot' : outcome.runs === 1 ? 'one' : outcome.runs === 2 ? 'two' : outcome.runs === 3 ? 'three' : outcome.four ? 'four' : outcome.six ? 'six' : 'dot';
      if (outcome.runs % 2 === 1) {
        const t = sc.batterName; // swap strike on odd runs (simplified, no separate non-striker runs tracked)
      }
    }

    // rotate bowler name every over (figures below stay cumulative for the whole innings' attack)
    if (sc.balls % 6 === 0 && sc.balls > 0) {
      const bowlTeam = this.state.teams[bowlTeamIdx];
      const pool = [bowlTeam.players[6], bowlTeam.players[7], bowlTeam.players[8], bowlTeam.players[0]];
      sc.bowlerName = pool[Math.floor(sc.balls / 6) % pool.length];
    }

    s.lastOutcome = key;
    const text = Commentary.line(key);
    s.log.push({ text, key });

    const inningsOver = sc.wkts >= 10 || sc.balls >= this.ballsPerInnings();
    return { ballCounts: true, outcome: key, inningsOver, wicket: !!outcome.wicket, text };
  },

  isInningsOver() {
    const sc = this.state.score[this.state.battingTeam];
    return sc.wkts >= 10 || sc.balls >= this.ballsPerInnings() || (this.state.innings === 2 && this.state.target !== null && sc.runs >= this.state.target);
  },

  startSecondInnings() {
    const s = this.state;
    s.innings = 2;
    s.target = s.score[s.battingFirst].runs + 1;
    s.battingTeam = 1 - s.battingFirst;
  },

  finishMatch() {
    const s = this.state;
    s.matchOver = true;
    const first = s.score[s.battingFirst];
    const second = s.score[1 - s.battingFirst];
    const firstTeam = s.teams[s.battingFirst];
    const secondTeam = s.teams[1 - s.battingFirst];
    if (second.runs >= s.target) {
      const wktsLeft = 10 - second.wkts;
      s.resultText = `${secondTeam.name} won by ${wktsLeft} wicket${wktsLeft === 1 ? '' : 's'}`;
      s.winner = 1 - s.battingFirst;
    } else if (second.runs === first.runs) {
      s.resultText = `Match tied`;
      s.winner = null;
    } else {
      const margin = first.runs - second.runs;
      s.resultText = `${firstTeam.name} won by ${margin} run${margin === 1 ? '' : 's'}`;
      s.winner = s.battingFirst;
    }
    // player of the match: best combination of runs/wickets among the two "active" names
    const candidates = [
      { name: first.batterName, val: first.batterRuns, type: 'bat' },
      { name: second.bowlerName, val: second.bowlerWkts * 25, type: 'bowl' },
      { name: second.batterName, val: second.batterRuns, type: 'bat' },
      { name: first.bowlerName, val: first.bowlerWkts * 25, type: 'bowl' }
    ];
    candidates.sort((a, b) => b.val - a.val);
    s.pom = candidates[0];
    return s;
  }
};

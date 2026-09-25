const Stats = {
  KEY: 'cc26_stats_v1',
  CAREER_KEY: 'cc26_career_v1',

  load() {
    const raw = localStorage.getItem(this.KEY);
    if (raw) return JSON.parse(raw);
    return { matches: 0, wins: 0, losses: 0, runs: 0, balls: 0, wickets: 0, runsConceded: 0, bowlBalls: 0, highestScore: 0, bestBowling: '0/0', sixes: 0, fours: 0 };
  },

  save(s) { localStorage.setItem(this.KEY, JSON.stringify(s)); },

  recordMatch({ playerBatted, playerBowled, batRuns, batBalls, fours, sixes, wktsTaken, runsConceded, bowlBalls, won }) {
    const s = this.load();
    s.matches += 1;
    if (won === true) s.wins += 1; else if (won === false) s.losses += 1;
    if (playerBatted) {
      s.runs += batRuns; s.balls += batBalls; s.fours += fours; s.sixes += sixes;
      if (batRuns > s.highestScore) s.highestScore = batRuns;
    }
    if (playerBowled) {
      s.wickets += wktsTaken; s.runsConceded += runsConceded; s.bowlBalls += bowlBalls;
      const [bw, br] = s.bestBowling.split('/').map(Number);
      if (wktsTaken > bw || (wktsTaken === bw && runsConceded < br)) s.bestBowling = `${wktsTaken}/${runsConceded}`;
    }
    this.save(s);
  },

  loadCareer() {
    const raw = localStorage.getItem(this.CAREER_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  saveCareer(c) { localStorage.setItem(this.CAREER_KEY, JSON.stringify(c)); },

  resetCareer() { localStorage.removeItem(this.CAREER_KEY); },

  careerTier(totalPoints) {
    if (totalPoints < 200) return 'Local Cricket';
    if (totalPoints < 600) return 'Club Level';
    if (totalPoints < 1400) return 'State Level';
    return 'National League';
  }
};

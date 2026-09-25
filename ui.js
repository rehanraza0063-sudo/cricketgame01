const UI = {
  goto(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  },

  renderTeamGrid(containerId, selectedId, onPick) {
    const el = document.getElementById(containerId);
    el.innerHTML = '';
    TEAMS.forEach((t, idx) => {
      const card = document.createElement('div');
      card.className = 'team-card' + (idx === selectedId ? ' selected' : '');
      card.innerHTML = `
        <div class="team-logo" style="background:${t.color}">${t.short}</div>
        <h4>${t.name}</h4>
        <div class="ratings">BAT ${t.bat} · BOWL ${t.bowl} · OVR ${t.overall}</div>
      `;
      card.addEventListener('click', () => onPick(idx));
      el.appendChild(card);
    });
  },

  populateStadiums() {
    const sel = document.getElementById('select-stadium');
    sel.innerHTML = STADIUMS.map((s, i) => `<option value="${i}">${s.name}</option>`).join('');
  },

  populateBowlChips(prefix, state, onChange) {
    const typeEl = document.getElementById(prefix + 'chip-type');
    const lenEl = document.getElementById(prefix + 'chip-length');
    const lineEl = document.getElementById(prefix + 'chip-line');
    const build = (el, arr, key) => {
      el.innerHTML = '';
      arr.forEach(v => {
        const c = document.createElement('div');
        c.className = 'chip' + (state[key] === v ? ' selected' : '');
        c.textContent = v;
        c.addEventListener('click', () => { state[key] = v; build(typeEl, DELIVERY_TYPES, 'type'); build(lenEl, LENGTHS, 'length'); build(lineEl, LINES, 'line'); if (onChange) onChange(); });
        el.appendChild(c);
      });
    };
    build(typeEl, DELIVERY_TYPES, 'type');
    build(lenEl, LENGTHS, 'length');
    build(lineEl, LINES, 'line');
  },

  updateHUD(match) {
    const s = match.state;
    const sc = s.score[s.battingTeam];
    const team = s.teams[s.battingTeam];
    document.getElementById('hud-team-name').textContent = team.name.toUpperCase();
    document.getElementById('hud-score-line').textContent = `${sc.runs}/${sc.wkts}`;
    const oversDone = Math.floor(sc.balls / 6) + '.' + (sc.balls % 6);
    document.getElementById('hud-overs-line').textContent = `${oversDone} / ${s.overs} OVERS`;
    document.getElementById('hud-batsman').textContent = `${sc.batterName} ${sc.batterRuns} (${sc.batterBalls})`;
    document.getElementById('hud-bowler').textContent = `${sc.bowlerName} ${sc.bowlerWkts}/${sc.bowlerRuns}`;

    const targetEl = document.getElementById('hud-target');
    if (s.innings === 2 && s.target) {
      const ballsLeft = match.ballsPerInnings() - sc.balls;
      const needed = s.target - sc.runs;
      targetEl.classList.remove('hidden');
      targetEl.textContent = `TARGET ${s.target} · NEED ${Math.max(0, needed)} FROM ${Math.max(0, ballsLeft)}`;
    } else {
      targetEl.classList.add('hidden');
    }
  },

  showCommentary(elId, text) {
    const el = document.getElementById(elId);
    el.textContent = text;
  },

  showTiming(meterId, resultId, cls) {
    const meter = document.getElementById(meterId);
    const result = document.getElementById(resultId);
    result.className = 'timing-result ' + cls;
    result.textContent = cls;
    meter.classList.remove('hidden');
    clearTimeout(meter._t);
    meter._t = setTimeout(() => meter.classList.add('hidden'), 900);
  },

  renderStats() {
    const s = Stats.load();
    const el = document.getElementById('stats-body');
    const rows = [
      ['Matches', s.matches], ['Wins', s.wins], ['Losses', s.losses],
      ['Runs', s.runs], ['Wickets', s.wickets], ['Highest Score', s.highestScore],
      ['Best Bowling', s.bestBowling], ['Sixes', s.sixes], ['Fours', s.fours],
      ['Strike Rate', s.balls ? (s.runs / s.balls * 100).toFixed(1) : '0.0'],
      ['Economy', s.bowlBalls ? (s.runsConceded / (s.bowlBalls / 6)).toFixed(2) : '0.00']
    ];
    el.innerHTML = rows.map(r => `<div class="stat"><div class="val">${r[1]}</div><div class="lbl">${r[0]}</div></div>`).join('');
  }
};

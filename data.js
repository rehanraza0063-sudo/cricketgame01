/* ===========================================================
   CRICKET CHAMPIONS 26 — Team & Player Data
   All names, teams and logos below are 100% original / fictional.
   =========================================================== */

const TEAMS = [
  {
    id: 'mum', name: 'Mumbai Warriors', short: 'MUM', color: '#1560BD', accent: '#FFC300',
    bat: 84, bowl: 79, overall: 82,
    players: ['A. Shah', 'R. Iyer', 'K. Deshmukh', 'V. Rane', 'S. Kadam (c)', 'P. Naik', 'J. Salvi (wk)', 'M. Kambli', 'T. Dalvi', 'H. Bhosale', 'O. Save']
  },
  {
    id: 'del', name: 'Delhi Titans', short: 'DEL', color: '#8E1B1B', accent: '#F2C14E',
    bat: 80, bowl: 85, overall: 83,
    players: ['R. Sharma (c)', 'A. Chopra', 'V. Malik', 'K. Sethi', 'N. Bhatia', 'D. Arora (wk)', 'G. Tandon', 'S. Khurana', 'M. Tyagi', 'L. Sabharwal', 'R. Anand']
  },
  {
    id: 'kol', name: 'Kolkata Tigers', short: 'KOL', color: '#4B0082', accent: '#F5A623',
    bat: 81, bowl: 80, overall: 81,
    players: ['S. Ganguly Jr.', 'A. Dutta', 'R. Basu (c)', 'M. Chatterjee', 'P. Roy', 'K. Sarkar (wk)', 'B. Mondal', 'T. Sen', 'D. Ghosh', 'N. Halder', 'S. Bose']
  },
  {
    id: 'guj', name: 'Gujarat Cheetahs', short: 'GUJ', color: '#B8860B', accent: '#0B3D91',
    bat: 78, bowl: 82, overall: 80,
    players: ['J. Patel (c)', 'K. Shah', 'M. Trivedi', 'R. Desai', 'A. Vyas', 'S. Mehta (wk)', 'H. Joshi', 'B. Parmar', 'D. Rathod', 'V. Solanki', 'N. Barot']
  },
  {
    id: 'raj', name: 'Rajasthan Falcons', short: 'RAJ', color: '#C11B17', accent: '#F4E285',
    bat: 79, bowl: 78, overall: 78,
    players: ['V. Rathore (c)', 'S. Chouhan', 'A. Shekhawat', 'K. Meena', 'R. Bhati', 'D. Kachhawa (wk)', 'M. Solanki', 'P. Charan', 'L. Nagar', 'G. Beniwal', 'H. Rao']
  },
  {
    id: 'che', name: 'Chennai Chargers', short: 'CHE', color: '#F9D71C', accent: '#003366',
    bat: 83, bowl: 81, overall: 82,
    players: ['M. Raina', 'S. Ashwin', 'R. Vijay', 'K. Bharath', 'A. Murali (c)', 'D. Karthik (wk)', 'V. Kumar', 'T. Natarajan', 'S. Badrinath', 'P. Chari', 'J. Suresh']
  },
  {
    id: 'hyd', name: 'Hyderabad Hawks', short: 'HYD', color: '#5B2C6F', accent: '#FF8C00',
    bat: 77, bowl: 84, overall: 80,
    players: ['V. Reddy (c)', 'A. Rao', 'S. Naidu', 'K. Prasad', 'M. Goud', 'R. Sharma (wk)', 'B. Kumar', 'T. Yadav', 'D. Rathore', 'N. Chary', 'H. Verma']
  },
  {
    id: 'ban', name: 'Bangalore Queens', short: 'BAN', color: '#C41E3A', accent: '#000000',
    bat: 85, bowl: 76, overall: 81,
    players: ['A. Kohli Jr.', 'R. Gowda', 'K. Shetty', 'V. Rai', 'S. Nair (c)', 'D. Hegde (wk)', 'M. Pai', 'P. Kamath', 'T. Poojary', 'L. Shenoy', 'G. Bhat']
  }
];

const STADIUMS = [
  { name: 'Sea View Arena', sky: 0x1a2b4c, crowdDensity: 0.85 },
  { name: 'Highland Cricket Bowl', sky: 0x223355, crowdDensity: 0.7 },
  { name: 'Coastal Champions Ground', sky: 0x16324f, crowdDensity: 0.9 }
];

const FORMATS = {
  quick: { label: 'Quick Match', overs: 2 },
  t20: { label: 'T20 Match', overs: 20 },
  odi: { label: 'ODI Match', overs: 50 }
};

const DIFFICULTIES = {
  EASY:   { window: 260, aiSkill: 0.35 },
  MEDIUM: { window: 190, aiSkill: 0.55 },
  HARD:   { window: 140, aiSkill: 0.72 },
  PRO:    { window: 100, aiSkill: 0.88 }
};

const DELIVERY_TYPES = ['Fast', 'Medium', 'Spin'];
const LENGTHS = ['Yorker', 'Full', 'Good Length', 'Short', 'Bouncer'];
const LINES = ['Off Stump', 'Middle Stump', 'Leg Stump', 'Wide Outside Off'];

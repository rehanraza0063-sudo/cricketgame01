/* Dynamic fictional text commentary — no copyrighted lines used. */

const Commentary = {
  line(outcome, ctx) {
    const lines = {
      dot: ["Good comeback ball, no run there.", "Solid defence, they leave it alone.", "Right on the money, dot ball.", "Well bowled, no run added."],
      one: ["Nudged away for a quick single.", "Worked into the gap, they'll take one.", "Tucked off the pads, easy single."],
      two: ["Good running, they come back for two.", "Timed nicely, two runs added.", "Driven into the gap, two more."],
      three: ["Excellent placement, they hustle back for three.", "Superb running between the wickets, three runs!"],
      four: ["That's timed beautifully — races to the boundary for FOUR!", "Cracking shot, finds the gap perfectly, FOUR runs!", "Class shot! Through the field for FOUR!"],
      six: ["That's gone all the way — SIX!", "Massive hit, into the stands for SIX!", "He's cleared the ropes with ease — SIX!"],
      wicket_bowled: ["BOWLED HIM! The stumps are shattered!", "OUT! Completely beaten, and that's timber!", "Castled! What a delivery!"],
      wicket_caught: ["OUT! Excellent catch taken!", "He's holed out! Caught in the deep!", "Skied it and it's safely taken — OUT!"],
      wicket_runout: ["RUN OUT! Direct hit and he's short of his ground!", "They've thrown the wicket away — RUN OUT!"],
      wide: ["Strays down leg, umpire signals wide.", "Too wide, that's called a wide."],
      noball: ["Overstepped! That's a no-ball.", "No-ball called, free run added."],
      early: ["Beaten for pace, played early.", "Rushed into that shot, mistimed."],
      late: ["Late on that one, almost got a leading edge.", "Behind the pace, scrambled through."],
      miss: ["Huge swing and a miss!", "Beaten all ends up!", "Fresh air! He's missed it completely."]
    };
    const arr = lines[outcome] || ["Play continues."];
    return arr[Math.floor(Math.random() * arr.length)];
  }
};

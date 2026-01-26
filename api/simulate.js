import { scenarios } from "./scenarios.js";

let step = 0;
let fireIntensity = 100;

export default function handler(req, res) {
  const { scenario = "kitchen" } = req.query;
  const selected = scenarios[scenario];

  if (!selected) {
    return res.status(400).json({
      state: "ERROR",
      log: "Invalid scenario",
      fireIntensity: 0
    });
  }

  const states = [
    "SEARCHING",
    "FIRE_DETECTED",
    "AIMING",
    "EXTINGUISHING",
    "IDLE"
  ];

  let state = states[Math.min(step, states.length - 1)];

  if (state === "EXTINGUISHING") {
    fireIntensity -= 20;
    if (fireIntensity <= 0) {
      fireIntensity = 0;
      state = "IDLE";
      step = 0;
    }
  } else {
    step++;
  }

  res.status(200).json({
    state,
    fireIntensity,
    log: `Scenario: ${selected.name} | State: ${state}`
  });
}

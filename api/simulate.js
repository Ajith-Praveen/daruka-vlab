import { scenarios } from "./scenarios.js";

export default function handler(req, res) {
  const { scenario } = req.query;

  const selected = scenarios[scenario];

  if (!selected) {
    return res.status(400).json({
      state: "ERROR",
      log: "Invalid scenario selected",
      fireIntensity: 0
    });
  }

  // Simple state machine
  const states = [
    "SEARCHING",
    "FIRE_DETECTED",
    "AIMING",
    "EXTINGUISHING",
    "IDLE"
  ];

  const randomState = states[Math.floor(Math.random() * states.length)];

  let intensity = selected.fireIntensity;

  if (randomState === "EXTINGUISHING") {
    intensity = Math.max(intensity - 40, 0);
  }

  res.status(200).json({
    state: randomState,
    log: `Scenario: ${selected.name} | State: ${randomState}`,
    fireIntensity: intensity
  });
}
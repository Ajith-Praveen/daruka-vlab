import { scenarios } from "./scenarios.js";

let battery = 100;
let fireIntensity = 0;
let state = "SEARCHING";

export default function handler(req, res) {
  const { scenario } = req.query;
  const selected = scenarios[scenario];

  if (!selected) {
    return res.status(400).json({
      state: "ERROR",
      log: "Invalid scenario",
      fireIntensity: 0,
      battery
    });
  }

  // Battery drain
  battery -= 2;
  if (battery <= 20) {
    state = "LOW_BATTERY";
    return res.status(200).json({
      state,
      log: "Battery low. Please charge the robot.",
      fireIntensity,
      battery
    });
  }

  // FSM
  switch (state) {
    case "SEARCHING":
      fireIntensity = selected.maxIntensity;
      state = "FIRE_DETECTED";
      break;

    case "FIRE_DETECTED":
      state = "AIMING";
      break;

    case "AIMING":
      state = "EXTINGUISHING";
      break;

    case "EXTINGUISHING":
      fireIntensity -= 30;
      if (fireIntensity <= 0) {
        fireIntensity = 0;
        state = "SEARCHING";
      }
      break;
  }

  res.status(200).json({
    state,
    log: `Scenario: ${selected.name}`,
    fireIntensity,
    battery
  });
}
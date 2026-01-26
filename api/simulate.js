import { scenarios } from "./scenarios.js";

let battery = 100;
let fireIntensity = 100;

export default function handler(req, res) {
  const { scenario } = req.query;
  const map = scenarios[scenario];

  if (!map) {
    return res.status(400).json({ error: "Invalid scenario" });
  }

  battery -= 5;

  let state = "SEARCHING";

  if (fireIntensity > 0) {
    state = "EXTINGUISHING";
    fireIntensity -= 20;
  } else {
    state = "IDLE";
  }

  if (battery <= 20) {
    state = "LOW_BATTERY";
  }

  res.status(200).json({
    state,
    fireIntensity,
    battery
  });
}

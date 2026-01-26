import { scenarios } from "./scenarios.js";

let battery = 100;
let fireIntensity = 100;
let patrolIndex = 0;

export default function handler(req, res) {
  const { scenario } = req.query;
  const map = scenarios[scenario];

  if (!map) {
    return res.status(400).json({ error: "Invalid scenario" });
  }

  battery -= 3;

  let state = "PATROL";

  if (fireIntensity > 0) {
    state = "EXTINGUISHING";
    fireIntensity -= 20;
  }

  if (battery <= 20) {
    state = "LOW_BATTERY";
  }

  const response = {
    state,
    battery,
    fireIntensity,
    mapClass: map.mapClass,
    firePos: map.firePos,
    patrol: map.patrol,
    patrolIndex
  };

  patrolIndex = (patrolIndex + 1) % map.patrol.length;

  res.status(200).json(response);
}

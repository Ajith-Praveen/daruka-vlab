import { scenarios } from "./scenarios.js";

let simulationState = {
  state: "IDLE",
  fireIntensity: 0,
  log: "Waiting to start"
};

export default function handler(req, res) {
  const scenario = scenarios[req.query.scenario || "kitchen"];

  switch (simulationState.state) {
    case "IDLE":
      simulationState = {
        state: "SCANNING",
        fireIntensity: scenario.fireIntensity,
        log: "Scanning environment for fire"
      };
      break;

    case "SCANNING":
      simulationState.state = "FIRE_DETECTED";
      simulationState.log = "Fire detected by flame sensor array";
      break;

    case "FIRE_DETECTED":
      simulationState.state = "ALIGNING";
      simulationState.log = "Aligning nozzle toward fire source";
      break;

    case "ALIGNING":
      simulationState.state = "EXTINGUISHING";
      simulationState.log = "Aerosol extinguisher activated";
      break;

    case "EXTINGUISHING":
      simulationState.fireIntensity -= 30;
      simulationState.log = "Extinguishing fire...";

      if (simulationState.fireIntensity <= 0) {
        simulationState.state = "CLEARED";
        simulationState.log = "Fire successfully extinguished";
      }
      break;

    case "CLEARED":
      simulationState.state = "IDLE";
      simulationState.log = "Simulation reset";
      break;
  }

  res.status(200).json({
    scenario: scenario.name,
    ...simulationState
  });
}

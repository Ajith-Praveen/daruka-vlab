const scenarios = {
  kitchen: [
    { state: "SEARCHING", log: "Scanning kitchen area", fireIntensity: 100 },
    { state: "FIRE_DETECTED", log: "Fire detected near stove", fireIntensity: 100 },
    { state: "AIMING", log: "Aligning nozzle toward fire", fireIntensity: 70 },
    { state: "EXTINGUISHING", log: "Releasing extinguisher", fireIntensity: 30 },
    { state: "FIRE_EXTINGUISHED", log: "Fire extinguished successfully", fireIntensity: 0 },
    { state: "IDLE", log: "Mission complete", fireIntensity: 0 }
  ]
};

let step = 0;

export default function handler(req, res) {
  const scenarioName = req.query.scenario || "kitchen";
  const scenario = scenarios[scenarioName];

  if (!scenario) {
    return res.status(400).json({ error: "Invalid scenario" });
  }

  const data = scenario[step] || scenario[scenario.length - 1];
  step = (step + 1) % scenario.length;

  res.status(200).json(data);
}

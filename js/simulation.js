import { scenarios } from "../api/scenarios.js";

let patrolIndex = 0;
let running = false;

const robot = document.getElementById("robot");
const fire = document.getElementById("fire");
const map = document.getElementById("map");

function move(el, pos) {
  el.style.top = pos.top + "%";
  el.style.left = pos.left + "%";
}

export async function startSimulation() {
  running = true;
  patrolIndex = 0;

  const scenario = document.getElementById("scenario").value;
  const data = scenarios[scenario];

  map.className = `map ${data.mapClass}`;
  move(fire, data.fire);

  patrol(data, scenario);
}

async function patrol(data, scenario) {
  if (!running) return;

  move(robot, data.patrol[patrolIndex]);
  patrolIndex = (patrolIndex + 1) % data.patrol.length;

  const res = await fetch(`/api/simulate?scenario=${scenario}`);
  const sim = await res.json();

  document.getElementById("state").innerText = sim.state;
  document.getElementById("battery").innerText = sim.battery + "%";

  fire.style.opacity = sim.fireIntensity / 100;

  if (sim.state === "LOW_BATTERY") {
    alert("Battery low! Please charge the robot.");
    running = false;
    return;
  }

  if (sim.fireIntensity <= 0) {
    setTimeout(() => patrol(data, scenario), 2000);
  } else {
    move(robot, data.fire);
    setTimeout(() => patrol(data, scenario), 1500);
  }
}

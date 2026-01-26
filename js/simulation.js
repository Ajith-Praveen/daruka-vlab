let running = false;

const robot = document.getElementById("robot");
const fire = document.getElementById("fire");
const map = document.getElementById("map");

function move(el, pos) {
  el.style.top = pos.top + "%";
  el.style.left = pos.left + "%";
}

async function startSimulation() {
  if (running) return;
  running = true;
  runStep();
}

async function runStep() {
  if (!running) return;

  const scenario = document.getElementById("scenario").value;
  const res = await fetch(`/api/simulate?scenario=${scenario}`);
  const data = await res.json();

  document.getElementById("state").innerText = data.state;
  document.getElementById("battery").innerText = data.battery + "%";

  map.className = `map ${data.mapClass}`;

  move(fire, data.firePos);
  fire.style.opacity = data.fireIntensity / 100;

  if (data.state === "EXTINGUISHING") {
    move(robot, data.firePos);
  } else {
    move(robot, data.patrol[data.patrolIndex]);
  }

  if (data.state === "LOW_BATTERY") {
    document.getElementById("battery-warning").classList.remove("hidden");
    running = false;
    return;
  }

  setTimeout(runStep, 1200);
}

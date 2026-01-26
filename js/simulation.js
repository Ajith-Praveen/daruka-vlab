let running = false;

async function startSimulation() {
  running = true;
  runStep();
}

async function runStep() {
  if (!running) return;

  const res = await fetch("/api/simulate?scenario=kitchen");
  const data = await res.json();

  document.getElementById("state").innerText = data.state;
  document.getElementById("log").innerText = data.log;

  const fire = document.getElementById("fire");

  if (data.fireIntensity !== undefined) {
    fire.style.opacity = Math.max(data.fireIntensity / 100, 0);
  }

  if (data.state !== "IDLE") {
    setTimeout(runStep, 1200);
  } else {
    running = false;
  }
}

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
  document.getElementById("battery").innerText = data.battery + "%";

  const fire = document.getElementById("fire");

  if (data.fireIntensity !== undefined) {
    fire.style.opacity = data.fireIntensity / 100;
  }

  if (data.state === "LOW_BATTERY") {
    document.getElementById("battery-warning").style.display = "block";
    running = false;
    return;
  }

  setTimeout(runStep, 1200);
}

async function chargeRobot() {
  document.getElementById("battery-warning").style.display = "none";
  alert("🔌 Robot charged!");
  location.reload(); // simple reset for lab demo
}
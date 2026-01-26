async function runSimulation() {
  const res = await fetch("/api/simulate?scenario=kitchen");
  const data = await res.json();

  document.getElementById("state").innerText = data.state;
  document.getElementById("log").innerText = data.log;

  if (data.state !== "IDLE") {
    setTimeout(runSimulation, 1200);
  }
}

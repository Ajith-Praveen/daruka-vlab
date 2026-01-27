/* ================= CONFIGURATION ================= */
const CONFIG = {
  robotSpeed: 3,        // Pixels per frame
  turnSpeed: 0.1,       // Rotation smoothing
  stopDistance: 60,    // Stop 120px away from fire
  obsPadding: 20,       // Safety buffer around obstacles
  fireChance: 0.005     // Chance to spawn fire
};

/* ================= STATE ================= */
const sys = {
  running: false,
  state: "IDLE", // IDLE, PATROLLING, DETECTED, APPROACHING, EXTINGUISHING
  robot: { x: 50, y: 50 },
  target: null, // {x, y}
  fire: null,   // {x, y}
  obstacles: [], // Array of {x, y, w, h}
  animID: null
};

/* ================= UI ELEMENTS ================= */
const ui = {
  svg: document.getElementById('svgContainer'),
  robot: document.getElementById('robot'),
  fire: document.getElementById('fire'),
  beam: document.getElementById('beam'),
  console: document.getElementById('console'),
  mapSelect: document.getElementById('mapSelect'),
  badges: {
    patrol: document.getElementById('st-patrol'),
    detect: document.getElementById('st-detect'),
    approach: document.getElementById('st-approach'),
    extinguish: document.getElementById('st-extinguish')
  }
};

/* ================= UTILS ================= */
function log(msg, type = '') {
  const p = document.createElement('p');
  p.textContent = `> ${msg}`;
  if(type) p.className = type;
  ui.console.prepend(p);
}

function updateState(newState) {
  sys.state = newState;
  Object.values(ui.badges).forEach(b => b.classList.remove('active'));
  
  if(newState === "PATROLLING") ui.badges.patrol.classList.add('active');
  if(newState === "DETECTED") ui.badges.detect.classList.add('active');
  if(newState === "APPROACHING") ui.badges.approach.classList.add('active');
  if(newState === "EXTINGUISHING") ui.badges.extinguish.classList.add('active');
}

/* ================= INIT & MAP LOADING ================= */
window.onload = () => {
  if (typeof MAP_DATA === 'undefined') return log("Error: map_data.js missing!", "err");
  
  document.getElementById('startBtn').onclick = startSim;
  document.getElementById('stopBtn').onclick = stopSim;
  ui.mapSelect.onchange = () => loadMap(ui.mapSelect.value);

  loadMap('kitchen');
};

function loadMap(mapName) {
  stopSim();
  
  // 1. Inject Map
  if (!MAP_DATA[mapName]) return log("Map not found", "err");
  ui.svg.innerHTML = MAP_DATA[mapName];

  // 2. Re-inject Entities (Robot, Fire, Beam)
  ui.svg.innerHTML += `
    <div id="robot" class="entity robot"><div class="sensor-ring"></div><span style="position:relative;z-index:2;font-size:24px;">🤖</span></div>
    <div id="fire" class="entity fire">🔥</div>
    <div id="beam" class="beam"></div>
  `;
  
  // 3. Re-bind Variables
  ui.robot = document.getElementById('robot');
  ui.fire = document.getElementById('fire');
  ui.beam = document.getElementById('beam');
  
  log(`Map Loaded: ${mapName.toUpperCase()}`, 'sys');

  // 4. CRITICAL FIX: Wait for DOM to render before measuring obstacles
  setTimeout(() => {
    parseObstacles();
    sys.robot = getFreePoint(); // Now it knows where obstacles are
    renderRobot();
  }, 100);
}

function parseObstacles() {
  sys.obstacles = [];
  const els = ui.svg.querySelectorAll('.obstacle');
  
  els.forEach(el => {
    const r = el.getBBox();
    // Save obstacle with padding
    sys.obstacles.push({
      x: r.x - CONFIG.obsPadding,
      y: r.y - CONFIG.obsPadding,
      w: r.width + (CONFIG.obsPadding * 2),
      h: r.height + (CONFIG.obsPadding * 2)
    });
  });
  
  // Debug Log
  console.log(`Parsed ${sys.obstacles.length} obstacles.`);
}

/* ================= MOVEMENT & PHYSICS ================= */
function getFreePoint() {
  let p = {x:0, y:0}, valid = false, tries = 0;
  
  // Try 500 times to find a safe spot
  while(!valid && tries < 500) {
    p.x = Math.random() * (800 - 60) + 30;
    p.y = Math.random() * (600 - 60) + 30;
    
    if (!checkCollision(p.x, p.y)) valid = true;
    tries++;
  }
  
  if (!valid) return {x: 50, y: 50}; // Safe fallback
  return p;
}

function checkCollision(x, y) {
  // 1. Map Boundaries
  if (x < 30 || x > 770 || y < 30 || y > 570) return true;
  
  // 2. Obstacles
  return sys.obstacles.some(o => 
    x > o.x && x < o.x + o.w &&
    y > o.y && y < o.y + o.h
  );
}

function moveRobot() {
  if (!sys.target) return;

  const dx = sys.target.x - sys.robot.x;
  const dy = sys.target.y - sys.robot.y;
  const dist = Math.hypot(dx, dy);

  // Check arrival
  let threshold = (sys.state === "APPROACHING") ? CONFIG.stopDistance : 5;
  
  if (dist <= threshold) {
    // Arrived
    if (sys.state === "APPROACHING") {
      extinguish();
    } else {
      sys.target = null; // Pick new patrol point next frame
    }
    return;
  }

  // Calculate Movement
  const moveX = (dx / dist) * CONFIG.robotSpeed;
  const moveY = (dy / dist) * CONFIG.robotSpeed;
  
  const nextX = sys.robot.x + moveX;
  const nextY = sys.robot.y + moveY;

  // Collision Check (Slide Logic)
  // 1. Try moving full step
  if (!checkCollision(nextX, nextY)) {
    sys.robot.x = nextX;
    sys.robot.y = nextY;
  } 
  // 2. Try sliding X
  else if (!checkCollision(nextX, sys.robot.y)) {
    sys.robot.x = nextX;
  }
  // 3. Try sliding Y
  else if (!checkCollision(sys.robot.x, nextY)) {
    sys.robot.y = nextY;
  }
  else {
    // Stuck? Pick new target if patrolling
    if (sys.state === "PATROLLING") sys.target = null;
  }

  renderRobot();
}

function renderRobot() {
  ui.robot.style.transform = `translate(${sys.robot.x}px, ${sys.robot.y}px)`;
}

/* ================= GAME LOOP ================= */
function startSim() {
  if(sys.running) return;
  sys.running = true;
  updateState("PATROLLING");
  log("Simulation Started.", "sys");
  loop();
}

function stopSim() {
  sys.running = false;
  cancelAnimationFrame(sys.animID);
  sys.target = null;
  sys.fire = null;
  
  ui.fire.style.opacity = 0;
  ui.beam.style.opacity = 0;
  
  updateState("IDLE");
  log("Simulation Stopped.", "err");
  
  // Reset Robot Position safely
  setTimeout(() => {
    sys.robot = getFreePoint();
    renderRobot();
  }, 50);
}

function loop() {
  if(!sys.running) return;

  // 1. Patrol Logic
  if (sys.state === "PATROLLING") {
    if (!sys.target) {
      sys.target = getFreePoint();
    }
    
    // Spawn Fire?
    if (!sys.fire && Math.random() < CONFIG.fireChance) {
      spawnFire();
    }
  }

  // 2. Approach Logic
  if (sys.state === "APPROACHING") {
     if (!sys.fire) sys.state = "PATROLLING";
  }

  // 3. Move
  moveRobot();

  sys.animID = requestAnimationFrame(loop);
}

/* ================= FIRE LOGIC ================= */
/* ================= FIRE LOGIC ================= */
function spawnFire() {
  const p = getFreePoint();
  // Ensure fire isn't on top of robot
  if (Math.hypot(p.x - sys.robot.x, p.y - sys.robot.y) < 150) return;

  sys.fire = p;
  
  ui.fire.style.transform = `translate(${p.x}px, ${p.y}px)`;
  ui.fire.style.opacity = 1;
  
  log(`Fire detected at [${Math.floor(p.x)}, ${Math.floor(p.y)}]`, "err");
  updateState("DETECTED");

  // --- NEW: 5-Second Timeout Logic ---
  // Store a reference to the current fire position to check against later
  const currentFireRef = p; 

  setTimeout(() => {
    // If the simulation is still running and the fire at this location hasn't been put out
    if (sys.running && sys.fire === currentFireRef) {
      log("Fire timed out! Relocating...", "err");
      clearFireEffects();
      updateState("PATROLLING");
    }
  }, 5000); 

  // Robot starts approaching after 1 second
  setTimeout(() => {
    if(sys.running && sys.fire === currentFireRef) {
      sys.target = sys.fire;
      updateState("APPROACHING");
    }
  }, 1000);
}

// Helper to clean up visuals and reset fire state
function clearFireEffects() {
  ui.fire.style.opacity = 0;
  ui.beam.style.opacity = 0;
  sys.fire = null;
  sys.target = null;
}

function extinguish() {
  sys.target = null; // Stop moving
  updateState("EXTINGUISHING");
  log("Extinguishing...", "sys");

  // Visual Beam
  const dx = sys.fire.x - sys.robot.x;
  const dy = sys.fire.y - sys.robot.y;
  const dist = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx) * (180/Math.PI);

  ui.beam.style.width = `${dist}px`;
  ui.beam.style.top = `${sys.robot.y}px`; 
  ui.beam.style.left = `${sys.robot.x}px`;
  ui.beam.style.transform = `rotate(${angle}deg)`;
  ui.beam.style.opacity = 1;

  setTimeout(() => {
    // Safety check: ensure fire wasn't cleared by timeout just as we finished
    if(!sys.running || !sys.fire) return; 

    log("Fire out. Resuming Patrol.", "path");
    clearFireEffects();
    updateState("PATROLLING");
  }, 2000);
}
/* ================= CONFIGURATION ================= */
const CONFIG = {
  robotSpeed: 4,         // Speed of the robot
  stopDistance: 60,      // Distance to stop from fire
  obsPadding: 15,        // Buffer around obstacles
  patrolInterval: 5000,  // Time to patrol before NEXT fire (5 seconds)
  gridSize: 20           // A* Grid Resolution
};

/* ================= STATE ================= */
const sys = {
  running: false,
  state: "IDLE", 
  robot: { x: 50, y: 50 },
  target: null,          
  path: [],              
  fire: null,   
  obstacles: [], 
  animID: null,
  nextFireTime: 0        // Timestamp for next fire
};

/* ================= UI ELEMENTS ================= */
const ui = {
  svg: document.getElementById('svgContainer'),
  robot: document.getElementById('robot'),
  fire: document.getElementById('fire'),
  beam: document.getElementById('beam'),
  mapSelect: document.getElementById('mapSelect'),
  badges: {
    patrol: document.getElementById('st-patrol'),
    detect: document.getElementById('st-detect'),
    approach: document.getElementById('st-approach'),
    extinguish: document.getElementById('st-extinguish')
  }
};

/* ================= UTILS & STATE UI ================= */
function log(msg) {
  console.log(`[Sim] ${msg}`);
  const consoleEl = document.getElementById('console');
  if(consoleEl) {
    const p = document.createElement('p');
    p.textContent = `> ${msg}`;
    consoleEl.prepend(p);
  }
}

function updateState(newState) {
  sys.state = newState;
  Object.values(ui.badges).forEach(b => b && b.classList.remove('active'));
  
  if(newState === "PATROLLING" && ui.badges.patrol) ui.badges.patrol.classList.add('active');
  if(newState === "DETECTED" && ui.badges.detect) ui.badges.detect.classList.add('active');
  if(newState === "APPROACHING" && ui.badges.approach) ui.badges.approach.classList.add('active');
  if(newState === "EXTINGUISHING" && ui.badges.extinguish) ui.badges.extinguish.classList.add('active');
}

/* ================= INITIALIZATION ================= */
window.onload = () => {
  if (typeof MAP_DATA === 'undefined') return log("Error: map_data.js missing!");
  
  document.getElementById('startBtn').onclick = startSim;
  document.getElementById('stopBtn').onclick = stopSim;
  
  if(ui.mapSelect) ui.mapSelect.onchange = () => loadMap(ui.mapSelect.value);

  loadMap('kitchen');
};

function loadMap(mapName) {
  stopSim();
  if (!MAP_DATA[mapName]) return log("Map not found");
  ui.svg.innerHTML = MAP_DATA[mapName];

  // Re-inject Entities
  ui.svg.innerHTML += `
    <div id="robot" class="entity robot"><div class="sensor-ring"></div><span style="position:relative;z-index:2;font-size:24px;">🤖</span></div>
    <div id="fire" class="entity fire">🔥</div>
    <div id="beam" class="beam"></div>
  `;
  
  ui.robot = document.getElementById('robot');
  ui.fire = document.getElementById('fire');
  ui.beam = document.getElementById('beam');
  
  log(`Map Loaded: ${mapName.toUpperCase()}`);

  setTimeout(() => {
    parseObstacles();
    sys.robot = getFreePoint(); 
    renderRobot();
  }, 100);
}

function parseObstacles() {
  sys.obstacles = [];
  const els = ui.svg.querySelectorAll('.obstacle');
  els.forEach(el => {
    const r = el.getBBox();
    sys.obstacles.push({
      x: r.x - CONFIG.obsPadding,
      y: r.y - CONFIG.obsPadding,
      w: r.width + (CONFIG.obsPadding * 2),
      h: r.height + (CONFIG.obsPadding * 2)
    });
  });
}

/* ================= A* PATHFINDING ================= */
function isBlocked(x, y) {
  if (x < 20 || x > 780 || y < 20 || y > 580) return true;
  return sys.obstacles.some(o => x > o.x && x < o.x + o.w && y > o.y && y < o.y + o.h);
}

function calculatePath(start, end) {
  // Simple A* on a grid
  const gridW = Math.floor(800 / CONFIG.gridSize);
  const gridH = Math.floor(600 / CONFIG.gridSize);
  
  const startNode = { c: Math.floor(start.x / CONFIG.gridSize), r: Math.floor(start.y / CONFIG.gridSize) };
  const endNode = { c: Math.floor(end.x / CONFIG.gridSize), r: Math.floor(end.y / CONFIG.gridSize) };
  
  let openSet = [startNode];
  let cameFrom = {};
  let gScore = {};
  let fScore = {};
  
  const id = n => `${n.c},${n.r}`;
  gScore[id(startNode)] = 0;
  fScore[id(startNode)] = Math.abs(startNode.c - endNode.c) + Math.abs(startNode.r - endNode.r);

  let loops = 0;
  while(openSet.length > 0 && loops < 2000) {
    loops++;
    openSet.sort((a,b) => (fScore[id(a)]||Infinity) - (fScore[id(b)]||Infinity));
    let current = openSet.shift();

    if (Math.abs(current.c - endNode.c) <= 1 && Math.abs(current.r - endNode.r) <= 1) {
      let path = [];
      let temp = current;
      while (cameFrom[id(temp)]) {
        path.unshift({ 
          x: temp.c * CONFIG.gridSize + CONFIG.gridSize/2, 
          y: temp.r * CONFIG.gridSize + CONFIG.gridSize/2 
        });
        temp = cameFrom[id(temp)];
      }
      return path;
    }

    const neighbors = [{c:0, r:-1}, {c:0, r:1}, {c:-1, r:0}, {c:1, r:0}];
    for(let n of neighbors) {
      let neighbor = { c: current.c + n.c, r: current.r + n.r };
      
      if (neighbor.c < 0 || neighbor.c >= gridW || neighbor.r < 0 || neighbor.r >= gridH) continue;
      
      let px = neighbor.c * CONFIG.gridSize + CONFIG.gridSize/2;
      let py = neighbor.r * CONFIG.gridSize + CONFIG.gridSize/2;
      if (isBlocked(px, py)) continue;

      let tentativeG = (gScore[id(current)]||Infinity) + 1;
      if (tentativeG < (gScore[id(neighbor)]||Infinity)) {
        cameFrom[id(neighbor)] = current;
        gScore[id(neighbor)] = tentativeG;
        fScore[id(neighbor)] = tentativeG + (Math.abs(neighbor.c - endNode.c) + Math.abs(neighbor.r - endNode.r));
        if (!openSet.some(x => x.c === neighbor.c && x.r === neighbor.r)) openSet.push(neighbor);
      }
    }
  }
  return []; 
}

/* ================= LOGIC & MOVEMENT ================= */
function getFreePoint() {
  let p = {x:0, y:0}, valid = false, tries = 0;
  while(!valid && tries < 200) {
    p.x = Math.random() * (750 - 50) + 50;
    p.y = Math.random() * (550 - 50) + 50;
    if (!isBlocked(p.x, p.y)) valid = true;
    tries++;
  }
  return valid ? p : {x:50, y:50};
}

function moveRobot() {
  // --- A* Path Following ---
  if (sys.state === "APPROACHING" && sys.path.length > 0) {
    sys.target = sys.path[0]; // Target is the next waypoint
    // If reached waypoint, remove it
    if (Math.hypot(sys.target.x - sys.robot.x, sys.target.y - sys.robot.y) < 10) {
      sys.path.shift(); 
    }
  }

  if (!sys.target) return;

  const dx = sys.target.x - sys.robot.x;
  const dy = sys.target.y - sys.robot.y;
  const dist = Math.hypot(dx, dy);

  // --- ARRIVAL CHECKS ---
  if (sys.state === "APPROACHING") {
    // Calculate distance to ACTUAL FIRE (not intermediate waypoint)
    const distToFire = Math.hypot(sys.fire.x - sys.robot.x, sys.fire.y - sys.robot.y);
    
    // STRICT CHECK: Only extinguish if actually close
    if (distToFire <= CONFIG.stopDistance) {
      extinguish();
      return;
    }
    
    // If path ran out but we are still far away, abort (don't extinguish from distance)
    if (sys.path.length === 0) {
       log("Path ended but fire is far. Aborting.");
       sys.fire = null;
       ui.fire.style.opacity = 0;
       updateState("PATROLLING");
       return;
    }
  } 
  else if (sys.state === "PATROLLING" && dist <= 5) {
    sys.target = null; // Reached patrol point, wait for next decision
    return;
  }

  // --- PHYSICS & MOVEMENT ---
  const moveX = (dx / dist) * CONFIG.robotSpeed;
  const moveY = (dy / dist) * CONFIG.robotSpeed;
  
  let nextX = sys.robot.x + moveX;
  let nextY = sys.robot.y + moveY;

  // Collision Slide (prevents getting stuck on corners)
  if (!isBlocked(nextX, nextY)) {
    sys.robot.x = nextX;
    sys.robot.y = nextY;
  } else if (!isBlocked(nextX, sys.robot.y)) {
    sys.robot.x = nextX;
  } else if (!isBlocked(sys.robot.x, nextY)) {
    sys.robot.y = nextY;
  } else {
    // If stuck while patrolling, pick new point
    if (sys.state === "PATROLLING") sys.target = null;
  }

  renderRobot();
}

function renderRobot() {
  if(ui.robot) ui.robot.style.transform = `translate(${sys.robot.x}px, ${sys.robot.y}px)`;
}

/* ================= MAIN LOOP ================= */
function startSim() {
  if(sys.running) return;
  sys.running = true;
  sys.nextFireTime = Date.now() + CONFIG.patrolInterval;
  
  updateState("PATROLLING");
  log("System Started. Patrolling...");
  loop();
}

function stopSim() {
  sys.running = false;
  cancelAnimationFrame(sys.animID);
  sys.target = null;
  sys.fire = null;
  sys.path = [];
  
  if(ui.fire) ui.fire.style.opacity = 0;
  if(ui.beam) ui.beam.style.opacity = 0;
  
  updateState("IDLE");
  log("System Stopped.");
}

function loop() {
  if(!sys.running) return;

  // 1. TIMED EVENT LOGIC
  if (sys.state === "PATROLLING") {
    // Pick patrol point if idle
    if (!sys.target) sys.target = getFreePoint();
    
    // Check Timer for Fire Spawn
    if (!sys.fire && Date.now() > sys.nextFireTime) {
      spawnFire();
    }
  }

  // 2. MOVEMENT
  moveRobot();

  sys.animID = requestAnimationFrame(loop);
}

/* ================= ACTIONS ================= */
function spawnFire() {
  const p = getFreePoint();
  // Ensure fire isn't on top of robot
  if (Math.hypot(p.x - sys.robot.x, p.y - sys.robot.y) < 150) return;

  sys.fire = p;
  
  if(ui.fire) {
    ui.fire.style.transform = `translate(${p.x}px, ${p.y}px)`;
    ui.fire.style.opacity = 1;
  }
  
  log("Fire Detected!");
  updateState("DETECTED");

  // Plan path after delay
  setTimeout(() => {
    if(sys.running && sys.fire) {
      log("Calculating route...");
      sys.path = calculatePath(sys.robot, sys.fire);
      
      // FIX: Even if pathfinding returns empty (complex obstacle), 
      // we set the state to APPROACHING so the robot tries to move directly.
      if(sys.path.length === 0) {
         log("Direct path fallback.");
         sys.target = sys.fire; // Force direct movement
      }
      
      updateState("APPROACHING");
    }
  }, 500);
}

function extinguish() {
  sys.target = null; 
  sys.path = [];
  updateState("EXTINGUISHING");
  log("Extinguishing...");

  // Visual Beam
  const dx = sys.fire.x - sys.robot.x;
  const dy = sys.fire.y - sys.robot.y;
  const dist = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx) * (180/Math.PI);

  if(ui.beam) {
    ui.beam.style.width = `${dist}px`;
    ui.beam.style.top = `${sys.robot.y}px`; 
    ui.beam.style.left = `${sys.robot.x}px`;
    ui.beam.style.transform = `rotate(${angle}deg)`;
    ui.beam.style.opacity = 1;
  }

  // Done after 2 seconds
  setTimeout(() => {
    if(!sys.running) return;
    if(ui.fire) ui.fire.style.opacity = 0;
    if(ui.beam) ui.beam.style.opacity = 0;
    
    sys.fire = null;
    sys.nextFireTime = Date.now() + CONFIG.patrolInterval; // Set timer for NEXT fire
    
    log("Fire Out. Resuming Patrol.");
    updateState("PATROLLING");
  }, 2000);
}
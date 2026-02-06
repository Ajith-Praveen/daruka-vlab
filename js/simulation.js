/* ===============================================================
   simulation.js — DARUKA VLab Simulation Engine
   Supports three modes via URL query param:
     ?mode=fire        → Experiment 1: Fire Detection (YOLOv8)
     ?mode=navigation  → Experiment 2: Autonomous Navigation
     ?mode=full        → Experiment 3: Full FSM Simulation
   =============================================================== */

/* ===== READ MODE FROM URL ===== */
const PARAMS = new URLSearchParams(window.location.search);
const MODE = PARAMS.get('mode') || 'full';  // default to full

/* ===== CONFIG ===== */
const CONFIG = {
  robotSpeed: 3,
  turnSpeed: 0.1,
  stopDistance: 60,
  obsPadding: 20,
  fireChance: 0.005,
  /* Navigation mode parameters (can be overridden by sliders) */
  obstacleDensity: 3,   // 1-5 (light → heavy)
  terrainDifficulty: 2, // 1-3
  navRobotSpeed: 3
};

/* ===== STATE ===== */
const sys = {
  running: false,
  state: 'IDLE',
  robot: { x: 50, y: 50 },
  target: null,
  fire: null,
  obstacles: [],
  animID: null,
  mode: MODE,
  /* Fire detection specific */
  yoloInterval: null,
  cameraStream: null,
  confidenceThreshold: 0.5,
  /* Navigation specific */
  navStartTime: 0,
  /* FSM specific */
  fsmPhase: null
};

/* ===== UI REFS ===== */
const ui = {
  svg: document.getElementById('svgContainer'),
  robot: document.getElementById('robot'),
  fire: document.getElementById('fire'),
  beam: document.getElementById('beam'),
  console: document.getElementById('console'),
  mapSelect: document.getElementById('mapSelect'),
  stateGrid: document.getElementById('stateGrid'),
  modeControls: document.getElementById('modeControls'),
  modeBadge: document.getElementById('modeBadgeWrap'),
  simTitle: document.getElementById('simTitle'),
  crosshair: document.getElementById('aimCrosshair')
};

/* ===============================================================
   INITIALIZATION
   =============================================================== */
window.onload = function() {
  LogPanel.init();

  if (typeof MAP_DATA === 'undefined') {
    log('Error: map_data.js missing!', 'err');
    return;
  }

  /* Set page title */
  const titles = {
    fire: 'Experiment 1: Fire Detection',
    navigation: 'Experiment 2: Autonomous Navigation',
    full: 'Experiment 3: Full Simulation (FSM)'
  };
  ui.simTitle.textContent = titles[MODE] || 'Robot Simulation';

  /* Render mode badge */
  renderModeBadge();

  /* Render state badges based on mode */
  renderStateBadges();

  /* Render mode-specific controls */
  renderModeControls();

  /* Button bindings */
  document.getElementById('startBtn').onclick = startSim;
  document.getElementById('stopBtn').onclick = stopSim;
  ui.mapSelect.onchange = function() { loadMap(ui.mapSelect.value); };

  /* Log mode selection */
  log('[MODE] ' + (titles[MODE] || MODE).toUpperCase() + ' selected', 'sys');

  /* Load default map */
  loadMap('kitchen');
};

/* ===============================================================
   MODE-SPECIFIC UI RENDERING
   =============================================================== */

function renderModeBadge() {
  var cls = { fire: 'mode-badge--fire', navigation: 'mode-badge--nav', full: 'mode-badge--full' };
  var label = { fire: 'Fire Detection', navigation: 'Navigation', full: 'Full FSM' };
  ui.modeBadge.innerHTML = '<span class="mode-badge ' + (cls[MODE] || '') + '">' + (label[MODE] || MODE) + '</span>';
}

function renderStateBadges() {
  var states = [];

  if (MODE === 'fire') {
    states = [
      { id: 'st-idle',    label: 'IDLE',        cls: 'st-idle' },
      { id: 'st-scan',    label: 'SCANNING',    cls: 'st-detect' },
      { id: 'st-detect',  label: 'DETECTED',    cls: 'st-detect' },
      { id: 'st-log',     label: 'LOGGING',     cls: 'st-navigate' }
    ];
  } else if (MODE === 'navigation') {
    states = [
      { id: 'st-patrol',  label: 'PATROLLING',   cls: 'st-idle' },
      { id: 'st-detect',  label: 'DETECTED',     cls: 'st-detect' },
      { id: 'st-approach',label: 'NAVIGATING',    cls: 'st-navigate' },
      { id: 'st-arrive',  label: 'ARRIVED',       cls: 'st-done' }
    ];
  } else {
    /* Full FSM */
    states = [
      { id: 'st-idle',    label: 'IDLE',        cls: 'st-idle' },
      { id: 'st-detect',  label: 'DETECT',      cls: 'st-detect' },
      { id: 'st-nav',     label: 'NAVIGATE',    cls: 'st-navigate' },
      { id: 'st-aim',     label: 'AIM',         cls: 'st-aim' },
      { id: 'st-ext',     label: 'EXTINGUISH',  cls: 'st-ext' },
      { id: 'st-verify',  label: 'VERIFY',      cls: 'st-verify' },
      { id: 'st-done',    label: 'COMPLETE',    cls: 'st-done' }
    ];
  }

  var html = '';
  states.forEach(function(s) {
    html += '<div id="' + s.id + '" class="state-badge ' + s.cls + '">' + s.label + '</div>';
  });
  ui.stateGrid.innerHTML = html;

  /* Adjust grid for FSM 7-state layout */
  if (MODE === 'full') {
    ui.stateGrid.style.gridTemplateColumns = '1fr 1fr 1fr';
  }
}

function renderModeControls() {
  var html = '';

  if (MODE === 'fire') {
    html = '<div class="control-group">' +
      '<h3>YOLOv8 Fire Detection</h3>' +
      '<div class="camera-preview" id="cameraPreview">' +
        '<div class="camera-placeholder" id="cameraPlaceholder">' +
          '<span>📷</span>' +
          '<div>Camera feed will appear here</div>' +
          '<div style="font-size:0.7rem;color:#666;">Requires local Flask backend on :5000</div>' +
        '</div>' +
        '<canvas id="detectionCanvas" style="display:none;"></canvas>' +
        '<div class="yolo-overlay" id="yoloOverlay" style="display:none;">YOLO: --</div>' +
      '</div>' +
      '<div class="param-row" style="margin-top:10px;">' +
        '<label>Confidence Threshold</label>' +
        '<input type="range" id="confSlider" min="0.1" max="0.95" step="0.05" value="0.5">' +
        '<span class="param-val" id="confVal">0.50</span>' +
      '</div>' +
      '<div class="detection-info" id="detectionInfo">' +
        '<div class="det-row"><span class="det-label">Status</span><span class="det-value" id="detStatus">Idle</span></div>' +
        '<div class="det-row"><span class="det-label">Label</span><span class="det-value" id="detLabel">—</span></div>' +
        '<div class="det-row"><span class="det-label">Confidence</span><span class="det-value" id="detConf">—</span></div>' +
        '<div class="det-row"><span class="det-label">Detections</span><span class="det-value" id="detCount">0</span></div>' +
      '</div>' +
    '</div>';

  } else if (MODE === 'navigation') {
    html = '<div class="control-group">' +
      '<h3>Navigation Parameters</h3>' +
      '<div class="param-row">' +
        '<label>Obstacle Density</label>' +
        '<input type="range" id="obsDensity" min="1" max="5" step="1" value="3">' +
        '<span class="param-val" id="obsDensityVal">3</span>' +
      '</div>' +
      '<div class="param-row">' +
        '<label>Terrain Difficulty</label>' +
        '<input type="range" id="terrDiff" min="1" max="3" step="1" value="2">' +
        '<span class="param-val" id="terrDiffVal">2</span>' +
      '</div>' +
      '<div class="param-row">' +
        '<label>Robot Speed</label>' +
        '<input type="range" id="robotSpeedSlider" min="1" max="6" step="0.5" value="3">' +
        '<span class="param-val" id="robotSpeedVal">3.0</span>' +
      '</div>' +
      '<div class="detection-info" id="navInfo">' +
        '<div class="det-row"><span class="det-label">Distance</span><span class="det-value" id="navDist">—</span></div>' +
        '<div class="det-row"><span class="det-label">Elapsed</span><span class="det-value" id="navTime">0.0 s</span></div>' +
        '<div class="det-row"><span class="det-label">State</span><span class="det-value" id="navState">Idle</span></div>' +
      '</div>' +
    '</div>';
  }
  /* Full mode uses FSM states — no extra controls needed */

  ui.modeControls.innerHTML = html;

  /* Bind sliders */
  if (MODE === 'fire') {
    var cs = document.getElementById('confSlider');
    if (cs) {
      cs.oninput = function() {
        sys.confidenceThreshold = parseFloat(cs.value);
        document.getElementById('confVal').textContent = parseFloat(cs.value).toFixed(2);
      };
    }
  }
  if (MODE === 'navigation') {
    bindSlider('obsDensity', 'obsDensityVal', function(v) { CONFIG.obstacleDensity = parseInt(v); });
    bindSlider('terrDiff', 'terrDiffVal', function(v) { CONFIG.terrainDifficulty = parseInt(v); });
    bindSlider('robotSpeedSlider', 'robotSpeedVal', function(v) { CONFIG.robotSpeed = parseFloat(v); CONFIG.navRobotSpeed = parseFloat(v); }, true);
  }
}

function bindSlider(id, valId, cb, isFloat) {
  var el = document.getElementById(id);
  if (!el) return;
  el.oninput = function() {
    var v = el.value;
    document.getElementById(valId).textContent = isFloat ? parseFloat(v).toFixed(1) : v;
    cb(v);
  };
}

/* ===============================================================
   STATE BADGE UPDATE
   =============================================================== */
function setActiveState(badgeId) {
  var badges = ui.stateGrid.querySelectorAll('.state-badge');
  badges.forEach(function(b) { b.classList.remove('active'); });
  var el = document.getElementById(badgeId);
  if (el) el.classList.add('active');
}

/* ===============================================================
   MAP LOADING
   =============================================================== */
function loadMap(mapName) {
  stopSim();
  if (!MAP_DATA[mapName]) { log('Map not found', 'err'); return; }

  ui.svg.innerHTML = MAP_DATA[mapName];
  ui.svg.innerHTML += '<div id="robot" class="entity robot"><div class="sensor-ring"></div><span style="position:relative;z-index:2;font-size:24px;">🤖</span></div>' +
    '<div id="fire" class="entity fire">🔥</div>' +
    '<div id="beam" class="beam"></div>' +
    '<div id="aimCrosshair" class="aim-crosshair"></div>';

  ui.robot = document.getElementById('robot');
  ui.fire = document.getElementById('fire');
  ui.beam = document.getElementById('beam');
  ui.crosshair = document.getElementById('aimCrosshair');

  log('Map Loaded: ' + mapName.toUpperCase(), 'sys');

  setTimeout(function() {
    parseObstacles();
    sys.robot = getFreePoint();
    renderRobot();
  }, 100);
}

function parseObstacles() {
  sys.obstacles = [];
  var els = ui.svg.querySelectorAll('.obstacle');
  els.forEach(function(el) {
    var r = el.getBBox();
    sys.obstacles.push({
      x: r.x - CONFIG.obsPadding,
      y: r.y - CONFIG.obsPadding,
      w: r.width + CONFIG.obsPadding * 2,
      h: r.height + CONFIG.obsPadding * 2
    });
  });
}

function getBounds() { return { w: ui.svg.clientWidth, h: ui.svg.clientHeight }; }

/* ===============================================================
   MOVEMENT & PHYSICS
   =============================================================== */
function getFreePoint() {
  var b = getBounds();
  for (var i = 0; i < 500; i++) {
    var p = { x: Math.random() * (b.w - 60) + 30, y: Math.random() * (b.h - 60) + 30 };
    if (!checkCollision(p.x, p.y)) return p;
  }
  return { x: b.w / 2, y: b.h / 2 };
}

function checkCollision(x, y) {
  var b = getBounds();
  if (x < 30 || y < 30 || x > b.w - 30 || y > b.h - 30) return true;
  return sys.obstacles.some(function(o) {
    return x > o.x && x < o.x + o.w && y > o.y && y < o.y + o.h;
  });
}

function moveRobot() {
  if (!sys.target) return;

  var dx = sys.target.x - sys.robot.x;
  var dy = sys.target.y - sys.robot.y;
  var dist = Math.hypot(dx, dy);

  var threshold = (sys.state === 'APPROACHING' || sys.state === 'NAVIGATE') ? CONFIG.stopDistance : 5;

  if (dist <= threshold) {
    if (sys.state === 'APPROACHING') {
      onRobotArrived();
    } else if (sys.state === 'NAVIGATE') {
      onRobotArrived();
    } else {
      sys.target = null;
    }
    return;
  }

  var speed = CONFIG.robotSpeed;
  /* Terrain difficulty slows robot in nav mode */
  if (MODE === 'navigation') {
    speed = CONFIG.navRobotSpeed / CONFIG.terrainDifficulty;
  }

  var mx = (dx / dist) * speed;
  var my = (dy / dist) * speed;
  var nx = sys.robot.x + mx;
  var ny = sys.robot.y + my;

  if (!checkCollision(nx, ny)) { sys.robot.x = nx; sys.robot.y = ny; }
  else if (!checkCollision(nx, sys.robot.y)) { sys.robot.x = nx; }
  else if (!checkCollision(sys.robot.x, ny)) { sys.robot.y = ny; }
  else { if (sys.state === 'PATROLLING') sys.target = null; }

  renderRobot();
}

function renderRobot() {
  ui.robot.style.transform = 'translate(' + sys.robot.x + 'px, ' + sys.robot.y + 'px)';
}

/* ===============================================================
   ARRIVAL HANDLER (called when robot reaches fire)
   =============================================================== */
function onRobotArrived() {
  sys.target = null;

  if (MODE === 'navigation') {
    var elapsed = ((Date.now() - sys.navStartTime) / 1000).toFixed(1);
    log('[NAV] Target reached in ' + elapsed + ' s', 'path');
    setActiveState('st-arrive');
    sys.state = 'ARRIVED';
    var ns = document.getElementById('navState');
    if (ns) ns.textContent = 'Arrived';
    var nt = document.getElementById('navTime');
    if (nt) nt.textContent = elapsed + ' s';

    /* Auto restart after brief pause */
    setTimeout(function() {
      if (sys.running) {
        clearFireEffects();
        sys.state = 'PATROLLING';
        setActiveState('st-patrol');
        log('[NAV] Resuming patrol...', 'sys');
        var ns2 = document.getElementById('navState');
        if (ns2) ns2.textContent = 'Patrolling';
      }
    }, 3000);

  } else if (MODE === 'full') {
    /* Notify FSM that navigation is done */
    FSM.notifyNavigationComplete();

  } else {
    /* fire mode or fallback: extinguish directly */
    extinguish();
  }
}

/* ===============================================================
   SIMULATION START / STOP
   =============================================================== */
function startSim() {
  if (sys.running) return;
  sys.running = true;
  log('Simulation Started.', 'sys');

  if (MODE === 'fire') {
    startFireDetectionMode();
  } else if (MODE === 'navigation') {
    startNavigationMode();
  } else {
    startFullMode();
  }

  loop();
}

function stopSim() {
  sys.running = false;
  cancelAnimationFrame(sys.animID);
  sys.target = null;
  sys.fire = null;
  sys.state = 'IDLE';

  clearFireEffects();
  FSM.reset();

  /* Reset badges */
  var badges = ui.stateGrid.querySelectorAll('.state-badge');
  badges.forEach(function(b) { b.classList.remove('active'); });

  /* Stop YOLO polling */
  if (sys.yoloInterval) { clearInterval(sys.yoloInterval); sys.yoloInterval = null; }

  log('Simulation Stopped.', 'err');

  setTimeout(function() {
    sys.robot = getFreePoint();
    renderRobot();
  }, 50);
}

/* ===============================================================
   MAIN LOOP
   =============================================================== */
function loop() {
  if (!sys.running) return;

  if (MODE === 'fire') {
    fireModeTick();
  } else if (MODE === 'navigation') {
    navigationModeTick();
  } else {
    fullModeTick();
  }

  moveRobot();
  sys.animID = requestAnimationFrame(loop);
}

/* ===============================================================
   MODE: FIRE DETECTION
   =============================================================== */
var fireDetectionCount = 0;

function startFireDetectionMode() {
  sys.state = 'SCANNING';
  setActiveState('st-scan');
  fireDetectionCount = 0;

  log('[DETECT] Starting YOLOv8 fire detection...', 'sys');
  log('[DETECT] Backend: http://localhost:5000/detect', 'sys');
  log('[DETECT] Confidence threshold: ' + sys.confidenceThreshold.toFixed(2), 'sys');

  /* Show placeholder info */
  var ds = document.getElementById('detStatus');
  if (ds) ds.textContent = 'Scanning';

  /* Start polling YOLO backend */
  pollYOLO();
  sys.yoloInterval = setInterval(pollYOLO, 1500);

  /* Also run the normal patrol + fire spawn for the viewport */
  sys.state = 'PATROLLING';
  setActiveState('st-scan');
}

function pollYOLO() {
  /* Try to fetch from local Flask backend */
  fetch('http://localhost:5000/detect', { method: 'GET' })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      handleYOLOResponse(data);
    })
    .catch(function() {
      /* Backend not running — simulate detection */
      simulateYOLODetection();
    });
}

function simulateYOLODetection() {
  /* Generate simulated YOLO results */
  var detected = Math.random() < 0.35;
  if (!detected) {
    var ds = document.getElementById('detStatus');
    if (ds) ds.textContent = 'Scanning...';
    return;
  }

  var conf = (0.4 + Math.random() * 0.55).toFixed(2);
  var result = [{
    label: 'fire',
    confidence: parseFloat(conf),
    bbox: [
      Math.floor(Math.random() * 400 + 50),
      Math.floor(Math.random() * 300 + 50),
      Math.floor(Math.random() * 200 + 150),
      Math.floor(Math.random() * 200 + 150)
    ]
  }];

  handleYOLOResponse(result);
}

function handleYOLOResponse(data) {
  if (!Array.isArray(data) || data.length === 0) {
    var ds = document.getElementById('detStatus');
    if (ds) ds.textContent = 'No detection';
    return;
  }

  var det = data[0];
  var aboveThreshold = det.confidence >= sys.confidenceThreshold;

  var ds = document.getElementById('detStatus');
  var dl = document.getElementById('detLabel');
  var dc = document.getElementById('detConf');
  var dn = document.getElementById('detCount');

  if (dl) dl.textContent = det.label;
  if (dc) dc.textContent = det.confidence.toFixed(2);

  if (aboveThreshold) {
    fireDetectionCount++;
    if (dn) dn.textContent = fireDetectionCount;
    if (ds) ds.textContent = '🔥 FIRE DETECTED';
    if (ds) ds.style.color = '#ff4444';

    setActiveState('st-detect');
    log('[DETECT] Fire detected — confidence: ' + det.confidence.toFixed(2) + ' (above threshold ' + sys.confidenceThreshold.toFixed(2) + ')', 'err');
    log('[DETECT] Bbox: [' + det.bbox.join(', ') + ']', 'warn');

    /* Spawn fire in viewport if none */
    if (!sys.fire && sys.running) {
      spawnFire();
    }

    setTimeout(function() {
      setActiveState('st-log');
      log('[DETECT] Event logged to system', 'path');
      setTimeout(function() {
        if (sys.running) setActiveState('st-scan');
      }, 1000);
    }, 1500);

  } else {
    if (ds) ds.textContent = 'Below threshold';
    if (ds) ds.style.color = '';
    log('[DETECT] Detection below threshold: ' + det.confidence.toFixed(2) + ' < ' + sys.confidenceThreshold.toFixed(2), 'warn');
  }

  /* Draw on overlay canvas */
  drawDetectionOverlay(det, aboveThreshold);
}

function drawDetectionOverlay(det, isAbove) {
  var canvas = document.getElementById('detectionCanvas');
  var overlay = document.getElementById('yoloOverlay');
  if (!canvas || !overlay) return;

  canvas.style.display = 'block';
  overlay.style.display = 'block';
  overlay.textContent = 'YOLO: ' + det.confidence.toFixed(2);
  overlay.style.color = isAbove ? '#ff4444' : '#00e676';

  var ctx = canvas.getContext('2d');
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = canvas.parentElement.clientHeight;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (isAbove) {
    /* Scale bbox to canvas size */
    var sx = canvas.width / 640;
    var sy = canvas.height / 480;
    var bx = det.bbox[0] * sx;
    var by = det.bbox[1] * sy;
    var bw = (det.bbox[2] - det.bbox[0]) * sx;
    var bh = (det.bbox[3] - det.bbox[1]) * sy;

    ctx.strokeStyle = '#ff4444';
    ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, bw, bh);

    ctx.fillStyle = '#ff4444';
    ctx.font = '12px JetBrains Mono, monospace';
    ctx.fillText(det.label + ' ' + det.confidence.toFixed(2), bx, by - 4);
  }
}

function fireModeTick() {
  /* Standard patrol in viewport */
  if (!sys.target && sys.state !== 'EXTINGUISHING') {
    sys.target = getFreePoint();
  }

  if (!sys.fire && Math.random() < CONFIG.fireChance) {
    spawnFire();
  }
}

/* ===============================================================
   MODE: AUTONOMOUS NAVIGATION
   =============================================================== */
function startNavigationMode() {
  sys.state = 'PATROLLING';
  setActiveState('st-patrol');
  sys.navStartTime = Date.now();

  var ns = document.getElementById('navState');
  if (ns) ns.textContent = 'Patrolling';

  log('[NAV] Starting autonomous navigation mode', 'sys');
  log('[NAV] Obstacle density: ' + CONFIG.obstacleDensity + ' | Terrain: ' + CONFIG.terrainDifficulty + ' | Speed: ' + CONFIG.navRobotSpeed, 'sys');
}

function navigationModeTick() {
  /* Update elapsed time display */
  if (sys.state !== 'IDLE' && sys.state !== 'ARRIVED') {
    var elapsed = ((Date.now() - sys.navStartTime) / 1000).toFixed(1);
    var nt = document.getElementById('navTime');
    if (nt) nt.textContent = elapsed + ' s';
  }

  /* Update distance to fire */
  if (sys.fire) {
    var d = Math.hypot(sys.fire.x - sys.robot.x, sys.fire.y - sys.robot.y);
    var nd = document.getElementById('navDist');
    if (nd) nd.textContent = Math.floor(d) + ' px';
  }

  /* Patrol logic */
  if (sys.state === 'PATROLLING') {
    if (!sys.target) {
      sys.target = getFreePoint();
      log('[NAV] New patrol waypoint set', '');
    }

    if (!sys.fire && Math.random() < 0.008) {
      spawnFireNav();
    }
  }

  if (sys.state === 'APPROACHING' || sys.state === 'NAVIGATE') {
    /* Continue moving towards fire */
  }
}

function spawnFireNav() {
  var p = getFreePoint();
  if (Math.hypot(p.x - sys.robot.x, p.y - sys.robot.y) < 150) return;

  sys.fire = p;
  ui.fire.style.transform = 'translate(' + p.x + 'px, ' + p.y + 'px)';
  ui.fire.style.opacity = 1;

  log('[DETECT] Fire detected at [' + Math.floor(p.x) + ', ' + Math.floor(p.y) + ']', 'err');
  sys.state = 'DETECTED';
  setActiveState('st-detect');
  sys.navStartTime = Date.now();

  var ns = document.getElementById('navState');
  if (ns) ns.textContent = 'Detected';

  var currentFire = p;
  setTimeout(function() {
    if (sys.running && sys.fire === currentFire) {
      sys.target = sys.fire;
      sys.state = 'APPROACHING';
      setActiveState('st-approach');
      log('[NAV] Path planned — navigating to fire', 'info');
      var ns2 = document.getElementById('navState');
      if (ns2) ns2.textContent = 'Navigating';
    }
  }, 1000);

  /* Timeout for stuck detection */
  setTimeout(function() {
    if (sys.running && sys.fire === currentFire && sys.state !== 'ARRIVED') {
      log('[NAV] Navigation timeout — fire relocated', 'err');
      clearFireEffects();
      sys.state = 'PATROLLING';
      setActiveState('st-patrol');
    }
  }, 20000);
}

/* ===============================================================
   MODE: FULL FSM
   =============================================================== */
function startFullMode() {
  log('[MODE] FULL SIMULATION selected', 'sys');

  /* Wire FSM callbacks */
  FSM.onStateChange = function(newState) {
    /* Map FSM states to badge IDs */
    var map = {
      IDLE: 'st-idle', DETECT: 'st-detect', NAVIGATE: 'st-nav',
      AIM: 'st-aim', EXTINGUISH: 'st-ext', VERIFY: 'st-verify', COMPLETE: 'st-done'
    };
    setActiveState(map[newState] || '');
    sys.state = newState;

    /* Handle visual effects per state */
    if (newState === 'DETECT') {
      spawnFireFSM();
    }
    if (newState === 'NAVIGATE' && sys.fire) {
      sys.target = sys.fire;
    }
    if (newState === 'AIM' && sys.fire) {
      showAimCrosshair();
    }
    if (newState === 'EXTINGUISH') {
      extinguishFSM();
    }
    if (newState === 'VERIFY') {
      hideAimCrosshair();
      ui.beam.style.opacity = 0;
    }
    if (newState === 'COMPLETE') {
      clearFireEffects();
      hideAimCrosshair();
    }
  };

  FSM.onComplete = function() {
    /* Allow restart after completion */
    log('[FSM] Simulation cycle complete. Press Start for another run.', 'path');
    sys.running = false;
  };

  FSM.start();
}

function fullModeTick() {
  /* Movement only during NAVIGATE state */
  if (FSM.current !== 'NAVIGATE') {
    /* Don't move outside navigation */
  }
}

function spawnFireFSM() {
  var p = getFreePoint();
  if (Math.hypot(p.x - sys.robot.x, p.y - sys.robot.y) < 120) {
    p = getFreePoint(); /* retry once */
  }
  sys.fire = p;
  ui.fire.style.transform = 'translate(' + p.x + 'px, ' + p.y + 'px)';
  ui.fire.style.opacity = 1;
}

function showAimCrosshair() {
  if (!sys.fire || !ui.crosshair) return;
  ui.crosshair.style.transform = 'translate(' + sys.fire.x + 'px, ' + sys.fire.y + 'px)';
  ui.crosshair.style.opacity = 1;
}

function hideAimCrosshair() {
  if (ui.crosshair) ui.crosshair.style.opacity = 0;
}

function extinguishFSM() {
  if (!sys.fire) return;
  var dx = sys.fire.x - sys.robot.x;
  var dy = sys.fire.y - sys.robot.y;
  var dist = Math.hypot(dx, dy);
  var angle = Math.atan2(dy, dx) * (180 / Math.PI);

  ui.beam.style.width = dist + 'px';
  ui.beam.style.top = sys.robot.y + 'px';
  ui.beam.style.left = sys.robot.x + 'px';
  ui.beam.style.transform = 'rotate(' + angle + 'deg)';
  ui.beam.style.opacity = 1;
}

/* ===============================================================
   SHARED FIRE LOGIC
   =============================================================== */
function spawnFire() {
  var p = getFreePoint();
  if (Math.hypot(p.x - sys.robot.x, p.y - sys.robot.y) < 150) return;

  sys.fire = p;
  ui.fire.style.transform = 'translate(' + p.x + 'px, ' + p.y + 'px)';
  ui.fire.style.opacity = 1;

  log('Fire detected at [' + Math.floor(p.x) + ', ' + Math.floor(p.y) + ']', 'err');

  var currentFireRef = p;
  setTimeout(function() {
    if (sys.running && sys.fire === currentFireRef) {
      log('Fire timed out! Relocating...', 'err');
      clearFireEffects();
    }
  }, 8000);

  if (MODE !== 'full') {
    setTimeout(function() {
      if (sys.running && sys.fire === currentFireRef) {
        sys.target = sys.fire;
        sys.state = 'APPROACHING';
      }
    }, 1000);
  }
}

function clearFireEffects() {
  if (ui.fire) ui.fire.style.opacity = 0;
  if (ui.beam) ui.beam.style.opacity = 0;
  if (ui.crosshair) ui.crosshair.style.opacity = 0;
  sys.fire = null;
  sys.target = null;
}

function extinguish() {
  sys.target = null;
  sys.state = 'EXTINGUISHING';
  log('Extinguishing...', 'sys');

  if (!sys.fire) return;

  var dx = sys.fire.x - sys.robot.x;
  var dy = sys.fire.y - sys.robot.y;
  var dist = Math.hypot(dx, dy);
  var angle = Math.atan2(dy, dx) * (180 / Math.PI);

  ui.beam.style.width = dist + 'px';
  ui.beam.style.top = sys.robot.y + 'px';
  ui.beam.style.left = sys.robot.x + 'px';
  ui.beam.style.transform = 'rotate(' + angle + 'deg)';
  ui.beam.style.opacity = 1;

  setTimeout(function() {
    if (!sys.running || !sys.fire) return;
    log('Fire out. Resuming Patrol.', 'path');
    clearFireEffects();
    sys.state = 'PATROLLING';
  }, 2000);
}

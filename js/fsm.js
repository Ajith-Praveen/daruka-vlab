/* ===== fsm.js — Finite State Machine for Full Simulation ===== */

const FSM_STATES = ['IDLE', 'DETECT', 'NAVIGATE', 'AIM', 'EXTINGUISH', 'VERIFY', 'COMPLETE'];

const FSM = {
  current: 'IDLE',
  running: false,
  timer: null,
  onStateChange: null,   // callback(newState, oldState)
  onComplete: null,       // callback()

  reset() {
    this.current = 'IDLE';
    this.running = false;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  },

  start() {
    this.running = true;
    this.transition('IDLE');
  },

  transition(newState) {
    if (!this.running) return;

    const oldState = this.current;
    this.current = newState;

    /* Log transition */
    if (oldState !== newState) {
      log('[STATE] ' + oldState + ' → ' + newState, 'sys');
    }

    /* Notify UI */
    if (this.onStateChange) {
      this.onStateChange(newState, oldState);
    }

    /* Schedule next transition based on current state */
    switch (newState) {

      case 'IDLE':
        log('[FSM] System initialized — awaiting fire event', 'sys');
        this.timer = setTimeout(() => this.transition('DETECT'), 2000);
        break;

      case 'DETECT':
        log('[DETECT] Scanning environment for fire...', 'warn');
        this.timer = setTimeout(() => {
          const conf = (0.75 + Math.random() * 0.2).toFixed(2);
          log('[DETECT] Fire detected — YOLO confidence: ' + conf, 'err');
          this.transition('NAVIGATE');
        }, 2500);
        break;

      case 'NAVIGATE':
        log('[NAV] Path planned — navigating to fire source', 'info');
        /* The simulation engine handles actual navigation;
           FSM will be advanced by simulation.js when robot arrives */
        break;

      case 'AIM':
        log('[AIM] Aligning nozzle to fire target', 'info');
        this.timer = setTimeout(() => {
          log('[AIM] Nozzle locked on target', 'path');
          this.transition('EXTINGUISH');
        }, 1800);
        break;

      case 'EXTINGUISH':
        log('[ACT] CO₂ spray activated', 'sys');
        this.timer = setTimeout(() => {
          log('[ACT] Spray cycle complete', 'path');
          this.transition('VERIFY');
        }, 2500);
        break;

      case 'VERIFY':
        log('[VERIFY] Re-scanning area for residual fire...', 'warn');
        this.timer = setTimeout(() => {
          log('[VERIFY] Area clear — no residual fire detected', 'path');
          this.transition('COMPLETE');
        }, 2000);
        break;

      case 'COMPLETE':
        log('[STATE] ✅ MISSION COMPLETE', 'path');
        this.running = false;
        if (this.onComplete) this.onComplete();
        break;
    }
  },

  /* Called externally when the robot finishes navigation */
  notifyNavigationComplete() {
    if (this.current === 'NAVIGATE' && this.running) {
      const t = (8 + Math.random() * 6).toFixed(1);
      log('[NAV] Target reached in ' + t + ' s', 'path');
      this.transition('AIM');
    }
  }
};

/* ===== experiments.js — Experiment mode routing ===== */
/* Experiment selection is handled by direct links in experiments.html:
   - simulation.html?mode=fire
   - simulation.html?mode=navigation
   - simulation.html?mode=full
   
   This file is available for future enhancements such as:
   - Tracking experiment completion
   - Storing experiment results
   - Pre-loading experiment configurations
*/

(function() {
  /* Highlight current experiment if returning from simulation */
  var ref = document.referrer;
  if (ref && ref.indexOf('simulation.html') !== -1) {
    console.log('[Experiments] Returned from simulation');
  }
})();

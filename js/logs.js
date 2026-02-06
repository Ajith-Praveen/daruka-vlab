/* ===== logs.js — System Log Utility ===== */

const LogPanel = {
  el: null,

  init() {
    this.el = document.getElementById('console');
  },

  /* Write a log entry to the console panel
     type: 'sys' | 'err' | 'path' | 'warn' | 'info' | '' */
  write(msg, type) {
    if (!this.el) this.init();
    const p = document.createElement('p');
    p.textContent = '> ' + msg;
    if (type) p.className = type;
    this.el.prepend(p);
  },

  clear() {
    if (!this.el) this.init();
    this.el.innerHTML = '<p class="sys">> System Ready.</p>';
  }
};

/* Convenience global */
function log(msg, type) {
  LogPanel.write(msg, type || '');
}

/* ---------- Event Delegation and Listeners ---------- */

// Event delegation: single listener for all "Merge" buttons
document.getElementById("diffResult").addEventListener("click", (e) => {
    const btn = e.target.closest('.merge-btn');
    if (!btn) return;
    const handler = btn.dataset.handler;
    if (handler === 'block') {
      selectBlockByBtn(e, btn);
      return;
    }
    if (handler === 'unified') {
      mergeUnified(e, btn);
      return;
    }
    // default: side-by-side single line
    selectLineByBtn(e, btn);
});

// Close history panel when clicking outside
document.addEventListener('click', (e) => {
    const historyPanel = document.getElementById('historyPanel');
    const historyToggle = document.querySelector('.history-toggle');
    const historyBtn = document.getElementById('historyBtn');
    
    if (historyPanel.classList.contains('open') && 
        !historyPanel.contains(e.target) && 
        !historyToggle?.contains(e.target) &&
        !historyBtn?.contains(e.target)) {
        toggleHistoryPanel(false);
    }
});

// Initialize the Prism.js configuration
document.addEventListener('DOMContentLoaded', () => {
    const preload = ['javascript','python','java','markup','json','css'];
    const load = Prism?.plugins?.autoloader?.loadLanguages;
    if (typeof load === 'function') preload.forEach(lang => load([lang]));
    
    // Validate dependencies after page load
    setTimeout(validateDependencies, 1000);
});

// Service worker registration
if ('serviceWorker' in navigator &&
    location.protocol === 'https:' &&
    location.hostname !== '127.0.0.1' &&
    location.hostname !== 'localhost') {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'));
}

// Setup Prism autoloader configuration
if (Prism.plugins && Prism.plugins.autoloader) {
  Prism.plugins.autoloader.languages_path =
    "https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/";
}

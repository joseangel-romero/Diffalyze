/* ─────────── History with IndexedDB ─────────── */
const DB_NAME = 'diffalyze_history';
const DB_VERSION = 1;
const STORE = 'comparisons';
const MAX_HISTORY_ITEMS = 10;
let db = null;

function openHistoryDB() {
  return new Promise((res, rej) => {
    if (db) return res(db);
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => {
      const d = e.target.result;
      if (!d.objectStoreNames.contains(STORE)) {
        d.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = e => { db = e.target.result; res(db); };
    req.onerror   = e => rej(e);
  });
}

const put = async entry => {
  const database = await openHistoryDB();
  return database.transaction(STORE, 'readwrite')
    .objectStore(STORE)
    .put(entry);
};

const all = async () => {
  const database = await openHistoryDB();
  return new Promise(res => {
    const req = database.transaction(STORE, 'readonly')
      .objectStore(STORE)
      .getAll();
    req.onsuccess = () => {
      res(req.result
        .sort((a, b) => b.id - a.id)
        .slice(0, MAX_HISTORY_ITEMS)
      );
    };
  });
};

const del = async id => {
  const database = await openHistoryDB();
  return database.transaction(STORE, 'readwrite')
    .objectStore(STORE)
    .delete(id);
};

const clr = async () => {
  const database = await openHistoryDB();
  return database.transaction(STORE, 'readwrite')
    .objectStore(STORE)
    .clear();
};

/* Public API */
async function saveToHistory(originalText, changedText, stats) {
  if ((!originalText && !changedText) ||
      (stats.added | stats.removed | stats.modified | stats.moved) === 0) {
    return;
  }

  const entry = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    originalText,
    changedText,
    stats,
    preview: {
      original: originalText.slice(0, 200),
      changed: changedText.slice(0, 200)
    }
  };

  await put(entry);
  updateHistoryDisplay();
}

async function updateHistoryDisplay() {
  const container = document.getElementById('historyContent');
  const history = await all();

  if (history.length === 0) {
    container.innerHTML = `
      <div class="history-empty">
        ${t('history.empty')}
      </div>`;
    return;
  }

  container.innerHTML = history.map(item => {
    const currentLang = window.i18n ? window.i18n.getCurrentLanguage() : 'es';
    const d = new Date(item.timestamp)
      .toLocaleDateString(currentLang === 'en' ? 'en-US' : currentLang === 'fr' ? 'fr-FR' : 'es-ES', {
        day: '2-digit', month: '2-digit',
        hour: '2-digit', minute: '2-digit'
      });
    const s = item.stats;
    const tag = (t, v) => v ? `<span class="history-stat ${t}">${v}</span>` : '';

    return `
      <div class="history-item" role="button" tabindex="0"
           onclick='loadFromHistory(${JSON.stringify(item)
             .replace(/&/g, '&amp;')   // escape ampersands first
             .replace(/'/g, '&#39;')    // escape single quotes – prevents attribute break‑out
             .replace(/"/g, '&quot;')   // escape double quotes
             .replace(/[\n\r]/g, '\\n') // flatten line breaks
           })'>
        <div class="history-item-header">
          <div class="history-item-date">${d}</div>
          <div class="history-item-stats">
            ${tag('added', `+${s.added}`)}
            ${tag('removed', `-${s.removed}`)}
            ${tag('modified', `~${s.modified}`)}
            ${tag('moved', `↕${s.moved}`)}
          </div>
        </div>
        <div class="history-item-preview">
          <div class="history-preview-column">
            ${escapeHtml(item.preview.original || '')}
          </div>
          <div class="history-preview-column">
            ${escapeHtml(item.preview.changed || '')}
          </div>
        </div>
        <div class="history-item-actions">
          <button class="history-action-btn"
                  onclick="event.stopPropagation(); removeFromHistory(${item.id})"
                  title="Eliminar">🗑️</button>
        </div>
      </div>
    `;
  }).join('') + `
    <div style="text-align:center; margin-top:1rem; padding-top:1rem; border-top:1px solid var(--border);">
      <button class="history-action-btn" style="background:var(--error);color:#fff;"
              onclick="clearHistory()">Borrar todo el historial</button>
    </div>
  `;
}

async function loadFromHistory(item) {
  document.getElementById('originalText').value = item.originalText;
  document.getElementById('changedText').value  = item.changedText;
  compareTexts();
  toggleHistoryPanel(false);
  showToast(t('messages.comparison_loaded'));
}

/* --- History panel toggle (added) --- */
function toggleHistoryPanel(forceState = null){
  const panel     = document.getElementById('historyPanel');
  const toggleBtn = document.querySelector('.history-toggle');
  
  if (!panel) {
    return;
  }
  
  const isOpen    = panel.classList.contains('open');
  const show      = forceState !== null ? forceState : !isOpen;

  if (show){
    panel.classList.add('open');
    panel.removeAttribute('style');
    panel.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      right: 0px !important;
      width: 420px !important;
      height: 100vh !important;
      background: rgba(26, 26, 28, 0.95) !important;
      border-left: 3px solid #ec4899 !important;
      z-index: 9999 !important;
      transition: right 0.4s ease-in-out !important;
      box-shadow: -10px 0 30px rgba(0, 0, 0, 0.5) !important;
      backdrop-filter: blur(20px) !important;
      display: flex !important;
      flex-direction: column !important;
    `;
    toggleBtn?.setAttribute('aria-expanded','true');
  } else {
    panel.classList.remove('open');
    panel.removeAttribute('style');
    panel.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      right: -450px !important;
      width: 420px !important;
      height: 100vh !important;
      background: rgba(26, 26, 28, 0.95) !important;
      border-left: 3px solid #ec4899 !important;
      z-index: 9999 !important;
      transition: right 0.4s ease-in-out !important;
      box-shadow: -10px 0 30px rgba(0, 0, 0, 0.5) !important;
      backdrop-filter: blur(20px) !important;
      display: flex !important;
      flex-direction: column !important;
    `;
    toggleBtn?.setAttribute('aria-expanded','false');
  }
}

async function removeFromHistory(id) {
  await del(id);
  updateHistoryDisplay();
  showToast(t('messages.history_deleted'));
}

async function clearHistory() {
  showConfirmModal();
}

function showConfirmModal() {
  const modal = document.getElementById('confirmClearModal');
  modal.style.display = 'flex';
  
  // Focus management
  const cancelBtn = modal.querySelector('.btn-secondary');
  if (cancelBtn) cancelBtn.focus();
}

function closeConfirmModal() {
  const modal = document.getElementById('confirmClearModal');
  modal.style.display = 'none';
}

async function confirmClearHistory() {
  await clr();
  updateHistoryDisplay();
  showToast(t('messages.history_cleared'));
  closeConfirmModal();
}

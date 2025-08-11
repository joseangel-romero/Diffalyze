/* ---------- Focus-trap helpers ---------- */
let lastFocused = null;
function trapFocus(modal){
const nodes = modal.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
);
if(!nodes.length) return;
const first = nodes[0];
const last  = nodes[nodes.length-1];
const handler = e=>{
    if(e.key!=='Tab') return;
    if(e.shiftKey && document.activeElement===first){ e.preventDefault(); last.focus(); }
    else if(!e.shiftKey && document.activeElement===last){ e.preventDefault(); first.focus(); }
};
modal.addEventListener('keydown', handler, { once:true });
}

/* ─────────── Shortcuts Modal helper ─────────── */
function toggleShortcutsModal(forceState=null){
    const modal = document.getElementById('shortcutsModal');
    const main  = document.querySelector('main');
    const isOpen= modal.style.display==='flex';
    const show  = forceState!==null ? forceState : !isOpen;

    if(show){
        lastFocused = document.activeElement;
        modal.style.display = 'flex';
        main.inert = true;
        trapFocus(modal);
        (modal.querySelector('button,[tabindex],input') || modal).focus();
    }else{
        modal.style.display = 'none';
        main.inert = false;
        lastFocused?.focus();
    }
}

/* ─────────── Keyboard Shortcuts Functionality ─────────── */
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Only activate if we're not typing in an input/textarea
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            // Exception for Ctrl/Cmd + Enter in textareas
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                compareTexts();
                return;
            }
            return;
        }
        
        switch(e.key) {
            case 'u':
                e.preventDefault();
                // Undo functionality - trigger undo if available
                break;
            case 'r':
                e.preventDefault();
                // Redo functionality - trigger redo if available
                break;
            case '?':
                e.preventDefault();
                toggleShortcutsModal();
                break;
        }
        
        // Ctrl/Cmd + Enter to compare
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            compareTexts();
        }
    });
}

/* ─────────── Drag & Drop Functionality ─────────── */
let dragCounter = 0;
let dragLeaveTimeout = null;

function setupDragAndDrop() {
    const dragOverlay = document.getElementById('dragOverlay');
    const originalZone = document.getElementById('dropZoneOriginal');
    const changedZone = document.getElementById('dropZoneChanged');
    
    // Prevent browser default behavior
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        document.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    // Show overlay when dragging over document
    document.addEventListener('dragenter', (e) => {
        // Clear timeout if it exists
        if (dragLeaveTimeout) {
            clearTimeout(dragLeaveTimeout);
            dragLeaveTimeout = null;
        }
        
        // Only count elements that are not inside the overlay
        if (!dragOverlay.contains(e.target)) {
            dragCounter++;
        }
        
        if (e.dataTransfer.types.includes('Files')) {
            dragOverlay.classList.add('active');
        }
    });
    
    document.addEventListener('dragleave', (e) => {
        // Use timeout to avoid flickering
        if (dragLeaveTimeout) {
            clearTimeout(dragLeaveTimeout);
        }
        
        dragLeaveTimeout = setTimeout(() => {
            // Only hide if we really left the document
            if (!e.relatedTarget || (!document.body.contains(e.relatedTarget) && !dragOverlay.contains(e.relatedTarget))) {
                dragCounter = 0;
                dragOverlay.classList.remove('active');
                clearDragOverEffects();
            }
        }, 50);
    });
    
    // Handle dragover on overlay to avoid flickering
    dragOverlay.addEventListener('dragover', (e) => {
        e.preventDefault();
    });
    
    // Drop anywhere on the overlay (outside specific zones)
    dragOverlay.addEventListener('drop', (e) => {
        // Clear timeout
        if (dragLeaveTimeout) {
            clearTimeout(dragLeaveTimeout);
            dragLeaveTimeout = null;
        }
        
        // Only handle if drop wasn't in a specific zone
        if (!e.target.closest('.drag-zone')) {
            dragCounter = 0;
            dragOverlay.classList.remove('active');
            clearDragOverEffects();
        }
    });
    
    // Specific events for each zone
    originalZone.addEventListener('dragenter', (e) => {
        e.stopPropagation();
        originalZone.classList.add('drag-over');
        changedZone.classList.remove('drag-over');
    });
    
    originalZone.addEventListener('dragleave', (e) => {
        // Only remove effect if we really left the zone
        if (!originalZone.contains(e.relatedTarget)) {
            originalZone.classList.remove('drag-over');
        }
    });
    
    changedZone.addEventListener('dragenter', (e) => {
        e.stopPropagation();
        changedZone.classList.add('drag-over');
        originalZone.classList.remove('drag-over');
    });
    
    changedZone.addEventListener('dragleave', (e) => {
        // Only remove effect if we really left the zone
        if (!changedZone.contains(e.relatedTarget)) {
            changedZone.classList.remove('drag-over');
        }
    });
    
    // Drop handlers for each zone
    originalZone.addEventListener('drop', (e) => {
        e.stopPropagation();
        handleZoneDrop(e, 'original');
    });
    
    changedZone.addEventListener('drop', (e) => {
        e.stopPropagation();
        handleZoneDrop(e, 'changed');
    });
}

function handleZoneDrop(e, target) {
    e.preventDefault();
    
    // Clear timeout if it exists
    if (dragLeaveTimeout) {
        clearTimeout(dragLeaveTimeout);
        dragLeaveTimeout = null;
    }
    
    dragCounter = 0;
    document.getElementById('dragOverlay').classList.remove('active');
    clearDragOverEffects();
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        const textareaId = target === 'original' ? 'originalText' : 'changedText';
        loadFileContent(file, textareaId);
        const targetText = target === 'original' ? t('original_text').toLowerCase() : t('modified_text').toLowerCase();
        showToast(`${file.name} ${t('file_loaded')} ${targetText}`);
    }
}

function clearDragOverEffects() {
    const originalZone = document.getElementById('dropZoneOriginal');
    const changedZone = document.getElementById('dropZoneChanged');
    
    if (originalZone) originalZone.classList.remove('drag-over');
    if (changedZone) changedZone.classList.remove('drag-over');
}

/* ─────────── Keyboard Shortcuts ─────────── */
document.addEventListener('keydown', (e) => {
  const activeTag = document.activeElement.tagName.toLowerCase();
  const isTyping  = ['input', 'textarea'].includes(activeTag) || document.activeElement.isContentEditable;

  /* Ignore plain‑key shortcuts while user is typing in a form control */
  if (isTyping && !(e.ctrlKey || e.metaKey)) return;

  /* Cmd/Ctrl + Enter → Compare texts */
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
    e.preventDefault();
    compareTexts();
    showToast('Comparación ejecutada (⌘/Ctrl+Enter)');
    return;
  }

  /*  Single‑letter shortcuts (without Ctrl/Cmd)  */
  if (!e.metaKey && !e.ctrlKey) {
    switch (e.key.toLowerCase()) {
      case 'u':               /* Undo */
        if (!document.getElementById('undoBtn')?.disabled) {
          e.preventDefault();
          undoMerge();
          showToast('Undo (u)');
        }
        break;

      case 'r':               /* Redo */
        if (!document.getElementById('redoBtn')?.disabled) {
          e.preventDefault();
          redoMerge();
          showToast('Redo (r)');
        }
        break;

      case 'm':               /* Toggle Unified / Side‑by‑side */
        e.preventDefault();
        const unifiedToggle = document.getElementById('unifiedToggle');
        if (unifiedToggle) {
          const wasUnified = unifiedToggle.checked;
          unifiedToggle.checked = !wasUnified;
          
          // Trigger change event to ensure proper handling
          const changeEvent = new Event('change', { bubbles: true });
          unifiedToggle.dispatchEvent(changeEvent);
          
          // Show immediate feedback
          const viewType = unifiedToggle.checked ? 'Unificada' : 'Lado a lado';
          showToast(`Vista ${viewType} (m)`);
          
          // Force refresh if there's existing diff data
          if (AppState.latestDiff) {
            displayDiff(AppState.latestDiff);
          }
        }
        break;

        case '?':               /* Help modal */
            e.preventDefault();
            toggleShortcutsModal();
        break;
    }
  }
});

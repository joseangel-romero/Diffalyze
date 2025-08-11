/* ---------- Merge Functions ---------- */

/*  ----- Functions for line-by-line merge -----  */
function prepareMerge(diff) {
    mergedLines = diff.original.map((orig, idx) => {
        // If both columns are empty, keep empty string
        if (!orig.content && !diff.changed[idx].content) return "";

        // Priority: always use the version currently shown in original
        return orig.content || diff.changed[idx].content;
    });
}

function selectLine(el) {
    const idx = parseInt(el.dataset.index);
    const side = el.dataset.side;
    if (!latestDiff) return;

    // Save state before making changes
    saveState();

    if (side === "original") {
        mergedLines[idx] = latestDiff.original[idx].content;
    } else {
        mergedLines[idx] = latestDiff.changed[idx].content;
    }
    updateAcceptedHighlights();
    updateMergedText();
}

// Prevent button click from bubbling to container
function selectLineByBtn(e, btn) {
    e.stopPropagation();
    saveState();
    btn.setAttribute("aria-pressed","true");
    if (!latestDiff) return;
    const lineDiv = btn.closest(".diff-line");
    if (!lineDiv) { return; }
    const idx  = parseInt(lineDiv.dataset.index);
    const side = lineDiv.dataset.side;      // "original" or "changed"

    // 1. Copy content from source side to the other side
    if (side === "original") {
        const val = latestDiff.original[idx].content;
        latestDiff.changed[idx].content = val;
    } else {
        const val = latestDiff.changed[idx].content;
        latestDiff.original[idx].content = val;
    }

    // 2. Mark both sides as 'unchanged' so buttons disappear
    latestDiff.original[idx].type = "unchanged";
    latestDiff.changed[idx].type  = "unchanged";

    // 3. Update merge structure and repaint
    prepareMerge(latestDiff);          // synchronize mergedLines and highlight accepted lines
    changeBlocks = computeBlocks(latestDiff); // recalculate blocks after merge
    updateMergedText();                // refresh final textarea
    displayDiff(latestDiff);           // re-render diff without stats
    updateAcceptedHighlights();        // re-apply highlighting to new nodes
}

/* Merge a complete block */
function selectBlockByBtn(e,btn){
    e.stopPropagation();
    saveState();
    btn.setAttribute("aria-pressed","true");
    if(!latestDiff) return;
    const start=+btn.dataset.start, end=+btn.dataset.end, side=btn.dataset.side;

    for(let i=start;i<=end;i++){
        if(side==="original"){
        latestDiff.changed[i].content = latestDiff.original[i].content;
        }else{
        latestDiff.original[i].content = latestDiff.changed[i].content;
        }
        latestDiff.original[i].type = "unchanged";
        latestDiff.changed[i].type  = "unchanged";
    }

    prepareMerge(latestDiff);
    changeBlocks = computeBlocks(latestDiff); // recalculate blocks after merge
    updateMergedText();
    displayDiff(latestDiff);
    updateAcceptedHighlights();
}

/* Merge a single line from Unified view */
function mergeUnified(e, btn) {
    e.stopPropagation();
    saveState();
    btn.setAttribute("aria-pressed","true");
    if (!latestDiff) return;

    const idx  = +btn.dataset.index;
    const side = btn.dataset.side;  // "original" | "changed"

    if (side === "original") {
        latestDiff.changed[idx].content = latestDiff.original[idx].content;
    } else {
        latestDiff.original[idx].content = latestDiff.changed[idx].content;
    }
    latestDiff.original[idx].type = "unchanged";
    latestDiff.changed[idx].type  = "unchanged";

    prepareMerge(latestDiff);
    changeBlocks = computeBlocks(latestDiff); // recalculate blocks after merge
    updateMergedText();
    displayDiff(latestDiff);
    updateAcceptedHighlights();
}

/* Save complete state: mergedLines and diff (max 20 steps) */
function saveState(){
    if (!latestDiff) return;
    
    // Save complete state including current diff
    const currentState = {
        merged: [...mergedLines],
        diff: JSON.parse(JSON.stringify(latestDiff)) // Deep clone
    };
    
    undoStack.push(currentState);
    if (undoStack.length > 20) undoStack.shift();
    redoStack.length = 0; // Clear redo stack when new action is performed
    updateHistoryButtons();
}

function undoMerge(){
    if (!undoStack.length) return;
    
    // Save current state to redo stack before undoing
    const currentState = {
        merged: [...mergedLines],
        diff: JSON.parse(JSON.stringify(latestDiff))
    };
    redoStack.push(currentState);
    
    // Restore previous state
    const previousState = undoStack.pop();
    mergedLines = [...previousState.merged];
    latestDiff = JSON.parse(JSON.stringify(previousState.diff));
    
    // Update entire interface
    changeBlocks = computeBlocks(latestDiff);
    displayDiff(latestDiff);
    updateMergedText();
    updateAcceptedHighlights();
    updateHistoryButtons();
}

function redoMerge(){
    if (!redoStack.length) return;
    
    // Save current state to undo stack before redoing
    const currentState = {
        merged: [...mergedLines],
        diff: JSON.parse(JSON.stringify(latestDiff))
    };
    undoStack.push(currentState);
    
    // Restore state from redo stack
    const redoState = redoStack.pop();
    mergedLines = [...redoState.merged];
    latestDiff = JSON.parse(JSON.stringify(redoState.diff));
    
    // Update entire interface
    changeBlocks = computeBlocks(latestDiff);
    displayDiff(latestDiff);
    updateMergedText();
    updateAcceptedHighlights();
    updateHistoryButtons();
}

function updateHistoryButtons(){
    document.getElementById("undoBtn").disabled = undoStack.length===0;
    document.getElementById("redoBtn").disabled = redoStack.length===0;
}

function updateAcceptedHighlights() {
  if (!latestDiff) return;
  document.querySelectorAll(".diff-line:not(.diff-empty)").forEach((el) => {
    const idx = Number(el.dataset.index);
    if (!Number.isFinite(idx)) return; // unified view or no index
    const side = el.dataset.side;
    const arr = side === "original" ? latestDiff.original : latestDiff.changed;
    if (!arr || idx < 0 || idx >= arr.length) return;
    const content = arr[idx]?.content;
    if (mergedLines[idx] === content) el.classList.add("accepted");
    else el.classList.remove("accepted");
  });
}

function updateMergedText() {
    const mergedText = mergedLines
        .filter((l) => l !== null && l !== undefined)
        .join("\n");

    const mergedArea = document.getElementById("mergedCode");
    mergedArea.textContent = mergedText;

    // Apply syntax highlighting
    const lang = currentLang || "plaintext";
    mergedArea.className = "language-" + lang;

    if (window.Prism) {
        Prism.highlightElement(mergedArea);
    }

    document.getElementById("mergeContainer").style.display = "block";
}

function copyMergedText() {
    const mergedText = mergedLines
        .filter((l) => l !== null && l !== undefined)
        .join("\n");

    navigator.clipboard.writeText(mergedText)
        .then(() => showToast(t('messages.text_copied')))
        .catch(err => showToast(t('messages.copy_error') + " " + err, true));
}

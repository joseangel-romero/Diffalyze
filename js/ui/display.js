/* ---------- Diff Display Functions ---------- */

function setHighlightMode(mode){
  highlightMode = mode;
  document.body.dataset.highlight = mode;
  // Only re-render if we have a diff and it's not during initial setup
  if (latestDiff && document.querySelector('.diff-result')) {
    displayDiff(latestDiff);
  }
}

/* Returns HTML with <span class="char-diff"> for different characters */
function highlightChars(base, compare){
    base = base || '';
    compare = compare || '';
    const len = Math.max(base.length, compare.length);
    // If the line is too long, avoid rendering thousands of <span> and return plain text
    if (len > 1000) {
        return escapeHtml(base);   // fallback without highlighting
    }
    let out = "";
    for(let i=0;i<len;i++){
        const ch  = base[i] ?? "";
        const oth = compare[i] ?? "";
        const esc = escapeHtml(ch);
        if(ch !== oth){
            out += `<span class="char-diff">${esc || "&nbsp;"}</span>`;
        }else{
            out += esc || "&nbsp;";
        }
    }
    return out;
}

/* Returns HTML with <span class="word-diff"> for different words */
function highlightWords(base, compare){
    base = base || '';
    compare = compare || '';
    const baseParts = base.split(/(\s+)/);      // keeps separators
    const compParts = compare.split(/(\s+)/);
    const len = Math.max(baseParts.length, compParts.length);
    let out = "";
    for(let i = 0; i < len; i++){
        const w  = baseParts[i]  ?? "";
        const cw = compParts[i] ?? "";
        const esc = escapeHtml(w);
        out += (w !== cw)
        ? `<span class="word-diff">${esc || "&nbsp;"}</span>`
        : esc;
    }
    return out;
}

/* Format line content according to current granularity */
function formatContent(base, compare){
    // Ensure base and compare are strings
    base = base || '';
    compare = compare || '';
    
    if (highlightMode === "char") return highlightChars(base, compare);
    if (highlightMode === "word") return highlightWords(base, compare);
    // highlightMode === "line"
    return currentLang
        ? `<code class="language-${currentLang}">${escapeHtml(base)}</code>`
        : escapeHtml(base);
}

/* Create quick diff summary */
function createDiffSummary(stats) {
    const summaryParts = [];
    
    if (stats.added > 0) {
        const label = stats.added > 1 ? t('stats.lines_added_plural') : t('stats.lines_added');
        summaryParts.push(`<div class="summary-stat added">+${stats.added} ${label}</div>`);
    }
    
    if (stats.removed > 0) {
        const label = stats.removed > 1 ? t('stats.lines_removed_plural') : t('stats.lines_removed');
        summaryParts.push(`<div class="summary-stat removed">-${stats.removed} ${label}</div>`);
    }
    
    if (stats.modified > 0) {
        const label = stats.modified > 1 ? t('stats.lines_modified_plural') : t('stats.lines_modified');
        summaryParts.push(`<div class="summary-stat modified">~${stats.modified} ${label}</div>`);
    }

    if (stats.moved > 0) {
        const label = stats.moved > 1 ? t('stats.lines_moved_plural') : t('stats.lines_moved');
        summaryParts.push(`<div class="summary-stat moved">↕${stats.moved} ${label}</div>`);
    }

    return summaryParts.length > 0 ? `<div class="diff-summary">${summaryParts.join('')}</div>` : '';
}

/*  Show result  */
function displayDiff(diff) {
  const diffResult = document.getElementById("diffResult");
  diffResult.className = "diff-container";
  
  // CRITICAL: Remove i18n attribute to prevent translation system from overwriting content
  diffResult.removeAttribute('data-i18n');
  
  if (!diff || !diff.original || !diff.changed) {
    diffResult.innerHTML = '<div class="error">Error: Datos de diff inválidos</div>';
    return;
  }
  
  const { unified, collapse } = getDiffOptions();
  const summaryHtml = createDiffSummary(diff.stats);
  
  // === UNIFIED VIEW ===
  if (unified) {
    let html = summaryHtml + `
      <div class="unified-header">
        <h4 data-i18n="unified.header">Vista Unificada - Comparación de Cambios</h4>
        <div class="unified-legend">
          <span class="legend-item">
            <span class="legend-btn merge-left-demo">← <span data-i18n="unified.original">Original</span></span>
            <span class="legend-text" data-i18n="unified.use_original">Usar versión original</span>
          </span>
          <span class="legend-item">
            <span class="legend-btn merge-right-demo">→ <span data-i18n="unified.modified">Modificado</span></span>
            <span class="legend-text" data-i18n="unified.use_modified">Usar versión modificada</span>
          </span>
        </div>
      </div>
      <div class="diff-column" style="width:100%">`;
    
    // Collect all lines and filter out empty ones aggressively
    let allLines = [];
    
    diff.original.forEach((o, idx) => {
      const c = diff.changed[idx] || { type: 'unchanged', content: '' };
      
      // Skip completely if collapse is enabled and line is unchanged
      if (collapse && o.type === "unchanged" && c.type === "unchanged") return;
      
      allLines.push({
        original: o,
        changed: c,
        index: idx,
        // Detect empty lines regardless of type
        isEmpty: (
          !o.content?.trim() || 
          o.type === "empty" ||
          (o.content?.trim() === "" && c.content?.trim() === "")
        )
      });
    });
    
    // Process lines, skipping empty ones entirely
    let i = 0;
    while (i < allLines.length) {
      const line = allLines[i];
      
      if (line.isEmpty) {
        // Skip empty lines completely - count them but don't render
        let emptyCount = 0;
        let j = i;
        while (j < allLines.length && allLines[j].isEmpty) {
          emptyCount++;
          j++;
        }
        
        // Don't render anything for empty lines - just skip them
        i = j;
        continue;
      }
      
      // Process non-empty line normally
      const { original: o, changed: c, index: idx } = line;
      const lineNum = String(idx + 1).padStart(3, '0');
      const content = formatContent(o.content, c.content);
      const lineClass = { 
        added: "diff-added", 
        removed: "diff-removed", 
        modified: "diff-modified", 
        moved: "diff-moved", 
        unchanged: "diff-unchanged" 
      }[o.type] || "diff-unchanged";
      
      // Add merge buttons for modified lines (both accept original and accept changed)
      let mergeButtons = "";
      if (o.type !== "unchanged" && o.type !== "empty") {
        mergeButtons = `
          <div class="merge-actions">
            <button type="button" class="merge-btn merge-left" data-handler="unified" data-side="original" data-index="${idx}" aria-pressed="false" data-i18n-title="unified.use_original">
              <span class="merge-icon">←</span>
              <span class="merge-text" data-i18n="unified.original">Original</span>
            </button>
            <button type="button" class="merge-btn merge-right" data-handler="unified" data-side="changed" data-index="${idx}" aria-pressed="false" data-i18n-title="unified.use_modified">
              <span class="merge-icon">→</span>
              <span class="merge-text" data-i18n="unified.modified">Modificado</span>
            </button>
          </div>
        `;
      }
      
      html += `
        <div class="diff-line ${lineClass}" data-index="${idx}" tabindex="0">
          <span class="line-number">${lineNum}</span>
          ${mergeButtons}
          <span class="line-content">${content}</span>
        </div>`;
      
      i++; // Move to next line
    }
    
    html += "</div>";
    diffResult.innerHTML = html;
    
    // Apply enhancements for unified view
    applySearchHighlight();
    setupScrollSync();
    
    // Apply translations to dynamically generated content
    if (window.i18n) {
      setTimeout(() => window.i18n.updateUI(), 50);
    }
    return;
  }
  
  // === SIDE BY SIDE VIEW ===
  let html = summaryHtml + '<div class="diff-result">';
  
  // Left column (original)
  html += '<div class="diff-column"><h4>Original</h4>';
  diff.original.forEach((line, idx) => {
    if (collapse && line.type === "unchanged") return;
    
    const showMergeBtn = (line.type !== "empty" && line.type !== "unchanged");
    const mergeBtn = showMergeBtn ? `<button type="button" class="merge-btn merge-left" aria-pressed="false">→</button>` : "";
    
    html += `
      <div class="diff-line diff-${line.type || 'unchanged'}" data-side="original" data-index="${idx}" tabindex="0">
        <span class="line-number">${String(line.number || idx + 1).padStart(3, '0')}</span>
        ${mergeBtn}
        <span class="line-content">${escapeHtml(line.content || '')}</span>
      </div>`;
  });
  html += '</div>';
  
  // Right column (changed)
  html += '<div class="diff-column"><h4>Modificado</h4>';
  diff.changed.forEach((line, idx) => {
    if (collapse && line.type === "unchanged") return;
    
    const showMergeBtn = (line.type !== "empty" && line.type !== "unchanged");
    const mergeBtn = showMergeBtn ? `<button type="button" class="merge-btn merge-right" aria-pressed="false">←</button>` : "";
    
    html += `
      <div class="diff-line diff-${line.type || 'unchanged'}" data-side="changed" data-index="${idx}" tabindex="0">
        <span class="line-number">${String(line.number || idx + 1).padStart(3, '0')}</span>
        ${mergeBtn}
        <span class="line-content">${escapeHtml(line.content || '')}</span>
      </div>`;
  });
  html += '</div></div>';
  
  diffResult.innerHTML = html;
  
  // Apply enhancements
  applySearchHighlight();
  setupScrollSync();
  
  // Apply translations to dynamically generated content
  if (window.i18n) {
    setTimeout(() => window.i18n.updateUI(), 50);
  }
}

function applySyntaxHighlight() {
    if (!currentLang) return;
    const nodes = document.querySelectorAll('#diffResult code[class^="language-"]');
    nodes.forEach(node => {
        runHeavy('highlight', { code: node.textContent, lang: currentLang })
        .then(html => { node.innerHTML = html; });
    });
}

/*  Escape HTML  */
function escapeHtml(text) {
    if (text === undefined || text === null) {
        return '';
    }
    if (typeof text !== 'string') {
        text = String(text);
    }
    const map = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
}

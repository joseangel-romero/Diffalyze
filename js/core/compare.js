/* ---------- Text Comparison Functions ---------- */

/*  Compare texts  */
async function compareTexts() {
    // Show loading state
    const compareBtn = document.getElementById("compareBtn");
    const originalBtnText = compareBtn?.textContent;
    
    try {
        // Input validation
        const originalText = document.getElementById("originalText").value;
        const changedText = document.getElementById("changedText").value;

        if (!originalText && !changedText) {
            showToast(t('messages.enter_text_alert') || "Please enter text in at least one of the fields", true);
            return;
        }

        // Validate input size and complexity
        const originalErrors = AppState.validateInput(originalText, 'original');
        const changedErrors = AppState.validateInput(changedText, 'modified');
        const allErrors = [...originalErrors, ...changedErrors];
        
        if (allErrors.length > 0) {
            showToast(`Input validation failed: ${allErrors.join(', ')}`, true);
            return;
        }

        if (compareBtn) {
            compareBtn.disabled = true;
            compareBtn.textContent = "⏳ Analizando...";
        }

            const originalLines = originalText.split("\n");
            const changedLines = changedText.split("\n");

            // Validate and sanitize regex pattern
            const regexInput = document.getElementById("regexInput")?.value;
            let safeRegexPattern = "";
            
            if (regexInput) {
                const isRegexSafe = await safeRegex(regexInput);
                if (isRegexSafe) {
                    safeRegexPattern = regexInput;
                } else {
                    showToast(t('messages.regex_invalid') || "Regex inválido o inseguro — se ignora", true);
                }
            }

            const opts = {
                ignoreSpacesCase: document.getElementById("ignoreToggle")?.checked,
                ignoreBlank: document.getElementById("blankToggle")?.checked,
                regex: safeRegexPattern
            };

            // Perform diff calculation with timeout
            let diff = await runHeavy('diff', { originalLines, changedLines, opts });

            if (!diff) {
                console.warn('Worker diff failed, using fallback implementation');
                diff = await fallbackDiff(originalLines, changedLines, opts);
            }

            // Final validation of diff result
            if (!diff || !diff.stats || typeof diff.stats !== 'object') {
                throw new Error('Diff calculation completely failed - no valid result structure');
            }

            // --- Immutable copy for rendering (original types will be preserved) ---
            const diffDisplay = structuredClone(diff);

            // Save original statistics before mutating `diff` (computeBlocks clears them)
            const savedStats = { ...diff.stats };

            // If no changes, show message and abort
            if ((savedStats.added | savedStats.removed | savedStats.modified | savedStats.moved) === 0) {
                document.getElementById("diffResult").innerHTML =
                    `<div class="success-message">${t('messages.identical_texts')}</div>`;
                AppState.latestDiff = null;
                AppState.mergedLines = [];
                AppState.changeBlocks = [];
                document.getElementById("mergeContainer").style.display = "none";
                return;
            }

            // Process change blocks (this mutates `diff`, not `diffDisplay`)
            changeBlocks = computeBlocks(diff);

            // Restore statistics in immutable copy
            diffDisplay.stats = savedStats;

            // --- Render and merge logic ---
            AppState.latestDiff = diffDisplay;
            latestDiff = diffDisplay; // Legacy compatibility
            
            displayDiff(diffDisplay);      // use untouched types
            prepareMerge(diff);            // use mutated diff with blocks
            updateMergedText();

            // Clear undo/redo history and save initial state
            undoStack.length = 0;
            redoStack.length = 0;
            updateHistoryButtons();

            // Save to history with correct stats
            saveToHistory(originalText, changedText, diffDisplay.stats);

            // Validate dependencies after successful comparison
            validateDependencies();

    } catch (error) {
        console.error('Error in compareTexts:', error);
        
        const errorMessage = error.message || 'Unknown error occurred during comparison';
        showToast(`Comparison failed: ${errorMessage}`, true);
        
        // Reset UI state
        const diffResult = document.getElementById("diffResult");
        diffResult.className = "diff-container no-diff error";
        diffResult.innerHTML = t('diff_analysis.no_diff');
        
    } finally {
        // Restore button state
        const compareBtn = document.getElementById("compareBtn");
        if (compareBtn) {
            compareBtn.disabled = false;
            compareBtn.textContent = originalBtnText || t('toolbar.analyze_btn') || "⚡ Analizar";
        }
    }
}

/* ─── View Options ─── */
function getDiffOptions(){
    return {
        unified : document.getElementById("unifiedToggle")?.checked,
        collapse: document.getElementById("collapseToggle")?.checked
    };
}

/*  Reset  */
function clearAll() {
    document.getElementById("originalText").value = "";
    document.getElementById("changedText").value = "";
    document.getElementById("originalFile").value = "";
    document.getElementById("changedFile").value = "";
    const diffResult = document.getElementById("diffResult");
    diffResult.className = "diff-container no-diff";
    diffResult.innerHTML = t('diff_analysis.no_diff');
    document.getElementById("mergeContainer").style.display = "none";
}

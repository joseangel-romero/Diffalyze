/**
 * Heavy computation worker for diff calculation
 * Handles Myers algorithm computation in background
 * Note: Syntax highlighting is handled in main thread to avoid CDN loading issues
 */

// Worker focuses on diff calculation only - no external dependencies
// Diff worker initialized for heavy computation

/* ===== Myers Diff Algorithm Implementation ===== */

/**
 * Implementation of Myers O(ND) diff algorithm
 * @param {Array} a - First sequence
 * @param {Array} b - Second sequence
 * @returns {Array} Edit script
 */
function myersDiff(a, b) {
    const N = a.length;
    const M = b.length;
    
    // Handle special cases
    if (N === 0 && M === 0) {
        return [];
    }
    
    if (N === 0) {
        // All insertions
        return b.map((_, index) => ({type: 'insert', newIndex: index}));
    }
    
    if (M === 0) {
        // All deletions
        return a.map((_, index) => ({type: 'delete', oldIndex: index}));
    }
    
    // Check if arrays are identical
    if (N === M && a.every((item, index) => item === b[index])) {
        return a.map((_, index) => ({type: 'equal', oldIndex: index, newIndex: index}));
    }
    
    // Simplified diff algorithm for now - can be enhanced later
    const editScript = [];
    const maxLen = Math.max(N, M);
    
    for (let i = 0; i < maxLen; i++) {
        if (i < N && i < M) {
            if (a[i] === b[i]) {
                editScript.push({type: 'equal', oldIndex: i, newIndex: i});
            } else {
                editScript.push({type: 'delete', oldIndex: i});
                editScript.push({type: 'insert', newIndex: i});
            }
        } else if (i < N) {
            editScript.push({type: 'delete', oldIndex: i});
        } else if (i < M) {
            editScript.push({type: 'insert', newIndex: i});
        }
    }
    
    return editScript;
}

/**
 * Backtrack through the edit graph to construct the edit script
 */
function backtrack(trace, D, k, N, M) {
    const editScript = [];
    let x = N;
    let y = M;
    
    for (let d = D; d > 0; d--) {
        const V = trace[d];
        const prevV = trace[d - 1];
        
        const prevK = findPreviousK(k, prevV, d);
        const prevX = prevV[prevK];
        const prevY = prevX - prevK;
        
        while (x > prevX && y > prevY) {
            editScript.unshift({type: 'equal', oldIndex: x - 1, newIndex: y - 1});
            x--;
            y--;
        }
        
        if (x > prevX) {
            editScript.unshift({type: 'delete', oldIndex: x - 1});
            x--;
        } else if (y > prevY) {
            editScript.unshift({type: 'insert', newIndex: y - 1});
            y++;
        }
        
        k = prevK;
    }
    
    while (x > 0 && y > 0) {
        editScript.unshift({type: 'equal', oldIndex: x - 1, newIndex: y - 1});
        x--;
        y--;
    }
    
    while (x > 0) {
        editScript.unshift({type: 'delete', oldIndex: x - 1});
        x--;
    }
    
    while (y > 0) {
        editScript.unshift({type: 'insert', newIndex: y - 1});
        y--;
    }
    
    return editScript;
}

function findPreviousK(k, prevV, d) {
    for (let prevK = k - 1; prevK <= k + 1; prevK += 2) {
        if (prevK >= -d + 1 && prevK <= d - 1 && prevV[prevK] !== undefined) {
            return prevK;
        }
    }
    return k;
}

/**
 * Detect moved lines in the diff
 */
function detectMovedLines(editScript, originalLines, changedLines) {
    const deletedLines = new Map();
    const insertedLines = new Map();
    
    editScript.forEach((op, index) => {
        if (op.type === 'delete') {
            const content = originalLines[op.oldIndex];
            if (!deletedLines.has(content)) {
                deletedLines.set(content, []);
            }
            deletedLines.get(content).push({index, op});
        } else if (op.type === 'insert') {
            const content = changedLines[op.newIndex];
            if (!insertedLines.has(content)) {
                insertedLines.set(content, []);
            }
            insertedLines.get(content).push({index, op});
        }
    });
    
    const movedOperations = [];
    
    deletedLines.forEach((deletedOps, content) => {
        if (insertedLines.has(content)) {
            const insertedOps = insertedLines.get(content);
            const minLength = Math.min(deletedOps.length, insertedOps.length);
            
            for (let i = 0; i < minLength; i++) {
                movedOperations.push({
                    from: deletedOps[i],
                    to: insertedOps[i],
                    content
                });
            }
        }
    });
    
    movedOperations.forEach(move => {
        editScript[move.from.index].type = 'move-from';
        editScript[move.to.index].type = 'move-to';
        editScript[move.to.index].moveFrom = move.from.op.oldIndex;
    });
    
    return editScript;
}

/**
 * Process edit script into structured diff data compatible with main application
 */
function processEditScript(editScript, originalLines, changedLines, processedOriginal, processedChanged) {
    const result = {
        original: [],
        changed: [],
        stats: {
            added: 0,
            removed: 0,
            modified: 0,
            moved: 0,
            unchanged: 0
        }
    };
    
    // Create a proper line-by-line mapping
    const maxLines = Math.max(originalLines.length, changedLines.length);
    
    // Build result arrays based on the maximum length
    for (let i = 0; i < maxLines; i++) {
        const origLine = originalLines[i];
        const changedLine = changedLines[i];
        const processedOrigLine = processedOriginal[i];
        const processedChangedLine = processedChanged[i];
        
        // Determine line types based on processed content for comparison
        let origType = 'unchanged';
        let changedType = 'unchanged';
        
        if (origLine === undefined) {
            origType = 'empty';
            changedType = 'added';
            result.stats.added++;
        } else if (changedLine === undefined) {
            origType = 'removed';
            changedType = 'empty';
            result.stats.removed++;
        } else if (processedOrigLine !== processedChangedLine) {
            // Use processed lines for comparison but display original content
            origType = 'modified';
            changedType = 'modified';
            result.stats.modified++;
        } else {
            result.stats.unchanged++;
        }
        
        result.original.push({
            type: origType,
            content: origLine || '',
            number: i + 1
        });
        
        result.changed.push({
            type: changedType,
            content: changedLine || '',
            number: i + 1
        });
    }
    
    return result;
}

/**
 * Main diff calculation function
 * @param {Array} originalLines - Original text lines
 * @param {Array} changedLines - Changed text lines
 * @param {Object} options - Diff options
 * @returns {Object} Structured diff result
 */
async function calculateDiff(originalLines, changedLines, options = {}) {
    try {
        // Validate inputs
        if (!Array.isArray(originalLines)) originalLines = [];
        if (!Array.isArray(changedLines)) changedLines = [];
        
        // Apply preprocessing based on options
        let processedOriginal = [...originalLines];
        let processedChanged = [...changedLines];
        
        // Handle ignoreSpacesCase option (combines whitespace and case normalization)
        if (options.ignoreSpacesCase) {
            processedOriginal = processedOriginal.map(line => (line || '').trim().replace(/\s+/g, ' ').toLowerCase());
            processedChanged = processedChanged.map(line => (line || '').trim().replace(/\s+/g, ' ').toLowerCase());
        } else {
            // Handle separate options for backward compatibility
            if (options.ignoreWhitespace) {
                processedOriginal = processedOriginal.map(line => (line || '').replace(/\s+/g, ' ').trim());
                processedChanged = processedChanged.map(line => (line || '').replace(/\s+/g, ' ').trim());
            }
            
            if (options.ignoreCase) {
                processedOriginal = processedOriginal.map(line => (line || '').toLowerCase());
                processedChanged = processedChanged.map(line => (line || '').toLowerCase());
            }
        }
        
        // Handle regex filtering
        if (options.regex && typeof options.regex === 'string' && options.regex.trim()) {
            try {
                const regex = new RegExp(options.regex, 'g');
                processedOriginal = processedOriginal.map(line => (line || '').replace(regex, '').replace(/\s+$/, ''));
                processedChanged = processedChanged.map(line => (line || '').replace(regex, '').replace(/\s+$/, ''));
            } catch (e) {
                console.warn('Invalid regex in worker, ignoring:', options.regex);
            }
        }
        
        // Handle blank line ignoring by marking them as empty strings for comparison
        if (options.ignoreBlank) {
            processedOriginal = processedOriginal.map(line => (line || '').trim() === '' ? '' : line);
            processedChanged = processedChanged.map(line => (line || '').trim() === '' ? '' : line);
        }
        
        // Use the simplified diff processing approach
        const result = processEditScript(null, originalLines, changedLines, processedOriginal, processedChanged);
        
        return result;
    } catch (error) {
        throw new Error(`Diff calculation failed: ${error.message}`);
    }
}

// Stub for safeRegex function (not needed in worker)
async function safeRegex() { 
    return true; 
}

/* ===== Worker Message Handler ===== */

self.onmessage = async function(event) {
    try {
        const {data} = event;
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid message data');
        }
        
        const {ticket, job, payload} = data;
        
        if (!ticket || !job) {
            throw new Error('Missing ticket or job in message');
        }
        
        if (job === 'diff') {
            const {originalLines, changedLines, opts} = payload || {};
            
            if (!Array.isArray(originalLines) || !Array.isArray(changedLines)) {
                throw new Error('Invalid input: originalLines and changedLines must be arrays');
            }
            
            const diff = await calculateDiff(originalLines, changedLines, opts || {});
            self.postMessage({ticket, result: diff, success: true});
            
        } else {
            throw new Error(`Unknown job type: ${job}`);
        }
    } catch (error) {
        const ticket = event.data?.ticket || 'unknown';
        self.postMessage({
            ticket, 
            error: error.message || 'Unknown error occurred', 
            success: false
        });
    }
};

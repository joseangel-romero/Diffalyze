/* ---------- Myers Diff Algorithm Implementation ---------- */

/* Fallback diff implementation when worker fails */
async function fallbackDiff(originalLines, changedLines, opts = {}) {
    try {
        console.log('Using fallback diff implementation');
        return await calculateDiff(originalLines, changedLines, opts);
    } catch (error) {
        console.error('Fallback diff also failed:', error);
        // Return a minimal diff structure indicating error
        return {
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
    }
}

/*  Myers O(ND) Algorithm for efficient and high-quality diff  */
async function calculateDiff(originalLines, changedLines, opts = {}) {
    /* ---------- QUICK SINGLE‑LINE GUARD ---------- *
     * If both texts have exactly one line and,
     * after normalization, those lines don't match,
     * we return a minimal "modified" diff without going
     * through the entire Myers algorithm (prevents
     * edge cases like "a" vs "b" from appearing as
     * identical due to any downstream failures).
     * ---------------------------------------------- */
    {
      const normalize = (s) => {
        if (!s) return "";
        const n = opts?.ignoreSpacesCase
          ? s.trim().replace(/\s+/g, " ").toLowerCase()
          : s;
        return (opts?.regex)
          ? n.replace(new RegExp(opts.regex, "g"), "").replace(/\s+$/, "")
          : n;
      };

      if (originalLines.length === 1 &&
          changedLines.length  === 1 &&
          normalize(originalLines[0]) !== normalize(changedLines[0])) {

        return {
          original: [{ type: "modified", content: originalLines[0], number: 1 }],
          changed : [{ type: "modified", content: changedLines[0],  number: 1 }],
          stats   : { added: 0, removed: 0, modified: 1, moved: 0, unchanged: 0 }
        };
      }
    }
    const result = {
        original: [],
        changed: [],
        stats: { added: 0, removed: 0, unchanged: 0, modified: 0, moved: 0 }
    };

    const ignoreSpacesCase = !!opts.ignoreSpacesCase;
    const ignoreBlank      = !!opts.ignoreBlank;
    let userRegex = null;
    if (opts.regex && opts.regex.trim()) {
      if (await safeRegex(opts.regex)) {
        userRegex = new RegExp(opts.regex, 'g');
      } else {
        console.warn('Regex inseguro/lento ignorado');
      }
    }

    const normalize = (s) => {
        let str = s;
        if (userRegex) {
            str = str.replace(userRegex, "");
            // Remove trailing spaces after removing comment
            str = str.replace(/\s+$/, "");
        }
        if (ignoreSpacesCase) str = str.trim().replace(/\s+/g, " ").toLowerCase();
        if (ignoreBlank && str.trim() === "") str = "";
        return str;
    };
    const a = originalLines.map(normalize);
    const b = changedLines.map(normalize);

    // Get edit sequence using Myers algorithm
    const editScript = myersDiff(a, b);
    
    // Detect moved lines before processing diff
    const moveDetection = detectMovedLines(originalLines, changedLines, editScript, normalize);
    
    // Process edit script to create final result
    const diffResult = processEditScript(editScript, originalLines, changedLines, moveDetection);
    // --- recalculate statistics ------------------------------------------------
    diffResult.stats = diffResult.original.reduce((acc, o, i) => {
      const c = diffResult.changed[i];
      [o, c].forEach(entry => {
        if (!entry) return;
        if (entry.type === 'added')     acc.added++;
        if (entry.type === 'removed')   acc.removed++;
        if (entry.type === 'modified')  acc.modified++;
        if (entry.type === 'moved')     acc.moved++;
      });
      return acc;
    }, { added:0, removed:0, modified:0, moved:0 });
    // ---------------------------------------------------------------------------
    return diffResult;
}

/*  Myers O(ND) Algorithm Implementation  */
function myersDiff(a, b) {
    const N = a.length;
    const M = b.length;
    const MAX = N + M;
    
    // Array of V vectors for each D value
    const V = {};
    V[1] = 0;
    
    // Array to store the path
    const trace = [];
    
    for (let D = 0; D <= MAX; D++) {
        trace.push({...V});
        
        for (let k = -D; k <= D; k += 2) {
            let x;
            
            if (k === -D || (k !== D && V[k - 1] < V[k + 1])) {
                x = V[k + 1];
            } else {
                x = V[k - 1] + 1;
            }
            
            let y = x - k;
            
            // Diagonal extension (equal elements)
            while (x < N && y < M && a[x] === b[y]) {
                x++;
                y++;
            }
            
            V[k] = x;
            
            // If we reached the end, we found the solution
            if (x >= N && y >= M) {
                return backtrack(trace, D, k, N, M);
            }
        }
    }
    
    return [];
}

/*  Rebuild edit sequence from trace  */
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
        
        // Add diagonal operations (equal elements)
        while (x > prevX && y > prevY) {
            x--;
            y--;
            editScript.unshift({ op: 'equal', x, y });
        }
        
        // Add edit operation
        if (x > prevX) {
            x--;
            editScript.unshift({ op: 'delete', x, y });
        } else if (y > prevY) {
            y--;
            editScript.unshift({ op: 'insert', x, y });
        }
        
        k = prevK;
    }
    
    // Add remaining equal elements at the beginning
    while (x > 0 && y > 0) {
        x--;
        y--;
        editScript.unshift({ op: 'equal', x, y });
    }
    
    return editScript;
}

/*  Find previous k in trace  */
function findPreviousK(k, prevV, V) {
    if (k === -Object.keys(prevV).length + 1 || (k !== Object.keys(prevV).length - 1 && prevV[k - 1] < prevV[k + 1])) {
        return k + 1;
    } else {
        return k - 1;
    }
}

/*  Detect lines that were moved from position  */
function detectMovedLines(originalLines, changedLines, editScript, normalize) {
    const moved = {
        original: new Set(),
        changed: new Set(),
        pairs: []
    };
    
    // Create content-to-indices maps to detect movements
    const origMap = new Map();
    const changedMap = new Map();
    
    originalLines.forEach((line, idx) => {
        const norm = normalize(line);
        if (!origMap.has(norm)) origMap.set(norm, []);
        origMap.get(norm).push(idx);
    });
    
    changedLines.forEach((line, idx) => {
        const norm = normalize(line);
        if (!changedMap.has(norm)) changedMap.set(norm, []);
        changedMap.get(norm).push(idx);
    });
    
    // Search for lines that appear in both texts but in different positions
    for (const [content, origIndices] of origMap) {
        if (changedMap.has(content)) {
            const changedIndices = changedMap.get(content);
            
            // If there's the same number of occurrences, it's likely a movement
            if (origIndices.length === changedIndices.length && origIndices.length === 1) {
                const origIdx = origIndices[0];
                const changedIdx = changedIndices[0];
                
                // Verify if it really moved (not in the same relative position)
                const thr = Math.max(2, Math.floor(0.1*originalLines.length));
                if (Math.abs(origIdx - changedIdx) > thr) {
                    moved.original.add(origIdx);
                    moved.changed.add(changedIdx);
                    moved.pairs.push({ original: origIdx, changed: changedIdx, content });
                }
            }
        }
    }
    
    return moved;
}

/*  Process edit script to generate final result  */
function processEditScript(editScript, originalLines, changedLines, moveDetection) {
    const result = {
        original: [],
        changed: [],
        stats: { added: 0, removed: 0, unchanged: 0, modified: 0, moved: 0 }
    };
    
    let origIdx = 0;
    let changedIdx = 0;
    
    // Group consecutive operations of the same type to detect modifications
    const groupedOps = groupConsecutiveOperations(editScript);
    
    for (const group of groupedOps) {
        if (group.type === 'equal') {
            // Unchanged lines
            for (let i = 0; i < group.count; i++) {
                const type = moveDetection.original.has(origIdx) ? 'moved' : 'unchanged';
                
                result.original.push({
                    type,
                    content: originalLines[origIdx],
                    number: result.original.length + 1,
                    moved: moveDetection.original.has(origIdx)
                });
                
                result.changed.push({
                    type: moveDetection.changed.has(changedIdx) ? 'moved' : 'unchanged',
                    content: changedLines[changedIdx],
                    number: result.changed.length + 1,
                    moved: moveDetection.changed.has(changedIdx)
                });
                
                if (type === 'moved') {
                    result.stats.moved++;
                } else {
                    result.stats.unchanged++;
                }
                
                origIdx++;
                changedIdx++;
            }
        } else if (group.type === 'mixed' && group.deletes === group.inserts) {
            // Modified lines (same number of consecutive deletes and inserts)
            for (let i = 0; i < group.deletes; i++) {
                const same = originalLines[origIdx] === changedLines[changedIdx];

                result.original.push({
                    type: same ? 'unchanged' : 'modified',
                    content: originalLines[origIdx],
                    number: result.original.length + 1
                });

                result.changed.push({
                    type: same ? 'unchanged' : 'modified',
                    content: changedLines[changedIdx],
                    number: result.changed.length + 1
                });

                if (same) {
                    result.stats.unchanged++;
                } else {
                    result.stats.modified++;
                }
                origIdx++;
                changedIdx++;
            }
        } else {
            // Process deletes
            for (let i = 0; i < group.deletes; i++) {
                const isMoved = moveDetection.original.has(origIdx);
                
                result.original.push({
                    type: isMoved ? 'moved' : 'removed',
                    content: originalLines[origIdx],
                    number: result.original.length + 1,
                    moved: isMoved
                });
                
                result.changed.push({
                    type: 'empty',
                    content: '',
                    number: result.changed.length + 1
                });
                
                if (isMoved) {
                    result.stats.moved++;
                } else {
                    result.stats.removed++;
                }
                
                origIdx++;
            }
            
            // Process inserts
            for (let i = 0; i < group.inserts; i++) {
                const isMoved = moveDetection.changed.has(changedIdx);
                
                result.original.push({
                    type: 'empty',
                    content: '',
                    number: result.original.length + 1
                });
                
                result.changed.push({
                    type: isMoved ? 'moved' : 'added',
                    content: changedLines[changedIdx],
                    number: result.changed.length + 1,
                    moved: isMoved
                });
                
                if (isMoved) {
                    result.stats.moved++;
                } else {
                    result.stats.added++;
                }
                
                changedIdx++;
            }
        }
    }
    
    return result;
}

/*  Group consecutive operations to detect modifications  */
function groupConsecutiveOperations(editScript) {
    const groups = [];
    let currentGroup = null;
    
    for (const op of editScript) {
        if (op.op === 'equal') {
            if (currentGroup) {
                groups.push(currentGroup);
                currentGroup = null;
            }
            groups.push({ type: 'equal', count: 1 });
        } else {
            if (!currentGroup) {
                currentGroup = { type: 'edit', deletes: 0, inserts: 0 };
            }
            
            if (op.op === 'delete') {
                currentGroup.deletes++;
            } else if (op.op === 'insert') {
                currentGroup.inserts++;
            }
        }
    }
    
    if (currentGroup) {
        // Determine if it's a modification or separate changes
        if (currentGroup.deletes > 0 && currentGroup.inserts > 0 && 
            Math.abs(currentGroup.deletes - currentGroup.inserts) <= 1) {
            currentGroup.type = 'mixed';
        }
        groups.push(currentGroup);
    }
    
    return groups;
}

/* Detects consecutive blocks of changed lines */
function computeBlocks(diff){
  // --- Save statistics from diff calculation ---
  const __statsBackup = diff && diff.stats ? { ...diff.stats } : null;

    const blocks=[]; let open=null;
    diff.original.forEach((o,idx)=>{
        const changed = (o.type!=="unchanged" || diff.changed[idx].type!=="unchanged");  
        if(changed && open===null) open={s:idx};
        if(!changed && open){ open.e=idx-1; blocks.push(open); open=null; }
    });
    if(open){ open.e=diff.original.length-1; blocks.push(open); }
    // --- Restore statistics before returning ---
    if (__statsBackup) diff.stats = __statsBackup;
    return blocks;
}

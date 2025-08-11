/* ---------- CDN Fallback and Dependency Validation ---------- */
function validateDependencies() {
    const issues = [];
    
    // Check DOMPurify
    if (typeof DOMPurify === 'undefined') {
        issues.push('DOMPurify (security library)');
    }
    
    // Check Prism.js
    if (typeof Prism === 'undefined') {
        issues.push('Prism.js (syntax highlighting)');
    }
    
    if (issues.length > 0) {
        console.warn('Missing dependencies:', issues);
        showToast(`Algunas funcionalidades pueden estar limitadas: ${issues.join(', ')}`, true);
    }
    
    return issues.length === 0;
}

if (!('inert' in HTMLElement.prototype)) {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@github/inert@latest/dist/inert.min.js';
    s.onerror = () => console.warn('Inert polyfill failed to load');
    document.head.appendChild(s);
}

/* ---------- External Workers with Fallback ---------- */
let regexWorker;
let heavyWorker;

try {
    // Try to load external workers first
    regexWorker = new Worker('./js/workers/regex-worker.js');
    heavyWorker = new Worker('./js/workers/diff-worker.js');
    
    // Test if worker is responsive
    heavyWorker.postMessage({ticket: 'test', job: 'diff', payload: {originalLines: ['test'], changedLines: ['test'], opts: {}}});
    
} catch (error) {
    console.warn('External workers failed to load, falling back to inline workers:', error);
    heavyWorker = null;
    
    // Fallback to inline workers
    const regexWorkerUrl = URL.createObjectURL(new Blob([`
        const REGEX_TIMEOUT_MS = 50;
        const PROBE_STRING = 'a'.repeat(1000);
        
        self.onmessage = function(e) {
            try {
                const pattern = new RegExp(e.data);
                const startTime = Date.now();
                pattern.test(PROBE_STRING);
                const executionTime = Date.now() - startTime;
                const isSafe = executionTime < REGEX_TIMEOUT_MS;
                postMessage(isSafe);
            } catch (error) {
                postMessage(false);
            }
        };
    `], {type: 'application/javascript'}));
    
    regexWorker = new Worker(regexWorkerUrl);
}

// Enhanced safeRegex function with timeout and error handling
function safeRegex(pattern, timeout = 250) {
    return new Promise((resolve) => {
        if (!regexWorker) {
            console.warn('Regex worker not available, assuming pattern is safe');
            resolve(true);
            return;
        }
        
        const timer = setTimeout(() => {
            resolve(false);
        }, timeout);
        
        regexWorker.onmessage = (message) => {
            clearTimeout(timer);
            resolve(message.data);
        };
        
        regexWorker.onerror = () => {
            clearTimeout(timer);
            resolve(false);
        };
        
        try {
            regexWorker.postMessage(pattern);
        } catch (error) {
            clearTimeout(timer);
            resolve(false);
        }
    });
}

/* ---------- Heavy Worker Setup with Enhanced Error Handling ---------- */
const pendingHeavy = new Map();

// Try to initialize heavy worker (if not already done)
if (!heavyWorker) {
    try {
        heavyWorker = new Worker('./js/workers/diff-worker.js');
        // External diff worker loaded successfully
    } catch (fallbackError) {
        console.warn('Failed to load external diff worker:', fallbackError);
        heavyWorker = null;
    }
}

if (heavyWorker) {
    heavyWorker.onmessage = ({data}) => {
        const {ticket, result, error, success} = data;
        
        // Ignore test messages
        if (ticket === 'test') {
            // Diff worker test successful
            return;
        }
        
        if (pendingHeavy.has(ticket)) {
            const resolver = pendingHeavy.get(ticket);
            pendingHeavy.delete(ticket);
            
            if (success && result !== undefined) {
                resolver(result);
            } else {
                console.error('Worker error:', error);
                resolver(null);
            }
        }
    };
    
    heavyWorker.onerror = (error) => {
        console.error('Heavy worker error:', error);
        // Resolve any pending promises with null
        pendingHeavy.forEach(resolver => resolver(null));
        pendingHeavy.clear();
        
        // Mark worker as unavailable
        heavyWorker = null;
    };
}

function runHeavy(job, payload, timeout = 30000) {
    return new Promise((resolve) => {
        if (!heavyWorker) {
            console.warn('Heavy worker not available');
            resolve(null);
            return;
        }
        
        const ticket = Math.random().toString(36).slice(2);
        
        // Set timeout for worker operations
        const timer = setTimeout(() => {
            if (pendingHeavy.has(ticket)) {
                pendingHeavy.delete(ticket);
                console.warn(`Worker job ${job} timed out`);
                resolve(null);
            }
        }, timeout);
        
        pendingHeavy.set(ticket, (result) => {
            clearTimeout(timer);
            resolve(result);
        });
        
        try {
            heavyWorker.postMessage({ticket, job, payload});
        } catch (error) {
            clearTimeout(timer);
            pendingHeavy.delete(ticket);
            console.error('Failed to send message to worker:', error);
            resolve(null);
        }
    });
}

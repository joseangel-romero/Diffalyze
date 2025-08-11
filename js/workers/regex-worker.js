/**
 * Web Worker for safe regex validation
 * Prevents ReDoS attacks by testing regex patterns in isolated environment
 */

const REGEX_TIMEOUT_MS = 50;
const PROBE_STRING = 'a'.repeat(1000);

self.onmessage = function(e) {
    try {
        const pattern = new RegExp(e.data);
        const startTime = Date.now();
        
        // Test the regex with a probe string to detect potentially dangerous patterns
        pattern.test(PROBE_STRING);
        
        const executionTime = Date.now() - startTime;
        const isSafe = executionTime < REGEX_TIMEOUT_MS;
        
        postMessage(isSafe);
    } catch (error) {
        // Invalid regex pattern
        postMessage(false);
    }
};

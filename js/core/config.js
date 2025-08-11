/**
 * Configuration file for Diffalyze performance settings and limits
 * Adjust these values based on your deployment environment and user needs
 */

window.DiffalyzeConfig = {
    // File size limits
    maxFileSize: 10 * 1024 * 1024, // 10MB in bytes
    maxLines: 50000, // Maximum number of lines per file
    
    // Performance thresholds
    largeFileThreshold: 1024 * 1024, // 1MB - files above this show loading indicators
    heavyComputationThreshold: 10000, // Lines above this use web workers
    
    // Timeouts (in milliseconds)
    workerTimeout: 30000, // 30 seconds for diff calculation
    regexTimeout: 250, // 250ms for regex validation
    debounceDelay: 300, // Input debounce delay
    
    // UI settings
    maxHistorySize: 50, // Maximum number of comparison history items
    scrollSyncBuffer: 600, // Pixels for scroll sync buffer
    
    // Feature flags
    features: {
        syntaxHighlighting: true,
        moveDetection: true,
        dragAndDrop: true,
        autoComparison: true,
        historyPanel: true,
        keyboardShortcuts: true
    },
    
    // CDN fallback URLs (in case primary CDNs fail)
    fallbackCDNs: {
        prism: [
            'https://unpkg.com/prismjs@1.29.0/components/',
            'https://cdn.skypack.dev/prismjs@1.29.0/'
        ],
        dompurify: [
            'https://unpkg.com/dompurify@3.0.2/dist/purify.min.js',
            'https://cdn.skypack.dev/dompurify@3.0.2'
        ]
    },
    
    // Language detection mappings
    languageMap: {
        // Programming languages
        js: 'javascript',
        jsx: 'javascript',
        ts: 'typescript',
        tsx: 'typescript',
        py: 'python',
        java: 'java',
        cpp: 'cpp',
        cxx: 'cpp',
        cc: 'cpp',
        c: 'c',
        h: 'c',
        hpp: 'cpp',
        cs: 'csharp',
        php: 'php',
        rb: 'ruby',
        go: 'go',
        rs: 'rust',
        swift: 'swift',
        kt: 'kotlin',
        scala: 'scala',
        
        // Web technologies
        html: 'markup',
        htm: 'markup',
        xml: 'markup',
        css: 'css',
        scss: 'scss',
        sass: 'sass',
        less: 'less',
        
        // Data formats
        json: 'json',
        yaml: 'yaml',
        yml: 'yaml',
        toml: 'toml',
        xml: 'markup',
        
        // Shell & Config
        sh: 'bash',
        bash: 'bash',
        zsh: 'bash',
        fish: 'bash',
        ps1: 'powershell',
        
        // Documentation
        md: 'markdown',
        markdown: 'markdown',
        rst: 'rest',
        
        // Databases
        sql: 'sql',
        
        // Other
        dockerfile: 'docker',
        makefile: 'makefile',
        gitignore: 'ignore'
    }
};

// Make config immutable to prevent accidental modifications
Object.freeze(window.DiffalyzeConfig);
Object.freeze(window.DiffalyzeConfig.features);
Object.freeze(window.DiffalyzeConfig.fallbackCDNs);
Object.freeze(window.DiffalyzeConfig.languageMap);

/* ---------- Application State Manager ---------- */
const AppState = {
    // Core diff data
    mergedLines: [],
    changeBlocks: [],
    latestDiff: null,
    
    // UI settings
    highlightMode: "line", // "line" | "word" | "char"
    currentLang: "",
    
    // History management
    undoStack: [],
    redoStack: [],
    
    // UI state
    isScrollSyncing: false,
    searchQuery: "",
    searchHits: [],
    currentHitIdx: -1,
    
    // Get configuration values with fallbacks
    get config() {
        return window.DiffalyzeConfig || {
            maxFileSize: 10 * 1024 * 1024,
            maxLines: 50000,
            maxHistorySize: 50,
            languageMap: {}
        };
    },
    
    get maxHistorySize() {
        return this.config.maxHistorySize;
    },
    
    get maxFileSize() {
        return this.config.maxFileSize;
    },
    
    get maxLines() {
        return this.config.maxLines;
    },
    
    // Initialization
    init() {
        document.body.dataset.highlight = this.highlightMode;
        this.loadSettings();
        // Initialize configuration
    },
    
    // Settings persistence
    saveSettings() {
        try {
            const settings = {
                highlightMode: this.highlightMode,
                currentLang: this.currentLang
            };
            localStorage.setItem('diffalyze_settings', JSON.stringify(settings));
        } catch (error) {
            console.warn('Could not save settings:', error);
        }
    },
    
    loadSettings() {
        try {
            const saved = localStorage.getItem('diffalyze_settings');
            if (saved) {
                const settings = JSON.parse(saved);
                this.highlightMode = settings.highlightMode || "line";
                this.currentLang = settings.currentLang || "";
                document.body.dataset.highlight = this.highlightMode;
            }
        } catch (error) {
            console.warn('Could not load settings:', error);
        }
    },
    
    // State validation
    validateInput(text, filename = '') {
        const errors = [];
        
        if (text.length > this.maxFileSize) {
            errors.push(`File ${filename} is too large (${(text.length / 1024 / 1024).toFixed(1)}MB > 10MB limit)`);
        }
        
        const lines = text.split('\n');
        if (lines.length > this.maxLines) {
            errors.push(`File ${filename} has too many lines (${lines.length} > ${this.maxLines} limit)`);
        }
        
        return errors;
    },
    
    // History management
    pushToHistory(state) {
        this.undoStack.push(JSON.parse(JSON.stringify(state)));
        if (this.undoStack.length > this.maxHistorySize) {
            this.undoStack.shift();
        }
        this.redoStack = []; // Clear redo stack when new action is performed
    },
    
    canUndo() {
        return this.undoStack.length > 0;
    },
    
    canRedo() {
        return this.redoStack.length > 0;
    }
};

// Initialize app state
AppState.init();

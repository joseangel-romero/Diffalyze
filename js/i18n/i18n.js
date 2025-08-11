/**
 * Internationalization (i18n) System for Diffalyze
 * Loads translation files dynamically and provides helper functions
 */

class I18nManager {
    constructor() {
        this.translations = {};
        this.currentLanguage = 'en'; // Default to English
        this.fallbackLanguage = 'en';
        this.supportedLanguages = ['es', 'en', 'fr'];
        this.loadingPromises = new Map();
    }

    /**
     * Initialize the i18n system
     */
    async init() {
        try {
            // Detect browser language
            const browserLang = this.detectBrowserLanguage();
            
            // Check for saved language preference
            const savedLang = localStorage.getItem('diffalyze_language');
            this.currentLanguage = savedLang || browserLang;

            // Load the current language
            await this.loadLanguage(this.currentLanguage);
            
            // Always ensure fallback language is loaded
            if (this.currentLanguage !== this.fallbackLanguage) {
                await this.loadLanguage(this.fallbackLanguage);
            }

            // i18n initialized successfully
        } catch (error) {
            console.error('Failed to initialize i18n system:', error);
            // Fallback to embedded translations if external loading fails
            this.loadEmbeddedTranslations();
        }
    }

    /**
     * Detect browser language
     */
    detectBrowserLanguage() {
        const browserLang = navigator.language || navigator.userLanguage || 'es';
        const langCode = browserLang.split('-')[0];
        
        if (this.supportedLanguages.includes(langCode)) {
            return langCode;
        }
        return this.fallbackLanguage;
    }

    /**
     * Load a specific language file
     */
    async loadLanguage(langCode) {
        if (!this.supportedLanguages.includes(langCode)) {
            console.warn(`Unsupported language: ${langCode}`);
            return false;
        }

        // Check if already loading
        if (this.loadingPromises.has(langCode)) {
            return this.loadingPromises.get(langCode);
        }

        // Check if already loaded
        if (this.translations[langCode]) {
            return true;
        }

        // Create loading promise
        const loadingPromise = this.fetchLanguageFile(langCode);
        this.loadingPromises.set(langCode, loadingPromise);

        try {
            const translations = await loadingPromise;
            this.translations[langCode] = translations;
            this.loadingPromises.delete(langCode);
            return true;
        } catch (error) {
            console.error(`Failed to load language ${langCode}:`, error);
            this.loadingPromises.delete(langCode);
            return false;
        }
    }

    /**
     * Fetch language file from server
     */
    async fetchLanguageFile(langCode) {
        const response = await fetch(`./js/i18n/${langCode}.json`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
    }

    /**
     * Set current language
     */
    async setLanguage(langCode) {
        if (!this.supportedLanguages.includes(langCode)) {
            console.warn(`Unsupported language: ${langCode}`);
            return false;
        }

        // Load language if not already loaded
        const loaded = await this.loadLanguage(langCode);
        if (!loaded) {
            return false;
        }

        this.currentLanguage = langCode;
        localStorage.setItem('diffalyze_language', langCode);
        
        // Update document language
        document.documentElement.lang = langCode;
        const rootHtml = document.getElementById('root-html');
        if (rootHtml) {
            rootHtml.lang = langCode;
        }
        
        // Language changed successfully
        return true;
    }

    /**
     * Get translation for a key (supports nested keys with dot notation)
     */
    t(keyPath, params = {}) {
        const translation = this.getNestedValue(this.translations[this.currentLanguage], keyPath) ||
                          this.getNestedValue(this.translations[this.fallbackLanguage], keyPath) ||
                          keyPath;

        // Simple parameter replacement
        return this.replaceParams(translation, params);
    }

    /**
     * Get nested value from object using dot notation
     */
    getNestedValue(obj, path) {
        if (!obj || !path) return undefined;
        
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);
    }

    /**
     * Replace parameters in translation string
     */
    replaceParams(str, params) {
        if (typeof str !== 'string' || !params || Object.keys(params).length === 0) {
            return str;
        }

        return str.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return params[key] !== undefined ? params[key] : match;
        });
    }

    /**
     * Load embedded translations as fallback
     */
    loadEmbeddedTranslations() {
        // This would contain the original embedded translations as fallback
        // In case external JSON files fail to load
        console.warn('Loading embedded translations as fallback');
        
        // For now, we'll set minimal translations
        this.translations = {
            es: {
                messages: {
                    loading_error: 'Error cargando traducciones'
                }
            },
            en: {
                messages: {
                    loading_error: 'Error loading translations'
                }
            },
            fr: {
                messages: {
                    loading_error: 'Erreur de chargement des traductions'
                }
            }
        };
    }

    /**
     * Update all UI elements with translations
     */
    updateUI() {
        // Update elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);
            
            if (element.tagName === 'INPUT' && (element.type === 'text' || element.type === 'search')) {
                element.placeholder = translation;
            } else if (element.tagName === 'TEXTAREA') {
                // Handle textarea placeholders specifically
                element.placeholder = translation;
            } else if (element.tagName === 'OPTION') {
                element.textContent = translation;
            } else if (element.hasAttribute('title')) {
                element.title = translation;
            } else if (element.hasAttribute('aria-label')) {
                element.setAttribute('aria-label', translation);
            } else {
                element.innerHTML = translation;
            }
        });

        // Update elements with data-i18n-title attribute
        document.querySelectorAll('[data-i18n-title]').forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            element.title = this.t(key);
        });

        // Update specific elements
        this.updateSpecialElements();
    }

    /**
     * Update elements that need special handling
     */
    updateSpecialElements() {
        // Update textareas placeholders specifically
        const originalTextarea = document.getElementById('originalText');
        if (originalTextarea) {
            originalTextarea.placeholder = this.t('text_areas.original_placeholder');
        }
        
        const changedTextarea = document.getElementById('changedText');
        if (changedTextarea) {
            changedTextarea.placeholder = this.t('text_areas.modified_placeholder');
        }
        
        // Update specific buttons that might not be updating correctly
        const compareBtn = document.getElementById('compareBtn');
        if (compareBtn) {
            compareBtn.innerHTML = this.t('toolbar.analyze_btn');
        }
        
        const clearBtn = document.getElementById('clearBtn');
        if (clearBtn) {
            clearBtn.innerHTML = this.t('toolbar.clear_btn');
        }
        
        // Update search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.placeholder = this.t('diff_analysis.search_placeholder');
            searchInput.setAttribute('aria-label', this.t('diff_analysis.search_label'));
        }
        
        // Update regex input
        const regexInput = document.getElementById('regexInput');
        if (regexInput) {
            regexInput.placeholder = this.t('toolbar.regex_placeholder');
            regexInput.title = this.t('toolbar.regex_title');
        }

        // Update no-diff message if displayed
        const diffResult = document.getElementById('diffResult');
        if (diffResult && diffResult.classList.contains('no-diff')) {
            diffResult.innerHTML = this.t('diff_analysis.no_diff');
        }
        
        // Update language selector title and aria-label
        const languageSelector = document.getElementById('languageSelector');
        if (languageSelector) {
            languageSelector.title = this.t('language.label');
            languageSelector.setAttribute('aria-label', this.t('language.label'));
        }
    }

    /**
     * Get available languages
     */
    getAvailableLanguages() {
        return this.supportedLanguages;
    }

    /**
     * Get current language
     */
    getCurrentLanguage() {
        return this.currentLanguage;
    }
}

// Create global instance
window.i18n = new I18nManager();

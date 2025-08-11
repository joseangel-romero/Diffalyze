/* ---------- Internationalization System Integration ---------- */

// Legacy compatibility functions that now use the new i18n system
function t(key) {
    return window.i18n ? window.i18n.t(key) : key;
}

function updateTexts() {
    if (window.i18n) {
        window.i18n.updateUI();
    }
}

function setLanguage(langCode) {
    if (window.i18n) {
        window.i18n.setLanguage(langCode).then(success => {
            if (success) {
                // Update the language selector
                const selector = document.getElementById('languageSelector');
                if (selector) {
                    selector.value = langCode;
                }
                
                // Force UI update
                setTimeout(() => {
                    window.i18n.updateUI();
                    // Force update specific buttons that might not be updating
                    const compareBtn = document.getElementById('compareBtn');
                    const clearBtn = document.getElementById('clearBtn');
                    if (compareBtn) compareBtn.innerHTML = window.i18n.t('toolbar.analyze_btn');
                    if (clearBtn) clearBtn.innerHTML = window.i18n.t('toolbar.clear_btn');
                }, 100);
                
                showToast(window.i18n.t('messages.language_changed'));
            }
        });
    }
}

async function initializeLanguage() {
    if (window.i18n) {
        await window.i18n.init();
        
        // Update language selector to match current language
        const selector = document.getElementById('languageSelector');
        if (selector) {
            selector.value = window.i18n.getCurrentLanguage();
        }
        
        // Update all UI elements with translations
        window.i18n.updateUI();
        
        // Language initialization complete
    }
}

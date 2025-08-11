/* ---------- File Handling Functions ---------- */

/*  Enhanced file loading with performance optimizations  */
function loadFile(fileInputId, textareaId) {
    const fileInput = document.getElementById(fileInputId);
    const textarea = document.getElementById(textareaId);
    const file = fileInput.files[0];
    if (!file) return;

    // Early validation
    const errors = AppState.validateInput(file.size.toString(), file.name);
    if (errors.length > 0) {
        showToast(`File validation failed: ${errors.join(', ')}`, true);
        fileInput.value = ''; // Reset file input
        return;
    }

    // Show loading state for large files
    const isLargeFile = file.size > 1024 * 1024; // 1MB
    if (isLargeFile) {
        showToast(`Loading large file (${(file.size / 1024 / 1024).toFixed(1)}MB)...`);
    }

    const reader = new FileReader();
    
    reader.onload = (e) => {
        try {
            const content = e.target.result;
            
            // Additional content validation
            const contentErrors = AppState.validateInput(content, file.name);
            if (contentErrors.length > 0) {
                showToast(`File content validation failed: ${contentErrors.join(', ')}`, true);
                return;
            }

            // Performance optimization: Use requestIdleCallback for large files
            const updateTextarea = () => {
                textarea.value = content;

                // Detect language type by extension
                const ext = file.name.split(".").pop().toLowerCase();
                const langMap = {
                    js: "javascript",
                    ts: "typescript", 
                    json: "json",
                    html: "markup",
                    htm: "markup",
                    css: "css",
                    py: "python",
                    java: "java",
                    cpp: "cpp",
                    c: "c",
                    php: "php",
                    rb: "ruby",
                    go: "go",
                    rs: "rust",
                    xml: "markup",
                    sql: "sql",
                    md: "markdown",
                    yml: "yaml",
                    yaml: "yaml"
                };
                
                const detected = langMap[ext] || "";
                if (detected) {
                    document.getElementById("languageSelect").value = detected;
                    AppState.currentLang = detected;
                    currentLang = detected; // Legacy compatibility
                }

                if (latestDiff) displayDiff(latestDiff);
                
                showToast(`${file.name} ${t('file_loaded')} ${textareaId.includes('original') ? t('original_text') : t('modified_text')}`);
            };

            if (isLargeFile && 'requestIdleCallback' in window) {
                requestIdleCallback(updateTextarea, { timeout: 1000 });
            } else {
                updateTextarea();
            }

            // Auto-compare with debouncing for better performance
            setTimeout(() => {
                const originalText = document.getElementById('originalText').value;
                const changedText = document.getElementById('changedText').value;
                
                if (originalText && changedText) {
                    // Debounce auto-comparison for large files
                    const delay = isLargeFile ? 1500 : 500;
                    setTimeout(() => {
                        compareTexts();
                        showToast(t('messages.auto_comparison'));
                    }, delay);
                }
            }, 100);

        } catch (error) {
            console.error('Error processing file:', error);
            showToast(`Error loading file: ${error.message}`, true);
        }
    };

    reader.onerror = () => {
        console.error('File reading failed');
        showToast('Failed to read file', true);
    };

    reader.onprogress = (e) => {
        if (isLargeFile && e.lengthComputable) {
            const percent = ((e.loaded / e.total) * 100).toFixed(0);
            // Could show progress bar here for very large files
            // Loading progress tracking
        }
    };

    reader.readAsText(file);
}

function loadFileContent(file, textareaId) {
    const textarea = document.getElementById(textareaId);
    const reader = new FileReader();
    
    reader.onload = (e) => {
        textarea.value = e.target.result;

        // Detect language type by extension
        const ext = file.name.split(".").pop().toLowerCase();
        const langMap = {
            js: "javascript",
            json: "json",
            html: "markup",
            htm: "markup",
            css: "css",
            py: "python",
            java: "java",
            php: "php",
            xml: "markup",
            sql: "sql",
            md: "markdown"
        };
        
        const detected = langMap[ext] || "";
        if (detected) {
            document.getElementById("languageSelect").value = detected;
            currentLang = detected;
        }

        // Auto-compare if both fields have content
        const originalText = document.getElementById('originalText').value;
        const changedText = document.getElementById('changedText').value;
        
        if (originalText && changedText) {
            setTimeout(() => {
                compareTexts();
                showToast(t('messages.auto_comparison'));
            }, 500);
        }
    };
    reader.readAsText(file);
}

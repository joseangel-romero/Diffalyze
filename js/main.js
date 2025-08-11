/* ---------- Main Application Entry Point ---------- */

// Global application state
let mergedLines = [];
let changeBlocks = [];
let highlightMode = "line";
let currentLang = "";
let latestDiff = null;
let undoStack = [];
let redoStack = [];

/* ---------- Application Initialization ---------- */
async function initializeApplication() {
    try {
        // Initialize internationalization
        await initializeLanguage();
        
        // Validate environment and dependencies
        const hasValidDeps = validateDependencies();
        
        // Setup event listeners with error handling
        setupEventListeners();
        
        // Initialize UI components
        setupDragAndDrop();
        setupKeyboardShortcuts();
        
    } catch (error) {
        showToast('Application initialization failed. Some features may not work correctly.', true);
    }
}

function setupEventListeners() {
    try {
        // Enhanced error handling for all event listeners
        const safeEventListener = (element, event, handler) => {
            if (element) {
                element.addEventListener(event, (e) => {
                    try {
                        handler(e);
                    } catch (error) {
                        showToast(`UI error: ${error.message}`, true);
                    }
                });
            }
        };
        
        // Diff options change handlers
        ["unifiedToggle", "collapseToggle", "ignoreToggle", "blankToggle"].forEach(id => {
            const element = document.getElementById(id);
            safeEventListener(element, "change", () => {
                // If there's already a calculated diff, just update the view
                if (AppState.latestDiff && id === "unifiedToggle") {
                    displayDiff(AppState.latestDiff);
                } else {
                    compareTexts();
                }
            });
        });
        
        // Regex input with debouncing
        const regexInput = document.getElementById("regexInput");
        if (regexInput) {
            let regexTimeout;
            safeEventListener(regexInput, "input", () => {
                clearTimeout(regexTimeout);
                regexTimeout = setTimeout(() => compareTexts(), 300);
            });
        }
        
        // Highlight mode radio buttons
        document.querySelectorAll('input[name="hlMode"]').forEach(radio => {
            safeEventListener(radio, 'change', (e) => setHighlightMode(e.target.value));
        });
        
        // Language selector
        const langSel = document.getElementById("languageSelect");
        safeEventListener(langSel, "change", () => {
            AppState.currentLang = langSel.value;
            currentLang = langSel.value; // Legacy compatibility
            AppState.saveSettings();
            compareTexts();
        });
        
    } catch (error) {
        showToast('Error setting up interface. Some features may not work.', true);
    }
}

// Call initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeApplication();
        initializeSampleText();
    });
} else {
    initializeApplication();
    initializeSampleText();
}

// Legacy compatibility - expose some variables globally for existing code
mergedLines = AppState.mergedLines;
changeBlocks = AppState.changeBlocks;
highlightMode = AppState.highlightMode;
currentLang = AppState.currentLang;
latestDiff = AppState.latestDiff;
undoStack = AppState.undoStack;
redoStack = AppState.redoStack;

//  Live example - Initialize with sample text
function initializeSampleText() {
    // Initialize language system
    initializeLanguage();
    
    setupDragAndDrop();
    
    document.getElementById("originalText").value = `# Bubble Sort Algorithm - Basic Version
def bubble_sort(arr):
    """Basic implementation of bubble sort algorithm"""
    n = len(arr)
    
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    
    return arr

def main():
    # Example list
    numbers = [64, 34, 25, 12, 22, 11, 90]
    print("Original list:", numbers)
    
    sorted_numbers = bubble_sort(numbers)
    print("Sorted list:", sorted_numbers)

if __name__ == "__main__":
    main()`;

    document.getElementById("changedText").value = `# Bubble Sort Algorithm - Optimized Version
def bubble_sort(arr):
    """Optimized implementation of bubble sort algorithm with early stopping"""
    n = len(arr)
    
    for i in range(n):
        # Flag to detect if there were swaps
        swapped = False
        
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                # Swap with more readable unpacking
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
                swapped = True
        
        # If no swaps occurred, the list is already sorted
        if not swapped:
            break
    
    return arr

def benchmark_sorting(arr, algorithm_name="Bubble Sort"):
    """Function to measure algorithm performance"""
    import time
    
    start_time = time.time()
    sorted_arr = bubble_sort(arr.copy())
    end_time = time.time()
    
    print(f"{algorithm_name} completed in {end_time - start_time:.4f} seconds")
    return sorted_arr

def main():
    # Larger example list for testing
    numbers = [64, 34, 25, 12, 22, 11, 90, 88, 76, 50, 42]
    print("Original list:", numbers)
    
    # Use the new benchmark function
    sorted_numbers = benchmark_sorting(numbers, "Optimized Bubble Sort")
    print("Sorted list:", sorted_numbers)
    
    # Verify that it's correctly sorted
    assert sorted_numbers == sorted(numbers), "Algorithm error!"
    print("✓ Verification completed - algorithm works correctly")

if __name__ == "__main__":
    main()`;
    
    // Configure language as Python for syntax highlighting
    const languageSelect = document.getElementById("languageSelect");
    if (languageSelect) {
        languageSelect.value = "python";
        AppState.currentLang = "python";
        currentLang = "python"; // Legacy compatibility
    }
    
    updateHistoryButtons();
    
    // Initialize history
    updateHistoryDisplay();
}

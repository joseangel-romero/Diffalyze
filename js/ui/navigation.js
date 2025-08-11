/* ---------- Navigation and UI Additional Functions ---------- */

// Modern navigation handling
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = ['comparison', 'history'];
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            if (link.href.includes('#')) {
                e.preventDefault();
                
                // Update active state
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                // Show relevant sections (you can implement this)
                const href = link.getAttribute('href');
                if (href === '#comparison') {
                    // Scroll to comparison area
                    document.getElementById('comparison')?.scrollIntoView({ behavior: 'smooth' });
                } else if (href === '#history') {
                    // Show history modal or scroll to history
                    toggleModal('historyModal');
                }
            }
        });
    });
}

// Mobile menu toggle
function toggleBurger(button) {
    const navMenu = document.getElementById('mainNav');
    const isOpen = button.getAttribute('aria-expanded') === 'true';
    
    button.setAttribute('aria-expanded', !isOpen);
    navMenu.classList.toggle('open');
}

/*  Toggle burger menu  */
function toggleBurger(btn){
    const navMenu = document.getElementById('mainNav');
    const mainEl  = document.querySelector('main');
    const isOpen  = navMenu.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(isOpen));
    mainEl.inert = isOpen;           // header remains operational
}

/* ─────────── Compact Toolbar Functions ─────────── */

// Toggle options dropdown menu
function toggleOptionsMenu() {
    const menu = document.getElementById('optionsMenu');
    const isOpen = menu.classList.contains('open');
    
    if (isOpen) {
        menu.classList.remove('open');
        document.removeEventListener('click', closeOptionsMenuOnOutsideClick);
    } else {
        menu.classList.add('open');
        // Close when clicking outside
        setTimeout(() => {
            document.addEventListener('click', closeOptionsMenuOnOutsideClick);
        }, 0);
    }
}

function closeOptionsMenuOnOutsideClick(event) {
    const menu = document.getElementById('optionsMenu');
    const dropdown = document.querySelector('.options-dropdown');
    
    if (!dropdown.contains(event.target)) {
        menu.classList.remove('open');
        document.removeEventListener('click', closeOptionsMenuOnOutsideClick);
    }
}

// Initialize compact toolbar
function initCompactToolbar() {
    // Setup toggle buttons
    const toggleButtons = document.querySelectorAll('.toggle-btn');
    toggleButtons.forEach(btn => {
        const targetId = btn.getAttribute('data-toggle');
        const checkbox = document.getElementById(targetId);
        
        if (checkbox) {
            // Sync initial state
            btn.classList.toggle('active', checkbox.checked);
            
            // Handle toggle button clicks
            btn.addEventListener('click', () => {
                checkbox.checked = !checkbox.checked;
                btn.classList.toggle('active', checkbox.checked);
                
                // Trigger change event for existing handlers
                const changeEvent = new Event('change', { bubbles: true });
                checkbox.dispatchEvent(changeEvent);
            });
            
            // Listen for programmatic changes to checkbox
            checkbox.addEventListener('change', () => {
                btn.classList.toggle('active', checkbox.checked);
            });
        }
    });
    
    // Close dropdown when ESC is pressed
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            // Close options dropdown
            const menu = document.getElementById('optionsMenu');
            if (menu.classList.contains('open')) {
                menu.classList.remove('open');
                document.removeEventListener('click', closeOptionsMenuOnOutsideClick);
                return;
            }
            
            // Close shortcuts modal
            const shortcutsModal = document.getElementById('shortcutsModal');
            if (shortcutsModal && shortcutsModal.style.display === 'flex') {
                toggleShortcutsModal(false);
                return;
            }
        }
    });
}

// Initialize navigation when DOM is ready
document.addEventListener('DOMContentLoaded', initNavigation);

// Initialize compact toolbar when DOM is ready
document.addEventListener('DOMContentLoaded', initCompactToolbar);

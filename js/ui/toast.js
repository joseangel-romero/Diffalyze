/* ---------- Toast Notification System ---------- */

function showToast(message, isError = false) {
    // Calculate vertical position based on existing notifications
    const existingToasts = document.querySelectorAll('.toast-notification');
    let bottomOffset = 2; // rem - base position
    
    existingToasts.forEach(toast => {
        const toastHeight = toast.offsetHeight;
        const toastMargin = 12; // space between notifications in px
        bottomOffset += (toastHeight + toastMargin) / 16; // convert to rem (assuming 16px base)
    });

    const toast = document.createElement("div");
    toast.setAttribute('role','status');
    toast.setAttribute('aria-live','assertive');
    toast.tabIndex = 0;
    setTimeout(()=>toast.focus(),10);
    toast.setAttribute('role','status');
    toast.setAttribute('aria-live','assertive');
    toast.className = "toast-notification"; // Add class for identification
    
    // Add icon and message
    const icon = isError ? "❌" : "✅";
    toast.innerHTML = `<span style="margin-right: 0.5rem;">${icon}</span>${message}`;
    
    toast.style.position = "fixed";
    toast.style.bottom = `${bottomOffset}rem`;
    toast.style.right = "2rem";
    toast.style.padding = "0.75rem 1.25rem";
    toast.style.borderRadius = "8px";
    toast.style.fontSize = "0.85rem";
    toast.style.zIndex = "10000";
    toast.style.background = isError ? "var(--error)" : "var(--success)";
    toast.style.color = "#fff";
    toast.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
    toast.style.opacity = "0";
    toast.style.transition = "all 0.3s ease";
    toast.style.transform = "translateX(100%)"; // Entry animation from the right
    toast.style.maxWidth = "300px";
    toast.style.wordWrap = "break-word";

    document.body.appendChild(toast);
    
    // Animate entry
    requestAnimationFrame(() => {
        toast.style.opacity = "1";
        toast.style.transform = "translateX(0)";
    });

    // Configure auto-removal
    const autoRemoveTimeout = setTimeout(() => {
        removeToast(toast);
    }, 3000); // 3 seconds for better readability

    // Allow closing by clicking
    toast.addEventListener('click', () => {
        clearTimeout(autoRemoveTimeout);
        removeToast(toast);
    });

    // Add pointer cursor to indicate it's clickable
    toast.style.cursor = "pointer";
    
    // Add tooltip title
    toast.title = "Click to close";
}

// Helper function to remove toast with animation
function removeToast(toast) {
    if (!toast.parentNode) return;
    
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100%)";
    
    toast.addEventListener("transitionend", () => {
        if (toast.parentNode) {
            toast.remove();
            // Readjust positions of remaining notifications
            repositionToasts();
        }
    }, { once: true });
}

// Function to readjust positions when a notification is removed
function repositionToasts() {
    const existingToasts = document.querySelectorAll('.toast-notification');
    let bottomOffset = 2; // rem - base position

    existingToasts.forEach((toast, index) => {
        toast.style.bottom = `${bottomOffset}rem`;
        const toastHeight = toast.offsetHeight;
        const toastMargin = 12; // space between notifications in px
        bottomOffset += (toastHeight + toastMargin) / 16; // convertir a rem
    });
}

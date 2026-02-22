// Load header HTML
fetch('../components/header.html')
    .then(response => response.text())
    .then(html => {
        document.getElementById('headerContainer').innerHTML = html;
        // Initialize header for this page (renamed tab to 'credits')
        initializeHeader('credits');
    })
    .catch(error => console.error('Error loading header:', error));

// Copy to clipboard function
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('Copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy:', err);
    });
}

// Regenerate key function
function regenerateKey(keyType) {
    const confirmed = confirm(`Are you sure you want to regenerate your ${keyType} API key? This action cannot be undone.`);
    if (confirmed) {
        console.log(`Regenerating ${keyType} key...`);
        // TODO: Implement key regeneration via backend API
        alert(`${keyType} key regenerated successfully!`);
    }
}

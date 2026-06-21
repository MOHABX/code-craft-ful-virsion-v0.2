document.addEventListener('DOMContentLoaded', async () => {
    // 0. Global Styles Injection (Dark Mode)
    const style = document.createElement('style');
    style.innerHTML = `
        body.dark-mode {
            background-color: #121212 !important;
            color: #e0e0e0 !important;
        }
        body.dark-mode header {
            background-color: #1e1e1e !important;
        }
        body.dark-mode .user-profile, body.dark-mode .course-card, body.dark-mode .card, body.dark-mode .login-card {
            background-color: #1e1e1e !important;
            color: #e0e0e0 !important;
            border-color: #333 !important;
        }
        body.dark-mode h1, body.dark-mode h2, body.dark-mode h3, body.dark-mode h4, body.dark-mode h5, body.dark-mode h6, body.dark-mode p, body.dark-mode span {
            color: #e0e0e0 !important;
        }
        body.dark-mode a {
            color: #bb86fc !important;
        }
        body.dark-mode input, body.dark-mode textarea, body.dark-mode select {
            background-color: #333 !important;
            color: #fff !important;
            border-color: #555 !important;
        }
    `;
    document.head.appendChild(style);

    const darkModeBtn = document.getElementById('darkModeToggle');
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    if (isDarkMode) document.body.classList.add('dark-mode');
    
    if (darkModeBtn) {
        darkModeBtn.innerHTML = isDarkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        darkModeBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            localStorage.setItem('darkMode', isDark);
            darkModeBtn.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        });
    }

    // All auth and UI logic have been moved to auth.js for RBAC support.
});

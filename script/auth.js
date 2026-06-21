document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initial State: Assume Guest
    let currentRole = 'guest';

    // 2. Read from localStorage
    const authToken = localStorage.getItem('authToken');
    const storedRole = localStorage.getItem('role');

    if (authToken && storedRole) {
        currentRole = storedRole;
    }

    // Apply the initial role class to body to prevent flash of unstyled content
    document.body.classList.add(`role-${currentRole}`);

    // 3. Define Route Protection Rules
    const path = window.location.pathname.toLowerCase();
    const isDoctorPage = path.includes('dr-');
    const isStudentPage = path.includes('st-');
    const isAdminPage = path.includes('admin-');
    const isAuthPage = path.includes('login.html') || path.includes('signup');

    // 4. Validate Token with Backend asynchronously to ensure session is real
    if (authToken) {
        try {
            const res = await fetch('/api/auth/me', {
                method: 'GET',
                // Keep credentials: 'include' if the backend still expects the HTTP-Only cookie 
                // alongside our localStorage mechanism.
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            if (!res.ok) {
                // Token invalid or expired
                handleLogout(false);
            } else {
                // Update role just in case it changed
                const { data } = await res.json();
                if (data.role && data.role !== currentRole) {
                    document.body.classList.remove(`role-${currentRole}`);
                    currentRole = data.role;
                    localStorage.setItem('role', currentRole);
                    document.body.classList.add(`role-${currentRole}`);
                }
            }
        } catch (err) {
            console.error('Auth validation error:', err);
        }
    }

    // 5. Enforce RBAC Routing
    if (isDoctorPage && currentRole !== 'doctor') {
        window.location.href = getDefaultRoute(currentRole);
    } else if (isStudentPage && currentRole !== 'student') {
        window.location.href = getDefaultRoute(currentRole);
    } else if (isAdminPage && currentRole !== 'admin') {
        window.location.href = getDefaultRoute(currentRole);
    } else if (isAuthPage && currentRole !== 'guest') {
        window.location.href = getDefaultRoute(currentRole);
    }

    // 6. Bind Global Logout Button (if it exists in the DOM)
    const logoutBtns = document.querySelectorAll('.logout-btn, #globalLogoutBtn');
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            handleLogout(true);
        });
    });
});

function getDefaultRoute(role) {
    switch (role) {
        case 'doctor': return '/html/dr-dashboard.html';
        case 'student': return '/html/st-profile.html';
        case 'admin': return '/html/admin-dashboard.html';
        default: return '/html/login.html';
    }
}

async function handleLogout(callApi = true) {
    if (callApi) {
        try {
            await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
        } catch (e) {
            console.error(e);
        }
    }
    localStorage.removeItem('authToken');
    localStorage.removeItem('role');
    window.location.href = '/html/login.html';
}

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Select all role-specific UI elements
    const guestElements = document.querySelectorAll('.guest-only');
    const studentElements = document.querySelectorAll('.student-only');
    const doctorElements = document.querySelectorAll('.doctor-only');
    const adminElements = document.querySelectorAll('.admin-only');

    // 2. Default State: Initially hide all role-specific UI elements
    const hideAllRoles = () => {
        guestElements.forEach(el => el.style.display = 'none');
        studentElements.forEach(el => el.style.display = 'none');
        doctorElements.forEach(el => el.style.display = 'none');
        adminElements.forEach(el => el.style.display = 'none');
    };

    // Helper to show specific elements
    const showRoleElements = (elements) => {
        elements.forEach(el => el.style.display = 'flex'); // using flex to match your UI layout
    };

    hideAllRoles();

    // 3. State Checking
    const authToken = localStorage.getItem('authToken');
    const role = localStorage.getItem('role');

    if (!authToken || !role) {
        // No token exists: Display ONLY the .guest-only elements
        showRoleElements(guestElements);
        bindLogoutButtons();
        return;
    }

    // Since token exists, show the role UI optimistically before validation (optional, for speed)
    // Or we wait for validation. We'll show optimistically for better UX, then validate.
    if (role === 'student') showRoleElements(studentElements);
    else if (role === 'doctor') showRoleElements(doctorElements);
    else if (role === 'admin') showRoleElements(adminElements);
    else showRoleElements(guestElements);

    // 4. Token Validation (Security)
    try {
        const response = await fetch('/api/auth/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (!response.ok) {
            // 401 Unauthorized / expired token
            clearSession();
            hideAllRoles();
            showRoleElements(guestElements);
        } else {
            // 5. Dynamic UI Rendering: Confirmed Valid
            const result = await response.json();
            const actualRole = result.data.role || role;
            
            // If the role from the server doesn't match localStorage, fix it
            if (actualRole !== role) {
                localStorage.setItem('role', actualRole);
                hideAllRoles();
                if (actualRole === 'student') showRoleElements(studentElements);
                else if (actualRole === 'doctor') showRoleElements(doctorElements);
                else if (actualRole === 'admin') showRoleElements(adminElements);
                else showRoleElements(guestElements);
            }
        }
    } catch (error) {
        console.error('Session validation error:', error);
        // On network failure, we fallback to guest state for security
        clearSession();
        hideAllRoles();
        showRoleElements(guestElements);
    }

    // 6. Logout Functionality
    bindLogoutButtons();
});

function bindLogoutButtons() {
    const logoutBtns = document.querySelectorAll('.logout-btn');
    logoutBtns.forEach(btn => {
        // Prevent adding multiple listeners if called twice
        btn.replaceWith(btn.cloneNode(true));
    });
    
    // Select again after cloning
    document.querySelectorAll('.logout-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            // Optional: call the logout API if it exists to clear server-side cookies
            try {
                await fetch('/api/auth/logout', { method: 'POST' });
            } catch (err) {
                console.error(err);
            }

            clearSession();
            window.location.href = '/html/login.html';
        });
    });
}

function clearSession() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('role');
}

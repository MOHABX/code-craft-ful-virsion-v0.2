document.addEventListener('DOMContentLoaded', async () => {
    // Check auth immediately
    let userRes;
    try {
        userRes = await fetch('/api/auth/me', { credentials: 'include' });
        if (!userRes.ok) {
            window.location.href = '/html/login.html';
            return;
        }
    } catch (e) {
        window.location.href = '/html/login.html';
        return;
    }

    // 1. Fetch Dashboard Data
    try {
        const response = await fetch('/api/users/dashboard', {
            credentials: 'include'
        });
        const result = await response.json();

        if (response.ok) {
            document.getElementById('totalCoursesCount').innerText = result.data.totalCourses || 0;
            document.getElementById('totalStudentsCount').innerText = result.data.totalStudents || 0;
            document.getElementById('totalVideosCount').innerText = result.data.totalVideos || 0;
        }
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
    }

    // 2. Tab Navigation
    const btnOverview = document.getElementById('btn-overview');
    const btnStudents = document.getElementById('btn-students');
    const btnSettings = document.getElementById('btn-settings');
    const panelOverview = document.getElementById('panel-overview');
    const panelStudents = document.getElementById('panel-students');
    const panelSettings = document.getElementById('panel-settings');
    const navItems = [btnOverview, btnStudents, btnSettings];

    function showPanel(panelToShow, activeBtn) {
        if (!panelToShow || !activeBtn) return;
        
        // Hide all panels
        [panelOverview, panelStudents, panelSettings].forEach(p => {
            if (p) p.classList.add('hidden');
        });
        
        // Remove active class from all buttons
        navItems.forEach(btn => {
            if (btn) btn.classList.remove('active', 'bg-[#F4F4FF]', 'text-[#6C5CE7]');
        });

        // Show target panel
        panelToShow.classList.remove('hidden');
        
        // Highlight active button
        activeBtn.classList.add('active', 'bg-[#F4F4FF]', 'text-[#6C5CE7]');
    }

    if (btnOverview) btnOverview.addEventListener('click', (e) => { e.preventDefault(); showPanel(panelOverview, btnOverview); });
    if (btnStudents) btnStudents.addEventListener('click', (e) => { e.preventDefault(); showPanel(panelStudents, btnStudents); });
    if (btnSettings) btnSettings.addEventListener('click', (e) => { e.preventDefault(); showPanel(panelSettings, btnSettings); });

    // 3. Logout
    const btnLogout = document.getElementById('logoutBtn');
    if (btnLogout) {
        btnLogout.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
            } catch(e) {}
            window.location.href = '/html/home.html';
        });
    }

    // Fetch user details for profile chip
    try {
        const userData = await userRes.json();
        if (userRes.ok) {
            document.getElementById('dashInstructorName').innerText = userData.data.name;
            if (userData.data.profilePic && userData.data.profilePic !== 'default-avatar.png') {
                document.getElementById('dashInstructorPic').src = userData.data.profilePic;
            }
            // Populate settings fields
            const settingsName = document.getElementById('settingsName');
            const settingsEmail = document.getElementById('settingsEmail');
            if (settingsName) settingsName.value = userData.data.name;
            if (settingsEmail) settingsEmail.value = userData.data.email;
        }
    } catch (err) {
        console.error(err);
    }

    // 4. Update Details
    const updateDetailsForm = document.getElementById('updateDetailsForm');
    if (updateDetailsForm) {
        updateDetailsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('settingsName').value;
            const email = document.getElementById('settingsEmail').value;
            
            const btn = updateDetailsForm.querySelector('button');
            const originalText = btn.innerHTML;
            btn.innerHTML = 'Updating...';
            btn.disabled = true;

            try {
                const res = await fetch('/api/auth/me/details', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ name, email })
                });
                const data = await res.json();
                if (res.ok) {
                    alert('Information updated successfully!');
                    document.getElementById('dashInstructorName').innerText = name;
                } else {
                    alert('Error: ' + data.message);
                }
            } catch (err) {
                alert('Server Error');
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        });
    }

    // 5. Update Password
    const updatePasswordForm = document.getElementById('updatePasswordForm');
    if (updatePasswordForm) {
        updatePasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            
            const btn = updatePasswordForm.querySelector('button');
            const originalText = btn.innerHTML;
            btn.innerHTML = 'Updating...';
            btn.disabled = true;

            try {
                const res = await fetch('/api/auth/me/password', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ currentPassword, newPassword })
                });
                const data = await res.json();
                if (res.ok) {
                    alert('Password changed successfully! Please log in again.');
                    window.location.href = '/html/login.html';
                } else {
                    alert('Error: ' + data.message);
                }
            } catch (err) {
                alert('Server Error');
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        });
    }

    // 6. Delete Account
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', async () => {
            if (confirm('Are you absolutely sure you want to delete your account? This cannot be undone.')) {
                try {
                    const res = await fetch('/api/auth/me', {
                        method: 'DELETE',
                        credentials: 'include'
                    });
                    if (res.ok) {
                        alert('Account deleted successfully.');
                        window.location.href = '/html/home.html';
                    } else {
                        const data = await res.json();
                        alert('Error: ' + data.message);
                    }
                } catch (err) {
                    alert('Server Error');
                }
            }
        });
    }
});

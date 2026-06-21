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
            document.getElementById('enrolledCoursesCount').innerText = result.data.enrolledCourses || 0;
            document.getElementById('completedVideosCount').innerText = result.data.completedVideos || 0;
            document.getElementById('avgQuizScore').innerText = (result.data.avgQuizScore || 0) + '%';
        }
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
    }

    // Tab Navigation logic removed. The sidebar now uses real page links.

    // 3. Logout
    const btnLogout = document.getElementById('btn-logout-st');
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
            document.getElementById('dashStudentNameHeader').innerText = userData.data.name;
            document.getElementById('dashStudentName').innerText = userData.data.name;
            if (userData.data.profilePic && userData.data.profilePic !== 'default-avatar.png') {
                document.getElementById('dashStudentPic').src = userData.data.profilePic;
            }
        }
    } catch (err) {
        console.error(err);
    }
});

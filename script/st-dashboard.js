document.addEventListener('DOMContentLoaded', async () => {
    // التحقق من المصادقة فوراً
    let userRes;
    try {
        // يا رفيقي هني بوابة الدخول، نشيك على هوية الرجال وندخله إذا علمه غانم
        userRes = await fetch('/api/auth/me', { credentials: 'include' });
        if (!userRes.ok) {
            window.location.href = '/html/login.html';
            return;
        }
    } catch (e) {
        window.location.href = '/html/login.html';
        return;
    }

    // 1. جلب بيانات لوحة التحكم
    try {
        // هني نجيب ملف الرجال وعلومه الشخصية، عشان نعرف مع مين نسولف
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

    // تم إزالة منطق التبويبات. الشريط الجانبي يستخدم روابط حقيقية الآن.

    // 3. تسجيل الخروج
    const btnLogout = document.getElementById('btn-logout-st');
    if (btnLogout) {
        btnLogout.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                // هني نجيب ملف الرجال وعلومه الشخصية، عشان نعرف مع مين نسولف
                await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
            } catch(e) {}
            window.location.href = '/html/home.html';
        });
    }

    // جلب تفاصيل المستخدم للملف الشخصي
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

document.addEventListener('DOMContentLoaded', async () => {
    // 1. تحديد كافة عناصر الواجهة الخاصة بكل صلاحية
    const guestElements = document.querySelectorAll('.guest-only');
    const studentElements = document.querySelectorAll('.student-only');
    const doctorElements = document.querySelectorAll('.doctor-only');
    const adminElements = document.querySelectorAll('.admin-only');

    // 2. الحالة الافتراضية: إخفاء جميع عناصر الصلاحيات مبدئياً
    const hideAllRoles = () => {
        guestElements.forEach(el => el.style.display = 'none');
        studentElements.forEach(el => el.style.display = 'none');
        doctorElements.forEach(el => el.style.display = 'none');
        adminElements.forEach(el => el.style.display = 'none');
    };

    // دالة مساعدة لإظهار عناصر محددة
    const showRoleElements = (elements) => {
        elements.forEach(el => el.style.display = 'flex'); // استخدام flex لمطابقة تخطيط الواجهة
    };

    hideAllRoles();

    // 3. فحص الحالة
    const authToken = localStorage.getItem('authToken');
    const role = localStorage.getItem('role');

    if (!authToken || !role) {
        // لا يوجد رمز: عرض عناصر الزوار فقط
        showRoleElements(guestElements);
        bindLogoutButtons();
        return;
    }

    // بما أن الرمز موجود، أظهر واجهة المستخدم بشكل تفاؤلي قبل التحقق (للسرعة)
    // أو ننتظر التحقق. سنعرضها لتجربة مستخدم أفضل ثم نتحقق.
    if (role === 'student') showRoleElements(studentElements);
    else if (role === 'doctor') showRoleElements(doctorElements);
    else if (role === 'admin') showRoleElements(adminElements);
    else showRoleElements(guestElements);

    // 4. التحقق من الرمز (للأمان)
    try {
        // هني نجيب ملف الرجال وعلومه الشخصية، عشان نعرف مع مين نسولف
        const response = await fetch('/api/auth/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (!response.ok) {
            // 401 غير مصرح / رمز منتهي الصلاحية
            clearSession();
            hideAllRoles();
            showRoleElements(guestElements);
        } else {
            // 5. تقديم الواجهة ديناميكياً: تم التأكيد
            const result = await response.json();
            const actualRole = result.data.role || role;
            
            // إذا كانت الصلاحية من السيرفر لا تطابق الذاكرة المحلية، أصلحها
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
        // عند فشل الشبكة، نعود لحالة الزائر للأمان
        clearSession();
        hideAllRoles();
        showRoleElements(guestElements);
    }

    // 6. وظيفة تسجيل الخروج
    bindLogoutButtons();
});

function bindLogoutButtons() {
    const logoutBtns = document.querySelectorAll('.logout-btn');
    logoutBtns.forEach(btn => {
        // منع إضافة عدة مستمعين إذا تم استدعاؤها مرتين
        btn.replaceWith(btn.cloneNode(true));
    });
    
    // التحديد مجدداً بعد الاستنساخ
    document.querySelectorAll('.logout-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            // اختياري: استدعاء API تسجيل الخروج إن وجد لمسح ملفات تعريف الارتباط من السيرفر
            try {
                // هني نجيب ملف الرجال وعلومه الشخصية، عشان نعرف مع مين نسولف
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

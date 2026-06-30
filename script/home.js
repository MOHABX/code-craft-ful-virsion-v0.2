document.addEventListener("DOMContentLoaded", () => {
    // ==========================================
    // 1. Search Box Logic (منطق عمل صندوق البحث)
    // ==========================================
    // هذا الكود يستهدف مربع البحث الموجود في صفحة الـ HTML برقم (id="searchbox")
    const form = document.getElementById("searchbox");
    if (form) {
        // الوصول إلى حقل إدخال النص داخل الفورم
        const input = form.querySelector("input");
        
        // إضافة حدث "submit" يتنفذ عندما يضغط المستخدم على زر البحث أو Enter
        form.addEventListener("submit", function(e){
            e.preventDefault(); // منع الصفحة من إعادة التحميل (Refresh) عند البحث

            // جلب النص الذي أدخله المستخدم، وتحويله لحروف صغيرة، وإزالة الفراغات الزائدة
            const value = input.value.toLowerCase().trim();
            if (value === "") return; // إذا كان الحقل فارغاً، لا تفعل شيء

            // فحص الكلمات المفتاحية في بحث المستخدم وتوجيهه للقسم المناسب بسلاسة
            if(value.includes("track") || value.includes("course")){
                document.getElementById("track").scrollIntoView({behavior:"smooth"});
            } else if(value.includes("start") || value.includes("journey")){
                document.getElementById("start-learn").scrollIntoView({behavior:"smooth"});
            } else if(value.includes("about")){
                document.getElementById("about").scrollIntoView({behavior:"smooth"});
            } else if(value.includes("contact")){
                const contactSec = document.getElementById("contact");
                if (contactSec) contactSec.scrollIntoView({behavior:"smooth"});
            } else {
                // إذا لم يتم العثور على قسم يطابق كلمة البحث
                alert("Sorry, we couldn't find a section related to your search. Try 'tracks' or 'start'.");
            }
        });
    }

});

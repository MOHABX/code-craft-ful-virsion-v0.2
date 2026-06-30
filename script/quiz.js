document.addEventListener("DOMContentLoaded", () => {
    // مصفوفة الأسئلة ليتم تعبئتها بواسطة الذكاء الاصطناعي
    let quizData = [];

    let currentQuestionIndex = 0;
    let score = 0;

    // عناصر واجهة الاختبار
    const questionText = document.getElementById("question-text");
    const optionsContainer = document.getElementById("options-container");
    const nextBtn = document.getElementById("next-btn");
    const progressTracker = document.getElementById("question-tracker");
    const progressBar = document.getElementById("progress");

    // عناصر الأقسام
    const quizSection = document.getElementById("quiz-section");
    const formSection = document.getElementById("form-section");
    const certSection = document.getElementById("certificate-section");
    const failSection = document.getElementById("fail-section");

    // ==========================================
    // 🤖 دالة لجلب الأسئلة من Gemini AI (عبر السيرفر)
    // ==========================================
    async function fetchQuestionsFromAI(trackName) {
        questionText.innerText = "🤖 Generating custom questions for you using AI...";
        optionsContainer.innerHTML = "";
        nextBtn.classList.add("hidden");
        
        try {
            // جلب الرمز من الذاكرة المحلية
            const token = localStorage.getItem('authToken');
            if (!token) {
                questionText.innerText = "❌ Error: You must be logged in to access the quiz.";
                return;
            }

            // الاتصال بالسيرفر الفعلي
            // يا ويل اللي ما يذاكر! هذي الدالة حقت الاختبارات، نشوف من ينجح ومن يجيب العيد
            const response = await fetch(`http://localhost:5000/api/quiz/generate?track=${trackName}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            quizData = data.questions;

            loadQuestion();
        } catch (error) {
            questionText.innerText = "❌ An error occurred while connecting to the AI server.";
        }
    }

    // تحميل السؤال
    function loadQuestion() {
        nextBtn.classList.add("hidden");
        optionsContainer.innerHTML = "";
        const currentQuestion = quizData[currentQuestionIndex];

        questionText.innerText = currentQuestion.question;
        progressTracker.innerText = `Question ${currentQuestionIndex + 1} of ${quizData.length}`;
        progressBar.style.width = `${((currentQuestionIndex + 1) / quizData.length) * 100}%`;

        currentQuestion.options.forEach((option, index) => {
            const btn = document.createElement("button");
            btn.innerText = option;
            btn.classList.add("option-btn");
            btn.onclick = () => checkAnswer(index, btn, currentQuestion.correct);
            optionsContainer.appendChild(btn);
        });
    }

    // التحقق من الإجابة
    function checkAnswer(selectedIndex, btnElem, correctIndex) {
        const allBtns = optionsContainer.querySelectorAll(".option-btn");
        allBtns.forEach(btn => btn.disabled = true); // تعطيل النقرات المتعددة

        if (selectedIndex === correctIndex) {
            btnElem.classList.add("correct");
            score++;
        } else {
            btnElem.classList.add("wrong");
            // إظهار الإجابة الصحيحة
            allBtns[correctIndex].classList.add("correct");
        }
        nextBtn.classList.remove("hidden");
    }

    // الزر التالي
    nextBtn.addEventListener("click", () => {
        currentQuestionIndex++;
        if (currentQuestionIndex < quizData.length) {
            loadQuestion();
        } else {
            finishQuiz();
        }
    });

    // إنهاء الاختبار
    function finishQuiz() {
        quizSection.classList.remove("active-section");
        quizSection.classList.add("hidden");
        
        // التحقق من الدرجة (النجاح إذا كانت الدرجة النصف أو أكثر)
        const passScore = Math.ceil(quizData.length / 2);
        
        if (score >= passScore) {
            document.getElementById("final-score").innerText = `${score} out of ${quizData.length}`;
            formSection.classList.remove("hidden");
            formSection.classList.add("active-section");
        } else {
            document.getElementById("fail-score").innerText = `${score} out of ${quizData.length}`;
            failSection.classList.remove("hidden");
            failSection.classList.add("active-section");
        }
    }

    // ==========================================
    // نموذج الشهادة
    // ==========================================
    const certForm = document.getElementById("certificate-form");
    
    certForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const studentName = document.getElementById("student-name").value;

        // TODO: يمكنك إرسال البيانات للسيرفر لاحقاً عبر fetch()

        // تجهيز وعرض الشهادة
        document.getElementById("cert-student-name").innerText = studentName;
        
        const today = new Date().toLocaleDateString('en-US');
        document.getElementById("cert-date").innerText = today;

        formSection.classList.add("hidden");
        certSection.classList.remove("hidden");
    });

    // طباعة الشهادة
    document.getElementById("download-btn").addEventListener("click", () => {
        window.print(); // يفتح نافذة الطباعة/الحفظ كـ PDF مباشرة
    });

    // إعادة الاختبار
    document.getElementById("retry-btn").addEventListener("click", () => {
        // إعادة تعيين الدرجة والعداد
        currentQuestionIndex = 0;
        score = 0;
        
        failSection.classList.remove("active-section");
        failSection.classList.add("hidden");
        
        quizSection.classList.remove("hidden");
        quizSection.classList.add("active-section");
        
        loadQuestion();
    });

    // بدء الاختبار لأول مرة
    // مرر اسم المسار هنا (يمكن جلبه من الرابط أو الذاكرة المحلية)
    fetchQuestionsFromAI("Front-End Development");
});

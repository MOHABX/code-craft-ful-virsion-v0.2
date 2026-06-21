document.addEventListener("DOMContentLoaded", () => {
    // Array of questions to be filled by the AI
    let quizData = [];

    let currentQuestionIndex = 0;
    let score = 0;

    // Quiz UI elements
    const questionText = document.getElementById("question-text");
    const optionsContainer = document.getElementById("options-container");
    const nextBtn = document.getElementById("next-btn");
    const progressTracker = document.getElementById("question-tracker");
    const progressBar = document.getElementById("progress");

    // Section elements
    const quizSection = document.getElementById("quiz-section");
    const formSection = document.getElementById("form-section");
    const certSection = document.getElementById("certificate-section");
    const failSection = document.getElementById("fail-section");

    // ==========================================
    // 🤖 Function to fetch questions from Gemini AI (via backend)
    // ==========================================
    async function fetchQuestionsFromAI(trackName) {
        questionText.innerText = "🤖 Generating custom questions for you using AI...";
        optionsContainer.innerHTML = "";
        nextBtn.classList.add("hidden");
        
        try {
            // Get token from local storage
            const token = localStorage.getItem('authToken');
            if (!token) {
                questionText.innerText = "❌ Error: You must be logged in to access the quiz.";
                return;
            }

            // Connect to the actual backend
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

    // Load Question
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

    // Check Answer
    function checkAnswer(selectedIndex, btnElem, correctIndex) {
        const allBtns = optionsContainer.querySelectorAll(".option-btn");
        allBtns.forEach(btn => btn.disabled = true); // Disable multiple clicks

        if (selectedIndex === correctIndex) {
            btnElem.classList.add("correct");
            score++;
        } else {
            btnElem.classList.add("wrong");
            // Show the correct answer
            allBtns[correctIndex].classList.add("correct");
        }
        nextBtn.classList.remove("hidden");
    }

    // Next Button
    nextBtn.addEventListener("click", () => {
        currentQuestionIndex++;
        if (currentQuestionIndex < quizData.length) {
            loadQuestion();
        } else {
            finishQuiz();
        }
    });

    // Finish Quiz
    function finishQuiz() {
        quizSection.classList.remove("active-section");
        quizSection.classList.add("hidden");
        
        // Check the score (pass if score is half or more)
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
    // Certificate Form
    // ==========================================
    const certForm = document.getElementById("certificate-form");
    
    certForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const studentName = document.getElementById("student-name").value;

        // TODO: Here you can send the data to the Backend later using fetch()

        // Prepare and display the certificate
        document.getElementById("cert-student-name").innerText = studentName;
        
        const today = new Date().toLocaleDateString('en-US');
        document.getElementById("cert-date").innerText = today;

        formSection.classList.add("hidden");
        certSection.classList.remove("hidden");
    });

    // Print Certificate
    document.getElementById("download-btn").addEventListener("click", () => {
        window.print(); // Opens the print/save as PDF dialog directly
    });

    // Retry Quiz
    document.getElementById("retry-btn").addEventListener("click", () => {
        // Reset score and counter
        currentQuestionIndex = 0;
        score = 0;
        
        failSection.classList.remove("active-section");
        failSection.classList.add("hidden");
        
        quizSection.classList.remove("hidden");
        quizSection.classList.add("active-section");
        
        loadQuestion();
    });

    // Run the quiz for the first time
    // Pass the track name here (can be fetched from URL or LocalStorage)
    fetchQuestionsFromAI("Front-End Development");
});

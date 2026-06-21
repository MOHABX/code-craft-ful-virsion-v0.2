document.addEventListener('DOMContentLoaded', () => {
    const inputs = document.querySelectorAll('.otp-box');
    const form = document.getElementById('otp-form');
    const timerDisplay = document.getElementById('timer');
    const resendBtn = document.getElementById('resend-btn');
    
    const email = localStorage.getItem('registrationEmail');
    if (!email) {
        alert('No email found. Redirecting to signup.');
        window.location.href = 'signup-st.html';
    }

    // Auto focus next/prev input box
    inputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            if (e.target.value.length === 1 && index < inputs.length - 1) {
                inputs[index + 1].focus();
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                inputs[index - 1].focus();
            }
            if (e.key === 'ArrowLeft' && index > 0) {
                inputs[index - 1].focus();
            }
            if (e.key === 'ArrowRight' && index < inputs.length - 1) {
                inputs[index + 1].focus();
            }
        });
        
        // Handle Paste
        input.addEventListener('paste', (e) => {
            e.preventDefault();
            const pastedData = e.clipboardData.getData('text').slice(0, inputs.length);
            for (let i = 0; i < pastedData.length; i++) {
                if (/[0-9]/.test(pastedData[i]) && inputs[i]) {
                    inputs[i].value = pastedData[i];
                    if (i < inputs.length - 1) inputs[i + 1].focus();
                }
            }
        });
    });

    let timeLeft = 40;
    let timerInterval;

    function startTimer() {
        clearInterval(timerInterval);
        timeLeft = 40;
        resendBtn.disabled = true;
        
        timerInterval = setInterval(() => {
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                timerDisplay.textContent = "00:00";
                resendBtn.disabled = false;
            } else {
                let seconds = timeLeft < 10 ? `0${timeLeft}` : timeLeft;
                timerDisplay.textContent = `00:${seconds}`;
                timeLeft--;
            }
        }, 1000);
    }

    startTimer();

    resendBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('/api/auth/resend-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await response.json();
            if (response.ok) {
                alert('OTP resent successfully.');
                inputs.forEach(input => input.value = '');
                inputs[0].focus();
                startTimer();
            } else {
                alert(data.message || 'Error resending OTP');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Server error.');
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        let otp = '';
        inputs.forEach(input => otp += input.value);
        
        if (otp.length !== 9) {
            alert('Please enter all 9 digits.');
            return;
        }

        try {
            const response = await fetch('/api/auth/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.removeItem('registrationEmail');
                
                alert('Account verified successfully!');
                if (data.role === 'doctor') {
                    window.location.href = '/html/dr-dashboard.html';
                } else {
                    window.location.href = '/html/st-dashboard.html';
                }
            } else {
                alert(data.message || 'Invalid OTP');
                inputs.forEach(input => input.value = '');
                inputs[0].focus();
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Server error. Try again.');
        }
    });
});

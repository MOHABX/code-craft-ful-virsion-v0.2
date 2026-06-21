// Elements
const btnLogin = document.getElementById('btn-login');
const btnDrSignup = document.getElementById('btn-dr-signup');
const btnStSignup = document.getElementById('btn-st-signup');
const backBtn = document.getElementById('back-to-login');
const goToSignupLink = document.getElementById('go-to-signup');

const logForm = document.getElementById('log');
const drForm = document.getElementById('sign_dr');
const stForm = document.getElementById('sign_st');

// Function to toggle the sidebar state (login or signup)
function setMode(mode) {
    if (mode === 'signup') {
        // Hide login button and show signup options
        btnLogin.classList.add('hidden');
        btnDrSignup.classList.remove('hidden');
        btnStSignup.classList.remove('hidden');
        backBtn.classList.remove('hidden');
        
        // Show instructor form as default
        switchForm(drForm, btnDrSignup);
    } else {
        // Return to login state
        btnLogin.classList.remove('hidden');
        btnDrSignup.classList.add('hidden');
        btnStSignup.classList.add('hidden');
        backBtn.classList.add('hidden');
        
        switchForm(logForm, btnLogin);
    }
}

// Function to switch between forms
function switchForm(targetForm, targetBtn) {
    // Hide all
    [logForm, drForm, stForm].forEach(f => f.style.display = 'none');
    [btnLogin, btnDrSignup, btnStSignup].forEach(b => b.classList.remove('active'));
    
    // Show the selected one
    targetForm.style.display = 'block';
    targetBtn.classList.add('active');
}

// Events
if (goToSignupLink) {
    goToSignupLink.addEventListener('click', (e) => {
        e.preventDefault();
        setMode('signup');
    });
}

if (backBtn) {
    backBtn.addEventListener('click', () => {
        setMode('login');
    });
}

if (btnDrSignup) btnDrSignup.addEventListener('click', () => switchForm(drForm, btnDrSignup));
if (btnStSignup) btnStSignup.addEventListener('click', () => switchForm(stForm, btnStSignup));
if (btnLogin) btnLogin.addEventListener('click', () => switchForm(logForm, btnLogin));

// ========================================================
//  API Integration for Registration
// ========================================================

/**
 * Handles the registration process by sending data to the backend API.
 * @param {Event} e The form submission event.
 * @param {string} role The role of the user ('student' or 'doctor').
 */
async function handleRegistration(e, role) {
    e.preventDefault();
    const form = e.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerText;

    // Disable button and show loading state
    submitButton.disabled = true;
    submitButton.innerText = 'Submitting...';

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    data.role = role; // Add the role to the data object
    
    // Prepare data to match the backend
    data.name = `${data.fname} ${data.lname}`;
    data.password = data.pass;

    if (data.pass !== data.cpass) {
        alert("Passwords do not match!");
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
            // If there's an error (e.g., email exists), show it
            alert(result.message || 'An error occurred during registration.');
        } else {
            // On success, redirect to the OTP page
            alert(result.message);
            localStorage.setItem('registrationEmail', data.email);
            window.location.href = `otp-verification.html`;
        }
    } catch (error) {
        console.error('Registration failed:', error);
        alert('Failed to connect to the server. Please check your internet connection.');
    } finally {
        // Re-enable the button
        submitButton.disabled = false;
        submitButton.innerText = originalButtonText;
    }
}

// Attach the event listeners to the signup forms
if (drForm) drForm.addEventListener('submit', (e) => handleRegistration(e, 'doctor'));
if (stForm) stForm.addEventListener('submit', (e) => handleRegistration(e, 'student'));

// Login form listener
if (logForm) {
    logForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(logForm);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                alert(result.message || 'Login failed');
            } else {
                alert(result.message);

                // Save to localStorage
                localStorage.setItem('authToken', result.token);
                localStorage.setItem('role', result.role);

                // Redirect the user based on account type
                if (result.role === 'admin') {
                    window.location.href = 'admin-dashboard.html';
                } else if (result.role === 'doctor') {
                    window.location.href = 'dr-dashboard.html';
                } else if (result.role === 'student') {
                    window.location.href = 'st-profile.html';
                } else {
                    window.location.href = 'home.html';
                }
            }
        } catch (error) {
            console.error('Login failed:', error);
            alert('Failed to connect to the server.');
        }
    });
}

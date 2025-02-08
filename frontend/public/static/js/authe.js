document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
    
    // Handle social login buttons
    const socialButtons = document.querySelectorAll('.social-btn');
    socialButtons.forEach(button => {
        button.addEventListener('click', handleSocialAuth);
    });
});

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        // Here you would typically make an API call to your backend
        console.log('Login attempt:', { email, password });
        
        // Simulate successful login
        alert('Login successful!');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Login failed:', error);
        alert('Login failed. Please try again.');
    }
}

async function handleSignup(e) {
    e.preventDefault();
    
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const accountType = document.getElementById('accountType').value;
    
    try {
        // Here you would typically make an API call to your backend
        console.log('Signup attempt:', { fullName, email, password, accountType });
        
        // Simulate successful signup
        alert('Account created successfully!');
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Signup failed:', error);
        alert('Signup failed. Please try again.');
    }
}

function handleSocialAuth(e) {
    const provider = e.currentTarget.classList.contains('google') ? 'Google' : 'GitHub';
    console.log(`${provider} authentication clicked`);
    // Implement social authentication logic here
    alert(`${provider} authentication coming soon!`);
} 
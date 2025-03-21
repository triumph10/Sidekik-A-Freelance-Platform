// Search functionality
const searchInput = document.querySelector('.search-container input');
const searchBtn = document.querySelector('.search-btn');

searchBtn.addEventListener('click', () => {
    const searchTerm = searchInput.value.trim();
    if (searchTerm) {
        console.log('Searching for:', searchTerm);
    }
});

// Dynamic header behavior
let lastScroll = 0;
const header = document.querySelector('.main-header');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > lastScroll) {
        header.style.transform = 'translateY(-100%)';
    } else {
        header.style.transform = 'translateY(0)';
    }
    
    lastScroll = currentScroll;
});

// Feature cards animation
const featureCards = document.querySelectorAll('.feature-card');

const observerOptions = {
    threshold: 0.5,
    rootMargin: '0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

featureCards.forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'all 0.5s ease-in-out';
    observer.observe(card);
});

// Service cards functionality
const serviceCards = document.querySelectorAll('.service-card');

serviceCards.forEach(card => {
    card.addEventListener('click', () => {
        console.log('Service card clicked:', card.querySelector('h3').textContent);
    });
});

// Authentication UI handling
function updateAuthUI() {
    const userInfo = document.getElementById('user-info');
    const authLinks = document.getElementById('auth-links');
    
    const isLoggedIn = document.body.getAttribute('data-logged-in') === 'true';
    
    if (isLoggedIn) {
        userInfo.style.display = 'inline-block';
        authLinks.style.display = 'none';
    } else {
        userInfo.style.display = 'none';
        authLinks.style.display = 'inline-block';
    }
}

// Handle active navigation and initialization
document.addEventListener('DOMContentLoaded', () => {
    // Handle active navigation state
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.main-nav a');
    
    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href').split('/').pop();
        if (linkPage === currentPage) {
            link.classList.add('active');
        }
    });

    // Initialize auth UI
    updateAuthUI();
}); 
document.addEventListener('DOMContentLoaded', () => {
    // Handle profile image upload
    const editAvatar = document.querySelector('.edit-avatar');
    const editCover = document.querySelector('.edit-cover');
    const editProfile = document.querySelector('.edit-profile');

    editAvatar.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                // Here you would typically upload the file to your server
                // For now, we'll just show a preview
                const reader = new FileReader();
                reader.onload = (e) => {
                    document.querySelector('.profile-avatar img').src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    });

    editCover.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    document.querySelector('.profile-cover').style.backgroundImage = `url(${e.target.result})`;
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    });

    editProfile.addEventListener('click', () => {
        // Here you would typically show a modal or navigate to an edit page
        alert('Edit profile functionality coming soon!');
    });

    // Load portfolio projects
    loadPortfolioProjects();
});

function loadPortfolioProjects() {
    const projectsGrid = document.querySelector('.projects-grid');
    
    // Sample projects data - in real app, this would come from your backend
    const projects = [
        {
            title: 'E-commerce Platform',
            description: 'Full-stack e-commerce solution with React and Node.js',
            image: 'images/project1.jpg',
            tags: ['React', 'Node.js', 'MongoDB']
        },
        {
            title: 'Social Media Dashboard',
            description: 'Analytics dashboard for social media management',
            image: 'images/project2.jpg',
            tags: ['Vue.js', 'Python', 'AWS']
        }
        // Add more projects as needed
    ];

    projects.forEach(project => {
        const projectCard = createProjectCard(project);
        projectsGrid.appendChild(projectCard);
    });
}

function createProjectCard(project) {
    const card = document.createElement('div');
    card.className = 'project-card';
    card.innerHTML = `
        <div class="project-image">
            <img src="${project.image}" alt="${project.title}">
        </div>
        <div class="project-info">
            <h4>${project.title}</h4>
            <p>${project.description}</p>
            <div class="project-tags">
                ${project.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
        </div>
    `;
    return card;
} 
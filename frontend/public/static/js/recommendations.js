document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('projectDescriptionForm');
    const skillsInput = document.getElementById('requiredSkills');
    const skillsTags = document.getElementById('skillsTags');
    const matchesSection = document.querySelector('.matches-section');
    const matchesGrid = document.getElementById('matchesGrid');

    let skills = new Set();

    // Handle skills input
    skillsInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const skill = skillsInput.value.trim();
            if (skill && !skills.has(skill)) {
                addSkillTag(skill);
                skills.add(skill);
                skillsInput.value = '';
            }
        }
    });

    function addSkillTag(skill) {
        const tag = document.createElement('span');
        tag.className = 'skill-tag';
        tag.innerHTML = `
            ${skill}
            <i class="fas fa-times" onclick="removeSkill(this, '${skill}')"></i>
        `;
        skillsTags.appendChild(tag);
    }

    // Make removeSkill function global so onclick can access it
    window.removeSkill = function(element, skill) {
        skills.delete(skill);
        element.parentElement.remove();
    };

    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = {
            title: document.getElementById('projectTitle').value,
            description: document.getElementById('projectDescription').value,
            budget: document.getElementById('projectBudget').value,
            duration: document.getElementById('projectDuration').value,
            skills: Array.from(skills)
        };

        try {
            // Here you would typically make an API call to get matches
            // For now, we'll simulate some matches
            const matches = await getMatchingFreelancers(formData);
            displayMatches(matches);
        } catch (error) {
            console.error('Error finding matches:', error);
            alert('Error finding matches. Please try again.');
        }
    });

    async function getMatchingFreelancers(formData) {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Return mock data
        return [
            {
                name: 'Sarah Johnson',
                title: 'Full Stack Developer',
                rating: 4.9,
                reviews: 127,
                hourlyRate: 65,
                skills: ['React', 'Node.js', 'MongoDB'],
                avatar: 'images/default-avatar.png'
            },
            {
                name: 'Michael Chen',
                title: 'UI/UX Designer',
                rating: 4.8,
                reviews: 93,
                hourlyRate: 55,
                skills: ['Figma', 'Adobe XD', 'Sketch'],
                avatar: 'images/default-avatar.png'
            }
            // Add more mock freelancers as needed
        ];
    }

    function displayMatches(matches) {
        matchesGrid.innerHTML = '';
        matches.forEach(freelancer => {
            const card = createFreelancerCard(freelancer);
            matchesGrid.appendChild(card);
        });
        matchesSection.style.display = 'block';
        matchesSection.scrollIntoView({ behavior: 'smooth' });
    }

    function createFreelancerCard(freelancer) {
        const card = document.createElement('div');
        card.className = 'freelancer-card';
        card.innerHTML = `
            <div class="freelancer-header">
                <img src="${freelancer.avatar}" alt="${freelancer.name}" class="freelancer-avatar">
                <div class="freelancer-info">
                    <h3>${freelancer.name}</h3>
                    <p>${freelancer.title}</p>
                    <div class="rating">
                        <i class="fas fa-star"></i>
                        <span>${freelancer.rating} (${freelancer.reviews} reviews)</span>
                    </div>
                </div>
            </div>
            <div class="freelancer-skills">
                ${freelancer.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
            </div>
            <div class="freelancer-footer">
                <span class="hourly-rate">$${freelancer.hourlyRate}/hr</span>
                <button class="btn contact-btn">Contact</button>
            </div>
        `;
        return card;
    }
}); 
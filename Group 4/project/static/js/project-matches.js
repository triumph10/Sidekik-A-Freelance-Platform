import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
import CONFIG from "./config.js";

// Initialize Supabase
const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is logged in
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (!user) {
        window.location.href = '/login';
        return;
    }

    // Set up auth buttons
    setupAuthButtons(user);

    // Get project ID from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('project_id');

    if (!projectId) {
        showError("No project specified. Please go back and try again.");
        return;
    }

    try {
        // Load project details
        await loadProjectDetails(projectId);
        
        // Load matching freelancers
        await loadMatchingFreelancers(projectId);
    } catch (error) {
        console.error("Error loading data:", error);
        showError("There was an error loading the data. Please try again later.");
    }
});

function setupAuthButtons(user) {
    const authButtons = document.getElementById('authButtons');
    
    if (user) {
        authButtons.innerHTML = `
            <a href="/client-dashboard" class="btn dashboard">Dashboard</a>
            <button id="logoutBtn" class="btn logout">Logout</button>
        `;
        
        document.getElementById('logoutBtn').addEventListener('click', async () => {
            await supabase.auth.signOut();
            window.location.href = '/';
        });
    } else {
        authButtons.innerHTML = `
            <a href="/login" class="btn login">Login</a>
            <a href="/signup" class="btn signup">Sign Up</a>
        `;
    }
}

async function loadProjectDetails(projectId) {
    try {
        // Fetch project from Supabase
        const { data: project, error } = await supabase
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .single();
        
        if (error) {
            throw error;
        }
        
        if (!project) {
            showError("Project not found.");
            return;
        }
        
        // Update the UI with project details
        document.getElementById('projectTitle').textContent = project.title;
        document.getElementById('projectDescription').textContent = project.description;
        
        // Format budget display
        let budgetText = "";
        switch(project.budget) {
            case 'micro':
                budgetText = "$100 - $500";
                break;
            case 'small':
                budgetText = "$500 - $1000";
                break;
            case 'medium':
                budgetText = "$1000 - $5000";
                break;
            case 'large':
                budgetText = "$5000+";
                break;
            default:
                budgetText = project.budget;
        }
        document.getElementById('projectBudget').textContent = `Budget: ${budgetText}`;
        
        // Format duration display
        let durationText = "";
        switch(project.duration) {
            case 'short':
                durationText = "Less than 1 week";
                break;
            case 'medium':
                durationText = "1-4 weeks";
                break;
            case 'long':
                durationText = "1-3 months";
                break;
            case 'extended':
                durationText = "3+ months";
                break;
            default:
                durationText = project.duration;
        }
        document.getElementById('projectDuration').textContent = `Duration: ${durationText}`;
        
        // Add skills
        const skillsContainer = document.getElementById('projectSkills');
        skillsContainer.innerHTML = '';
        
        if (project.required_skills) {
            const skills = project.required_skills.split(',').map(skill => skill.trim());
            skills.forEach(skill => {
                const skillTag = document.createElement('span');
                skillTag.className = 'skill-tag';
                skillTag.textContent = skill;
                skillsContainer.appendChild(skillTag);
            });
        }
    } catch (error) {
        console.error("Error loading project details:", error);
        showError("Failed to load project details.");
    }
}

async function loadMatchingFreelancers(projectId) {
    try {
        console.log(`Loading matching freelancers for project: ${projectId}`);
        
        // Fetch matching freelancers from Flask backend
        const response = await fetch(`/find_matching_freelancers?project_id=${projectId}`);
        
        if (!response.ok) {
            throw new Error(`Server responded with ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Received freelancer data:", data);
        
        // Hide loading spinner
        document.getElementById('loadingContainer').style.display = 'none';
        
        // Show freelancers list
        const freelancersList = document.getElementById('freelancersList');
        freelancersList.style.display = 'block';
        
        // Check if we got any freelancers
        if (!data.freelancers || data.freelancers.length === 0) {
            console.log("No matching freelancers found");
            freelancersList.innerHTML = `
                <div class="no-results">
                    <p>No matching freelancers found for your project.</p>
                    <p>Try modifying your project requirements or check back later.</p>
                </div>
            `;
            return;
        }
        
        console.log(`Found ${data.freelancers.length} matching freelancers`);
        
        // Generate freelancer cards
        freelancersList.innerHTML = data.freelancers.map(freelancer => {
            console.log(`Processing freelancer: ${freelancer.id}, similarity: ${freelancer.similarity}`);
            
            // Determine match score class based on percentage (0-100 scale)
            let matchScoreClass = 'low';
            const similarity = parseFloat(freelancer.similarity);
            
            if (similarity >= 70) {
                matchScoreClass = 'high';
            } else if (similarity >= 40) {
                matchScoreClass = 'medium';
            }
            
            // Format match percentage (already in percentage format from server)
            const matchPercentage = Math.round(similarity);
            
            // Handle skills regardless of format (array or string)
            let skillsArray = [];
            if (freelancer.skills) {
                if (Array.isArray(freelancer.skills)) {
                    skillsArray = freelancer.skills;
                } else if (typeof freelancer.skills === 'string') {
                    skillsArray = freelancer.skills.split(',').map(s => s.trim()).filter(s => s);
                }
            }
            
            // Create skills HTML
            const skillsHtml = skillsArray.length > 0
                ? skillsArray.map(skill => `<span class="skill-tag">${skill}</span>`).join('')
                : '<span class="no-skills">No skills listed</span>';
            
            // Format rate with fallback
            const rate = freelancer.rate ? parseFloat(freelancer.rate) : 0;
            
            return `
                <div class="freelancer-card">
                    <div class="freelancer-header">
                        <h3 class="freelancer-name">${freelancer.full_name || 'Unnamed Freelancer'}</h3>
                        <span class="freelancer-rate">$${rate}/hr</span>
                    </div>
                    <div class="freelancer-bio">
                        <p>${freelancer.bio || 'No bio provided'}</p>
                    </div>
                    <div class="freelancer-experience">
                        <p><strong>Experience:</strong> ${freelancer.experience || 'Not specified'}</p>
                    </div>
                    <div class="freelancer-availability">
                        <p><strong>Availability:</strong> ${freelancer.availability || 'Not specified'}</p>
                    </div>
                    <div class="freelancer-skills">
                        <h4>Skills:</h4>
                        <div class="skills-tags">
                            ${skillsHtml}
                        </div>
                    </div>
                    <div class="freelancer-footer">
                        <span class="match-score ${matchScoreClass}">
                            ${matchPercentage}% Match
                        </span>
                        <a href="/messages?freelancer_id=${freelancer.id}" class="contact-button">Contact</a>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error("Error loading matching freelancers:", error);
        document.getElementById('loadingContainer').style.display = 'none';
        showError("Failed to load matching freelancers.");
    }
}

function showError(message) {
    const freelancersPanel = document.querySelector('.freelancers-panel');
    document.getElementById('loadingContainer').style.display = 'none';
    
    freelancersPanel.innerHTML += `
        <div class="error-container">
            <div class="error-icon">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <p class="error-message">${message}</p>
            <a href="/recommendations" class="btn">Go Back</a>
        </div>
    `;
}
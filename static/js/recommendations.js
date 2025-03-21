import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
import CONFIG from "./config.js";

// ✅ Initialize Supabase
const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', async () => {
    // ✅ Check if user is logged in
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (!user) {
        window.location.href = '/login';
        return;
    }

    const form = document.getElementById('projectDescriptionForm');
    const skillsInput = document.getElementById('required_skills');
    const skillsTags = document.getElementById('skillsTags');

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

   // ...existing code...

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validate if skills exist
    if (skills.size === 0) {
        alert('Please add at least one skill');
        return;
    }

    // Convert Set to simple string without brackets
    const skillsString = Array.from(skills).join(', ');
    
    const formData = {
        title: document.getElementById('projectTitle').value,
        description: document.getElementById('projectDescription').value,
        budget: document.getElementById('projectBudget').value,
        duration: document.getElementById('projectDuration').value,
        required_skills: skillsString || '', // Use empty string if no skills
        client_id: user.id
    };

    try {
        // Add debug log to check skills format
        console.log('Skills being sent:', formData.required_skills);

        const now = new Date().toISOString();
        const projectData = {
            title: formData.title,
            description: formData.description,
            budget: formData.budget,
            duration: formData.duration,
            required_skills: formData.required_skills,
            client_id: formData.client_id,
            created_at: now,
            updated_at: now,
            embedding: null
        };

        const { data, error: projectError } = await supabase
            .from('projects')
            .insert([projectData])
            .select();

        if (projectError) {
            console.error("Project Insert Error:", projectError);
            throw projectError;
        }

        console.log("Project inserted successfully:", data);
        alert("Project posted successfully!");
        
        // Clear form
        form.reset();
        skills.clear();
        skillsTags.innerHTML = '';
        
    } catch (error) {
        console.error('Error details:', error);
        alert('Error posting project. Please try again.');
    }
});
});

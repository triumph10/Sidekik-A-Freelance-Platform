import CONFIG from "./config.js";

// Initialize Supabase Client
const supabase = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

document.addEventListener("DOMContentLoaded", async () => {
    await loadFreelancerProfile(); // Fetch freelancer profile details
    loadPortfolioProjects();       // Load projects
});

// ✅ Fetch Freelancer Profile from Supabase
async function loadFreelancerProfile() {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.id) {
        console.error("User ID not found in local storage!");
        return;
    }

    try {
        const { data, error } = await supabase
            .from("freelancer_profiles")
            .select("*")
            .eq("id", user.id)
            .single();

        if (error || !data) {
            console.error("Error fetching profile:", error);
            document.getElementById("profile-section").innerHTML = "<p>Profile not found.</p>";
            return;
        }

        // Populate profile details
        document.querySelector(".profile-name").textContent = data.name || "No Name Provided";
        document.querySelector(".profile-bio").textContent = data.bio || "No Bio Available";
        document.querySelector(".profile-avatar img").src = data.profile_image || "default-avatar.png";

        // Add skills dynamically
        const skillsContainer = document.querySelector(".profile-skills");
        skillsContainer.innerHTML = "";
        if (data.skills && Array.isArray(data.skills)) {
            data.skills.forEach(skill => {
                const skillTag = document.createElement("span");
                skillTag.className = "tag";
                skillTag.textContent = skill;
                skillsContainer.appendChild(skillTag);
            });
        }
    } catch (err) {
        console.error("Unexpected error:", err);
    }
}

// ✅ Handle Profile Image Upload
document.addEventListener("DOMContentLoaded", () => {
    const editAvatar = document.querySelector(".edit-avatar");
    const editCover = document.querySelector(".edit-cover");
    const editProfile = document.querySelector(".edit-profile");

    editAvatar.addEventListener("click", () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    document.querySelector(".profile-avatar img").src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    });

    editCover.addEventListener("click", () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    document.querySelector(".profile-cover").style.backgroundImage = `url(${e.target.result})`;
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    });

    editProfile.addEventListener("click", () => {
        alert("Edit profile functionality coming soon!");
    });

    loadPortfolioProjects();
});

// ✅ Load Portfolio Projects
function loadPortfolioProjects() {
    const projectsGrid = document.querySelector(".projects-grid");

    const projects = [
        {
            title: "E-commerce Platform",
            description: "Full-stack e-commerce solution with React and Node.js",
            image: "images/project1.jpg",
            tags: ["React", "Node.js", "MongoDB"]
        },
        {
            title: "Social Media Dashboard",
            description: "Analytics dashboard for social media management",
            image: "images/project2.jpg",
            tags: ["Vue.js", "Python", "AWS"]
        }
    ];

    projects.forEach(project => {
        const projectCard = createProjectCard(project);
        projectsGrid.appendChild(projectCard);
    });
}

// ✅ Create Project Cards
function createProjectCard(project) {
    const card = document.createElement("div");
    card.className = "project-card";
    card.innerHTML = `
        <div class="project-image">
            <img src="${project.image}" alt="${project.title}">
        </div>
        <div class="project-info">
            <h4>${project.title}</h4>
            <p>${project.description}</p>
            <div class="project-tags">
                ${project.tags.map(tag => `<span class="tag">${tag}</span>`).join("")}
            </div>
        </div>
    `;
    return card;
}


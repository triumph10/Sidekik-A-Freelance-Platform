import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
import CONFIG from "./config.js";

// ✅ Initialize Supabase
const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

document.addEventListener("DOMContentLoaded", async () => {
    await checkUserSession();  // ✅ Only runs after the page has fully loaded

    const signupForm = document.getElementById("signupForm");
    const loginForm = document.getElementById("loginForm");

    if (signupForm) {
        signupForm.addEventListener("submit", handleSignup);
    }

    if (loginForm) {
        loginForm.addEventListener("submit", handleLogin);
    }
});



async function checkUserSession() {
    // ✅ Force refresh session to ensure no old session remains
    await supabase.auth.refreshSession(); 

    const { data: { user }, error } = await supabase.auth.getUser();

    console.log("Checking user session:", user);

    const userInfo = document.getElementById("user-info");
    const authLinks = document.getElementById("auth-links");
    const usernameSpan = document.getElementById("username");

    if (user && user.user_metadata) {
        console.log("User is logged in:", user.user_metadata.full_name);

        if (userInfo) {
            userInfo.style.display = "inline-block";
            usernameSpan.textContent = user.user_metadata.full_name;
        }
        if (authLinks) authLinks.style.display = "none";
    } else {
        console.log("No user found, resetting session");

        // ✅ Clear localStorage and sessionStorage to remove any old tokens
        localStorage.clear();
        sessionStorage.clear();

        if (userInfo) userInfo.style.display = "none";
        if (authLinks) authLinks.style.display = "inline-block";
    }
}




// ✅ Handle Signup
async function handleSignup(event) {
    event.preventDefault();
    
    const fullName = document.getElementById("fullName").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const accountType = document.getElementById("accountType").value; // "hire" (Client) or "work" (Freelancer)

    try {
        let { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: fullName, account_type: accountType } }
        });

        if (error) throw error;

        // ✅ Store session in Flask
        await fetch(`/set_session/${accountType}/${fullName}`);

        window.location.href = "/index";  // ✅ Redirect to home
    } catch (error) {
        console.error("Signup failed:", error.message);
        alert("Signup failed. Please try again.");
    }
}

// ✅ Handle Login
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        let { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) throw error;
        const user = data.user;

        if (!user) {
            alert("Login failed. User not found.");
            return;
        }

        // ✅ Store session in Flask
        await fetch(`/set_session/${user.user_metadata.account_type}/${user.user_metadata.full_name}`);

        window.location.href = "/index";  // ✅ Redirect to home
    } catch (error) {
        console.error("Login failed:", error.message);
        alert("Login failed. Please try again.");
    }
}

// ✅ Logout Function
async function logout() {
    console.log("Logging out...");

    await supabase.auth.signOut(); // ✅ Logs out from Supabase

    // ✅ Clear local storage, session storage, and Supabase cookies
    localStorage.removeItem("sb-dlgjrgwhgysbdnrldcnn-auth-token");
    sessionStorage.clear();
    document.cookie = "sb-dlgjrgwhgysbdnrldcnn-auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    
    console.log("Cleared session data");

    // ✅ Redirect to login page
    window.location.href = "/login";
}



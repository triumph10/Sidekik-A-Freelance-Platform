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

async function handleSignup(event) {
    event.preventDefault();

    const fullName = document.getElementById("fullName").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    let accountType = document.getElementById("accountType").value;

    accountType = accountType === "hire" ? "client" : "freelancer";

    try {
        console.log("🚀 Signing up...");

        // ✅ Step 1: Sign up in Supabase Auth
        let { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: fullName, role: accountType } }
        });

        if (error) throw error;
        const userId = data.user.id;

        // ✅ Step 2: Store user in 'users' table
        let { error: insertError } = await supabase
            .from("users")
            .insert([{ id: userId, full_name: fullName, email, role: accountType }]);

        if (insertError) throw insertError;

        // ✅ Step 3: If freelancer, create an entry in `freelancer_profiles`
        if (accountType === "freelancer") {
            let { error: freelancerError } = await supabase
                .from("freelancer_profiles")
                .insert([{ id: userId, email }]);

            if (freelancerError) throw freelancerError;
        }

        // ✅ Step 4: Store session in Flask (VERY IMPORTANT)
        console.log("🚀 Sending session data:", {
            role: accountType,
            full_name: fullName,
            id: userId
        });

        let sessionResponse = await fetch("/set_session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                role: accountType,
                full_name: fullName,
                id: userId
            })
        });

        let sessionResult = await sessionResponse.json();
        console.log("📌 Session Response:", sessionResult);

        if (!sessionResponse.ok) {
            throw new Error("❌ Session storage failed: " + sessionResult.error);
        }

        console.log("✅ Session stored successfully!");

        // ✅ Step 5: Redirect to profile setup for freelancers
        setTimeout(() => {
            if (accountType === "freelancer") {
                console.log("🔄 Redirecting to Profile Setup...");
                window.location.replace("/profile-setup");
            } else {
                console.log("🔄 Redirecting to Home...");
                window.location.replace("/index");
            }
        }, 500);

    } catch (error) {
        console.error("❌ Signup failed:", error.message);
        alert("Signup failed. Please try again.");
    }
}


async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        console.log("🚀 Logging in...");

        let { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) throw error;
        const user = data.user;

        if (!user) {
            alert("Login failed. User not found.");
            return;
        }

        console.log("✅ User logged in:", user);

        // ✅ Fetch user details from "users" table
        let { data: userData, error: userError } = await supabase
            .from("users") 
            .select("id, full_name, role")  
            .eq("id", user.id)
            .single();

        if (userError || !userData) {
            console.error("❌ Error fetching user details:", userError);
            alert("Error retrieving user information.");
            return;
        }

        console.log("📌 Retrieved User Data:", userData);

        // ✅ Call Flask `/set_session`
        console.log("🚀 Attempting to store session...");
        let sessionResponse = await fetch("/set_session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                role: userData.role,  
                full_name: userData.full_name,
                id: userData.id
            }),
        });

        let result = await sessionResponse.json();
        console.log("📌 Session Response:", result);

        if (!sessionResponse.ok) {
            throw new Error("❌ Session storage failed: " + result.error);
        }

        console.log("✅ Session stored successfully!");

        // ✅ Redirect the user
        setTimeout(() => {
            if (userData.role === "freelancer") {
                console.log("🔄 Redirecting to Freelancer Dashboard...");
                window.location.replace("/freelancer-dashboard");
            } else {
                console.log("🔄 Redirecting to Home...");
                window.location.replace("/index");
            }
        }, 500);
        
    } catch (error) {
        console.error("❌ Login failed:", error.message);
        alert("Login failed. Please try again.");
    }
}

async function storeSession(accountType, fullName, userId) {
    try {
        let response = await fetch("/set_session", {  // ✅ Ensure this is correct!
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                account_type: accountType,
                full_name: fullName,
                user_id: userId
            }),
        });

        let result = await response.json();
        console.log("Session Response:", result);

        if (!response.ok) {
            throw new Error("Session storage failed: " + result.error);
        }

        console.log("✅ Session stored successfully!");
    } catch (error) {
        console.error("❌ Session storage failed:", error);
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



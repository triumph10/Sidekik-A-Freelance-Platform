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


// // ✅ Handle Signup
// async function handleSignup(event) {
//     event.preventDefault();
    
//     const fullName = document.getElementById("fullName").value;
//     const email = document.getElementById("email").value;
//     const password = document.getElementById("password").value;
//     const accountType = document.getElementById("accountType").value; // "hire" (Client) or "work" (Freelancer)

//     try {
//         let { data, error } = await supabase.auth.signUp({
//             email,
//             password,
//             options: { data: { full_name: fullName, account_type: accountType } }
//         });

//         if (error) throw error;

//         const userId = data.user.id; // Get User ID from Supabase Auth

//         // ✅ Insert user details into the database table
//         let { error: dbError } = await supabase
//             .from("users")  // Ensure "users" is the correct table name
//             .insert([{ id: userId, full_name: fullName, email: email, account_type: accountType }]);

//         if (dbError) throw dbError;

//         // ✅ Store session in Flask & Redirect properly
//         await fetch(`/set_session/${accountType}/${fullName}`);

//         if (accountType === "work") {
//             window.location.href = "/freelancer-dashboard"; // Redirect freelancers
//         } else {
//             window.location.href = "/index"; // Redirect clients
//         }
//     } catch (error) {
//         console.error("Signup failed:", error.message);
//         alert("Signup failed. Please try again.");
//     }
// }

async function handleSignup(event) {
    event.preventDefault();

    const fullName = document.getElementById("fullName").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    let accountType = document.getElementById("accountType").value; // "hire" or "work"

    // ✅ Convert role to match database constraint
    accountType = accountType === "hire" ? "client" : "freelancer";

    try {
        // ✅ Step 1: Sign up the user in Supabase Auth
        let { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: fullName, role: accountType } }
        });

        if (error) throw error;
        const userId = data.user.id; // ✅ Get the Supabase Auth user ID

        // ✅ Step 2: Insert user details into "users" table (WITHOUT PASSWORD)
        let { error: insertError } = await supabase
            .from("users")
            .insert([
                {
                    id: userId,  
                    full_name: fullName,
                    email: email,
                    role: accountType,  // ✅ Role is now either "client" or "freelancer"
                }
            ]);

        if (insertError) throw insertError;

        // ✅ Step 3: Store session & redirect properly
        await fetch(`/set_session/${accountType}/${fullName}`);

        if (accountType === "freelancer") {
            window.location.href = "/freelancer-dashboard"; // ✅ Redirect freelancers
        } else {
            window.location.href = "/index"; // ✅ Redirect clients
        }
    } catch (error) {
        console.error("Signup failed:", error.message);
        alert("Signup failed. Please try again.");
    }
}





// ✅ Handle Login with Debugging
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

        console.log("User logged in:", user.user_metadata);

        // ✅ Ensure session is stored before redirecting
        let sessionResponse = await fetch(`/set_session/${user.user_metadata.account_type}/${user.user_metadata.full_name}`);
        let sessionData = await sessionResponse.text();

        console.log("Session Response:", sessionData);  // ✅ Debugging step

        if (sessionData.includes("Session stored")) {
            // ✅ Proper redirection based on account type
            if (user.user_metadata.account_type === "work") {
                console.log("Redirecting to Freelancer Dashboard...");
                window.location.href = "/freelancer-dashboard";
            } else {
                console.log("Redirecting to Home...");
                window.location.href = "/index";
            }
        } else {
            console.error("Session storage failed:", sessionData);
            alert("Error storing session. Please try again.");
        }
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



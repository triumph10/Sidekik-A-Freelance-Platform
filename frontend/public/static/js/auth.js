import { supabase } from './supabase_config.js';

// Signup function
async function signUp(email, password) {
    let { user, error } = await supabase.auth.signUp({
        email: email,
        password: password
    });
    if (error) console.error(error);
    else console.log('User signed up:', user);
}

// Login function
async function login(email, password) {
    let { user, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    });
    if (error) console.error(error);
    else console.log('User logged in:', user);
}

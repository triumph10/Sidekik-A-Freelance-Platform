from flask import Flask, render_template, request, redirect, url_for, session, make_response, jsonify, session, send_from_directory
from flask_session import Session
from supabase import create_client
import traceback 
import os
import subprocess

app = Flask(__name__)
app.secret_key = 'your-secret-key'  # Change this to a secure secret key

# Configure Flask-Session to store sessions in the filesystem
app.config["SESSION_TYPE"] = "filesystem"  # Stores session data in files
app.config["SESSION_PERMANENT"] = False  # Session expires when the browser is closed
app.config["SESSION_FILE_DIR"] = "./.flask_session/"  # Directory for session storage
app.config["SESSION_USE_SIGNER"] = True  # Encrypts session cookies for security
app.config["SECRET_KEY"] = "iamironman"  # Change to a strong secret key

# Initialize Flask-Session
Session(app)

@app.route('/')
@app.route('/index')
def home():
    print("📌 Checking Session Data:", session)  # Debugging line

    if 'role' in session:
        if session['role'] == "freelancer":
            return redirect(url_for('freelancer_dashboard'))
        elif session['role'] == "client":
            # return redirect(url_for('home'))
            return render_template('index.html', 
                username=session.get('full_name'),
                loggedin=session.get('loggedin', False)
            )
    
    return render_template('index.html', 
        username=session.get('full_name'),
        loggedin=session.get('loggedin', False)
    )

@app.route('/about')
def about():
    return render_template('about.html', username=session.get('username'), loggedin=session.get('loggedin'))

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST' and 'username' in request.form and 'email' in request.form and 'password' in request.form:
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']

        # ✅ Simulate saving user in database (replace with Supabase logic)
        session['loggedin'] = True
        session['username'] = username
        session['account_type'] = request.form.get('accountType', 'hire')

        return redirect(url_for('home'))  # ✅ Redirect to index.html after signup
    return render_template('signup.html')


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST' and 'email' in request.form and 'password' in request.form:
        email = request.form['email']
        password = request.form['password']

        print("📌 Current Session Before Login:", session)  # Debugging

        # ✅ Simulate authentication (Replace with Supabase auth check)
        if email == "test@example.com" and password == "password":
            session['loggedin'] = True
            session['username'] = "Test User"
            session['account_type'] = "freelancer"  # Assume freelancer login
            
            print("✅ New Session Data:", session)  # Debugging
            return redirect(url_for('freelancer_dashboard'))
        else:
            return render_template('login.html', msg="Incorrect email/password!")

    return render_template('login.html')

@app.route('/profile-setup', methods=['GET'])
def profile_setup():
    if 'loggedin' not in session or session.get('role') != 'freelancer':
        print("⚠ Unauthorized Access. Redirecting to login.")
        return redirect(url_for('login'))

    print("✅ Accessing Profile Setup Page")
    return render_template('profile-setup.html')



@app.route('/profile')
def profile():
    print("📌 Current Session Data at Profile Route:", session)  # Debugging line
    
    if 'loggedin' not in session or session.get('role') != 'freelancer':
        print("⚠ Session missing or incorrect. Redirecting to login.")
        return redirect(url_for('login'))  # Redirects when session is missing

    user_id = session.get('id')  # Get user ID

    supabase_url = request.args.get("supabaseUrl")
    supabase_key = request.args.get("supabaseKey")

    if not supabase_url or not supabase_key:
        return "Missing Supabase credentials", 400

    supabase = create_client(supabase_url, supabase_key)

    # ✅ Step 1: Fetch freelancer profile
    response = supabase.from_("freelancer_profiles").select("*").eq("id", user_id).single().execute()
    profile_data = response.data

    if not profile_data:
        return "Profile not found", 404

    # ✅ Step 2: If email is missing, fetch from 'users' table
    if not profile_data.get("email"):
        print("⚠ Email missing in freelancer_profiles. Fetching from users table...")
        user_response = supabase.from_("users").select("email").eq("id", user_id).single().execute()
        user_data = user_response.data
        if user_data:
            profile_data["email"] = user_data["email"]

    profile = profile_data

    return render_template('profile.html', profile=profile)


@app.route('/freelancer-dashboard')
def freelancer_dashboard():
    print("🚀 Checking Session Data:", session)  # Debugging

    # ✅ Change 'account_type' to 'role'
    if 'loggedin' not in session or session.get('role') != 'freelancer':  
        print("⚠ Unauthorized Access. Redirecting to login.")
        return redirect(url_for('login'))  

    return render_template('freelancer-dashboard.html', username=session.get('full_name'))

@app.route('/upload-project')
def upload_project():
    return render_template('upload-project.html')

@app.route('/graph')
def graph():
    subprocess.run(["python", "fetch_skills.py"])
    subprocess.run(["python", "fetch_trends.py"])
    return render_template('graph.html')

@app.route('/set_session', methods=['POST'])
def set_session():
    try:
        session.clear()  # Clear any previous session

        data = request.get_json()
        print("📌 Received Data in set_session:", data)  # Debugging line

        role = data.get("role")  # ✅ Change to 'role'
        full_name = data.get("full_name")
        user_id = data.get("id")  # ✅ Ensure 'id' is used instead of 'user_id'

        if not role or not full_name or not user_id:
            print("❌ Missing required fields:", data)
            return jsonify({"error": "Missing required fields"}), 400  

        # ✅ Store session
        session["loggedin"] = True
        session["role"] = role  # ✅ Store role instead of account_type
        session["full_name"] = full_name
        session["id"] = user_id  

        print("✅ Session Set Successfully:", session)  # Debugging

        return jsonify({"message": "Session stored successfully"}), 200  

    except Exception as e:
        print("❌ Error in set_session:", str(e))
        return jsonify({"error": "Failed to store session", "details": str(e)}), 500  


@app.route('/logout')
def logout():
    print("📌 Logging out, clearing session...")  # Debugging line

    session.clear()  # ✅ Clears all session data
    response = make_response(redirect(url_for('login')))

    # ✅ Forcefully delete session cookies
    response.set_cookie('session', '', expires=0)
    response.set_cookie('supabase-auth-token', '', expires=0)

    print("✅ Session cleared successfully")  # Debugging line
    return response

@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static', 'images'),
                             'favicon.ico', mimetype='image/vnd.microsoft.icon')



if __name__ == '__main__':
    app.run(debug=True)



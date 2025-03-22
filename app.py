from flask import Flask, render_template, request, redirect, url_for, session, make_response, jsonify, session
from flask_session import Session
from supabase import create_client
import traceback 
from utils import generate_profile_embedding, generate_project_embedding
import config as CONFIG  # Direct import if it's a Python module

app = Flask(__name__)

# Configure Flask-Session to store sessions in the filesystem
app.config["SESSION_TYPE"] = "filesystem"  # Stores session data in files
app.config["SESSION_PERMANENT"] = False  # Session expires when the browser is closed
app.config["SESSION_FILE_DIR"] = "./.flask_session/"  # Directory for session storage
app.config["SESSION_USE_SIGNER"] = True  # Encrypts session cookies for security
app.config["SECRET_KEY"] = "iamironman"  # Change to a strong secret key

# Set Supabase credentials in app config
app.config["SUPABASE_URL"] = CONFIG.SUPABASE_URL
app.config["SUPABASE_ANON_KEY"] = CONFIG.SUPABASE_ANON_KEY

# Initialize Flask-Session
Session(app)

#----------------------------------------------------------------------------------------------------------------------

@app.route('/')
@app.route('/index')
def home():
    print("📌 Checking Session Data:", session)  # Debugging line

    if 'role' in session:
        if session['role'] == "freelancer":
            return redirect(url_for('freelancer_dashboard'))
        elif session['role'] == "client":
            # return redirect(url_for('home'))
            return render_template('index.html', username=session.get('username'))
    
    return render_template('index.html', username=session.get('username'))

@app.route('/about')
def about():
    return render_template('about.html', username=session.get('username'), loggedin=session.get('loggedin'))

#----------------------------------------------------------------------------------------------------------------------

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

#----------------------------------------------------------------------------------------------------------------------

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

#----------------------------------------------------------------------------------------------------------------------

@app.route('/profile-setup', methods=['GET'])
def profile_setup():
    if 'loggedin' not in session or session.get('role') != 'freelancer':
        print("⚠ Unauthorized Access. Redirecting to login.")
        return redirect(url_for('login'))

    print("✅ Accessing Profile Setup Page")
    return render_template('profile-setup.html')

#----------------------------------------------------------------------------------------------------------------------

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

#----------------------------------------------------------------------------------------------------------------------

@app.route('/freelancer-dashboard')
def freelancer_dashboard():
    print("🚀 Checking Session Data:", session)  # Debugging

    # ✅ Change 'account_type' to 'role'
    if 'loggedin' not in session or session.get('role') != 'freelancer':  
        print("⚠ Unauthorized Access. Redirecting to login.")
        return redirect(url_for('login'))  

    return render_template('freelancer-dashboard.html', username=session.get('full_name'))

#----------------------------------------------------------------------------------------------------------------------

@app.route('/upload-project')
def upload_project():
    return render_template('upload-project.html')

#----------------------------------------------------------------------------------------------------------------------

@app.route('/recommendations')
def recommendations():
    if 'loggedin' not in session:
        return redirect(url_for('login'))
    return render_template('recommendations.html')

#----------------------------------------------------------------------------------------------------------------------

@app.route('/project-matches')
def project_matches():
    if 'loggedin' not in session or session.get('role') != 'client':
        return redirect(url_for('login'))
    
    project_id = request.args.get('project_id')
    if not project_id:
        return redirect(url_for('recommendations'))
        
    return render_template('project-matches.html')

#----------------------------------------------------------------------------------------------------------------------

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

#----------------------------------------------------------------------------------------------------------------------

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

#----------------------------------------------------------------------------------------------------------------------

@app.route('/generate_profile_embedding', methods=['POST'])
def create_profile_embedding():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        # Extract relevant fields
        profile_data = {
            "bio": data.get("bio", ""),
            "skills": data.get("skills", [])
        }
        
        # Generate embedding
        embedding = generate_profile_embedding(profile_data)
        
        if embedding is None:
            return jsonify({"error": "Failed to generate embedding"}), 500
            
        return jsonify({"embedding": embedding}), 200
        
    except Exception as e:
        print(f"Error generating profile embedding: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

#----------------------------------------------------------------------------------------------------------------------

@app.route('/generate_project_embedding', methods=['POST'])
def create_project_embedding():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        # Extract relevant fields
        project_data = {
            "title": data.get("title", ""),
            "description": data.get("description", ""),
            "required_skills": data.get("required_skills", "")
        }
        
        # Generate embedding
        embedding = generate_project_embedding(project_data)
        
        if embedding is None:
            return jsonify({"error": "Failed to generate embedding"}), 500
            
        return jsonify({"embedding": embedding}), 200
        
    except Exception as e:
        print(f"Error generating project embedding: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

#----------------------------------------------------------------------------------------------------------------------

@app.route('/find_matching_projects', methods=['GET'])
def find_matching_projects():
    if 'loggedin' not in session or session.get('role') != 'freelancer':
        return jsonify({"error": "Unauthorized"}), 401
    
    user_id = session.get('id')
    if not user_id:
        return jsonify({"error": "User ID not found"}), 400
    
    try:
        # Query Supabase for the freelancer's profile embedding
        supabase = create_client(app.config.get('SUPABASE_URL'), app.config.get('SUPABASE_KEY'))
        profile_response = supabase.from_("freelancer_profiles").select("embedding").eq("id", user_id).single().execute()
        
        if not profile_response.data or 'embedding' not in profile_response.data:
            return jsonify({"error": "Freelancer profile embedding not found"}), 404
        
        # Get embedding and ensure it's 384 dimensions
        embedding = profile_response.data['embedding']
        if len(embedding) > 384:
            embedding = embedding[:384]  # Truncate to 384 if it's larger
        
        # Use direct SQL query with pgvector for similarity search
        query = """
        SELECT 
            id, title, description, budget, duration, required_skills, client_id, created_at,
            1 - (embedding <=> $1) as similarity
        FROM projects
        WHERE embedding IS NOT NULL
        ORDER BY embedding <=> $1
        LIMIT 10
        """
        
        # Execute the query directly through Supabase
        projects_response = supabase.rpc(
            'query_with_embedding', 
            {
                'query_text': query, 
                'query_params': [embedding]
            }
        ).execute()
        
        if projects_response.error:
            # Fallback to simpler solution if custom RPC not available
            projects = supabase.from_("projects").select("*").execute().data
            # Sort the results by looking for projects that need skills matching freelancer's skills
            freelancer = supabase.from_("freelancer_profiles").select("skills").eq("id", user_id).single().execute().data
            
            if freelancer and 'skills' in freelancer and projects:
                freelancer_skills = set(freelancer['skills'])
                for project in projects:
                    if 'required_skills' in project:
                        project_skills = set(project['required_skills'].split(','))
                        project['similarity'] = len(freelancer_skills.intersection(project_skills))
                
                projects.sort(key=lambda x: x.get('similarity', 0), reverse=True)
                return jsonify({"projects": projects[:10]}), 200
            
            return jsonify({"projects": projects}), 200
            
        return jsonify({"projects": projects_response.data}), 200
        
    except Exception as e:
        print(f"Error finding matching projects: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

#----------------------------------------------------------------------------------------------------------------------

@app.route('/find_matching_freelancers', methods=['GET'])
def find_matching_freelancers():
    if 'loggedin' not in session or session.get('role') != 'client':
        return jsonify({"error": "Unauthorized"}), 401
    
    project_id = request.args.get('project_id')
    if not project_id:
        return jsonify({"error": "Project ID not provided"}), 400
    
    try:
        # Initialize Supabase client with configuration from the app
        supabase_url = CONFIG.SUPABASE_URL if hasattr(CONFIG, 'SUPABASE_URL') else app.config.get('SUPABASE_URL')
        supabase_key = CONFIG.SUPABASE_KEY if hasattr(CONFIG, 'SUPABASE_KEY') else app.config.get('SUPABASE_KEY')
        supabase = create_client(supabase_url, supabase_key)
        
        # Query Supabase for the project's embedding
        project_response = supabase.from_("projects").select("embedding,required_skills").eq("id", project_id).single().execute()
        
        if not project_response.data:
            return jsonify({"error": "Project not found"}), 404
        
        project_data = project_response.data
        matching_freelancers = []
        
        # If embedding exists, use vector similarity with FAISS
        if 'embedding' in project_data and project_data['embedding']:
            embedding = project_data['embedding']
            
            # Query for freelancer profiles with embeddings
            profiles_response = supabase.from_("freelancer_profiles").select("*").execute()
            if profiles_response.data:
                # Import FAISS for similarity search
                try:
                    import numpy as np
                    import faiss
                    
                    # Extract embeddings and IDs
                    freelancer_ids = []
                    embedding_matrix = []
                    
                    for profile in profiles_response.data:
                        if 'embedding' in profile and profile['embedding'] and len(profile['embedding']) == len(embedding):
                            freelancer_ids.append(profile['id'])
                            embedding_matrix.append(profile['embedding'])
                    
                    if embedding_matrix:
                        # Convert to numpy arrays
                        embedding_matrix = np.array(embedding_matrix, dtype=np.float32)
                        query_embedding = np.array([embedding], dtype=np.float32)
                        
                        # Create FAISS index
                        dimension = len(embedding)
                        index = faiss.IndexFlatL2(dimension)
                        index.add(embedding_matrix)
                        
                        # Search for similar vectors
                        k = min(10, len(freelancer_ids))  # Number of results to return
                        distances, indices = index.search(query_embedding, k)
                        
                        # Convert distances to similarity scores (1.0 is perfect match)
                        max_distance = np.max(distances) if distances.size > 0 else 1.0
                        similarities = 1.0 - (distances[0] / max_distance)
                        
                        # Get the freelancer profiles for the top matches
                        for i, idx in enumerate(indices[0]):
                            if idx < len(freelancer_ids):
                                freelancer_id = freelancer_ids[idx]
                                for profile in profiles_response.data:
                                    if profile['id'] == freelancer_id:
                                        profile['similarity'] = float(similarities[i])
                                        matching_freelancers.append(profile)
                                        break
                        
                    # If FAISS search failed or found no results, fall back to skills-based matching
                    if not matching_freelancers:
                        print("FAISS search found no results, falling back to skills-based matching")
                        matching_freelancers = skills_based_matching(profiles_response.data, project_data)
                    
                except (ImportError, Exception) as e:
                    print(f"FAISS error: {str(e)}, falling back to skills-based matching")
                    matching_freelancers = skills_based_matching(profiles_response.data, project_data)
            else:
                # No profiles found
                return jsonify({"freelancers": []}), 200
        else:
            # No embedding, use skills-based matching
            profiles_response = supabase.from_("freelancer_profiles").select("*").execute()
            matching_freelancers = skills_based_matching(profiles_response.data, project_data)
        
        # Sort by similarity score
        matching_freelancers.sort(key=lambda x: x.get('similarity', 0), reverse=True)
        
        # Get user names for the matching freelancers
        for freelancer in matching_freelancers:
            if 'id' in freelancer:
                user_response = supabase.from_("users").\
                    select("full_name").\
                    eq("id", freelancer['id']).\
                    single().execute()
                
                if user_response.data:
                    freelancer['full_name'] = user_response.data.get('full_name')
        
        return jsonify({"freelancers": matching_freelancers[:10]}), 200
        
    except Exception as e:
        print(f"Error finding matching freelancers: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

def skills_based_matching(freelancers, project_data):
    """Fall back to skills-based matching when vector similarity isn't available"""
    matching_freelancers = []
    
    if 'required_skills' in project_data and project_data['required_skills'] and freelancers:
        project_skills = set(project_data['required_skills'].split(',')) if isinstance(project_data['required_skills'], str) else set()
        
        for freelancer in freelancers:
            if 'skills' in freelancer and freelancer['skills']:
                # Convert to set for intersection calculation
                freelancer_skills = set(freelancer['skills']) if isinstance(freelancer['skills'], list) else set(str(freelancer['skills']).split(','))
                
                # Calculate similarity based on skill overlap
                skill_overlap = len(project_skills.intersection(freelancer_skills))
                total_skills = len(project_skills.union(freelancer_skills))
                
                # Calculate Jaccard similarity
                similarity = skill_overlap / total_skills if total_skills > 0 else 0
                
                # Add similarity score to freelancer data
                freelancer_copy = dict(freelancer)
                freelancer_copy['similarity'] = similarity
                matching_freelancers.append(freelancer_copy)
    
    # Sort by similarity
    matching_freelancers.sort(key=lambda x: x.get('similarity', 0), reverse=True)
    return matching_freelancers[:10]

if __name__ == '__main__':
    app.run(debug=True)



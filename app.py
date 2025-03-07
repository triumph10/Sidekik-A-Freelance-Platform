from flask import Flask, render_template, request, redirect, url_for, session, make_response

app = Flask(__name__)
app.secret_key = "iamironman"  # Change this to a strong secret key

@app.route('/')
@app.route('/index')
def home():
    return render_template('index.html', username=session.get('username'))  # ✅ Pass username

@app.route('/about')
def about():
    return render_template('about.html')

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

# @app.route('/login')
# def login():
#     return render_template('login.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST' and 'email' in request.form and 'password' in request.form:
        email = request.form['email']
        password = request.form['password']

        # ✅ Simulate user authentication (Replace with Supabase auth check)
        if email == "test@example.com" and password == "password":
            session['loggedin'] = True
            session['username'] = "Test User"
            session['account_type'] = "hire"  # Assume client login
            return redirect(url_for('home'))
        else:
            return render_template('login.html', msg="Incorrect email/password!")

    return render_template('login.html')

@app.route('/freelancer-dashboard')
def freelancer_dashboard():
    if 'user' not in session or session.get('account_type') != 'work':
        return redirect(url_for('login'))  # Redirect unauthorized users
    return render_template('freelancer-dashboard.html')

# ✅ Store session after signup/login
@app.route('/set_session/<account_type>/<full_name>')
def set_session(account_type, full_name):
    session['user'] = True
    session['account_type'] = account_type
    session['full_name'] = full_name
    return "Session set", 200

@app.route('/logout')
def logout():
    session.clear()  # ✅ Clears session
    response = make_response(redirect(url_for('login')))
    
    # ✅ Forcefully delete cookies to ensure proper logout
    response.set_cookie('session', '', expires=0)
    response.set_cookie('supabase-auth-token', '', expires=0)
    
    return response

if __name__ == '__main__':
    app.run(debug=True)

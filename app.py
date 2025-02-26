from flask import Flask, render_template, request, redirect, url_for, session, flash
from supabase_config import supabase

app = Flask(__name__)
app.secret_key = "iamironman"  # Change this for security

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/freelancer-dashboard")
def freelancer_dashboard():
    return render_template("freelancer-dashboard.html")

@app.route("/signup", methods=["GET", "POST"])
def signup():
    if request.method == "POST":
        full_name = request.form.get("fullName")
        email = request.form.get("email")
        password = request.form.get("password")
        account_type = request.form.get("accountType")  # "hire" or "work"

        # Create user in Supabase Auth
        response = supabase.auth.sign_up({"email": email, "password": password})

        if "error" in response:
            flash("Signup failed: " + response["error"]["message"], "danger")
            return redirect(url_for("signup"))

        # Store user in the database
        user_id = response["user"]["id"]
        data = {"id": user_id, "full_name": full_name, "email": email, "account_type": account_type}
        supabase.table("users").insert(data).execute()

        # Redirect based on user type
        if account_type == "hire":
            return redirect(url_for("home"))  # Redirect to index.html
        elif account_type == "work":
            return redirect(url_for("freelancer_dashboard"))  # Redirect to freelancer-dashboard.html

    return render_template("signup.html")

if __name__ == "__main__":
    app.run(port=5000, debug=True)
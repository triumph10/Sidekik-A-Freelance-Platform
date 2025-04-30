import re
import pickle
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer

# Path to saved model and vectorizer
MODEL_PATH = 'bio_quality_model.pkl'
VECTORIZER_PATH = 'tfidf_vectorizer.pkl'

# Load the model and vectorizer if they exist, otherwise they'll be created when the notebook is run
try:
    with open(MODEL_PATH, 'rb') as file:
        model = pickle.load(file)
    with open(VECTORIZER_PATH, 'rb') as file:
        vectorizer = pickle.load(file)
    print(f"✅ Bio quality model and vectorizer loaded successfully")
    model_loaded = True
except FileNotFoundError:
    print(f"⚠️ Bio quality model not found. Run the bio_quality_classifier.ipynb notebook first.")
    model_loaded = False

def clean_text(text):
    """
    Clean and preprocess text for analysis
    
    Args:
        text (str): The text to clean
        
    Returns:
        str: Cleaned text
    """
    if not text or not isinstance(text, str):
        return ""
    
    # Convert to lowercase
    text = text.lower()
    
    # Remove special characters and numbers
    text = re.sub(r'[^a-zA-Z\s]', '', text)
    
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    
    return text

def analyze_bio_quality(bio_text):
    """
    Analyze the quality of a freelancer bio and provide feedback.
    
    Args:
        bio_text (str): The bio text to analyze
        
    Returns:
        dict: Analysis results including quality score and feedback
    """
    # If model isn't loaded, perform basic analysis
    if not model_loaded:
        return basic_bio_analysis(bio_text)
    
    # Clean the text
    clean_bio = clean_text(bio_text)
    
    # Transform using the vectorizer
    bio_features = vectorizer.transform([clean_bio])
    
    # Predict quality
    quality_score = model.predict(bio_features)[0]
    quality_prob = model.predict_proba(bio_features)[0][1]  # Probability of good quality
    
    # Generate feedback
    feedback = generate_bio_feedback(bio_text)
    
    # Overall assessment
    if quality_score == 1:
        overall = "Your bio appears to be well-written."
        if feedback:
            overall += " However, there are still some improvements you could make."
    else:
        overall = "Your bio needs improvement to better showcase your skills and experience."
    
    return {
        "quality_score": int(quality_score),
        "quality_probability": float(quality_prob),
        "overall_assessment": overall,
        "feedback": feedback,
        "is_good_quality": quality_score == 1
    }

def basic_bio_analysis(bio_text):
    """
    Perform basic analysis of bio quality without ML model
    
    Args:
        bio_text (str): The bio text to analyze
        
    Returns:
        dict: Analysis results
    """
    # Check length
    is_good_length = len(bio_text) >= 100
    
    # Check word count
    words = bio_text.split()
    is_good_word_count = len(words) >= 20
    
    # Check for keyword inclusion
    keywords = ['experience', 'skill', 'project', 'develop', 'design', 'create', 'work', 'professional']
    keyword_count = sum(1 for keyword in keywords if keyword in bio_text.lower())
    has_keywords = keyword_count >= 3
    
    # Generate quality score
    quality_score = 1 if (is_good_length and is_good_word_count and has_keywords) else 0
    
    # Generate feedback
    feedback = generate_bio_feedback(bio_text)
    
    # Overall assessment
    if quality_score == 1:
        overall = "Your bio appears to be well-written."
        if feedback:
            overall += " However, there are still some improvements you could make."
    else:
        overall = "Your bio needs improvement to better showcase your skills and experience."
    
    return {
        "quality_score": quality_score,
        "quality_probability": 0.8 if quality_score == 1 else 0.2,  # Estimated probability
        "overall_assessment": overall,
        "feedback": feedback,
        "is_good_quality": quality_score == 1
    }

def generate_bio_feedback(bio_text):
    """
    Generate specific feedback for improving a bio
    
    Args:
        bio_text (str): The bio text to analyze
        
    Returns:
        list: List of feedback items
    """
    feedback = []
    
    # Check length
    if len(bio_text) < 100:
        feedback.append("Your bio is too short. Aim for at least 100-150 characters.")
    
    # Check word count
    words = bio_text.split()
    if len(words) < 20:
        feedback.append("Your bio has too few words. Include at least 20-30 words.")
    
    # Check for keyword inclusion
    keywords = {
        'experience': "Mention your years of experience in your field.",
        'skill': "Include your key skills relevant to your profession.",
        'project': "Briefly mention significant projects you've worked on.",
        'professional': "Highlight your professional background."
    }
    
    missing_keywords = []
    for keyword, suggestion in keywords.items():
        if keyword not in bio_text.lower():
            missing_keywords.append(suggestion)
    
    if missing_keywords:
        feedback.extend(missing_keywords)
    
    return feedback

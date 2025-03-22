import torch
from transformers import AutoTokenizer, AutoModel
import numpy as np

# Initialize BERT model and tokenizer
tokenizer = None
model = None

def init_bert_model():
    global tokenizer, model
    if tokenizer is None or model is None:
        tokenizer = AutoTokenizer.from_pretrained('bert-base-uncased')
        model = AutoModel.from_pretrained('bert-base-uncased')

def generate_bert_embedding(text):
    """Generate BERT embeddings for the given text"""
    if not text:
        return None
    
    # Initialize model if needed
    init_bert_model()
    
    # Tokenize and prepare input
    inputs = tokenizer(text, return_tensors='pt', padding=True, truncation=True, max_length=512)
    
    # Generate embeddings
    with torch.no_grad():
        outputs = model(**inputs)
    
    # Use CLS token embedding (first token) as the sentence embedding
    embeddings = outputs.last_hidden_state[:, 0, :].numpy()
    
    # Original BERT embeddings are 768 dimensions, we need to truncate to 384
    # Taking the first 384 dimensions is a simple approach
    truncated_embeddings = embeddings[0][:384].tolist()
    
    return truncated_embeddings

def generate_profile_embedding(profile_data):
    """Generate embeddings for a freelancer profile"""
    # Combine relevant profile fields into a single text
    text_fields = []
    
    if "bio" in profile_data and profile_data["bio"]:
        text_fields.append(profile_data["bio"])
    
    if "skills" in profile_data and profile_data["skills"]:
        if isinstance(profile_data["skills"], list):
            skills_text = ", ".join(profile_data["skills"])
        else:
            skills_text = profile_data["skills"]
        text_fields.append(f"Skills: {skills_text}")
    
    combined_text = " ".join(text_fields)
    return generate_bert_embedding(combined_text)

def generate_project_embedding(project_data):
    """Generate embeddings for a project"""
    # Combine relevant project fields into a single text
    text_fields = []
    
    if "title" in project_data and project_data["title"]:
        text_fields.append(project_data["title"])
    
    if "description" in project_data and project_data["description"]:
        text_fields.append(project_data["description"])
    
    if "required_skills" in project_data and project_data["required_skills"]:
        text_fields.append(f"Required skills: {project_data['required_skills']}")
    
    combined_text = " ".join(text_fields)
    return generate_bert_embedding(combined_text) 
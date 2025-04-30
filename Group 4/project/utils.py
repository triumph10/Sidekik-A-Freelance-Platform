import torch
from transformers import AutoTokenizer, AutoModel
import numpy as np
import traceback

# Initialize BERT model and tokenizer
tokenizer = None
model = None

# Standardize on 384 dimensions for all embeddings (for FAISS compatibility)
EMBEDDING_DIM = 384

def init_bert_model():
    global tokenizer, model
    if tokenizer is None or model is None:
        try:
            print("🔄 Initializing BERT model...")
            tokenizer = AutoTokenizer.from_pretrained('bert-base-uncased')
            model = AutoModel.from_pretrained('bert-base-uncased')
            print("✅ BERT model initialized successfully")
        except Exception as e:
            print(f"❌ Error initializing BERT model: {str(e)}")
            traceback.print_exc()

def generate_bert_embedding(text):
    """Generate BERT embeddings for the given text with 384 dimensions"""
    if not text:
        print("⚠️ Warning: Empty text provided for embedding generation")
        # Return a zero vector instead of None to avoid errors
        return [0.0] * EMBEDDING_DIM
    
    try:
        # Initialize model if needed
        init_bert_model()
        
        print(f"📊 Generating embedding for text: '{text[:50]}...' ({len(text)} chars)")
        
        # Tokenize and prepare input
        inputs = tokenizer(text, return_tensors='pt', padding=True, truncation=True, max_length=512)
        
        # Generate embeddings
        with torch.no_grad():
            outputs = model(**inputs)
        
        # Use CLS token embedding (first token) as the sentence embedding
        embeddings = outputs.last_hidden_state[:, 0, :].numpy()
        
        # Truncate to 384 dimensions for consistency
        truncated_embeddings = embeddings[0][:EMBEDDING_DIM].tolist()
        
        # Ensure we have exactly EMBEDDING_DIM dimensions
        if len(truncated_embeddings) < EMBEDDING_DIM:
            print(f"⚠️ Warning: Embedding shorter than expected: {len(truncated_embeddings)}/{EMBEDDING_DIM}")
            # Pad with zeros if needed
            truncated_embeddings = truncated_embeddings + [0.0] * (EMBEDDING_DIM - len(truncated_embeddings))
        
        # Normalize the embedding vector to unit length
        norm = np.linalg.norm(truncated_embeddings)
        if norm > 0:
            normalized_embeddings = [float(val / norm) for val in truncated_embeddings]
        else:
            normalized_embeddings = truncated_embeddings
        
        print(f"✅ Successfully generated embedding with {len(normalized_embeddings)} dimensions")
        return normalized_embeddings
        
    except Exception as e:
        print(f"❌ Error generating embedding: {str(e)}")
        import traceback
        traceback.print_exc()
        # Return a zero vector instead of None to avoid errors
        return [0.0] * EMBEDDING_DIM

def generate_profile_embedding(profile_data):
    """Generate embeddings for a freelancer profile (384 dimensions)"""
    print(f"📊 Generating profile embedding for: {profile_data.get('id', 'Unknown ID')}")
    
    # Combine relevant profile fields into a single text with weights
    text_fields = []
    
    # Bio has weight 2
    if "bio" in profile_data and profile_data["bio"]:
        # Repeat bio twice for higher weight
        text_fields.append(profile_data["bio"])
        text_fields.append(profile_data["bio"])
        print(f"✅ Added bio: '{profile_data['bio'][:50]}...'")
    
    # Skills have weight 3
    if "skills" in profile_data and profile_data["skills"]:
        skills_text = ""
        if isinstance(profile_data["skills"], list):
            skills_text = ", ".join(profile_data["skills"])
        else:
            skills_text = str(profile_data["skills"])
        
        # Repeat skills three times for higher weight
        skills_prefix = "Skills: "
        text_fields.append(f"{skills_prefix}{skills_text}")
        text_fields.append(f"{skills_prefix}{skills_text}")
        text_fields.append(f"{skills_prefix}{skills_text}")
        print(f"✅ Added skills: '{skills_text[:50]}...'")
    
    # Add experience if available
    if "experience" in profile_data and profile_data["experience"]:
        text_fields.append(f"Experience: {profile_data['experience']}")
        print(f"✅ Added experience: '{profile_data['experience'][:50]}...'")
    
    # Add availability if available
    if "availability" in profile_data and profile_data["availability"]:
        text_fields.append(f"Availability: {profile_data['availability']}")
        print(f"✅ Added availability: '{profile_data['availability'][:50]}...'")
    
    combined_text = " ".join(text_fields)
    print(f"📊 Combined text length: {len(combined_text)} characters")
    
    return generate_bert_embedding(combined_text)

def generate_project_embedding(project_data):
    """Generate embeddings for a project (384 dimensions)"""
    print(f"📊 Generating project embedding for: {project_data.get('title', 'Untitled')}")
    
    # Combine relevant project fields into a single text with weights
    text_fields = []
    
    # Title has weight 2
    if "title" in project_data and project_data["title"]:
        # Repeat title twice for higher weight
        text_fields.append(project_data["title"])
        text_fields.append(project_data["title"])
        print(f"✅ Added title: '{project_data['title']}'")
    
    # Description has weight 1
    if "description" in project_data and project_data["description"]:
        text_fields.append(project_data["description"])
        print(f"✅ Added description: '{project_data['description'][:50]}...'")
    
    # Required skills have weight 3
    if "required_skills" in project_data and project_data["required_skills"]:
        skills_text = ""
        if isinstance(project_data["required_skills"], list):
            skills_text = ", ".join(project_data["required_skills"])
        else:
            skills_text = str(project_data["required_skills"])
        
        # Repeat skills three times for higher weight
        skills_prefix = "Required skills: "
        text_fields.append(f"{skills_prefix}{skills_text}")
        text_fields.append(f"{skills_prefix}{skills_text}")
        text_fields.append(f"{skills_prefix}{skills_text}")
        print(f"✅ Added required skills: '{skills_text}'")
    
    combined_text = " ".join(text_fields)
    print(f"📊 Combined text length: {len(combined_text)} characters")
    
    return generate_bert_embedding(combined_text)
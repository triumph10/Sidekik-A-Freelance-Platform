import faiss
import numpy as np
from supabase import create_client
from embeddings import get_embedding
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Supabase Connection
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def build_faiss_index():
    """
    Builds a FAISS index from all freelancer embeddings.
    """
    freelancers = supabase.table("freelancers").select("id, name, embedding").execute()
    freelancer_embeddings = np.array([f["embedding"] for f in freelancers.data], dtype="float32")

    # Initialize FAISS index (L2 = Euclidean, use IndexFlatIP for cosine similarity)
    index = faiss.IndexFlatL2(freelancer_embeddings.shape[1])
    index.add(freelancer_embeddings)  # Add embeddings to FAISS index
    
    return index, freelancers.data

def find_similar_freelancers(job_description, top_k=3):
    """
    Uses FAISS to find top-K similar freelancers based on job description.
    """
    job_embedding = np.array(get_embedding(job_description), dtype="float32").reshape(1, -1)

    index, freelancer_data = build_faiss_index()

    # Search FAISS index
    distances, indices = index.search(job_embedding, top_k)

    return [freelancer_data[i] for i in indices[0]]  # Get top freelancers

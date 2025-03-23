# 1. Check version info
import faiss
print(f"FAISS version: {faiss.__version__}")
print(f"CPU capability: {faiss.get_compile_options()}")

# 2. Test a more complex index
import numpy as np
dimension = 128
num_vectors = 1000
vectors = np.random.random((num_vectors, dimension)).astype('float32')

# Create IVF index (more advanced than basic flat index)
nlist = 10
quantizer = faiss.IndexFlatL2(dimension)
index = faiss.IndexIVFFlat(quantizer, dimension, nlist)
index.train(vectors)
index.add(vectors)

# Verify search
query = np.random.random((1, dimension)).astype('float32')
index.nprobe = 3  # Set number of cells to probe
distances, indices = index.search(query, k=5)
print("IVF index search successful!")
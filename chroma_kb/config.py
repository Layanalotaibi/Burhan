"""
Configuration constants for the ChromaDB Knowledge Base module.
"""
import os

# ChromaDB Storage
CHROMA_PERSIST_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "chroma_db")
COLLECTION_NAME = "nca_knowledge_base"

# Embedding Model (runs 100% locally)
EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"

# Chunking Parameters
CHUNK_SIZE = 900
CHUNK_OVERLAP = 150
MIN_CHUNK_SIZE = 100

# Search Defaults
DEFAULT_N_RESULTS = 5
MAX_N_RESULTS = 20

# PDF Processing - batch size for large documents
PDF_PAGE_BATCH_SIZE = 50

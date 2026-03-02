"""
Document indexer: extracts text from PDFs and indexes into ChromaDB.
"""
import os
import io
from typing import List, Dict
from pypdf import PdfReader

from .config import (
    CHROMA_PERSIST_DIR,
    COLLECTION_NAME,
    EMBEDDING_MODEL_NAME,
    PDF_PAGE_BATCH_SIZE,
)
from .chunking import chunk_pages

import chromadb
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction

# Module-level singletons (lazy-initialized)
_chroma_client = None
_collection = None
_embedding_fn = None


def _get_embedding_fn():
    """Lazy-initialize the SentenceTransformer embedding function."""
    global _embedding_fn
    if _embedding_fn is None:
        _embedding_fn = SentenceTransformerEmbeddingFunction(
            model_name=EMBEDDING_MODEL_NAME,
        )
    return _embedding_fn


def _get_collection():
    """Lazy-initialize the ChromaDB client and collection."""
    global _chroma_client, _collection
    if _collection is None:
        os.makedirs(CHROMA_PERSIST_DIR, exist_ok=True)
        _chroma_client = chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)
        _collection = _chroma_client.get_or_create_collection(
            name=COLLECTION_NAME,
            embedding_function=_get_embedding_fn(),
        )
    return _collection


def extract_pdf_pages(file_content: bytes) -> List[Dict]:
    """Extract text from PDF page by page, skipping empty pages."""
    reader = PdfReader(io.BytesIO(file_content))
    pages = []
    for i, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ""
        if text.strip():
            pages.append({"page_num": i, "text": text})
    return pages


def _delete_existing_chunks(collection, source_filename: str) -> int:
    """Delete all existing chunks for a source file (for re-indexing)."""
    existing = collection.get(
        where={"source": source_filename},
        include=[]
    )
    if existing and existing["ids"]:
        collection.delete(ids=existing["ids"])
        return len(existing["ids"])
    return 0


def index_pdf_document(file_content: bytes, filename: str) -> Dict:
    """
    Main indexing function: extract PDF text, chunk, and upsert into ChromaDB.

    Args:
        file_content: Raw PDF file bytes.
        filename: Original filename (used as source identifier).

    Returns:
        Dict with indexing summary.
    """
    collection = _get_collection()

    try:
        # Step 1: Extract pages
        print(f"  [KB] Extracting text from {filename}...")
        pages = extract_pdf_pages(file_content)
        if not pages:
            return {
                "source": filename,
                "total_pages": 0,
                "total_chunks": 0,
                "status": "error",
                "message": "No text could be extracted from PDF"
            }

        print(f"  [KB] Extracted {len(pages)} pages with text")

        # Step 2: Delete existing chunks for re-indexing
        deleted_count = _delete_existing_chunks(collection, filename)
        if deleted_count > 0:
            print(f"  [KB] Deleted {deleted_count} old chunks")

        # Step 3: Process pages in batches
        all_chunks = []
        for batch_start in range(0, len(pages), PDF_PAGE_BATCH_SIZE):
            batch_pages = pages[batch_start:batch_start + PDF_PAGE_BATCH_SIZE]
            batch_chunks = chunk_pages(batch_pages)

            # Set source on each chunk
            for chunk in batch_chunks:
                chunk["metadata"]["source"] = filename

            all_chunks.extend(batch_chunks)
            print(f"  [KB] Processed pages {batch_start + 1}-{min(batch_start + PDF_PAGE_BATCH_SIZE, len(pages))}")

        # Re-number chunk IDs sequentially
        for i, chunk in enumerate(all_chunks):
            chunk["chunk_id"] = f"{filename}::chunk_{i}"
            chunk["metadata"]["chunk_index"] = i

        if not all_chunks:
            return {
                "source": filename,
                "total_pages": len(pages),
                "total_chunks": 0,
                "status": "error",
                "message": "Text extracted but no valid chunks produced"
            }

        # Step 4: Upsert into ChromaDB in batches
        UPSERT_BATCH = 100
        for batch_start in range(0, len(all_chunks), UPSERT_BATCH):
            batch = all_chunks[batch_start:batch_start + UPSERT_BATCH]
            collection.upsert(
                ids=[c["chunk_id"] for c in batch],
                documents=[c["text"] for c in batch],
                metadatas=[c["metadata"] for c in batch],
            )
            print(f"  [KB] Indexed chunks {batch_start + 1}-{min(batch_start + UPSERT_BATCH, len(all_chunks))}")

        print(f"  [KB] Done! {len(all_chunks)} chunks from {len(pages)} pages")

        return {
            "source": filename,
            "total_pages": len(pages),
            "total_chunks": len(all_chunks),
            "status": "success",
            "message": f"Indexed {len(all_chunks)} chunks from {len(pages)} pages"
        }

    except Exception as e:
        print(f"  [KB] Error: {e}")
        return {
            "source": filename,
            "total_pages": 0,
            "total_chunks": 0,
            "status": "error",
            "message": str(e)
        }


def list_indexed_documents() -> List[Dict]:
    """List all unique source documents currently in the KB."""
    collection = _get_collection()
    all_data = collection.get(include=["metadatas"])

    if not all_data or not all_data["metadatas"]:
        return []

    source_counts = {}
    for meta in all_data["metadatas"]:
        source = meta.get("source", "unknown")
        source_counts[source] = source_counts.get(source, 0) + 1

    return [
        {"source": source, "chunk_count": count}
        for source, count in sorted(source_counts.items())
    ]


def delete_document(filename: str) -> Dict:
    """Delete all chunks for a specific source document."""
    collection = _get_collection()
    deleted = _delete_existing_chunks(collection, filename)
    return {
        "source": filename,
        "deleted_chunks": deleted,
        "status": "success"
    }


def index_pdf_from_path(file_path: str) -> Dict:
    """
    Index a PDF file from a local file path.
    Used for auto-indexing the default KB document on startup.
    """
    with open(file_path, "rb") as f:
        file_content = f.read()
    filename = os.path.basename(file_path)
    return index_pdf_document(file_content, filename)


def get_collection_stats() -> Dict:
    """Get total count and list of indexed documents."""
    collection = _get_collection()
    return {
        "collection_name": COLLECTION_NAME,
        "total_chunks": collection.count(),
        "documents": list_indexed_documents()
    }

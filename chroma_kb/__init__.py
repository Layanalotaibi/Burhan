"""
ChromaDB Knowledge Base module for Burhan.

Stores and retrieves NCA-ECC reference documents (framework guides, templates).
NOT for user evidence -- that goes through db_service.py and SQLite.
"""

from .indexer import index_pdf_document as index_kb_document
from .indexer import index_pdf_from_path
from .indexer import list_indexed_documents as list_kb_documents
from .indexer import delete_document as delete_kb_document
from .indexer import get_collection_stats as kb_stats
from .search import search_kb

__all__ = [
    "index_kb_document",
    "index_pdf_from_path",
    "search_kb",
    "list_kb_documents",
    "delete_kb_document",
    "kb_stats",
]

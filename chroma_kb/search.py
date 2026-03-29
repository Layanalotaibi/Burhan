"""
Semantic search against the ChromaDB Knowledge Base.
"""
from typing import Dict, Optional
from .config import DEFAULT_N_RESULTS, MAX_N_RESULTS
from .indexer import _get_collection


def search_kb(
    query: str,
    n_results: int = DEFAULT_N_RESULTS,
    source_filter: Optional[str] = None,
) -> Dict:
    """
    Perform semantic search against the Knowledge Base.

    Args:
        query: Search query text (English or Arabic).
        n_results: Number of results to return.
        source_filter: Optional filename to restrict search to one document.

    Returns:
        Dict with query and list of results sorted by relevance.
    """
    collection = _get_collection()

    n_results = min(max(1, n_results), MAX_N_RESULTS)

    # Don't request more than what exists
    total_count = collection.count()
    if total_count == 0:
        return {"query": query, "results": []}
    n_results = min(n_results, total_count)

    # Build filter
    where_filter = None
    if source_filter:
        where_filter = {"source": source_filter}

    # Query - ChromaDB handles embedding via the collection's embedding_function
    query_result = collection.query(
        query_texts=[query],
        n_results=n_results,
        where=where_filter,
        include=["documents", "metadatas", "distances"],
    )

    # Format results
    results = []
    if query_result and query_result["ids"] and query_result["ids"][0]:
        ids = query_result["ids"][0]
        documents = query_result["documents"][0]
        metadatas = query_result["metadatas"][0]
        distances = query_result["distances"][0]

        for i in range(len(ids)):
            distance = distances[i]
            relevance_score = round(1.0 / (1.0 + distance), 4)

            results.append({
                "chunk_id": ids[i],
                "text": documents[i],
                "source": metadatas[i].get("source", "unknown"),
                "page": metadatas[i].get("page", 0),
                "chunk_index": metadatas[i].get("chunk_index", 0),
                "distance": round(distance, 4),
                "relevance_score": relevance_score,
            })

    return {"query": query, "results": results}

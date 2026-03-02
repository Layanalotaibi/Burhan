"""
Smart text chunking with sentence-boundary awareness and Arabic support.
"""
import re
from typing import List, Dict
from .config import CHUNK_SIZE, CHUNK_OVERLAP, MIN_CHUNK_SIZE

# Sentence-ending punctuation: English (. ! ?) and Arabic (۔ ؟)
# Split after these when followed by whitespace or newline
SENTENCE_SPLIT_PATTERN = re.compile(
    r'(?<=[.!?۔؟])\s+'
    r'|(?<=[.!?۔؟])\n+'
    r'|(?<=\n)\n+'
)


def split_into_sentences(text: str) -> List[str]:
    """Split text into sentences respecting English and Arabic punctuation."""
    sentences = SENTENCE_SPLIT_PATTERN.split(text)
    return [s.strip() for s in sentences if s.strip()]


def chunk_text(text: str, source: str, start_page: int = 1) -> List[Dict]:
    """
    Split text into overlapping chunks that respect sentence boundaries.

    Returns list of dicts with keys: text, chunk_id, metadata
    """
    sentences = split_into_sentences(text)
    if not sentences:
        return []

    chunks = []
    current_sentences = []
    current_length = 0
    chunk_index = 0

    for sentence in sentences:
        sentence_len = len(sentence)

        # If adding this sentence exceeds limit and we have content, finalize chunk
        if current_length + sentence_len > CHUNK_SIZE and current_sentences:
            chunk_str = " ".join(current_sentences)

            if len(chunk_str) >= MIN_CHUNK_SIZE:
                chunks.append({
                    "text": chunk_str,
                    "chunk_id": f"{source}::chunk_{chunk_index}",
                    "metadata": {
                        "source": source,
                        "page": start_page,
                        "chunk_index": chunk_index,
                    }
                })
                chunk_index += 1

            # Build overlap from end of current sentences
            overlap_sentences = []
            overlap_length = 0
            for s in reversed(current_sentences):
                if overlap_length + len(s) > CHUNK_OVERLAP:
                    break
                overlap_sentences.insert(0, s)
                overlap_length += len(s)

            current_sentences = overlap_sentences
            current_length = overlap_length

        current_sentences.append(sentence)
        current_length += sentence_len

    # Final chunk
    if current_sentences:
        chunk_str = " ".join(current_sentences)
        if len(chunk_str) >= MIN_CHUNK_SIZE:
            chunks.append({
                "text": chunk_str,
                "chunk_id": f"{source}::chunk_{chunk_index}",
                "metadata": {
                    "source": source,
                    "page": start_page,
                    "chunk_index": chunk_index,
                }
            })

    return chunks


def chunk_pages(pages: List[Dict]) -> List[Dict]:
    """
    Chunk a list of page dicts from PDF extraction.
    Accumulates text across page boundaries before chunking.

    Args:
        pages: List of {"page_num": int, "text": str}

    Returns:
        List of chunk dicts with page metadata.
    """
    all_chunks = []
    accumulated_text = ""
    current_start_page = 1

    for page in pages:
        if not accumulated_text:
            current_start_page = page["page_num"]
        accumulated_text += page["text"] + "\n"

        # Chunk when accumulated text is large enough
        if len(accumulated_text) > CHUNK_SIZE * 3:
            page_chunks = chunk_text(
                accumulated_text,
                source="",
                start_page=current_start_page
            )
            all_chunks.extend(page_chunks)

            # Keep overlap for next batch
            if accumulated_text:
                accumulated_text = accumulated_text[-CHUNK_OVERLAP:]
                current_start_page = page["page_num"]

    # Process remaining text
    if accumulated_text.strip():
        page_chunks = chunk_text(
            accumulated_text,
            source="",
            start_page=current_start_page
        )
        all_chunks.extend(page_chunks)

    return all_chunks

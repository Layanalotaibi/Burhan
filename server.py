"""
Burhan - NCA Compliance Evaluation System (POC)
Backend API Server
"""
from fastapi import FastAPI, Form, UploadFile, File, Request
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os
import uuid
import json
import re
import base64
import uvicorn
from datetime import datetime
from dotenv import load_dotenv
from openai import OpenAI
from typing import List

# Database service
try:
    from db_service import db
    DB_AVAILABLE = True
except Exception as e:
    print(f"Database not available: {e}")
    DB_AVAILABLE = False

# Knowledge Base service
try:
    from chroma_kb import index_kb_document, index_pdf_from_path, search_kb, list_kb_documents, delete_kb_document, kb_stats
    KB_AVAILABLE = True
except Exception as e:
    print(f"Knowledge Base not available: {e}")
    KB_AVAILABLE = False

# Uploads directory
UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "uploads", "evidence")

# Default Knowledge Base PDF
DEFAULT_KB_PDF = os.path.join(os.path.dirname(__file__), "chroma_kb", "Guide-to-Essential-Cybersecurity-Controls-(ECC)-Implementation-15.pdf")

# Load environment variables
import pathlib
env_path = pathlib.Path(__file__).parent / ".env"
load_dotenv(env_path)

app = FastAPI(title="Burhan POC")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount frontend files
app.mount("/frontend", StaticFiles(directory="frontend"), name="frontend")


@app.on_event("startup")
async def auto_index_default_kb():
    """Auto-index the default ECC Guide PDF into ChromaDB on startup."""
    if not KB_AVAILABLE:
        print("[KB] Knowledge Base module not available, skipping auto-index.")
        return

    if not os.path.exists(DEFAULT_KB_PDF):
        print(f"[KB] Default KB PDF not found: {DEFAULT_KB_PDF}")
        return

    # Check if already indexed
    stats = kb_stats()
    kb_filename = os.path.basename(DEFAULT_KB_PDF)
    already_indexed = any(doc["source"] == kb_filename for doc in stats.get("documents", []))

    if already_indexed:
        print(f"[KB] Default KB already indexed: {kb_filename}")
        return

    print(f"[KB] Auto-indexing default KB: {kb_filename}...")
    result = index_pdf_from_path(DEFAULT_KB_PDF)
    print(f"[KB] Auto-index result: {result['message']}")

# Cache for evaluation results
evaluation_cache = {}


# =============================================================================
# Helper Functions
# =============================================================================

def get_llm_client():
    """Create OpenRouter client"""
    api_key = os.getenv("OPENROUTER_API_KEY")
    if api_key:
        api_key = api_key.strip().strip("'\"")
        return OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=api_key
        )
    return None


def save_file_locally(file_content: bytes, original_filename: str, deliverable_id: str) -> dict:
    """Save uploaded file to local uploads directory"""
    # Create date-based subdirectory
    date_folder = datetime.now().strftime("%Y/%m")
    save_dir = os.path.join(UPLOADS_DIR, date_folder)
    os.makedirs(save_dir, exist_ok=True)

    # Generate unique filename
    file_ext = os.path.splitext(original_filename)[1]
    unique_filename = f"{deliverable_id}_{uuid.uuid4().hex[:8]}{file_ext}"
    file_path = os.path.join(save_dir, unique_filename)

    # Save file
    with open(file_path, "wb") as f:
        f.write(file_content)

    return {
        "file_name": original_filename,
        "file_location": file_path,
        "file_size": len(file_content)
    }


# =============================================================================
# Frontend Route
# =============================================================================

@app.get("/", response_class=HTMLResponse)
async def home():
    """Serve the main HTML page"""
    return FileResponse("frontend/index.html")


# =============================================================================
# API Routes
# =============================================================================

@app.get("/api/hierarchy/status")
async def hierarchy_status():
    """Check if hierarchy JSON has been uploaded"""
    from controls_data import is_hierarchy_loaded
    return {"status": "success", "loaded": is_hierarchy_loaded()}


@app.post("/api/hierarchy/upload")
async def hierarchy_upload(file: UploadFile = File(...)):
    """Upload hierarchy JSON file"""
    from controls_data import save_hierarchy

    if not file.filename.lower().endswith('.json'):
        return {"status": "error", "message": "Only JSON files are supported"}

    try:
        content = await file.read()
        data = json.loads(content.decode("utf-8"))
        save_hierarchy(data)

        # Count totals for feedback
        total_sc = 0
        total_ed = 0
        for sd in data["sub_domains"]:
            for ctrl in sd["controls"]:
                for sc in ctrl["sub_controls"]:
                    total_sc += 1
                    total_ed += len(sc["expected_deliverables"])

        return {
            "status": "success",
            "message": f"Hierarchy loaded: {total_sc} sub-controls, {total_ed} deliverables",
            "sub_controls": total_sc,
            "deliverables": total_ed
        }
    except json.JSONDecodeError as e:
        return {"status": "error", "message": f"Invalid JSON: {e}"}
    except ValueError as e:
        return {"status": "error", "message": f"Validation error: {e}"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/api/sub-controls")
async def get_sub_controls():
    """Get all sub-controls with their deliverables"""
    from controls_data import get_hierarchy

    hierarchy = get_hierarchy()
    if not hierarchy:
        return {"status": "success", "sub_controls": [], "message": "No hierarchy loaded. Please upload a hierarchy JSON file."}

    sub_controls = []

    for sd in hierarchy["sub_domains"]:
        for ctrl in sd["controls"]:
            for sc in ctrl["sub_controls"]:
                sub_controls.append({
                    "sub_control_id": sc["sub_control_id"],
                    "name": sc["name"],
                    "control_id": ctrl["control_id"],
                    "control_name": ctrl["name"],
                    "deliverables": [
                        {"id": d["deliverable_id"], "name": d["name"]}
                        for d in sc["expected_deliverables"]
                    ]
                })

    return {"status": "success", "sub_controls": sub_controls}


def extract_text_from_file(file_content: bytes, content_type: str, filename: str) -> str:
    """Extract text from uploaded file"""
    if content_type == 'text/plain':
        return file_content.decode('utf-8')

    elif content_type == 'application/pdf':
        from pypdf import PdfReader
        import io
        reader = PdfReader(io.BytesIO(file_content))
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text.strip()

    elif content_type in ['application/vnd.openxmlformats-officedocument.wordprocessingml.document']:
        from docx import Document
        import io
        doc = Document(io.BytesIO(file_content))
        text = ""
        for para in doc.paragraphs:
            text += para.text + "\n"
        return text.strip()

    elif content_type in ['application/msword']:
        # For .doc files, just return a note (would need additional library)
        return "[Word .doc file - please convert to .docx]"

    else:
        return None  # For images, we'll handle separately


@app.post("/api/evaluate-subcontrol")
async def evaluate_subcontrol(
    sub_control_id: str = Form(...),
    files: List[UploadFile] = File(...),
    deliverable_ids: List[str] = Form(...)
):
    """Evaluate a sub-control with evidence files for each deliverable"""
    from controls_data import get_sub_control_by_id
    from aggregation_engine import AggregationEngine

    # Get LLM client
    client = get_llm_client()
    if not client:
        return {"status": "error", "message": "OPENROUTER_API_KEY not set"}

    # Get sub-control data
    sc_data = get_sub_control_by_id(sub_control_id)
    if not sc_data:
        return {"status": "error", "message": "Sub-control not found"}

    sub_control = sc_data["sub_control"]
    control = sc_data["control"]

    # Map deliverable_id to file
    evidence_map = {}
    for i, del_id in enumerate(deliverable_ids):
        if i < len(files):
            evidence_map[del_id] = files[i]

    # LLM settings
    model_name = "openai/gpt-5-nano"
    deliverable_results = []
    scores = []

    print(f"\nEvaluating {sub_control_id}: {sub_control['name']}")

    # Evaluate each deliverable
    for deliverable in sub_control["expected_deliverables"]:
        del_id = deliverable["deliverable_id"]

        # Check if we have evidence for this deliverable
        if del_id not in evidence_map:
            deliverable_results.append({
                "deliverable_id": del_id,
                "name": deliverable["name"],
                "score": 0,
                "explanation": "No evidence provided"
            })
            scores.append(0)
            print(f"  [-] {del_id}: No evidence")
            continue

        file = evidence_map[del_id]
        file_content = await file.read()
        await file.seek(0)  # Reset for potential re-read
        content_type = file.content_type
        filename = file.filename

        print(f"  Checking {del_id} with file: {filename}")

        # Save file locally
        saved_file = save_file_locally(file_content, filename, del_id)
        print(f"    Saved to: {saved_file['file_location']}")

        # Save evidence to database
        if DB_AVAILABLE:
            try:
                user_id = db.get_default_user()
                db_deliverable_id = db.get_or_create_deliverable(del_id, deliverable["name"])
                db.save_evidence(
                    user_id=user_id,
                    deliverable_id=db_deliverable_id,
                    file_name=saved_file["file_name"],
                    file_location=saved_file["file_location"],
                    file_size=saved_file["file_size"],
                    file_type=content_type
                )
                print(f"    Evidence saved to database")
            except Exception as db_err:
                print(f"    DB save error: {db_err}")

        # Check if it's an image
        is_image = content_type in ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']

        # RAG: Retrieve relevant KB chunks for this deliverable
        kb_context = ""
        if KB_AVAILABLE:
            try:
                query = f"{control['name']} {sub_control['name']} {deliverable['name']}"
                kb_results = search_kb(query=query, n_results=3)
                if kb_results["results"]:
                    kb_chunks = []
                    for r in kb_results["results"]:
                        kb_chunks.append(f"[Source: {r['source']}, p.{r['page']}]\n{r['text']}")
                    kb_context = "\n\n".join(kb_chunks)
                    print(f"    KB: Found {len(kb_results['results'])} relevant chunks")
            except Exception as kb_err:
                print(f"    KB search error: {kb_err}")

        # Build the reference section
        if kb_context:
            reference_section = f"""FRAMEWORK REFERENCE (from Knowledge Base):
{kb_context[:3000]}

DELIVERABLE TO CHECK:
"{deliverable['name']}"

Use the framework reference above as the evaluation criteria."""
        else:
            reference_section = f"""DELIVERABLE TO CHECK:
"{deliverable['name']}"

Evaluate based on the deliverable name and cybersecurity best practices."""

        try:
            if is_image:
                # For images, send as base64 with vision capability
                image_base64 = base64.b64encode(file_content).decode('utf-8')
                messages = [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": f"""You are a cybersecurity compliance evaluator.

CONTROL: {control['name']}
SUB-CONTROL: {sub_control['name']}

{reference_section}

Look at the attached image evidence and evaluate if it proves the deliverable.

Return JSON only: {{"score": 0 or 1, "explanation": "brief reason"}}
Score 1 = evidence proves deliverable, Score 0 = not proven"""
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:{content_type};base64,{image_base64}"
                                }
                            }
                        ]
                    }
                ]
            else:
                # Extract text for non-image files
                evidence_text = extract_text_from_file(file_content, content_type, filename)
                if evidence_text is None:
                    raise Exception(f"Unsupported file type: {content_type}")

                messages = [
                    {
                        "role": "user",
                        "content": f"""You are a cybersecurity compliance evaluator.

CONTROL: {control['name']}
SUB-CONTROL: {sub_control['name']}

{reference_section}

EVIDENCE (from file: {filename}):
{evidence_text[:4000]}

Return JSON only: {{"score": 0 or 1, "explanation": "brief reason"}}
Score 1 = evidence proves deliverable, Score 0 = not proven"""
                    }
                ]

            response = client.chat.completions.create(
                model=model_name,
                max_tokens=1000,
                temperature=0.1,
                messages=messages
            )

            text = response.choices[0].message.content
            print(f"    Raw: {text[:200] if text else 'EMPTY'}...")

            if not text:
                raise Exception("Empty response from model")

            # Remove thinking tags if present
            if "<think>" in text:
                text = text.split("</think>")[-1].strip()

            # Remove markdown code blocks
            if "```" in text:
                parts = text.split("```")
                for part in parts:
                    if "{" in part and "}" in part:
                        text = part.replace("json", "").strip()
                        break

            # Find JSON in the response
            json_match = re.search(r'\{[^{}]*"score"[^{}]*\}', text, re.IGNORECASE)
            if json_match:
                text = json_match.group()

            result = json.loads(text.strip())
            score = 1 if result.get("score", 0) == 1 else 0

            deliverable_results.append({
                "deliverable_id": del_id,
                "name": deliverable["name"],
                "score": score,
                "explanation": result.get("explanation", "")
            })
            scores.append(score)
            print(f"  [{'+' if score else '-'}] {del_id}")

            # Save evaluation result to database
            if DB_AVAILABLE:
                try:
                    grade = "compliant" if score == 1 else "non_compliant"
                    db_deliverable_id = db.get_or_create_deliverable(del_id, deliverable["name"])
                    db.update_deliverable_evaluation(
                        deliverable_id=db_deliverable_id,
                        grade=grade,
                        justification=result.get("explanation", "")
                    )
                except Exception as db_err:
                    print(f"    DB evaluation save error: {db_err}")

        except Exception as e:
            print(f"  [!] {del_id}: {e}")
            deliverable_results.append({
                "deliverable_id": del_id,
                "name": deliverable["name"],
                "score": 0,
                "explanation": f"Error: {str(e)}"
            })
            scores.append(0)

    # Calculate sub-control score
    engine = AggregationEngine()
    sc_score = engine.calculate_binary_score(scores)

    # Store in cache
    eval_id = str(uuid.uuid4())[:8]
    if eval_id not in evaluation_cache:
        evaluation_cache[eval_id] = {}

    for d in deliverable_results:
        evaluation_cache[eval_id][d["deliverable_id"]] = {
            "score": d["score"],
            "explanation": d["explanation"]
        }

    return {
        "status": "success",
        "evaluation_id": eval_id,
        "result": {
            "sub_control_id": sub_control_id,
            "name": sub_control["name"],
            "score": sc_score,
            "deliverables": deliverable_results
        }
    }


@app.get("/api/aggregate/{evaluation_id}")
async def aggregate(evaluation_id: str):
    """Generate aggregated compliance report"""
    from aggregation_engine import AggregationEngine

    if evaluation_id not in evaluation_cache:
        return {"status": "error", "message": "Evaluation not found"}

    engine = AggregationEngine()
    report = engine.generate_full_report(evaluation_cache[evaluation_id])
    return {"status": "success", "report": report}


# =============================================================================
# Knowledge Base API Routes
# =============================================================================

@app.get("/api/kb/search")
async def kb_search(q: str, n: int = 5, source: str = None):
    """Search the Knowledge Base"""
    if not KB_AVAILABLE:
        return {"status": "error", "message": "Knowledge Base module not available"}

    if not q.strip():
        return {"status": "error", "message": "Query cannot be empty"}

    results = search_kb(query=q, n_results=n, source_filter=source)
    return {"status": "success", **results}


@app.get("/api/kb/documents")
async def kb_list_documents():
    """List all indexed KB documents"""
    if not KB_AVAILABLE:
        return {"status": "error", "message": "Knowledge Base module not available"}

    stats = kb_stats()
    return {"status": "success", **stats}


# =============================================================================
# Main Entry Point
# =============================================================================

if __name__ == "__main__":
    print("\n" + "="*50)
    print("Burhan - Compliance Evaluation")
    print("="*50)
    print("Open: http://localhost:8000")
    print("="*50 + "\n")
    uvicorn.run(app, host="0.0.0.0", port=8000)

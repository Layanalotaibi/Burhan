"""
Burhan - NCA Compliance Evaluation System (POC)
Backend API Server
"""
from fastapi import FastAPI, Form, UploadFile, File, Request
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import uuid
import json
import re
import base64
import hashlib
import uvicorn
from datetime import datetime
from dotenv import load_dotenv
from openai import OpenAI
from typing import List, Optional

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

app = FastAPI(title="Burhan POC", docs_url=None, redoc_url=None)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================================================================
# In-Memory Stores (for POC — no external DB needed)
# =============================================================================

# Users store: {email: {name, email, password_hash, role}}
users_store = {
    "admin@burhan.sa": {
        "name": "Layan Alotaibi",
        "email": "admin@burhan.sa",
        "password_hash": hashlib.sha256("admin123".encode()).hexdigest(),
        "role": "admin"
    }
}

# Evidence store: [{id, deliverable_id, deliverable_name, sub_control_id, control_name, file_name, file_size, upload_date, status, explanation}]
evidence_store = []

# Evaluation results store: {sub_control_id: {score, deliverables: [...], evaluated_at}}
evaluation_results_store = {}

# Human validation store: {control_id: {validated: bool, validator_name: str, validated_at: str, notes: str}}
validation_store = {}



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
    """Create LLM client — Ollama (local) or OpenRouter (cloud)"""
    use_ollama = os.getenv("USE_OLLAMA", "false").lower() == "true"

    if use_ollama:
        return OpenAI(base_url="http://localhost:11434/v1", api_key="ollama")

    api_key = os.getenv("OPENROUTER_API_KEY")
    if api_key:
        api_key = api_key.strip().strip("'\"")
        return OpenAI(base_url="https://openrouter.ai/api/v1", api_key=api_key)

    return None


def get_model_name():
    """Get the LLM model name based on configuration"""
    use_ollama = os.getenv("USE_OLLAMA", "false").lower() == "true"
    if use_ollama:
        return os.getenv("LLM_MODEL", "llama3.2")
    return "openai/gpt-5-nano"


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
# ECC Data API Routes
# =============================================================================

@app.get("/api/ecc/data")
async def get_ecc_data():
    """Get full ECC data with all domains, controls, guidelines, and deliverables"""
    from controls_data import get_ecc_data as load_ecc, is_hierarchy_loaded
    if not is_hierarchy_loaded():
        return {"status": "success", "data": None, "message": "No ECC data loaded"}
    data = load_ecc()
    return {"status": "success", "data": data}


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
        return {"status": "error", "message": "No LLM configured. Set USE_OLLAMA=true or OPENROUTER_API_KEY in .env"}

    # Get sub-control data
    sc_data = get_sub_control_by_id(sub_control_id)
    if not sc_data:
        return {"status": "error", "message": "Sub-control not found"}

    sub_control = sc_data["sub_control"]
    control = sc_data["control"]

    # Map deliverable_id to file
    evidence_map = {}
    if deliverable_ids and deliverable_ids[0] == "__all__":
        # Single upload mode: all files apply to all deliverables
        for deliverable in sub_control["expected_deliverables"]:
            if files:
                evidence_map[deliverable["deliverable_id"]] = files[0]
    else:
        for i, del_id in enumerate(deliverable_ids):
            if i < len(files):
                evidence_map[del_id] = files[i]

    # LLM settings
    model_name = get_model_name()
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

    # Store evaluation result for dashboard
    evaluation_results_store[sub_control_id] = {
        "score": sc_score,
        "status": "compliant" if sc_score == 1.0 else ("partial" if sc_score == 0.5 else "non_compliant"),
        "deliverables": deliverable_results,
        "evaluated_at": datetime.now().isoformat(),
        "evaluation_id": eval_id
    }

    # Store evidence for evidence listing
    for d in deliverable_results:
        if d["score"] >= 0:
            del_id = d["deliverable_id"]
            file_info = evidence_map.get(del_id)
            evidence_store.append({
                "id": str(uuid.uuid4())[:8],
                "deliverable_id": del_id,
                "deliverable_name": d["name"],
                "sub_control_id": sub_control_id,
                "control_name": control["name"],
                "file_name": file_info.filename if file_info else "N/A",
                "upload_date": datetime.now().isoformat(),
                "status": "compliant" if d["score"] == 1 else "non_compliant",
                "explanation": d["explanation"]
            })

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
# Auth API Routes
# =============================================================================

class LoginRequest(BaseModel):
    email: str
    password: str

class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

@app.post("/api/auth/login")
async def login(req: LoginRequest):
    """Login with email and password"""
    user = users_store.get(req.email)
    if not user:
        return {"status": "error", "message": "Invalid email or password"}

    password_hash = hashlib.sha256(req.password.encode()).hexdigest()
    if user["password_hash"] != password_hash:
        return {"status": "error", "message": "Invalid email or password"}

    return {
        "status": "success",
        "user": {"name": user["name"], "email": user["email"], "role": user["role"]}
    }


@app.post("/api/auth/signup")
async def signup(req: SignupRequest):
    """Create a new account"""
    if req.email in users_store:
        return {"status": "error", "message": "Email already registered"}

    users_store[req.email] = {
        "name": req.name,
        "email": req.email,
        "password_hash": hashlib.sha256(req.password.encode()).hexdigest(),
        "role": "user"
    }
    return {
        "status": "success",
        "user": {"name": req.name, "email": req.email, "role": "user"}
    }


# =============================================================================
# User Profile API Routes
# =============================================================================

class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None

@app.get("/api/user/profile")
async def get_profile(email: str = "admin@burhan.sa"):
    """Get user profile"""
    user = users_store.get(email)
    if not user:
        return {"status": "error", "message": "User not found"}
    return {"status": "success", "user": {"name": user["name"], "email": user["email"], "role": user["role"]}}


@app.put("/api/user/profile")
async def update_profile(req: ProfileUpdateRequest):
    """Update user profile"""
    for email, user in users_store.items():
        if req.email and req.email == email:
            if req.name:
                user["name"] = req.name
            return {"status": "success", "user": {"name": user["name"], "email": user["email"], "role": user["role"]}}
    return {"status": "error", "message": "User not found"}


# =============================================================================
# Dashboard Stats API Routes
# =============================================================================

@app.get("/api/dashboard/stats")
async def dashboard_stats():
    """Get dashboard statistics from real evaluation data"""
    from controls_data import get_ecc_data

    data = get_ecc_data()
    total_deliverables = 0
    total_controls = 0
    compliant = 0
    partial = 0
    non_compliant = 0
    not_evaluated = 0

    def count_item(item_id, deliverables_count):
        nonlocal total_controls, total_deliverables, compliant, partial, non_compliant, not_evaluated
        total_controls += 1
        total_deliverables += deliverables_count
        if item_id in evaluation_results_store:
            score = evaluation_results_store[item_id]["score"]
            if score == 1.0:
                compliant += 1
            elif score == 0.0:
                non_compliant += 1
            else:
                partial += 1
        else:
            not_evaluated += 1

    if data and "domains" in data:
        for domain in data["domains"]:
            for sd in domain.get("sub_domains", []):
                for ctrl in sd.get("controls", []):
                    scs = ctrl.get("sub_controls", [])
                    if scs:
                        # Count sub-controls
                        for sc in scs:
                            count_item(sc["sub_control_id"], len(sc.get("expected_deliverables", [])))
                    else:
                        # Count control itself
                        count_item(ctrl["control_id"], len(ctrl.get("expected_deliverables", [])))
    elif data:
        # Old format
        for sd in data.get("sub_domains", []):
            for ctrl in sd.get("controls", []):
                for sc in ctrl.get("sub_controls", []):
                    count_item(sc["sub_control_id"], len(sc.get("expected_deliverables", [])))

    evaluated = compliant + partial + non_compliant
    overall_score = 0
    if evaluated > 0:
        overall_score = round((compliant + partial * 0.5) / total_controls * 100)

    return {
        "status": "success",
        "stats": {
            "overall_score": overall_score,
            "total_sub_controls": total_controls,
            "total_deliverables": total_deliverables,
            "compliant": compliant,
            "partial": partial,
            "non_compliant": non_compliant,
            "not_evaluated": not_evaluated,
            "evidence_count": len(evidence_store),
            "controls_with_evidence": list(set(e.get("sub_control_id", "") for e in evidence_store)),
            "evaluation_results": evaluation_results_store
        }
    }


# =============================================================================
# Full Hierarchy API Route
# =============================================================================

@app.get("/api/hierarchy/full")
async def get_full_hierarchy():
    """Get full hierarchy with evaluation status"""
    from controls_data import get_ecc_data

    data = get_ecc_data()
    if not data:
        return {"status": "success", "hierarchy": None}

    # Return ECC data with evaluation results attached
    return {"status": "success", "hierarchy": data, "evaluation_results": evaluation_results_store}


# =============================================================================
# Evidence Listing API Route
# =============================================================================

@app.get("/api/evidence/list")
async def list_evidence():
    """List all uploaded evidence"""
    return {"status": "success", "evidence": evidence_store}


# =============================================================================
# Report Generation API
# =============================================================================

@app.get("/api/report/generate")
async def generate_report():
    """Generate a full compliance report from all available data"""
    from controls_data import get_ecc_data

    data = get_ecc_data()
    report_date = datetime.now().isoformat()

    # Build domain-level results
    domain_results = []
    total_controls = 0
    total_evaluated = 0
    total_compliant = 0
    total_partial = 0
    total_non_compliant = 0

    if data and "domains" in data:
        for domain in data["domains"]:
            domain_controls = 0
            domain_evaluated = 0
            domain_compliant = 0

            control_findings = []

            for sd in domain.get("sub_domains", []):
                for ctrl in sd.get("controls", []):
                    scs = ctrl.get("sub_controls", [])
                    items = scs if scs else [ctrl]

                    for item in items:
                        item_id = item.get("sub_control_id", item.get("control_id"))
                        domain_controls += 1
                        total_controls += 1

                        eval_result = evaluation_results_store.get(item_id)
                        val_result = validation_store.get(item_id)

                        if eval_result:
                            domain_evaluated += 1
                            total_evaluated += 1
                            score = eval_result["score"]

                            if score == 1.0:
                                domain_compliant += 1
                                total_compliant += 1
                                status = "Compliant"
                            elif score == 0.0:
                                total_non_compliant += 1
                                status = "Non-Compliant"
                            else:
                                total_partial += 1
                                status = "Partial"

                            # Get evidence files for this control
                            control_evidence = [e for e in evidence_store if e.get("sub_control_id") == item_id]

                            control_findings.append({
                                "control_id": item_id,
                                "name": item.get("name", ""),
                                "score": score,
                                "status": status,
                                "evidence_files": [e.get("file_name", "") for e in control_evidence],
                                "deliverables": eval_result.get("deliverables", []),
                                "evaluated_at": eval_result.get("evaluated_at", ""),
                                "validated": val_result is not None and val_result.get("validated", False),
                                "validator": val_result.get("validator_name", "") if val_result else "",
                            })

            domain_progress = round((domain_compliant / domain_controls * 100)) if domain_controls > 0 else 0

            domain_results.append({
                "domain_id": domain["domain_id"],
                "name": domain["name"],
                "total_controls": domain_controls,
                "evaluated": domain_evaluated,
                "compliant": domain_compliant,
                "progress": domain_progress,
                "status": "Compliant" if domain_progress >= 80 else "Partially Compliant" if domain_progress >= 40 else "Non-Compliant",
                "control_findings": control_findings,
            })

    # Build recommendations
    recommendations = []
    not_evaluated = total_controls - total_evaluated
    if not_evaluated > 0:
        recommendations.append(f"Complete evaluation for the remaining {not_evaluated} controls.")
    if total_non_compliant > 0:
        recommendations.append(f"Address {total_non_compliant} non-compliant controls by uploading required evidence.")
    if total_partial > 0:
        recommendations.append(f"Improve {total_partial} partially compliant controls to achieve full compliance.")
    validated_count = len([v for v in validation_store.values() if v.get("validated")])
    if validated_count < total_evaluated and total_evaluated > 0:
        recommendations.append(f"Complete human validation for {total_evaluated - validated_count} evaluated controls.")

    overall_score = round((total_compliant + total_partial * 0.5) / total_controls * 100) if total_controls > 0 else 0

    return {
        "status": "success",
        "report": {
            "generated_at": report_date,
            "overall_score": overall_score,
            "total_controls": total_controls,
            "total_evaluated": total_evaluated,
            "total_compliant": total_compliant,
            "total_partial": total_partial,
            "total_non_compliant": total_non_compliant,
            "not_evaluated": not_evaluated,
            "validated_count": validated_count,
            "domain_results": domain_results,
            "recommendations": recommendations,
            "evidence_count": len(evidence_store),
        }
    }


# =============================================================================
# Control Details API (for Eye icon)
# =============================================================================

@app.get("/api/control/{control_id}/details")
async def control_details(control_id: str):
    """Get full details for a control: uploaded files, AI evaluation, validation"""
    # Get uploaded evidence for this control
    control_evidence = [e for e in evidence_store if e.get("sub_control_id") == control_id]

    # Get AI evaluation result
    evaluation = evaluation_results_store.get(control_id)

    # Get human validation
    validation = validation_store.get(control_id)

    return {
        "status": "success",
        "control_id": control_id,
        "evidence": control_evidence,
        "evaluation": evaluation,
        "validation": validation
    }


# =============================================================================
# Human Validation API
# =============================================================================

class ValidationRequest(BaseModel):
    control_id: str
    validated: bool
    notes: str = ""
    validator_name: str = ""

@app.post("/api/validation/save")
async def save_validation(req: ValidationRequest):
    """Save human validation for a control"""
    if req.validated:
        validation_store[req.control_id] = {
            "validated": True,
            "validator_name": req.validator_name,
            "validated_at": datetime.now().isoformat(),
            "notes": req.notes
        }
    else:
        validation_store.pop(req.control_id, None)

    return {"status": "success", "validation": validation_store.get(req.control_id)}


@app.get("/api/validation/list")
async def list_validations():
    """List all human validations"""
    return {"status": "success", "validations": validation_store}


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

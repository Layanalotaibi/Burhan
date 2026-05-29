"""
Burhan - NCA Compliance Evaluation System (POC)
Backend API Server
"""
# Load .env before any imports that need env vars (e.g. HF_HUB_OFFLINE)
import pathlib as _pathlib
from dotenv import load_dotenv as _load_dotenv
_load_dotenv(_pathlib.Path(__file__).parent / ".env")

from fastapi import FastAPI, Form, UploadFile, File, Request
from fastapi.responses import HTMLResponse, StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
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

# Serve built frontend if dist folder exists
FRONTEND_DIST = os.path.join(os.path.dirname(__file__), "burhanUI", "build")
if os.path.exists(FRONTEND_DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="assets")

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

# Organization settings store
org_settings_store = {
    "company_name": "",
    "industry": "financial",
    "org_size": "medium",
    "country": "sa",
}



@app.on_event("startup")
async def load_persisted_data():
    """Load persisted data from SQLite into in-memory stores on startup."""
    global evidence_store, evaluation_results_store, validation_store
    if DB_AVAILABLE:
        try:
            evaluation_results_store = db.load_all_evaluation_results()
            validation_store = db.load_all_validations()
            evidence_store = db.load_evidence_store()
            print(f"[DB] Loaded: {len(evaluation_results_store)} evaluations, "
                  f"{len(validation_store)} validations, {len(evidence_store)} evidence")
        except Exception as e:
            print(f"[DB] Load error: {e}")


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
        base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434/v1")
        return OpenAI(base_url=base_url, api_key="ollama")

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


async def generate_llm_recommendations(
    company_name: str,
    total_controls: int,
    total_evaluated: int,
    total_compliant: int,
    total_partial: int,
    total_non_compliant: int,
    not_evaluated: int,
    overall_score: int,
    domain_results: list,
) -> list:
    """Use the LLM to generate customized compliance recommendations."""
    client = get_llm_client()
    if not client:
        recs = []
        if not_evaluated > 0:
            recs.append(f"Complete evaluation for the remaining {not_evaluated} controls.")
        if total_non_compliant > 0:
            recs.append(f"Address {total_non_compliant} non-compliant controls by uploading required evidence.")
        if total_partial > 0:
            recs.append(f"Improve {total_partial} partially compliant controls to achieve full compliance.")
        return recs

    model_name = get_model_name()

    # Collect specific gaps with evaluation reasons
    gap_lines = []
    for d in domain_results:
        for cf in d.get("control_findings", []):
            if cf["status"] in ("Non-Compliant", "Partial"):
                failing = [
                    dv for dv in cf.get("deliverables", [])
                    if dv.get("score", 1) == 0 and dv.get("explanation", "")
                ]
                if failing:
                    reasons = "; ".join(dv["explanation"][:120] for dv in failing[:2])
                    gap_lines.append(f"- [{cf['control_id']}] {cf['name']} — Gap: {reasons}")
                else:
                    gap_lines.append(f"- [{cf['control_id']}] {cf['name']} — Status: {cf['status']}")

    gaps_text = "\n".join(gap_lines[:12]) or "No specific gaps identified"

    prompt = f"""You are an NCA ECC compliance auditor writing a formal report for {company_name or "the organization"}.

The organization scored {overall_score}% overall. Based ONLY on the specific gaps listed below, write exactly 4 recommendations.

STRICT RULES — violating any rule means the output is rejected:
- Each recommendation must directly address one of the listed gaps
- Use the exact control names from the list
- NEVER mention any number of days, weeks, months, or any deadline (e.g. do not write "30 days", "90-day", "within X", "quarterly", "monthly")
- NEVER write generic cybersecurity advice not tied to the gaps
- One sentence per recommendation
- Output only the recommendation sentences, one per line, no numbering, no dashes, no bullets

BAD example (rejected — contains deadline): "Assign owners and remediate within 30 days."
GOOD example (accepted): "Assign formal owners to each non-compliant control and document the required evidence artifacts in the ECC control catalog."

Identified Gaps:
{gaps_text}"""

    try:
        response = client.chat.completions.create(
            model=model_name,
            max_tokens=4000,
            temperature=0.4,
            messages=[{"role": "user", "content": prompt}]
        )
        text = response.choices[0].message.content or ""
        if "<think>" in text:
            text = text.split("</think>")[-1].strip()
        lines = [l.strip("- •*").strip() for l in text.strip().splitlines() if l.strip()]
        result = [l for l in lines if len(l) > 10]
        if result:
            return result
    except Exception as e:
        print(f"[LLM Recommendations] Error: {e}")

    # Fallback static recommendations
    recs = []
    if not_evaluated > 0:
        recs.append(f"Complete evaluation for the remaining {not_evaluated} controls.")
    if total_non_compliant > 0:
        recs.append(f"Address {total_non_compliant} non-compliant controls by uploading required evidence.")
    if total_partial > 0:
        recs.append(f"Improve {total_partial} partially compliant controls to achieve full compliance.")
    return recs


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
            scs = ctrl.get("sub_controls", [])
            if scs:
                for sc in scs:
                    sub_controls.append({
                        "sub_control_id": sc["sub_control_id"],
                        "name": sc["name"],
                        "control_id": ctrl["control_id"],
                        "control_name": ctrl["name"],
                        "deliverables": [
                            {"id": d["deliverable_id"], "name": d["name"]}
                            for d in sc.get("expected_deliverables", [])
                        ]
                    })
            else:
                # Control itself is the evaluatable item
                sub_controls.append({
                    "sub_control_id": ctrl["control_id"],
                    "name": ctrl["name"],
                    "control_id": ctrl["control_id"],
                    "control_name": ctrl["name"],
                    "deliverables": [
                        {"id": d["deliverable_id"], "name": d["name"]}
                        for d in ctrl.get("expected_deliverables", [])
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
        return "[Word .doc file - please convert to .docx]"

    elif content_type in [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'application/octet-stream'
    ] or filename.lower().endswith(('.xlsx', '.xls')):
        import openpyxl, io
        wb = openpyxl.load_workbook(io.BytesIO(file_content), data_only=True)
        parts = []
        for sheet in wb.worksheets:
            parts.append(f"[Sheet: {sheet.title}]")
            for row in sheet.iter_rows(values_only=True):
                row_values = [str(cell) if cell is not None else "" for cell in row]
                if any(v.strip() for v in row_values):
                    parts.append("\t".join(row_values))
        return "\n".join(parts).strip()

    else:
        return None  # For images, handled separately


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

    # Read all uploaded files upfront — evidence is not tied to specific deliverables
    all_evidence = []  # list of {filename, content_type, file_content}
    for file in files:
        file_content = await file.read()
        all_evidence.append({
            "filename": file.filename,
            "content_type": file.content_type,
            "file_content": file_content
        })

    # Save all files to disk and DB once (not per-deliverable)
    user_id = db.get_default_user() if DB_AVAILABLE else None
    for ev in all_evidence:
        saved_file = save_file_locally(ev["file_content"], ev["filename"], sub_control_id)
        ev["file_location"] = saved_file["file_location"]
        ev["file_size"] = saved_file["file_size"]
        print(f"  [FILE] Saved: {saved_file['file_location']}")
        if DB_AVAILABLE:
            try:
                # Save evidence linked to sub-control (not a specific deliverable)
                first_deliverable = sub_control["expected_deliverables"][0] if sub_control["expected_deliverables"] else None
                if first_deliverable:
                    db_deliverable_id = db.get_or_create_deliverable(
                        first_deliverable["deliverable_id"], first_deliverable["name"]
                    )
                    db.save_evidence(
                        user_id=user_id,
                        deliverable_id=db_deliverable_id,
                        file_name=saved_file["file_name"],
                        file_location=saved_file["file_location"],
                        file_size=saved_file["file_size"],
                        file_type=ev["content_type"],
                        deliverable_code="",
                        sub_control_id=sub_control_id,
                        control_name=control["name"]
                    )
            except Exception as db_err:
                print(f"    DB save error: {db_err}")

    # Build combined evidence text and image list from all files
    combined_text_parts = []
    combined_images = []
    for ev in all_evidence:
        ct = ev["content_type"]
        if ct in ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']:
            combined_images.append({
                "filename": ev["filename"],
                "content_type": ct,
                "base64": base64.b64encode(ev["file_content"]).decode('utf-8')
            })
        else:
            text = extract_text_from_file(ev["file_content"], ct, ev["filename"])
            if text:
                combined_text_parts.append(f"[File: {ev['filename']}]\n{text[:3000]}")

    combined_evidence_text = "\n\n---\n\n".join(combined_text_parts) if combined_text_parts else ""
    has_evidence = bool(combined_evidence_text or combined_images)

    # LLM settings
    model_name = get_model_name()
    deliverable_results = []
    scores = []

    print(f"\nEvaluating {sub_control_id}: {sub_control['name']} ({len(all_evidence)} files)")

    # Evaluate each deliverable using ALL evidence
    for deliverable in sub_control["expected_deliverables"]:
        del_id = deliverable["deliverable_id"]

        if not has_evidence:
            deliverable_results.append({
                "deliverable_id": del_id,
                "name": deliverable["name"],
                "score": 0,
                "explanation": "No evidence provided"
            })
            scores.append(0)
            print(f"  [-] {del_id}: No evidence")
            continue

        print(f"  Checking {del_id}")

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
{kb_context[:2000]}

DELIVERABLE TO CHECK:
"{deliverable['name']}"

Use the framework reference above as the evaluation criteria."""
        else:
            reference_section = f"""DELIVERABLE TO CHECK:
"{deliverable['name']}"

Evaluate based on the deliverable name and cybersecurity best practices."""

        try:
            consistency_note = """IMPORTANT EVALUATION RULES:
- Apply the same standard consistently across all deliverables for this sub-control.
- If the evidence is a template or draft (not approved/signed/customized), apply this judgment to ALL deliverables equally — do not score some as compliant and others as non-compliant based on the same flaw.
- If the evidence partially satisfies a deliverable, score 0 (not proven). Only score 1 if the deliverable is clearly and fully satisfied.
- Be strict and consistent: the same evidence quality should yield the same score pattern."""

            # Build message content — include all images + all text
            if combined_images:
                content = [
                    {
                        "type": "text",
                        "text": f"""You are a cybersecurity compliance evaluator.

CONTROL: {control['name']}
SUB-CONTROL: {sub_control['name']}

{consistency_note}

{reference_section}

The following evidence files were submitted (may include text and images).
Evaluate ALL provided evidence together to determine if the deliverable is satisfied.
{f'TEXT EVIDENCE:{chr(10)}{combined_evidence_text[:2000]}' if combined_evidence_text else ''}

Return JSON only: {{"score": 0 or 1, "explanation": "brief reason"}}
Score 1 = evidence clearly and fully proves deliverable, Score 0 = not proven or only partially proven"""
                    }
                ]
                for img in combined_images:
                    content.append({
                        "type": "image_url",
                        "image_url": {"url": f"data:{img['content_type']};base64,{img['base64']}"}
                    })
                messages = [{"role": "user", "content": content}]
            else:
                messages = [
                    {
                        "role": "user",
                        "content": f"""You are a cybersecurity compliance evaluator.

CONTROL: {control['name']}
SUB-CONTROL: {sub_control['name']}

{consistency_note}

{reference_section}

EVIDENCE ({len(all_evidence)} file(s) submitted):
{combined_evidence_text[:4000]}

Return JSON only: {{"score": 0 or 1, "explanation": "brief reason"}}
Score 1 = evidence clearly and fully proves deliverable, Score 0 = not proven or only partially proven"""
                    }
                ]

            prompt_len = sum(len(str(m.get("content", ""))) for m in messages)
            print(f"    Prompt chars: {prompt_len}")

            response = client.chat.completions.create(
                model=model_name,
                max_tokens=4000,
                temperature=0.1,
                messages=messages
            )

            raw_msg = response.choices[0].message
            text = raw_msg.content or ""
            # DeepSeek reasoning models put the answer in content but may return empty
            # if thinking exhausted the token budget — check finish_reason
            finish = getattr(response.choices[0], "finish_reason", "")
            print(f"    Raw ({finish}): {text[:200] if text else 'EMPTY'}...")

            # Retry 1: shorter prompt without KB context, higher token budget
            if not text:
                print(f"    [RETRY-1] Retrying without KB context...")
                fallback_messages = [
                    {
                        "role": "user",
                        "content": f"""Cybersecurity compliance check.

Deliverable: "{deliverable['name']}"

Evidence: {combined_evidence_text[:2000] if combined_evidence_text else "No text evidence provided"}

Does the evidence prove this deliverable? Reply with JSON only: {{"score": 0 or 1, "explanation": "reason"}}"""
                    }
                ]
                fallback_response = client.chat.completions.create(
                    model=model_name,
                    max_tokens=4000,
                    temperature=0.1,
                    messages=fallback_messages
                )
                text = fallback_response.choices[0].message.content or ""
                print(f"    [RETRY-1] Raw: {text[:200] if text else 'STILL EMPTY'}...")

            # Retry 2: minimal prompt, different phrasing to avoid reasoning loops
            if not text:
                print(f"    [RETRY-2] Retrying with minimal prompt...")
                minimal_messages = [
                    {
                        "role": "user",
                        "content": f'Score this compliance check. Deliverable: "{deliverable["name"]}". Evidence snippet: {combined_evidence_text[:300] if combined_evidence_text else "none provided"}. Output ONLY valid JSON: {{"score": 0, "explanation": "your reason here"}}'
                    }
                ]
                minimal_response = client.chat.completions.create(
                    model=model_name,
                    max_tokens=4000,
                    temperature=0.0,
                    messages=minimal_messages
                )
                text = minimal_response.choices[0].message.content or ""
                print(f"    [RETRY-2] Raw: {text[:200] if text else 'STILL EMPTY'}...")

            if not text:
                print(f"    [!] All retries failed — scoring as 0")
                text = '{"score": 0, "explanation": "Model returned empty response after multiple retries"}'

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
                    explanation_text = result.get("explanation", "")
                    db_deliverable_id = db.get_or_create_deliverable(del_id, deliverable["name"])
                    db.update_deliverable_evaluation(
                        deliverable_id=db_deliverable_id,
                        grade=grade,
                        justification=explanation_text
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
    eval_status = "compliant" if sc_score == 1.0 else ("partial" if sc_score == 0.5 else "non_compliant")
    eval_time = datetime.now().isoformat()
    evaluation_results_store[sub_control_id] = {
        "score": sc_score,
        "status": eval_status,
        "deliverables": deliverable_results,
        "evaluated_at": eval_time,
        "evaluation_id": eval_id
    }

    # Persist evaluation result to SQLite
    if DB_AVAILABLE:
        try:
            db.save_evaluation_result(sub_control_id, sc_score, eval_status,
                                      deliverable_results, eval_time, eval_id)
        except Exception as db_err:
            print(f"[DB] Save evaluation error: {db_err}")

    # Recompute parent control score from all evaluated sub-controls
    parent_control_id = control["control_id"]
    from controls_data import get_ecc_data
    ecc_data = get_ecc_data()
    if ecc_data:
        for domain in ecc_data.get("domains", []):
            for sd in domain.get("sub_domains", []):
                for ctrl in sd.get("controls", []):
                    if ctrl["control_id"] == parent_control_id:
                        scs = ctrl.get("sub_controls", [])
                        if scs:
                            sc_scores = []
                            sc_results = []
                            for sc in scs:
                                sc_id = sc["sub_control_id"]
                                if sc_id in evaluation_results_store:
                                    sc_scores.append(evaluation_results_store[sc_id]["score"])
                                    sc_results.append(evaluation_results_store[sc_id])
                            if sc_scores:
                                ctrl_score = round(engine.calculate_average_score(sc_scores), 2)
                                ctrl_status = "compliant" if ctrl_score == 1.0 else ("partial" if ctrl_score > 0 else "non_compliant")
                                ctrl_time = datetime.now().isoformat()
                                evaluation_results_store[parent_control_id] = {
                                    "score": ctrl_score,
                                    "status": ctrl_status,
                                    "deliverables": [],
                                    "sub_control_results": sc_results,
                                    "evaluated_at": ctrl_time,
                                    "evaluation_id": eval_id
                                }
                                if DB_AVAILABLE:
                                    try:
                                        db.save_evaluation_result(parent_control_id, ctrl_score, ctrl_status,
                                                                  [], ctrl_time, eval_id)
                                    except Exception as db_err:
                                        print(f"[DB] Save control score error: {db_err}")
                                print(f"  [CTRL] {parent_control_id} score updated: {ctrl_score}")

    # Store evidence for evidence listing — one entry per uploaded file
    overall_status = "compliant" if sc_score == 1.0 else ("partial" if sc_score == 0.5 else "non_compliant")
    summary_explanation = "; ".join(
        f"{d['name']}: {d['explanation']}" for d in deliverable_results
    )[:300]
    for ev in all_evidence:
        evidence_store.append({
            "id": str(uuid.uuid4())[:8],
            "deliverable_id": deliverable_results[0]["deliverable_id"] if deliverable_results else "",
            "deliverable_name": sub_control["name"],
            "sub_control_id": sub_control_id,
            "control_name": control["name"],
            "file_name": ev["filename"],
            "upload_date": datetime.now().isoformat(),
            "status": overall_status,
            "explanation": summary_explanation,
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


class OrgSettingsRequest(BaseModel):
    company_name: Optional[str] = None
    industry: Optional[str] = None
    org_size: Optional[str] = None
    country: Optional[str] = None

@app.get("/api/org/settings")
async def get_org_settings():
    return {"status": "success", "settings": org_settings_store}

@app.put("/api/org/settings")
async def update_org_settings(req: OrgSettingsRequest):
    global org_settings_store
    if req.company_name is not None:
        org_settings_store["company_name"] = req.company_name
    if req.industry is not None:
        org_settings_store["industry"] = req.industry
    if req.org_size is not None:
        org_settings_store["org_size"] = req.org_size
    if req.country is not None:
        org_settings_store["country"] = req.country
    return {"status": "success", "settings": org_settings_store}


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


@app.delete("/api/evidence/{evidence_id}")
async def delete_evidence(evidence_id: str):
    """Delete an evidence entry by ID"""
    global evidence_store
    evidence_store = [e for e in evidence_store if e["id"] != evidence_id]
    if DB_AVAILABLE:
        try:
            db.execute_query("DELETE FROM Evidence WHERE evidence_ID = ?", (int(evidence_id),))
        except Exception:
            pass
    return {"status": "success"}


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

                            control_evidence = [e for e in evidence_store if e.get("sub_control_id") == item_id]

                            control_findings.append({
                                "control_id": item_id,
                                "name": item.get("name", ""),
                                "sub_domain_id": sd.get("sub_domain_id", ""),
                                "sub_domain_name": sd.get("name", ""),
                                "score": score,
                                "status": status,
                                "evidence_files": [e.get("file_name", "") for e in control_evidence],
                                "deliverables": eval_result.get("deliverables", []),
                                "evaluated_at": eval_result.get("evaluated_at", ""),
                                "validated": val_result is not None and val_result.get("validated", False),
                                "validator": val_result.get("validator_name", "") if val_result else "",
                            })
                        else:
                            control_findings.append({
                                "control_id": item_id,
                                "name": item.get("name", ""),
                                "sub_domain_id": sd.get("sub_domain_id", ""),
                                "sub_domain_name": sd.get("name", ""),
                                "score": None,
                                "status": "Not Evaluated",
                                "evidence_files": [],
                                "deliverables": [],
                                "evaluated_at": "",
                                "validated": False,
                                "validator": "",
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

    not_evaluated = total_controls - total_evaluated
    validated_count = len([v for v in validation_store.values() if v.get("validated")])
    overall_score = round((total_compliant + total_partial * 0.5) / total_controls * 100) if total_controls > 0 else 0

    recommendations = await generate_llm_recommendations(
        company_name=org_settings_store.get("company_name", ""),
        total_controls=total_controls,
        total_evaluated=total_evaluated,
        total_compliant=total_compliant,
        total_partial=total_partial,
        total_non_compliant=total_non_compliant,
        not_evaluated=not_evaluated,
        overall_score=overall_score,
        domain_results=domain_results,
    )

    return {
        "status": "success",
        "report": {
            "generated_at": report_date,
            "company_name": org_settings_store.get("company_name", ""),
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
# Scoped Report (selected sub-domains)
# =============================================================================

class ScopedReportRequest(BaseModel):
    sub_domain_ids: List[str]
    company_name: Optional[str] = ""

@app.post("/api/report/generate-scoped")
async def generate_scoped_report(req: ScopedReportRequest):
    """Generate a compliance report filtered to specific sub-domains"""
    from controls_data import get_ecc_data

    data = get_ecc_data()
    report_date = datetime.now().isoformat()
    selected_ids = set(req.sub_domain_ids)

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
                if sd["sub_domain_id"] not in selected_ids:
                    continue
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
                            control_evidence = [e for e in evidence_store if e.get("sub_control_id") == item_id]
                            control_findings.append({
                                "control_id": item_id,
                                "name": item.get("name", ""),
                                "sub_domain": sd["sub_domain_id"],
                                "score": score,
                                "status": status,
                                "evidence_files": [e.get("file_name", "") for e in control_evidence],
                                "deliverables": eval_result.get("deliverables", []),
                                "evaluated_at": eval_result.get("evaluated_at", ""),
                                "validated": val_result is not None and val_result.get("validated", False),
                                "validator": val_result.get("validator_name", "") if val_result else "",
                            })
                        else:
                            control_findings.append({
                                "control_id": item_id,
                                "name": item.get("name", ""),
                                "sub_domain_id": sd.get("sub_domain_id", ""),
                                "sub_domain_name": sd.get("name", ""),
                                "score": None,
                                "status": "Not Evaluated",
                                "evidence_files": [],
                                "deliverables": [],
                                "evaluated_at": "",
                                "validated": False,
                                "validator": "",
                            })

            if domain_controls > 0:
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

    not_evaluated = total_controls - total_evaluated
    validated_count = len([v for v in validation_store.values() if v.get("validated")])
    overall_score = round((total_compliant + total_partial * 0.5) / total_controls * 100) if total_controls > 0 else 0

    recommendations = await generate_llm_recommendations(
        company_name=req.company_name,
        total_controls=total_controls,
        total_evaluated=total_evaluated,
        total_compliant=total_compliant,
        total_partial=total_partial,
        total_non_compliant=total_non_compliant,
        not_evaluated=not_evaluated,
        overall_score=overall_score,
        domain_results=domain_results,
    )

    return {
        "status": "success",
        "report": {
            "generated_at": report_date,
            "company_name": req.company_name,
            "scoped": True,
            "sub_domain_ids": list(selected_ids),
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
    validated_at = datetime.now().isoformat()
    if req.validated:
        validation_store[req.control_id] = {
            "validated": True,
            "validator_name": req.validator_name,
            "validated_at": validated_at,
            "notes": req.notes
        }
        if DB_AVAILABLE:
            try:
                db.save_validation(req.control_id, True, req.validator_name, validated_at, req.notes)
            except Exception as e:
                print(f"[DB] Save validation error: {e}")
    else:
        validation_store.pop(req.control_id, None)
        if DB_AVAILABLE:
            try:
                db.delete_validation(req.control_id)
            except Exception as e:
                print(f"[DB] Delete validation error: {e}")

    return {"status": "success", "validation": validation_store.get(req.control_id)}


@app.get("/api/validation/list")
async def list_validations():
    """List all human validations"""
    return {"status": "success", "validations": validation_store}


# =============================================================================
# Reset API
# =============================================================================

@app.post("/api/reset")
async def reset_all_data():
    """Clear all evaluation results, validations, and evidence"""
    global evidence_store, evaluation_results_store, validation_store
    evaluation_results_store.clear()
    validation_store.clear()
    evidence_store.clear()
    db.reset_all_data()
    return {"status": "success", "message": "All data has been reset"}


# =============================================================================
# DOCX Report Download
# =============================================================================

class DocxReportRequest(BaseModel):
    report: dict

@app.post("/api/report/download-docx")
async def download_docx_report(req: DocxReportRequest):
    """Generate and return a Word (.docx) file from the provided report data"""
    from report_docx import generate_docx
    import io

    docx_bytes = generate_docx(req.report)
    company = req.report.get("company_name", "Burhan").replace(" ", "-")
    filename = f"{company}-ECC-Report.docx"

    return StreamingResponse(
        io.BytesIO(docx_bytes),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# =============================================================================
# Frontend Catch-All (must be last)
# =============================================================================

@app.get("/{full_path:path}", include_in_schema=False)
async def serve_frontend(full_path: str):
    if os.path.exists(FRONTEND_DIST):
        index = os.path.join(FRONTEND_DIST, "index.html")
        if os.path.exists(index):
            return FileResponse(index)
    return {"error": "Frontend not built. Run: cd burhanUI && npm run build"}

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

/**
 * Burhan API Service
 * Centralized API layer connecting the frontend to the backend
 */

const API_BASE = "/api";

async function request(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  return res.json();
}

// =============================================================================
// Auth
// =============================================================================

export async function login(email: string, password: string) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function signup(name: string, email: string, password: string) {
  return request("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

// =============================================================================
// User Profile
// =============================================================================

export async function getProfile(email: string) {
  return request(`/user/profile?email=${encodeURIComponent(email)}`);
}

export async function updateProfile(data: { name?: string; email?: string }) {
  return request("/user/profile", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// =============================================================================
// Hierarchy & Controls
// =============================================================================

export async function getHierarchyStatus() {
  return request("/hierarchy/status");
}

export async function getFullHierarchy() {
  return request("/hierarchy/full");
}

export async function getSubControls() {
  return request("/sub-controls");
}

export async function getECCData() {
  return request("/ecc/data");
}

// =============================================================================
// Evaluation
// =============================================================================

export async function evaluateSubControl(
  subControlId: string,
  files: File[],
  deliverableIds: string[]
) {
  const formData = new FormData();
  formData.append("sub_control_id", subControlId);
  files.forEach((file) => formData.append("files", file));
  deliverableIds.forEach((id) => formData.append("deliverable_ids", id));

  const res = await fetch(`${API_BASE}/evaluate-subcontrol`, {
    method: "POST",
    body: formData,
  });
  return res.json();
}

export async function evaluateControl(
  controlId: string,
  files: File[]
) {
  const formData = new FormData();
  formData.append("sub_control_id", controlId);
  files.forEach((file) => formData.append("files", file));
  // Send all deliverable IDs for this control
  formData.append("deliverable_ids", "__all__");

  const res = await fetch(`${API_BASE}/evaluate-subcontrol`, {
    method: "POST",
    body: formData,
  });
  return res.json();
}

// =============================================================================
// Aggregation / Reports
// =============================================================================

export async function getAggregateReport(evaluationId: string) {
  return request(`/aggregate/${evaluationId}`);
}

export async function generateReport() {
  return request("/report/generate");
}

// =============================================================================
// Dashboard
// =============================================================================

export async function getDashboardStats() {
  return request("/dashboard/stats");
}

// =============================================================================
// Evidence
// =============================================================================

export async function getEvidenceList() {
  return request("/evidence/list");
}

export async function getControlDetails(controlId: string) {
  return request(`/control/${encodeURIComponent(controlId)}/details`);
}

export async function saveValidation(
  controlId: string,
  validated: boolean,
  validatorName: string,
  notes: string
) {
  return request("/validation/save", {
    method: "POST",
    body: JSON.stringify({
      control_id: controlId,
      validated,
      validator_name: validatorName,
      notes,
    }),
  });
}

export async function getValidations() {
  return request("/validation/list");
}

// =============================================================================
// Knowledge Base
// =============================================================================

export async function searchKB(query: string, n: number = 5) {
  return request(`/kb/search?q=${encodeURIComponent(query)}&n=${n}`);
}

export async function getKBDocuments() {
  return request("/kb/documents");
}

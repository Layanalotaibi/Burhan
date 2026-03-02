// Global variables
let allResults = {};
let evaluationId = null;
let subControlIds = [];
let subControlsData = {};

// On page load: load sub-controls
document.addEventListener('DOMContentLoaded', loadSubControls);

async function loadSubControls() {
    try {
        const response = await fetch('/api/sub-controls');
        const data = await response.json();

        if (data.status === 'success' && data.sub_controls.length > 0) {
            renderSubControls(data.sub_controls);
            subControlIds = data.sub_controls.map(sc => sc.sub_control_id);
            data.sub_controls.forEach(sc => { subControlsData[sc.sub_control_id] = sc; });
            document.getElementById('topActions').style.display = '';
        } else {
            document.getElementById('subControlsContainer').innerHTML =
                '<div class="loading-message">' + (data.message || 'Upload a hierarchy JSON to get started.') + '</div>';
            document.getElementById('topActions').style.display = 'none';
        }
    } catch (err) {
        document.getElementById('subControlsContainer').innerHTML =
            '<div class="loading-message">Error loading controls: ' + err.message + '</div>';
    }
}

function renderSubControls(subControls) {
    let html = '';

    for (const sc of subControls) {
        // Build deliverables with file upload for each
        let deliverablesHtml = '';
        for (const d of sc.deliverables) {
            deliverablesHtml += `
                <div class="deliverable-item" id="del-${d.id}">
                    <div class="deliverable-name">${d.name}</div>
                    <div class="deliverable-upload">
                        <input type="file" id="file-${d.id}" accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg" onchange="handleFileSelect('${d.id}')">
                        <label for="file-${d.id}" class="file-btn" id="label-${d.id}">Upload Evidence</label>
                        <span class="file-name" id="fname-${d.id}"></span>
                    </div>
                </div>
            `;
        }

        html += `
            <div class="control-card" id="card-${sc.sub_control_id}">
                <div class="control-header">
                    <div class="control-id">${sc.sub_control_id}</div>
                    <div class="control-name">${sc.name}</div>
                    <div class="control-status" id="status-${sc.sub_control_id}">Not Evaluated</div>
                </div>
                <div class="deliverables-section">
                    <strong>Deliverables:</strong>
                    ${deliverablesHtml}
                </div>
                <div class="card-actions">
                    <button onclick="previewChunks('${sc.sub_control_id}')" id="preview-btn-${sc.sub_control_id}" class="btn-preview">
                        Preview Chunks
                    </button>
                    <button onclick="evaluateOne('${sc.sub_control_id}')" id="btn-${sc.sub_control_id}">
                        Evaluate ${sc.sub_control_id}
                    </button>
                </div>
                <div class="chunks-preview" id="chunks-${sc.sub_control_id}"></div>
                <div class="results-section" id="results-${sc.sub_control_id}"></div>
            </div>
        `;
    }

    document.getElementById('subControlsContainer').innerHTML = html;
}

function handleFileSelect(delId) {
    const fileInput = document.getElementById('file-' + delId);
    const label = document.getElementById('label-' + delId);
    const fname = document.getElementById('fname-' + delId);

    if (fileInput.files.length > 0) {
        label.textContent = 'Change';
        label.classList.add('file-selected');
        fname.textContent = fileInput.files[0].name;
    } else {
        label.textContent = 'Upload Evidence';
        label.classList.remove('file-selected');
        fname.textContent = '';
    }
}

async function previewChunks(scId) {
    const btn = document.getElementById('preview-btn-' + scId);
    const chunksDiv = document.getElementById('chunks-' + scId);
    const sc = subControlsData[scId];

    if (!sc) return;

    btn.disabled = true;
    btn.textContent = 'Loading...';
    chunksDiv.innerHTML = '<div class="kb-loading">Fetching chunks...</div>';
    chunksDiv.classList.add('show');

    let html = '';

    for (const d of sc.deliverables) {
        const query = sc.control_name + ' ' + sc.name + ' ' + d.name;
        try {
            const response = await fetch('/api/kb/search?q=' + encodeURIComponent(query) + '&n=3');
            const data = await response.json();

            html += '<div class="chunk-deliverable">';
            html += '<div class="chunk-del-header">' + d.id + ': ' + d.name + '</div>';
            html += '<div class="chunk-query">Query: "' + query + '"</div>';

            if (data.status === 'success' && data.results.length > 0) {
                data.results.forEach((r, i) => {
                    const relevance = (r.relevance_score * 100).toFixed(0);
                    html += `
                        <div class="chunk-item">
                            <div class="chunk-meta">#${i + 1} | ${r.source} (p.${r.page}) | Relevance: ${relevance}%</div>
                            <div class="chunk-text">${r.text}</div>
                        </div>
                    `;
                });
            } else {
                html += '<div class="chunk-empty">No chunks found</div>';
            }
            html += '</div>';
        } catch (err) {
            html += '<div class="chunk-deliverable">';
            html += '<div class="chunk-del-header">' + d.id + ': ' + d.name + '</div>';
            html += '<div class="chunk-empty">Error: ' + err.message + '</div>';
            html += '</div>';
        }
    }

    chunksDiv.innerHTML = html;
    btn.disabled = false;
    btn.textContent = 'Preview Chunks';
}

async function evaluateOne(scId) {
    const btn = document.getElementById('btn-' + scId);
    const status = document.getElementById('status-' + scId);
    const resultsDiv = document.getElementById('results-' + scId);

    btn.disabled = true;
    btn.textContent = 'Evaluating...';
    status.textContent = 'Evaluating...';
    status.className = 'control-status status-pending';

    try {
        const formData = new FormData();
        formData.append('sub_control_id', scId);

        // Get all file inputs for this control's deliverables
        const card = document.getElementById('card-' + scId);
        const fileInputs = card.querySelectorAll('input[type="file"]');

        let hasFiles = false;
        fileInputs.forEach(input => {
            if (input.files.length > 0) {
                formData.append('files', input.files[0]);
                formData.append('deliverable_ids', input.id.replace('file-', ''));
                hasFiles = true;
            }
        });

        if (!hasFiles) {
            alert('Please upload at least one evidence file for ' + scId);
            btn.disabled = false;
            btn.textContent = 'Evaluate ' + scId;
            status.textContent = 'Not Evaluated';
            status.className = 'control-status';
            return;
        }

        const response = await fetch('/api/evaluate-subcontrol', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();

        if (data.status === 'success') {
            allResults[scId] = data.result;
            evaluationId = data.evaluation_id;
            renderSubControlResult(scId, data.result);
            document.getElementById('reportBtn').disabled = false;
        } else {
            alert('Error: ' + data.message);
            status.textContent = 'Error';
        }
    } catch (err) {
        alert('Error: ' + err.message);
        status.textContent = 'Error';
    } finally {
        btn.disabled = false;
        btn.textContent = 'Evaluate ' + scId;
    }
}

async function evaluateAll() {
    const btn = document.getElementById('evalAllBtn');
    btn.disabled = true;
    btn.textContent = 'Evaluating All...';

    for (const scId of subControlIds) {
        await evaluateOne(scId);
    }

    btn.disabled = false;
    btn.textContent = 'Evaluate All Controls';
}

function renderSubControlResult(scId, result) {
    const status = document.getElementById('status-' + scId);
    const resultsDiv = document.getElementById('results-' + scId);

    // Update status
    if (result.score === 1) {
        status.textContent = 'Compliant';
        status.className = 'control-status status-compliant';
    } else if (result.score === 0) {
        status.textContent = 'Non-Compliant';
        status.className = 'control-status status-non-compliant';
    } else {
        status.textContent = 'Partial';
        status.className = 'control-status status-partial';
    }

    // Render deliverable results
    let html = '';
    for (const d of result.deliverables) {
        const icon = d.score === 1 ? '&#10003;' : '&#10007;';
        const iconClass = d.score === 1 ? 'icon-pass' : 'icon-fail';
        const resultClass = d.score === 1 ? 'pass' : 'fail';
        html += `
            <div class="deliverable-result ${resultClass}">
                <div class="deliverable-header">
                    <div class="deliverable-icon ${iconClass}">${icon}</div>
                    <div class="deliverable-name">${d.name}</div>
                </div>
                <div class="deliverable-explanation">
                    <strong>LLM Analysis:</strong> ${d.explanation}
                </div>
            </div>
        `;
    }
    resultsDiv.innerHTML = html;
    resultsDiv.classList.add('show');
}

async function generateReport() {
    if (!evaluationId) return;

    try {
        const response = await fetch('/api/aggregate/' + evaluationId);
        const data = await response.json();

        if (data.status === 'success') {
            document.getElementById('overallScore').textContent = (data.report.overall_score * 100).toFixed(0) + '%';
            document.getElementById('overallStatus').textContent = data.report.overall_status;
            document.getElementById('aggregatedReport').classList.add('show');
            document.getElementById('aggregatedReport').scrollIntoView({ behavior: 'smooth' });
        }
    } catch (err) {
        alert('Error generating report: ' + err.message);
    }
}


// =============================================================================
// Knowledge Base Functions
// =============================================================================

function toggleKB() {
    const content = document.getElementById('kbContent');
    const toggle = document.getElementById('kbToggle');
    if (content.style.display === 'none') {
        content.style.display = 'block';
        toggle.textContent = '-';
        loadKBDocuments();
    } else {
        content.style.display = 'none';
        toggle.textContent = '+';
    }
}

async function searchKB() {
    const query = document.getElementById('kbQuery').value;
    const resultsDiv = document.getElementById('kbSearchResults');

    if (!query.trim()) {
        resultsDiv.textContent = 'Enter a search query.';
        return;
    }

    resultsDiv.innerHTML = '<div class="kb-loading">Searching...</div>';

    try {
        const response = await fetch('/api/kb/search?q=' + encodeURIComponent(query));
        const data = await response.json();

        if (data.status === 'success' && data.results.length > 0) {
            let html = '';
            data.results.forEach((r, i) => {
                const relevance = (r.relevance_score * 100).toFixed(0);
                html += `
                    <div class="kb-result">
                        <div class="kb-result-header">
                            <strong>#${i + 1}</strong> | ${r.source} (p.${r.page})
                            | Relevance: ${relevance}%
                        </div>
                        <div class="kb-result-text">${r.text.substring(0, 400)}...</div>
                    </div>
                `;
            });
            resultsDiv.innerHTML = html;
        } else {
            resultsDiv.textContent = 'No results found.';
        }
    } catch (err) {
        resultsDiv.textContent = 'Error: ' + err.message;
    }
}

async function loadKBDocuments() {
    const listDiv = document.getElementById('kbDocumentList');
    try {
        const response = await fetch('/api/kb/documents');
        const data = await response.json();

        if (data.status === 'success' && data.documents && data.documents.length > 0) {
            let html = '<p class="kb-total">Total chunks: ' + data.total_chunks + '</p>';
            data.documents.forEach(doc => {
                html += `
                    <div class="kb-doc-item">
                        <span>${doc.source} (${doc.chunk_count} chunks)</span>
                    </div>
                `;
            });
            listDiv.innerHTML = html;
        } else {
            listDiv.textContent = 'No documents indexed yet.';
        }
    } catch (err) {
        listDiv.textContent = 'Error loading documents.';
    }
}


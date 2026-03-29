-- =============================================================================
-- Burhan - NCA Compliance Management System
-- SQLite Database Schema
-- =============================================================================
-- Note: Tables are auto-created by db_service.py on startup.
-- This file is kept as documentation reference only.
-- =============================================================================

CREATE TABLE IF NOT EXISTS Domains (
    domain_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    domain_title TEXT NOT NULL UNIQUE,
    domain_description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Users (
    user_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin', 'auditor', 'user')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Subdomains (
    subdomain_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    domain_ID INTEGER NOT NULL,
    subdomain_title TEXT NOT NULL,
    subdomain_description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (domain_ID) REFERENCES Domains(domain_ID) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Controls (
    control_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    subdomain_ID INTEGER NOT NULL,
    control_title TEXT NOT NULL,
    control_description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subdomain_ID) REFERENCES Subdomains(subdomain_ID) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Deliverables (
    deliverable_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    deliverable_title TEXT NOT NULL,
    deliverable_description TEXT,
    evaluation_grade TEXT DEFAULT 'not_evaluated' CHECK(evaluation_grade IN ('compliant', 'partial', 'non_compliant', 'not_evaluated')),
    evaluation_date DATETIME,
    evaluation_justification TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Evidence (
    evidence_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    user_ID INTEGER NOT NULL,
    deliverable_ID INTEGER NOT NULL,
    file_name TEXT NOT NULL,
    upload_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    file_location TEXT NOT NULL,
    file_size INTEGER,
    file_type TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_ID) REFERENCES Users(user_ID) ON DELETE CASCADE,
    FOREIGN KEY (deliverable_ID) REFERENCES Deliverables(deliverable_ID) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Reports (
    report_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    user_ID INTEGER NOT NULL,
    score_level TEXT NOT NULL CHECK(score_level IN ('high', 'medium', 'low')),
    score_value REAL NOT NULL,
    status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'final', 'archived')),
    generation_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    report_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_ID) REFERENCES Users(user_ID) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Control_Deliverables (
    mapping_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    control_ID INTEGER NOT NULL,
    deliverable_ID INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(control_ID, deliverable_ID),
    FOREIGN KEY (control_ID) REFERENCES Controls(control_ID) ON DELETE CASCADE,
    FOREIGN KEY (deliverable_ID) REFERENCES Deliverables(deliverable_ID) ON DELETE CASCADE
);

-- =============================================================================
-- End of Schema
-- =============================================================================

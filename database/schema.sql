-- =============================================================================
-- Burhan - NCA Compliance Management System
-- MySQL Database Schema
-- =============================================================================

-- Select database
USE burhan_db;

-- Drop existing tables (in reverse order of dependencies)
DROP TABLE IF EXISTS Control_Deliverables;
DROP TABLE IF EXISTS Reports;
DROP TABLE IF EXISTS Evidence;
DROP TABLE IF EXISTS Deliverables;
DROP TABLE IF EXISTS Controls;
DROP TABLE IF EXISTS Subdomains;
DROP TABLE IF EXISTS Domains;
DROP TABLE IF EXISTS Users;

-- =============================================================================
-- Table: Domains
-- Description: Top-level compliance domains (e.g., Cybersecurity Governance)
-- =============================================================================
CREATE TABLE Domains (
    domain_ID INT AUTO_INCREMENT PRIMARY KEY,
    domain_title VARCHAR(255) NOT NULL,
    domain_description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_domain_title (domain_title)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Top-level compliance domains';

-- =============================================================================
-- Table: Users
-- Description: System users who upload evidence and generate reports
-- =============================================================================
CREATE TABLE Users (
    user_ID INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'auditor', 'user') NOT NULL DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='System users for authentication and authorization';

-- =============================================================================
-- Table: Subdomains
-- Description: Sub-divisions within each domain
-- =============================================================================
CREATE TABLE Subdomains (
    subdomain_ID INT AUTO_INCREMENT PRIMARY KEY,
    domain_ID INT NOT NULL,
    subdomain_title VARCHAR(255) NOT NULL,
    subdomain_description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_domain_ID (domain_ID),
    UNIQUE KEY uk_subdomain_title_domain (subdomain_title, domain_ID),

    CONSTRAINT fk_subdomain_domain
        FOREIGN KEY (domain_ID) REFERENCES Domains(domain_ID)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Sub-divisions within compliance domains';

-- =============================================================================
-- Table: Controls
-- Description: Security controls within each subdomain
-- =============================================================================
CREATE TABLE Controls (
    control_ID INT AUTO_INCREMENT PRIMARY KEY,
    subdomain_ID INT NOT NULL,
    control_title VARCHAR(255) NOT NULL,
    control_description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_subdomain_ID (subdomain_ID),

    CONSTRAINT fk_control_subdomain
        FOREIGN KEY (subdomain_ID) REFERENCES Subdomains(subdomain_ID)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Security controls within subdomains';

-- =============================================================================
-- Table: Deliverables
-- Description: Expected deliverables/evidence for compliance verification
-- =============================================================================
CREATE TABLE Deliverables (
    deliverable_ID INT AUTO_INCREMENT PRIMARY KEY,
    deliverable_title VARCHAR(255) NOT NULL,
    deliverable_description TEXT,
    evaluation_grade ENUM('compliant', 'partial', 'non_compliant', 'not_evaluated') DEFAULT 'not_evaluated',
    evaluation_date DATETIME,
    evaluation_justification TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_evaluation_grade (evaluation_grade)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Expected deliverables for compliance verification';

-- =============================================================================
-- Table: Evidence
-- Description: Uploaded evidence files linked to deliverables
-- =============================================================================
CREATE TABLE Evidence (
    evidence_ID INT AUTO_INCREMENT PRIMARY KEY,
    user_ID INT NOT NULL,
    deliverable_ID INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    upload_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    file_location VARCHAR(500) NOT NULL,
    file_size INT,
    file_type VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_user_ID (user_ID),
    INDEX idx_deliverable_ID (deliverable_ID),
    INDEX idx_upload_time (upload_time),

    CONSTRAINT fk_evidence_user
        FOREIGN KEY (user_ID) REFERENCES Users(user_ID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_evidence_deliverable
        FOREIGN KEY (deliverable_ID) REFERENCES Deliverables(deliverable_ID)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Uploaded evidence files for deliverables';

-- =============================================================================
-- Table: Reports
-- Description: Generated compliance reports
-- =============================================================================
CREATE TABLE Reports (
    report_ID INT AUTO_INCREMENT PRIMARY KEY,
    user_ID INT NOT NULL,
    score_level ENUM('high', 'medium', 'low') NOT NULL,
    score_value DECIMAL(5,2) NOT NULL,
    status ENUM('draft', 'final', 'archived') DEFAULT 'draft',
    generation_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    report_address VARCHAR(500),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_user_ID (user_ID),
    INDEX idx_status (status),
    INDEX idx_generation_date (generation_date),

    CONSTRAINT fk_report_user
        FOREIGN KEY (user_ID) REFERENCES Users(user_ID)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Generated compliance reports';

-- =============================================================================
-- Table: Control_Deliverables
-- Description: Junction table linking controls to their deliverables (M:N)
-- =============================================================================
CREATE TABLE Control_Deliverables (
    mapping_ID INT AUTO_INCREMENT PRIMARY KEY,
    control_ID INT NOT NULL,
    deliverable_ID INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_control_ID (control_ID),
    INDEX idx_deliverable_ID (deliverable_ID),
    UNIQUE KEY uk_control_deliverable (control_ID, deliverable_ID),

    CONSTRAINT fk_cd_control
        FOREIGN KEY (control_ID) REFERENCES Controls(control_ID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_cd_deliverable
        FOREIGN KEY (deliverable_ID) REFERENCES Deliverables(deliverable_ID)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Junction table linking controls to deliverables';

-- =============================================================================
-- Sample Data (Optional - for testing)
-- =============================================================================

-- Insert sample domain
INSERT INTO Domains (domain_title, domain_description) VALUES
('Cybersecurity Governance', 'Governance and management of cybersecurity');

-- Insert sample subdomain
INSERT INTO Subdomains (domain_ID, subdomain_title, subdomain_description) VALUES
(1, 'Asset Management', 'Management of information assets');

-- Insert sample control
INSERT INTO Controls (subdomain_ID, control_title, control_description) VALUES
(1, 'Asset Management Requirements', 'Define and approve asset management requirements');

-- Insert sample deliverable
INSERT INTO Deliverables (deliverable_title, deliverable_description) VALUES
('Approved Policy Document', 'Document containing approved information asset management cybersecurity requirements');

-- Link control to deliverable
INSERT INTO Control_Deliverables (control_ID, deliverable_ID) VALUES
(1, 1);

-- Insert sample user
INSERT INTO Users (name, email, password, role) VALUES
('Admin User', 'admin@burhan.sa', '$2b$12$placeholder_hash', 'admin');

-- =============================================================================
-- End of Schema
-- =============================================================================

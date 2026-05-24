"""
Database Service for Burhan Compliance System
Handles SQLite database operations for evidence and evaluation results
"""
import sqlite3
from datetime import datetime
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "database", "burhan.db")


class DatabaseService:
    def __init__(self):
        os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
        self._init_tables()

    def _get_connection(self):
        """Create a new connection (SQLite connections are not thread-safe)"""
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        return conn

    def _init_tables(self):
        """Create tables if they don't exist"""
        conn = self._get_connection()
        conn.executescript("""
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
                deliverable_code TEXT,
                sub_control_id TEXT,
                control_name TEXT,
                file_name TEXT NOT NULL,
                upload_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                file_location TEXT NOT NULL,
                file_size INTEGER,
                file_type TEXT,
                status TEXT DEFAULT 'non_compliant',
                explanation TEXT,
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

            CREATE TABLE IF NOT EXISTS EvaluationResults (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sub_control_id TEXT NOT NULL UNIQUE,
                score REAL NOT NULL,
                status TEXT NOT NULL,
                deliverables_json TEXT NOT NULL,
                evaluated_at DATETIME NOT NULL,
                evaluation_id TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS Validations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                control_id TEXT NOT NULL UNIQUE,
                validated INTEGER NOT NULL DEFAULT 0,
                validator_name TEXT,
                validated_at DATETIME,
                notes TEXT
            );
        """)
        conn.commit()
        conn.close()

    def execute_query(self, query, params=None, fetch=False):
        """Execute a query with optional parameters"""
        try:
            # Convert MySQL %s placeholders to SQLite ? placeholders
            query = query.replace("%s", "?")

            conn = self._get_connection()
            cursor = conn.cursor()
            cursor.execute(query, params or ())

            if fetch:
                result = [dict(row) for row in cursor.fetchall()]
                conn.close()
                return result
            else:
                conn.commit()
                last_id = cursor.lastrowid
                conn.close()
                return last_id

        except Exception as e:
            print(f"Query error: {e}")
            return None

    # =========================================================================
    # Evidence Operations
    # =========================================================================

    def save_evidence(self, user_id: int, deliverable_id: int, file_name: str,
                      file_location: str, file_size: int = None, file_type: str = None,
                      deliverable_code: str = None, sub_control_id: str = None,
                      control_name: str = None, status: str = None, explanation: str = None):
        """Save evidence file metadata to database"""
        query = """
            INSERT INTO Evidence (user_ID, deliverable_ID, deliverable_code, sub_control_id,
                                  control_name, file_name, file_location, file_size, file_type,
                                  status, explanation, upload_time)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        params = (user_id, deliverable_id, deliverable_code, sub_control_id, control_name,
                  file_name, file_location, file_size, file_type, status, explanation,
                  datetime.now().isoformat())
        return self.execute_query(query, params)

    def get_evidence_by_deliverable(self, deliverable_id: int):
        """Get all evidence for a deliverable"""
        query = "SELECT * FROM Evidence WHERE deliverable_ID = ? ORDER BY upload_time DESC"
        return self.execute_query(query, (deliverable_id,), fetch=True)

    # =========================================================================
    # Deliverable Operations
    # =========================================================================

    def save_deliverable(self, title: str, description: str = None):
        """Create a new deliverable"""
        query = """
            INSERT INTO Deliverables (deliverable_title, deliverable_description)
            VALUES (?, ?)
        """
        return self.execute_query(query, (title, description))

    def update_deliverable_evaluation(self, deliverable_id: int, grade: str,
                                       justification: str):
        """Update deliverable evaluation result"""
        query = """
            UPDATE Deliverables
            SET evaluation_grade = ?,
                evaluation_date = ?,
                evaluation_justification = ?
            WHERE deliverable_ID = ?
        """
        params = (grade, datetime.now().isoformat(), justification, deliverable_id)
        return self.execute_query(query, params)

    def get_deliverable(self, deliverable_id: int):
        """Get deliverable by ID"""
        query = "SELECT * FROM Deliverables WHERE deliverable_ID = ?"
        result = self.execute_query(query, (deliverable_id,), fetch=True)
        return result[0] if result else None

    def get_or_create_deliverable(self, deliverable_code: str, title: str):
        """Get existing deliverable or create new one"""
        query = "SELECT * FROM Deliverables WHERE deliverable_title = ?"
        result = self.execute_query(query, (title,), fetch=True)

        if result:
            return result[0]['deliverable_ID']
        else:
            return self.save_deliverable(title)

    # =========================================================================
    # Report Operations
    # =========================================================================

    def save_report(self, user_id: int, score_value: float, score_level: str,
                    status: str = 'draft', report_address: str = None):
        """Save compliance report"""
        query = """
            INSERT INTO Reports (user_ID, score_value, score_level, status,
                                 generation_date, report_address)
            VALUES (?, ?, ?, ?, ?, ?)
        """
        params = (user_id, score_value, score_level, status,
                  datetime.now().isoformat(), report_address)
        return self.execute_query(query, params)

    def get_reports_by_user(self, user_id: int):
        """Get all reports for a user"""
        query = "SELECT * FROM Reports WHERE user_ID = ? ORDER BY generation_date DESC"
        return self.execute_query(query, (user_id,), fetch=True)

    # =========================================================================
    # User Operations
    # =========================================================================

    def get_user_by_email(self, email: str):
        """Get user by email"""
        query = "SELECT * FROM Users WHERE email = ?"
        result = self.execute_query(query, (email,), fetch=True)
        return result[0] if result else None

    def get_default_user(self):
        """Get or create default user for POC"""
        user = self.get_user_by_email('admin@burhan.sa')
        if user:
            return user['user_ID']

        query = """
            INSERT INTO Users (name, email, password, role)
            VALUES (?, ?, ?, ?)
        """
        return self.execute_query(query, ('Admin', 'admin@burhan.sa', 'poc_password', 'admin'))


    # =========================================================================
    # Evaluation Results Operations
    # =========================================================================

    def save_evaluation_result(self, sub_control_id: str, score: float, status: str,
                                deliverables: list, evaluated_at: str, evaluation_id: str):
        """Save or update sub-control evaluation result"""
        import json
        query = """
            INSERT INTO EvaluationResults (sub_control_id, score, status, deliverables_json, evaluated_at, evaluation_id)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(sub_control_id) DO UPDATE SET
                score=excluded.score, status=excluded.status,
                deliverables_json=excluded.deliverables_json,
                evaluated_at=excluded.evaluated_at, evaluation_id=excluded.evaluation_id
        """
        return self.execute_query(query, (sub_control_id, score, status,
                                          json.dumps(deliverables), evaluated_at, evaluation_id))

    def load_all_evaluation_results(self):
        """Load all evaluation results as a dict keyed by sub_control_id"""
        import json
        rows = self.execute_query("SELECT * FROM EvaluationResults", fetch=True)
        result = {}
        for row in (rows or []):
            result[row['sub_control_id']] = {
                "score": row['score'],
                "status": row['status'],
                "deliverables": json.loads(row['deliverables_json']),
                "evaluated_at": row['evaluated_at'],
                "evaluation_id": row['evaluation_id']
            }
        return result

    # =========================================================================
    # Validation Operations
    # =========================================================================

    def save_validation(self, control_id: str, validated: bool, validator_name: str = "",
                        validated_at: str = None, notes: str = ""):
        """Save or update human validation for a control"""
        query = """
            INSERT INTO Validations (control_id, validated, validator_name, validated_at, notes)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(control_id) DO UPDATE SET
                validated=excluded.validated, validator_name=excluded.validator_name,
                validated_at=excluded.validated_at, notes=excluded.notes
        """
        return self.execute_query(query, (control_id, 1 if validated else 0,
                                          validator_name, validated_at, notes))

    def delete_validation(self, control_id: str):
        """Delete validation for a control"""
        return self.execute_query("DELETE FROM Validations WHERE control_id = ?", (control_id,))

    def load_all_validations(self):
        """Load all validations as a dict keyed by control_id"""
        rows = self.execute_query("SELECT * FROM Validations WHERE validated = 1", fetch=True)
        result = {}
        for row in (rows or []):
            result[row['control_id']] = {
                "validated": bool(row['validated']),
                "validator_name": row['validator_name'] or "",
                "validated_at": row['validated_at'] or "",
                "notes": row['notes'] or ""
            }
        return result

    # =========================================================================
    # Evidence Store Operations
    # =========================================================================

    def load_evidence_store(self):
        """Load all evidence as a list matching the in-memory evidence_store format"""
        query = """
            SELECT e.evidence_ID, e.deliverable_code, e.sub_control_id, e.control_name,
                   e.file_name, e.upload_time, e.status, e.explanation,
                   d.deliverable_title
            FROM Evidence e
            JOIN Deliverables d ON e.deliverable_ID = d.deliverable_ID
            ORDER BY e.upload_time DESC
        """
        rows = self.execute_query(query, fetch=True)
        result = []
        for row in (rows or []):
            result.append({
                "id": str(row['evidence_ID']),
                "deliverable_id": row['deliverable_code'] or "",
                "deliverable_name": row['deliverable_title'],
                "sub_control_id": row['sub_control_id'] or "",
                "control_name": row['control_name'] or "",
                "file_name": row['file_name'],
                "upload_date": row['upload_time'],
                "status": row['status'] or "non_compliant",
                "explanation": row['explanation'] or ""
            })
        return result

    def reset_all_data(self):
        """Delete all evaluation results, validations, and evidence from the database"""
        conn = self._get_connection()
        conn.executescript("""
            DELETE FROM EvaluationResults;
            DELETE FROM Validations;
            DELETE FROM Evidence;
            DELETE FROM Deliverables;
        """)
        conn.commit()
        conn.close()


# Singleton instance
db = DatabaseService()

"""
Database Service for Burhan Compliance System
Handles MySQL database operations for evidence and evaluation results
"""
import mysql.connector
from mysql.connector import Error
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()


class DatabaseService:
    def __init__(self):
        self.config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'port': int(os.getenv('DB_PORT', 3306)),
            'user': os.getenv('DB_USER', 'root'),
            'password': os.getenv('DB_PASSWORD', ''),
            'database': os.getenv('DB_NAME', 'burhan_db')
        }
        self.connection = None

    def connect(self):
        """Establish database connection"""
        try:
            self.connection = mysql.connector.connect(**self.config)
            if self.connection.is_connected():
                return True
        except Error as e:
            print(f"Database connection error: {e}")
            return False

    def disconnect(self):
        """Close database connection"""
        if self.connection and self.connection.is_connected():
            self.connection.close()

    def execute_query(self, query, params=None, fetch=False):
        """Execute a query with optional parameters"""
        try:
            if not self.connection or not self.connection.is_connected():
                self.connect()

            cursor = self.connection.cursor(dictionary=True)
            cursor.execute(query, params or ())

            if fetch:
                result = cursor.fetchall()
                cursor.close()
                return result
            else:
                self.connection.commit()
                last_id = cursor.lastrowid
                cursor.close()
                return last_id

        except Error as e:
            print(f"Query error: {e}")
            return None

    # =========================================================================
    # Evidence Operations
    # =========================================================================

    def save_evidence(self, user_id: int, deliverable_id: int, file_name: str,
                      file_location: str, file_size: int = None, file_type: str = None):
        """Save evidence file metadata to database"""
        query = """
            INSERT INTO Evidence (user_ID, deliverable_ID, file_name, file_location,
                                  file_size, file_type, upload_time)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        params = (user_id, deliverable_id, file_name, file_location,
                  file_size, file_type, datetime.now())
        return self.execute_query(query, params)

    def get_evidence_by_deliverable(self, deliverable_id: int):
        """Get all evidence for a deliverable"""
        query = "SELECT * FROM Evidence WHERE deliverable_ID = %s ORDER BY upload_time DESC"
        return self.execute_query(query, (deliverable_id,), fetch=True)

    # =========================================================================
    # Deliverable Operations
    # =========================================================================

    def save_deliverable(self, title: str, description: str = None):
        """Create a new deliverable"""
        query = """
            INSERT INTO Deliverables (deliverable_title, deliverable_description)
            VALUES (%s, %s)
        """
        return self.execute_query(query, (title, description))

    def update_deliverable_evaluation(self, deliverable_id: int, grade: str,
                                       justification: str):
        """Update deliverable evaluation result"""
        query = """
            UPDATE Deliverables
            SET evaluation_grade = %s,
                evaluation_date = %s,
                evaluation_justification = %s
            WHERE deliverable_ID = %s
        """
        params = (grade, datetime.now(), justification, deliverable_id)
        return self.execute_query(query, params)

    def get_deliverable(self, deliverable_id: int):
        """Get deliverable by ID"""
        query = "SELECT * FROM Deliverables WHERE deliverable_ID = %s"
        result = self.execute_query(query, (deliverable_id,), fetch=True)
        return result[0] if result else None

    def get_or_create_deliverable(self, deliverable_code: str, title: str):
        """Get existing deliverable or create new one"""
        # First try to find by title
        query = "SELECT * FROM Deliverables WHERE deliverable_title = %s"
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
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        params = (user_id, score_value, score_level, status,
                  datetime.now(), report_address)
        return self.execute_query(query, params)

    def get_reports_by_user(self, user_id: int):
        """Get all reports for a user"""
        query = "SELECT * FROM Reports WHERE user_ID = %s ORDER BY generation_date DESC"
        return self.execute_query(query, (user_id,), fetch=True)

    # =========================================================================
    # User Operations
    # =========================================================================

    def get_user_by_email(self, email: str):
        """Get user by email"""
        query = "SELECT * FROM Users WHERE email = %s"
        result = self.execute_query(query, (email,), fetch=True)
        return result[0] if result else None

    def get_default_user(self):
        """Get or create default user for POC"""
        user = self.get_user_by_email('admin@burhan.sa')
        if user:
            return user['user_ID']

        # Create default user
        query = """
            INSERT INTO Users (name, email, password, role)
            VALUES (%s, %s, %s, %s)
        """
        return self.execute_query(query, ('Admin', 'admin@burhan.sa', 'poc_password', 'admin'))


# Singleton instance
db = DatabaseService()

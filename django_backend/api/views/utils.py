import os
import cv2
import dlib
import numpy as np
from datetime import datetime
from typing import List, Dict, Tuple, Optional
from django.conf import settings
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from google.oauth2.service_account import Credentials
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import logging

# Set up logging
logger = logging.getLogger(__name__)

# Initialize face detection and recognition models
try:
    face_detector = dlib.get_frontal_face_detector()
    shape_predictor = dlib.shape_predictor(os.path.join(settings.BASE_DIR, 'shape_predictor_68_face_landmarks.dat'))
    face_recognizer = dlib.face_recognition_model_v1(os.path.join(settings.BASE_DIR, 'dlib_face_recognition_resnet_model_v1.dat'))
    logger.info("Face recognition models loaded successfully")
except Exception as e:
    logger.error("Error loading face recognition models: %s", str(e))
    face_detector = None
    shape_predictor = None
    face_recognizer = None

# Google Sheets API setup
SCOPES = ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive']
GOOGLE_CREDENTIALS_FILE = os.path.join(settings.BASE_DIR, 'credentials.json')

try:
    if not os.path.exists(GOOGLE_CREDENTIALS_FILE):
        raise FileNotFoundError(f"Credentials file not found at {GOOGLE_CREDENTIALS_FILE}")
    creds = Credentials.from_service_account_file(GOOGLE_CREDENTIALS_FILE, scopes=SCOPES)
    sheets_service = build('sheets', 'v4', credentials=creds)
    drive_service = build('drive', 'v3', credentials=creds)
    logger.info("Google Sheets API initialized successfully")
except Exception as e:
    logger.error("Error setting up Google API with credentials.json: %s", str(e))
    sheets_service = None
    drive_service = None

# Ensure student data directory exists
if not os.path.exists(settings.STUDENT_DATA_PATH):
    os.makedirs(settings.STUDENT_DATA_PATH)
    logger.info("Created student data directory at %s", settings.STUDENT_DATA_PATH)

def compute_face_distance(encoding1: np.ndarray, encoding2: np.ndarray) -> float:
    """Compute Euclidean distance between two face encodings."""
    return np.linalg.norm(encoding1 - encoding2)

def is_same_person(known_encodings: List[np.ndarray], test_encoding: np.ndarray, threshold: float = 0.4) -> bool:
    """Check if test_encoding matches any of the known_encodings within the threshold."""
    if not known_encodings or not any(isinstance(enc, np.ndarray) for enc in known_encodings):
        logger.debug("No valid known encodings provided for comparison")
        return False
    distances = [compute_face_distance(test_encoding, enc) for enc in known_encodings if isinstance(enc, np.ndarray)]
    if not distances:
        logger.debug("No valid distances computed")
        return False
    min_distance = min(distances)
    close_matches = sum(1 for d in distances if d < threshold)
    logger.debug("Face comparison: min_distance=%.2f, close_matches=%d, threshold=%.2f", min_distance, close_matches, threshold)
    return (min_distance < threshold and close_matches >= 2) if len(distances) > 1 else min_distance < threshold

def get_google_sheet_id(branch_name: str, subject_name: str, section_name: str, semester_number: int) -> Optional[str]:
    """Retrieve or create a Google Sheet ID for attendance tracking."""
    sheet_id_file = os.path.join(settings.STUDENT_DATA_PATH, f'{branch_name}_{subject_name}_{section_name}_{semester_number}_sheet_id.txt')
    if os.path.exists(sheet_id_file):
        with open(sheet_id_file, 'r') as file:
            sheet_id = file.read().strip()
        try:
            sheets_service.spreadsheets().get(spreadsheetId=sheet_id).execute()
            logger.info("Verified existing sheet ID: %s for %s_%s_%s_%s", sheet_id, branch_name, subject_name, section_name, semester_number)
            return sheet_id
        except HttpError as e:
            if e.resp.status == 404:
                logger.warning("Sheet with ID %s not found; creating a new sheet for %s_%s_%s_%s", sheet_id, branch_name, subject_name, section_name, semester_number)
                return create_google_sheet(branch_name, subject_name, section_name, semester_number)
            logger.error("Error verifying sheet %s for %s_%s_%s_%s: %s", sheet_id, branch_name, subject_name, section_name, semester_number, str(e))
            return None
    logger.info("No sheet ID file found; creating a new sheet for %s_%s_%s_%s", branch_name, subject_name, section_name, semester_number)
    return create_google_sheet(branch_name, subject_name, section_name, semester_number)

def create_google_sheet(branch_name: str, subject_name: str, section_name: str, semester_number: int) -> Optional[str]:
    """Create a new Google Sheet for attendance and return its ID."""
    if sheets_service is None or drive_service is None:
        logger.error("Google Sheets service not initialized due to credentials error")
        return None
    try:
        spreadsheet = {
            'properties': {'title': f'Attendance_{branch_name}_{semester_number}_{subject_name}_{section_name}_{datetime.now().strftime("%Y%m%d")}'},
            'sheets': [
                {'properties': {'title': 'Present'}},
                {'properties': {'title': 'Absent'}}
            ]
        }
        sheet = sheets_service.spreadsheets().create(body=spreadsheet).execute()
        sheet_id = sheet['spreadsheetId']
        with open(os.path.join(settings.STUDENT_DATA_PATH, f'{branch_name}_{subject_name}_{section_name}_{semester_number}_sheet_id.txt'), 'w') as file:
            file.write(sheet_id)
        drive_service.permissions().create(fileId=sheet_id, body={'type': 'anyone', 'role': 'writer'}).execute()
        logger.info("Created new sheet with ID: %s for %s_%s_%s_%s", sheet_id, branch_name, subject_name, section_name, semester_number)
        return sheet_id
    except HttpError as err:
        logger.error("Error creating or sharing sheet for %s_%s_%s_%s: %s", branch_name, semester_number, subject_name, section_name, str(err))
        return None

def update_attendance_in_sheet(sheet_id: str, present_students: List[Tuple[str, str]], absent_students: List[Tuple[str, str]], timestamp: str) -> None:
    """Update the Google Sheet with present and absent students."""
    if sheets_service is None:
        logger.error("Cannot update sheet: Google Sheets service not initialized")
        return
    range_present = 'Present!A1'
    range_absent = 'Absent!A1'
    values_present = [[timestamp] + [f"{name} ({usn})" for name, usn in present_students]]
    values_absent = [[timestamp] + [f"{name} ({usn})" for name, usn in absent_students]]
    try:
        sheets_service.spreadsheets().values().append(
            spreadsheetId=sheet_id, range=range_present, valueInputOption='RAW', body={'values': values_present}
        ).execute()
        sheets_service.spreadsheets().values().append(
            spreadsheetId=sheet_id, range=range_absent, valueInputOption='RAW', body={'values': values_absent}
        ).execute()
        logger.info("Updated Google Sheet %s with attendance data", sheet_id)
    except HttpError as e:
        logger.error("Error updating Google Sheet %s: %s", sheet_id, str(e))
        raise

def parse_attendance(file_path: str) -> List[Dict]:
    """Parse attendance data from a text file."""
    try:
        attendance_records = []
        with open(file_path, "r", encoding="utf-8") as file:
            lines = file.readlines()
            session_date = None
            present = []
            absent = []
            faculty = None
            for line in lines:
                line = line.strip()
                if line.startswith("--- Attendance Session:"):
                    if session_date and (present or absent):
                        attendance_records.append({"date": session_date, "present": present, "absent": absent, "faculty": faculty})
                    timestamp = line.split(": ")[1].strip().split(" ")[0]
                    session_date = datetime.strptime(timestamp, "%Y-%m-%d")
                    present = []
                    absent = []
                    faculty = None
                elif line.startswith("Faculty:"):
                    faculty = line.split(":")[1].strip()
                elif line.startswith("Present Students:"):
                    present = [student.strip() for student in line.split(":")[1].split(",") if student.strip()]
                elif line.startswith("Absent Students:"):
                    absent = [student.strip() for student in line.split(":")[1].split(",") if student.strip()]
            if session_date and (present or absent):
                attendance_records.append({"date": session_date, "present": present, "absent": absent, "faculty": faculty})
        logger.info("Parsed %d attendance records from %s", len(attendance_records), file_path)
        return attendance_records
    except Exception as e:
        logger.error("Error parsing attendance file %s: %s", file_path, str(e))
        return []

def calculate_statistics(attendance_records: List[Dict]) -> Dict[str, Tuple[int, float]]:
    """Calculate attendance statistics from parsed records."""
    total_sessions = len(attendance_records)
    if total_sessions == 0:
        logger.warning("No attendance records provided for statistics calculation")
        return {}
    attendance: Dict[str, int] = {}
    for session in attendance_records:
        for student in session["present"]:
            attendance[student] = attendance.get(student, 0) + 1
        for student in session["absent"]:
            attendance.setdefault(student, 0)
    stats = {student: (count, (count / total_sessions) * 100) for student, count in attendance.items()}
    logger.info("Calculated attendance statistics for %d students over %d sessions", len(stats), total_sessions)
    return stats

def generate_pdf(stats: Dict[str, Tuple[int, float]], output_file: str, record) -> None:
    """Generate a PDF report with attendance statistics."""
    try:
        c = canvas.Canvas(output_file, pagesize=letter)
        width, height = letter
        c.setFont("Helvetica-Bold", 16)
        title = f"Attendance Statistics - {record.branch.name} Semester {record.semester.number} {record.subject.name} ({record.section.name})"
        c.drawString(100, height - 40, title)
        c.setFont("Helvetica", 12)
        c.drawString(100, height - 60, f"Total Sessions: {len(parse_attendance(record.file_path))}")
        c.drawString(100, height - 80, f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        c.setFont("Helvetica-Bold", 12)
        c.drawString(50, height - 120, "Above 75% Attendance")
        c.drawString(350, height - 120, "Below 75% Attendance")
        c.setFont("Helvetica", 10)
        above_75 = [(s, c, p) for s, (c, p) in stats.items() if p >= 75]
        below_75 = [(s, c, p) for s, (c, p) in stats.items() if p < 75]
        y_above = y_below = height - 140
        for student, count, percentage in sorted(above_75, key=lambda x: x[2], reverse=True):
            c.drawString(50, y_above, f"{student}: {count} ({percentage:.2f}%)")
            y_above -= 15
            if y_above < 50:
                c.showPage()
                c.setFont("Helvetica", 10)
                y_above = height - 50
        for student, count, percentage in sorted(below_75, key=lambda x: x[2], reverse=True):
            c.drawString(350, y_below, f"{student}: {count} ({percentage:.2f}%)")
            y_below -= 15
            if y_below < 50:
                c.showPage()
                c.setFont("Helvetica", 10)
                y_below = height - 50
        c.save()
        logger.info("Generated PDF report at %s", output_file)
    except Exception as e:
        logger.error("Error generating PDF at %s: %s", output_file, str(e))
        raise
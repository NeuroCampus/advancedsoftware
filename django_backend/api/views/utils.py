import os
import cv2
import dlib
import pickle
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

# Ensure the pickle file exists
if not os.path.exists(settings.PICKLE_FILE):
    with open(settings.PICKLE_FILE, 'wb') as f:
        pass
    logger.info("Created empty pickle file at %s", settings.PICKLE_FILE)

def compute_face_distance(encoding1: np.ndarray, encoding2: np.ndarray) -> float:
    return np.linalg.norm(encoding1 - encoding2)

def is_same_person(known_encodings: List[np.ndarray], test_encoding: np.ndarray, threshold: float = 0.4) -> bool:
    if not known_encodings:
        logger.debug("No known encodings provided for comparison")
        return False
    distances = [compute_face_distance(test_encoding, enc) for enc in known_encodings]
    min_distance = min(distances)
    close_matches = sum(1 for d in distances if d < threshold)
    logger.debug("Face comparison: min_distance=%.2f, close_matches=%d, threshold=%.2f", min_distance, close_matches, threshold)
    return (min_distance < threshold and close_matches >= 2) if len(known_encodings) > 1 else min_distance < threshold

def load_all_students() -> List[Dict]:
    students = []
    try:
        with open(settings.PICKLE_FILE, 'rb') as f:
            while True:
                try:
                    student = pickle.load(f)
                    students.append(student)
                except EOFError:
                    break
        logger.info("Loaded %d students from pickle file %s", len(students), settings.PICKLE_FILE)
    except FileNotFoundError:
        logger.warning("Pickle file %s not found; returning empty list", settings.PICKLE_FILE)
    except Exception as e:
        logger.error("Error loading students from pickle file: %s", str(e))
    return students

def sync_pickle_with_database():
    """Regenerate students.pkl from the Student model in the database."""
    from .models import Student
    students = []
    for student in Student.objects.all():
        photo_dir = os.path.join(settings.STUDENT_DATA_PATH, student.usn)
        encodings = []
        if os.path.exists(photo_dir):
            for photo_file in os.listdir(photo_dir):
                if photo_file.endswith('.jpg'):
                    photo_path = os.path.join(photo_dir, photo_file)
                    img = cv2.imread(photo_path)
                    if img is not None:
                        rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                        faces = face_detector(rgb_img)
                        if faces:
                            shape = shape_predictor(rgb_img, faces[0])
                            encoding = np.array(face_recognizer.compute_face_descriptor(rgb_img, shape))
                            encodings.append(encoding)
                            logger.debug("Computed encoding for %s from %s", student.usn, photo_path)
        student_data = {
            'name': student.name,
            'usn': student.usn,
            'semester': student.semester,
            'section': student.section,
            'encodings': encodings
        }
        students.append(student_data)
    
    with open(settings.PICKLE_FILE, 'wb') as f:
        for student_data in students:
            pickle.dump(student_data, f)
    logger.info("Synced %d students from database to %s", len(students), settings.PICKLE_FILE)

def get_google_sheet_id(subject: str, section: str, semester: str) -> Optional[str]:
    sheet_id_file = os.path.join(settings.STUDENT_DATA_PATH, f'{subject}_{section}_{semester}_sheet_id.txt')
    if os.path.exists(sheet_id_file):
        with open(sheet_id_file, 'r') as file:
            sheet_id = file.read().strip()
        try:
            sheets_service.spreadsheets().get(spreadsheetId=sheet_id).execute()
            logger.info("Verified existing sheet ID: %s", sheet_id)
            return sheet_id
        except HttpError as e:
            if e.resp.status == 404:
                logger.warning("Sheet with ID %s not found; creating a new sheet", sheet_id)
                return create_google_sheet(subject, section, semester)
            logger.error("Error verifying sheet %s: %s", sheet_id, str(e))
            return None
    logger.info("No sheet ID file found; creating a new sheet for %s_%s_%s", subject, section, semester)
    return create_google_sheet(subject, section, semester)

def create_google_sheet(subject: str, section: str, semester: str) -> Optional[str]:
    if sheets_service is None or drive_service is None:
        logger.error("Google Sheets service not initialized due to credentials error")
        return None
    try:
        spreadsheet = {
            'properties': {'title': f'Attendance_{semester}_{subject}_{section}'},
            'sheets': [{'properties': {'title': 'Present'}}, {'properties': {'title': 'Absent'}}]
        }
        sheet = sheets_service.spreadsheets().create(body=spreadsheet).execute()
        sheet_id = sheet['spreadsheetId']
        with open(os.path.join(settings.STUDENT_DATA_PATH, f'{subject}_{section}_{semester}_sheet_id.txt'), 'w') as file:
            file.write(sheet_id)
        drive_service.permissions().create(fileId=sheet_id, body={'type': 'anyone', 'role': 'reader'}).execute()
        logger.info("Created new sheet with ID: %s", sheet_id)
        return sheet_id
    except HttpError as err:
        logger.error("Error creating or sharing sheet for %s_%s_%s: %s", semester, subject, section, str(err))
        return None

def update_attendance_in_sheet(sheet_id: str, present_students: List[Tuple[str, str]], absent_students: List[Tuple[str, str]], timestamp: str) -> None:
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
    try:
        attendance_records = []
        with open(file_path, "r", encoding="utf-8") as file:
            lines = file.readlines()
            session_date = None
            present = []
            absent = []
            for line in lines:
                line = line.strip()
                if line.startswith("--- Attendance Session:"):
                    if session_date and (present or absent):
                        attendance_records.append({"date": session_date, "present": present, "absent": absent})
                    timestamp = line.split(": ")[1].strip().split(" ")[0]
                    session_date = datetime.strptime(timestamp, "%Y-%m-%d")
                    present = []
                    absent = []
                elif line.startswith("Present Students:"):
                    present = [student.strip() for student in line.split(":")[1].split(",") if student.strip()]
                elif line.startswith("Absent Students:"):
                    absent = [student.strip() for student in line.split(":")[1].split(",") if student.strip()]
            if session_date and (present or absent):
                attendance_records.append({"date": session_date, "present": present, "absent": absent})
        logger.info("Parsed %d attendance records from %s", len(attendance_records), file_path)
        return attendance_records
    except Exception as e:
        logger.error("Error parsing attendance file %s: %s", file_path, str(e))
        return []

def calculate_statistics(attendance_records: List[Dict]) -> Dict[str, Tuple[int, float]]:
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
    try:
        c = canvas.Canvas(output_file, pagesize=letter)
        width, height = letter
        c.setFont("Helvetica-Bold", 16)
        c.drawString(100, height - 40, f"Attendance Statistics - {record.semester} {record.subject} ({record.section})")
        c.setFont("Helvetica", 12)
        c.drawString(100, height - 60, f"Total Sessions: {len(parse_attendance(record.file_path))}")
        c.setFont("Helvetica-Bold", 12)
        c.drawString(50, height - 100, "Above 75% Attendance")
        c.drawString(350, height - 100, "Below 75% Attendance")
        c.setFont("Helvetica", 10)
        above_75 = [(s, p) for s, (count, p) in stats.items() if p >= 75]
        below_75 = [(s, p) for s, (count, p) in stats.items() if p < 75]
        y_above = y_below = height - 120
        for student, percentage in above_75:
            c.drawString(50, y_above, f"{student}: {percentage:.2f}%")
            y_above -= 15
            if y_above < 50:
                c.showPage()
                c.setFont("Helvetica", 10)
                y_above = height - 50
        for student, percentage in below_75:
            c.drawString(350, y_below, f"{student}: {percentage:.2f}%")
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
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

# Initialize face detection and recognition models
try:
    face_detector = dlib.get_frontal_face_detector()
    shape_predictor = dlib.shape_predictor(os.path.join(settings.BASE_DIR, 'shape_predictor_68_face_landmarks.dat'))
    face_recognizer = dlib.face_recognition_model_v1(os.path.join(settings.BASE_DIR, 'dlib_face_recognition_resnet_model_v1.dat'))
except Exception as e:
    print(f"Error loading face recognition models: {e}")
    face_detector = None
    shape_predictor = None
    face_recognizer = None

# Google Sheets API setup
SCOPES = ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive']
try:
    creds = Credentials.from_service_account_file(settings.GOOGLE_CREDENTIALS_FILE, scopes=SCOPES)
    sheets_service = build('sheets', 'v4', credentials=creds)
    drive_service = build('drive', 'v3', credentials=creds)
except Exception as e:
    print(f"Error setting up Google API: {e}")
    sheets_service = None
    drive_service = None

# Ensure the pickle file exists
if not os.path.exists(settings.PICKLE_FILE):
    with open(settings.PICKLE_FILE, 'wb') as f:
        pass

def compute_face_distance(encoding1: np.ndarray, encoding2: np.ndarray) -> float:
    return np.linalg.norm(encoding1 - encoding2)

def is_same_person(known_encodings: List[np.ndarray], test_encoding: np.ndarray, threshold: float = 0.4) -> bool:
    if not known_encodings:
        return False
    distances = [compute_face_distance(test_encoding, enc) for enc in known_encodings]
    min_distance = min(distances)
    close_matches = sum(1 for d in distances if d < threshold)
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
    except FileNotFoundError:
        pass
    return students

def get_google_sheet_id(subject: str, section: str, semester: str) -> Optional[str]:
    sheet_id_file = os.path.join(settings.STUDENT_DATA_PATH, f'{subject}_{section}_{semester}_sheet_id.txt')
    if os.path.exists(sheet_id_file):
        with open(sheet_id_file, 'r') as file:
            sheet_id = file.read().strip()
        try:
            sheets_service.spreadsheets().get(spreadsheetId=sheet_id).execute()
            return sheet_id
        except HttpError as e:
            if e.resp.status == 404:
                print(f"Sheet with ID {sheet_id} not found. Creating a new sheet...")
                return create_google_sheet(subject, section, semester)
            print(f"Error verifying sheet: {e}")
            return None
    return create_google_sheet(subject, section, semester)

def create_google_sheet(subject: str, section: str, semester: str) -> Optional[str]:
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
        return sheet_id
    except HttpError as err:
        print(f"Error creating or sharing the sheet: {err}")
        return None

def update_attendance_in_sheet(sheet_id: str, present_students: List[Tuple[str, str]], absent_students: List[Tuple[str, str]], timestamp: str) -> None:
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
    except HttpError as e:
        print(f"Error updating Google Sheet: {e}")
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
        return attendance_records
    except Exception as e:
        print(f"Error parsing attendance file: {e}")
        return []

def calculate_statistics(attendance_records: List[Dict]) -> Dict[str, float]:
    total_sessions = len(attendance_records)
    if total_sessions == 0:
        return {}
    attendance: Dict[str, int] = {}
    for session in attendance_records:
        for student in session["present"]:
            attendance[student] = attendance.get(student, 0) + 1
        for student in session["absent"]:
            attendance.setdefault(student, 0)
    return {student: (count / total_sessions) * 100 for student, count in attendance.items()}

def generate_pdf(stats: Dict[str, float], output_file: str, record) -> None:
    try:
        c = canvas.Canvas(output_file, pagesize=letter)
        width, height = letter
        c.setFont("Helvetica-Bold", 16)
        c.drawString(100, height - 40, f"Attendance Statistics - {record.semester} {record.subject} ({record.section})")
        c.setFont("Helvetica", 12)
        c.drawString(100, height - 60, f"Date: {record.date.strftime('%Y-%m-%d')}")
        c.setFont("Helvetica-Bold", 12)
        c.drawString(50, height - 100, "Above 75% Attendance")
        c.drawString(350, height - 100, "Below 75% Attendance")
        c.setFont("Helvetica", 10)
        above_75 = [(s, p) for s, p in stats.items() if p >= 75]
        below_75 = [(s, p) for s, p in stats.items() if p < 75]
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
    except Exception as e:
        print(f"Error generating PDF: {e}")
        raise
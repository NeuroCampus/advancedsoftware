from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from ..permissions import IsFaculty  # Import custom permission
from .utils import face_detector, shape_predictor, face_recognizer, load_all_students, is_same_person, get_google_sheet_id, update_attendance_in_sheet
from ..models import AttendanceRecord, AttendanceDetail, Student
import os
import cv2
import numpy as np
from datetime import datetime
from django.conf import settings

@api_view(['POST'])
@permission_classes([IsFaculty])
def take_attendance(request) -> Response:
    if face_detector is None or shape_predictor is None or face_recognizer is None:
        return Response({'success': False, 'message': 'Face recognition models not loaded'})
    token = request.headers.get('Authorization', '').replace('Bearer ', '').strip()
    if not token:
        return Response({'success': False, 'message': 'Authentication token required'}, status=401)
    subject = request.data.get('subject')
    section = request.data.get('section')
    semester = request.data.get('semester')
    files = request.FILES.getlist('class_images')
    if not all([subject, section, semester, files]):
        return Response({'success': False, 'message': 'Missing required fields'})
    sheet_id = get_google_sheet_id(subject, section, semester)
    if not sheet_id:
        return Response({'success': False, 'message': 'Failed to create or retrieve Google Sheet'})
    try:
        attendance_record = AttendanceRecord.objects.create(semester=semester, section=section, subject=subject, sheet_id=sheet_id)
    except Exception as e:
        return Response({'success': False, 'message': f'Error creating attendance record: {str(e)}'})
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    attendance_file = f"attendance_{semester}_{subject}_{section}.txt"
    file_path = os.path.join(settings.STUDENT_DATA_PATH, attendance_file)
    attendance_record.file_path = file_path
    attendance_record.save()
    present_students = set()
    enrolled_students = load_all_students()
    class_students = [s for s in enrolled_students if s['semester'] == semester and s['section'] == section]
    for file in files:
        try:
            img_bytes = file.read()
            nparr = np.frombuffer(img_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if img is None or img.size == 0:
                return Response({'success': False, 'message': 'Invalid image file'})
            rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            faces = face_detector(rgb_img)
            for face in faces:
                shape = shape_predictor(rgb_img, face)
                face_encoding = np.array(face_recognizer.compute_face_descriptor(rgb_img, shape))
                for student in class_students:
                    if is_same_person(student['encodings'], face_encoding):
                        present_students.add((student['name'], student['usn']))
                        break
        except Exception as e:
            return Response({'success': False, 'message': f'Error processing class image: {str(e)}'})
    all_class_students = [(s['name'], s['usn']) for s in class_students]
    absent_students = [(name, usn) for name, usn in all_class_students if (name, usn) not in present_students]
    try:
        update_attendance_in_sheet(sheet_id, list(present_students), absent_students, timestamp)
    except Exception as e:
        return Response({'success': False, 'message': f'Error updating Google Sheet: {str(e)}'})
    try:
        with open(file_path, 'a') as report:
            report.write(f"\n--- Attendance Session: {timestamp} ---\n")
            report.write("Present Students: " + ", ".join([name for name, _ in present_students]) + "\n")
            report.write("Absent Students: " + ", ".join([name for name, _ in absent_students]) + "\n")
    except Exception as e:
        return Response({'success': False, 'message': f'Error writing to attendance file: {str(e)}'})
    try:
        for name, usn in present_students:
            student = Student.objects.get(usn=usn)
            AttendanceDetail.objects.create(record=attendance_record, student=student, status=True)
        for name, usn in absent_students:
            student = Student.objects.get(usn=usn)
            AttendanceDetail.objects.create(record=attendance_record, student=student, status=False)
    except Student.DoesNotExist:
        return Response({'success': False, 'message': 'One or more students not found in database'})
    except Exception as e:
        return Response({'success': False, 'message': f'Error saving attendance details: {str(e)}'})
    sheet_url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/edit?usp=sharing"
    return Response({
        'success': True,
        'message': f"Attendance taken for {semester} {subject} ({section})",
        'present_students': [f"{name} ({usn})" for name, usn in present_students],
        'absent_students': [f"{name} ({usn})" for name, usn in absent_students],
        'sheet_url': sheet_url
    })
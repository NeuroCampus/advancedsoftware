from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.http import FileResponse
from ..permissions import IsTeacher
from .utils import face_detector, shape_predictor, face_recognizer, load_all_students, is_same_person, get_google_sheet_id, update_attendance_in_sheet, parse_attendance, calculate_statistics, generate_pdf
from ..models import AttendanceRecord, AttendanceDetail, Student, User
import os
import cv2
import numpy as np
from datetime import datetime
from django.conf import settings
import logging
from django.contrib.auth.hashers import make_password
import pickle
import glob

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([IsTeacher])
def take_attendance(request) -> Response:
    logger.info("Received take_attendance request")
    
    if face_detector is None or shape_predictor is None or face_recognizer is None:
        logger.error("Face recognition models not loaded")
        return Response({'success': False, 'message': 'Face recognition models not loaded'})
    
    token = request.headers.get('Authorization', '').replace('Bearer ', '').strip()
    if not token:
        logger.error("Authentication token missing")
        return Response({'success': False, 'message': 'Authentication token required'}, status=401)
    
    subject = request.data.get('subject')
    section = request.data.get('section')
    semester = request.data.get('semester')
    files = request.FILES.getlist('class_images')
    if not all([subject, section, semester, files]):
        logger.error("Missing required fields: subject=%s, section=%s, semester=%s, files=%s", subject, section, semester, len(files))
        return Response({'success': False, 'message': 'Missing required fields'})
    
    try:
        logger.info("Fetching Google Sheet ID for %s_%s_%s", semester, subject, section)
        sheet_id = get_google_sheet_id(subject, section, semester)
        if not sheet_id:
            logger.warning("Failed to get Google Sheet ID; proceeding without sheet")
    except Exception as e:
        logger.warning("Exception while fetching Google Sheet ID: %s; proceeding without sheet", str(e))
        sheet_id = None
    
    try:
        attendance_record = AttendanceRecord.objects.create(semester=semester, section=section, subject=subject, sheet_id=sheet_id)
        logger.info("Created AttendanceRecord with ID: %s", attendance_record.id)
    except Exception as e:
        logger.error("Error creating attendance record: %s", str(e))
        return Response({'success': False, 'message': f'Error creating attendance record: {str(e)}'})
    
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    attendance_file = f"attendance_{semester}_{subject}_{section}.txt"
    file_path = os.path.join(settings.STUDENT_DATA_PATH, attendance_file)
    attendance_record.file_path = file_path
    attendance_record.save()
    
    present_students = set()
    # Fetch students directly from the database first
    db_students = Student.objects.filter(semester=semester, section=section)
    class_students = [{'name': s.name, 'usn': s.usn, 'semester': s.semester, 'section': s.section, 'encodings': []} for s in db_students]
    logger.info("Loaded %d students from database for semester %s, section %s", len(class_students), semester, section)
    
    # Load encodings from pickle file and merge with database students
    enrolled_students = load_all_students()
    for student in class_students:
        pickle_student = next((s for s in enrolled_students if s['usn'] == student['usn']), None)
        if pickle_student and pickle_student['encodings']:
            student['encodings'] = pickle_student['encodings']
            logger.debug("Added encodings for student %s from pickle", student['usn'])
    
    if not class_students:
        logger.warning("No students found for semester %s, section %s", semester, section)
        return Response({'success': False, 'message': 'No students enrolled in this class'}, status=400)
    
    for file in files:
        try:
            img_bytes = file.read()
            nparr = np.frombuffer(img_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if img is None or img.size == 0:
                logger.error("Invalid image file: %s", file.name)
                return Response({'success': False, 'message': 'Invalid image file'})
            rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            faces = face_detector(rgb_img)
            logger.debug("Detected %d faces in image %s", len(faces), file.name)
            for face in faces:
                shape = shape_predictor(rgb_img, face)
                face_encoding = np.array(face_recognizer.compute_face_descriptor(rgb_img, shape))
                for student in class_students:
                    if is_same_person(student['encodings'], face_encoding):
                        present_students.add((student['name'], student['usn']))
                        logger.debug("Matched student: %s (%s)", student['name'], student['usn'])
                        break
        except Exception as e:
            logger.error("Error processing class image %s: %s", file.name, str(e))
            return Response({'success': False, 'message': f'Error processing class image: {str(e)}'})
    
    all_class_students = [(s['name'], s['usn']) for s in class_students]
    absent_students = [(name, usn) for name, usn in all_class_students if (name, usn) not in present_students]
    logger.info("Present: %d students, Absent: %d students", len(present_students), len(absent_students))
    
    if sheet_id:
        try:
            update_attendance_in_sheet(sheet_id, list(present_students), absent_students, timestamp)
            logger.info("Successfully updated Google Sheet: %s", sheet_id)
        except Exception as e:
            logger.warning("Error updating Google Sheet: %s; continuing without sheet update", str(e))
    
    try:
        with open(file_path, 'a') as report:
            report.write(f"\n--- Attendance Session: {timestamp} ---\n")
            report.write("Present Students: " + ", ".join([name for name, _ in present_students]) + "\n")
            report.write("Absent Students: " + ", ".join([name for name, _ in absent_students]) + "\n")
        logger.info("Wrote attendance to file: %s", file_path)
    except Exception as e:
        logger.error("Error writing to attendance file: %s", str(e))
        return Response({'success': False, 'message': f'Error writing to attendance file: {str(e)}'})
    
    try:
        for name, usn in present_students:
            student = Student.objects.get(usn=usn)
            AttendanceDetail.objects.create(record=attendance_record, student=student, status=True)
        for name, usn in absent_students:
            student = Student.objects.get(usn=usn)
            AttendanceDetail.objects.create(record=attendance_record, student=student, status=False)
        logger.info("Saved attendance details to database")
    except Student.DoesNotExist:
        logger.error("One or more students not found in database")
        return Response({'success': False, 'message': 'One or more students not found in database'})
    except Exception as e:
        logger.error("Error saving attendance details: %s", str(e))
        return Response({'success': False, 'message': f'Error saving attendance details: {str(e)}'})
    
    sheet_url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/edit?usp=sharing" if sheet_id else None
    response_data = {
        'success': True,
        'message': f"Attendance taken for {semester} {subject} ({section})",
        'present_students': [f"{name} ({usn})" for name, usn in present_students],
        'absent_students': [f"{name} ({usn})" for name, usn in absent_students],
    }
    if sheet_url:
        response_data['sheet_url'] = sheet_url
    logger.info("Attendance process completed successfully")
    return Response(response_data)

@api_view(['POST'])
@permission_classes([IsTeacher])
def enroll(request) -> Response:
    logger.info("Received enroll request")
    name = request.data.get('name')
    usn = request.data.get('usn')
    semester = request.data.get('semester')
    section = request.data.get('section')
    email = request.data.get('email')
    photos = request.FILES.getlist('photos')
    photos_to_delete = request.data.get('photos_to_delete', [])
    if not usn:
        logger.error("Missing required field: usn")
        return Response({'success': False, 'message': 'USN is required'}, status=400)
    if not photos and not photos_to_delete:
        logger.error("No photos provided and no deletions requested")
        return Response({'success': False, 'message': 'At least one photo addition or deletion is required'}, status=400)
    try:
        existing_student = Student.objects.filter(usn=usn).first()
        is_update = bool(existing_student)
        if existing_student:
            student = existing_student
            logger.info("Updating existing student: %s (%s)", student.name, usn)
            if name and name != student.name:
                student.name = name
                student.save()
                logger.info("Updated name for %s to %s", usn, name)
            if semester and semester != student.semester:
                student.semester = semester
                student.save()
                logger.info("Updated semester for %s to %s", usn, semester)
            if section and section != student.section:
                student.section = section
                student.save()
                logger.info("Updated section for %s to %s", usn, section)
            if email and email != student.user.email:
                if User.objects.filter(email=email).exclude(id=student.user.id).exists():
                    logger.warning("Email %s already in use by another user", email)
                    return Response({'success': False, 'message': 'Email already in use'}, status=400)
                student.user.email = email
                student.user.save()
                logger.info("Updated email for %s to %s", usn, email)
        else:
            if not all([name, semester, section, email]):
                logger.error("Missing required fields for new student: name=%s, semester=%s, section=%s, email=%s", 
                            name, semester, section, email)
                return Response({'success': False, 'message': 'Name, semester, section, and email are required for new students'}, status=400)
            if User.objects.filter(email=email).exists():
                logger.warning("User with email %s already exists", email)
                return Response({'success': False, 'message': 'Email already in use'}, status=400)
            default_password = "default123"
            user = User.objects.create(
                username=usn,
                email=email,
                password=make_password(default_password),
                role='student'
            )
            logger.info("Created User for %s with email %s", usn, email)
            student = Student.objects.create(
                name=name,
                usn=usn,
                semester=semester,
                section=section,
                user=user
            )
            logger.info("Created Student: %s (%s) linked to User", name, usn)
        photo_dir = os.path.join(settings.STUDENT_DATA_PATH, usn)
        try:
            os.makedirs(photo_dir, exist_ok=True)
        except PermissionError as e:
            logger.error("Permission denied creating directory %s: %s", photo_dir, str(e))
            return Response({'success': False, 'message': f'Permission denied creating directory for USN {usn}'}, status=500)
        if photos_to_delete:
            for photo_filename in photos_to_delete:
                photo_path = os.path.join(photo_dir, photo_filename)
                try:
                    if os.path.exists(photo_path):
                        os.remove(photo_path)
                        logger.info("Deleted photo %s for student %s", photo_path, usn)
                    else:
                        logger.warning("Photo %s not found for student %s", photo_path, usn)
                except PermissionError as e:
                    logger.error("Permission denied deleting photo %s: %s", photo_path, str(e))
                    return Response({'success': False, 'message': f'Permission denied deleting photo for USN {usn}'}, status=500)
        encodings = []
        if photos:
            for idx, photo in enumerate(photos):
                photo_filename = f"photo_{idx}_{datetime.now().strftime('%Y%m%d%H%M%S')}.jpg"
                photo_path = os.path.join(photo_dir, photo_filename)
                try:
                    with open(photo_path, 'wb') as f:
                        f.write(photo.read())
                    logger.debug("Saved photo %s for student %s", photo_path, usn)
                except PermissionError as e:
                    logger.error("Permission denied saving photo %s: %s", photo_path, str(e))
                    return Response({'success': False, 'message': f'Permission denied saving photo for USN {usn}'}, status=500)
                photo.seek(0)
                img_data = photo.read()
                img = cv2.imdecode(np.frombuffer(img_data, np.uint8), cv2.IMREAD_COLOR)
                if img is not None:
                    rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                    faces = face_detector(rgb_img)
                    if faces:
                        shape = shape_predictor(rgb_img, faces[0])
                        encoding = np.array(face_recognizer.compute_face_descriptor(rgb_img, shape))
                        encodings.append(encoding)
                        logger.debug("Computed encoding for photo %s", photo_path)
                    else:
                        logger.warning("No faces detected in photo %s for student %s", photo_path, usn)
                else:
                    logger.error("Failed to decode image %s for student %s", photo_path, usn)
        all_students = load_all_students()
        student_data = next((s for s in all_students if s['usn'] == usn), None)
        if photos_to_delete:
            remaining_photos = glob.glob(os.path.join(photo_dir, "*.jpg"))
            encodings = []
            for photo_path in remaining_photos:
                img = cv2.imread(photo_path)
                if img is not None:
                    rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                    faces = face_detector(rgb_img)
                    if faces:
                        shape = shape_predictor(rgb_img, faces[0])
                        encoding = np.array(face_recognizer.compute_face_descriptor(rgb_img, shape))
                        encodings.append(encoding)
                        logger.debug("Recomputed encoding for remaining photo %s", photo_path)
                    else:
                        logger.warning("No faces detected in remaining photo %s for student %s", photo_path, usn)
        if student_data:
            student_data['encodings'] = encodings
            logger.info("Updated encodings for student %s with %d encodings", usn, len(encodings))
        else:
            student_data = {
                'name': student.name,
                'usn': usn,
                'semester': student.semester,
                'section': student.section,
                'encodings': encodings
            }
            logger.info("Created new student data for %s with %d encodings", usn, len(encodings))
        updated_students = [s for s in all_students if s['usn'] != usn] + [student_data]
        try:
            with open(settings.PICKLE_FILE, 'wb') as f:
                for s in updated_students:
                    pickle.dump(s, f)
        except PermissionError as e:
            logger.error("Permission denied writing to pickle file %s: %s", settings.PICKLE_FILE, str(e))
            return Response({'success': False, 'message': 'Permission denied updating student data'}, status=500)
        message = f"Student {student.name} ({usn}) {'updated' if GRADED else 'enrolled'} successfully."
        if not is_update:
            message += f" Default password is 'default123'."
        logger.info(message)
        return Response({
            'success': True,
            'message': message,
            'email': email
        }, status=200 if is_update else 201)
    except Exception as e:
        logger.error("Error processing enrollment/update: %s", str(e))
        return Response({'success': False, 'message': f'Error processing request: {str(e)}'}, status=500)

@api_view(['POST'])
@permission_classes([IsTeacher])
def generate_statistics(request) -> Response:
    logger.info("Received generate_statistics request from faculty")
    token = request.headers.get('Authorization', '').replace('Bearer ', '').strip()
    if not token:
        logger.error("Authentication token missing")
        return Response({'success': False, 'message': 'Authentication token required'}, status=401)
    file_id = request.data.get('file_id')
    if not file_id:
        logger.error("Missing file ID")
        return Response({'success': False, 'message': 'Missing file ID'}, status=400)
    try:
        record = AttendanceRecord.objects.get(id=file_id)
        if not record.file_path or not os.path.exists(record.file_path):
            logger.error("Attendance file not found for record %s", file_id)
            return Response({'success': False, 'message': 'Attendance file not found'}, status=404)
        attendance_records = parse_attendance(record.file_path)
        if not attendance_records:
            logger.warning("No valid attendance data in file %s", record.file_path)
            return Response({'success': False, 'message': 'No valid attendance data in file'}, status=404)
        stats = calculate_statistics(attendance_records)
        total_sessions = len(attendance_records)
        pdf_filename = f"attendance_report_{record.semester}_{record.subject}_{record.section}_{record.date.strftime('%Y%m%d')}.pdf"
        pdf_path = os.path.join(settings.MEDIA_ROOT, pdf_filename)
        os.makedirs(os.path.dirname(pdf_path), exist_ok=True)
        generate_pdf(stats, pdf_path, record)
        detailed_stats = {
            student: {
                'percentage': round(percentage, 2),
                'present': count,
                'absent': total_sessions - count
            }
            for student, (count, percentage) in stats.items()
        }
        above_75 = [
            {'student': s, 'percentage': data['percentage'], 'present': data['present'], 'absent': data['absent']}
            for s, data in detailed_stats.items() if data['percentage'] >= 75
        ]
        below_75 = [
            {'student': s, 'percentage': data['percentage'], 'present': data['present'], 'absent': data['absent']}
            for s, data in detailed_stats.items() if data['percentage'] < 75
        ]
        above_75.sort(key=lambda x: x['percentage'], reverse=True)
        below_75.sort(key=lambda x: x['percentage'], reverse=True)
        logger.info("Generated statistics for %s_%s_%s: %d sessions", record.semester, record.subject, record.section, total_sessions)
        return Response({
            'success': True,
            'total_sessions': total_sessions,
            'above_75': above_75,
            'below_75': below_75,
            'pdf_url': f"/api/download-pdf/{pdf_filename}"
        })
    except AttendanceRecord.DoesNotExist:
        logger.error("Attendance record with ID %s not found", file_id)
        return Response({'success': False, 'message': 'Attendance record not found'}, status=404)
    except Exception as e:
        logger.error("Error generating statistics: %s", str(e))
        return Response({'success': False, 'message': f'Error generating statistics: {str(e)}'}, status=500)

@api_view(['GET'])
@permission_classes([IsTeacher])
def download_pdf(request, filename: str) -> FileResponse:
    logger.info("Received download_pdf request for %s", filename)
    token = request.headers.get('Authorization', '').replace('Bearer ', '').strip()
    if not token:
        logger.error("Authentication token missing")
        return Response({'success': False, 'message': 'Authentication token required'}, status=401)
    file_path = os.path.join(settings.MEDIA_ROOT, filename)
    if os.path.exists(file_path):
        logger.info("Serving PDF file: %s", file_path)
        return FileResponse(open(file_path, 'rb'), as_attachment=True, filename=os.path.basename(file_path))
    else:
        logger.error("PDF file not found: %s", file_path)
        return Response({'success': False, 'message': 'File not found'}, status=404)

@api_view(['GET'])
@permission_classes([IsTeacher])
def get_students(request) -> Response:
    logger.info("Received get_students request")
    semester = request.query_params.get('semester')
    section = request.query_params.get('section')
    if not semester or not section:
        logger.error("Missing semester or section in query parameters: semester=%s, section=%s", semester, section)
        return Response({'success': False, 'message': 'Semester and section are required'}, status=400)
    try:
        students = Student.objects.filter(semester=semester, section=section)
        student_list = [{'usn': s.usn, 'name': s.name, 'email': s.user.email} for s in students]
        logger.info("Fetched %d students for semester %s, section %s", len(student_list), semester, section)
        return Response({'success': True, 'students': student_list})
    except Exception as e:
        logger.error("Error fetching students: %s", str(e))
        return Response({'success': False, 'message': f'Error fetching students: {str(e)}'}, status=500)

@api_view(['GET'])
@permission_classes([IsTeacher])
def get_student_photos(request) -> Response:
    logger.info("Received get_student_photos request")
    usn = request.query_params.get('usn')
    if not usn:
        logger.error("Missing usn parameter")
        return Response({'success': False, 'message': 'USN is required'}, status=400)
    try:
        student = Student.objects.filter(usn=usn).first()
        if not student:
            logger.warning("Student with USN %s not found", usn)
            return Response({'success': False, 'message': 'Student not found'}, status=404)
        photo_dir = os.path.join(settings.STUDENT_DATA_PATH, usn)
        if not os.path.exists(photo_dir):
            logger.info("No photos found for student %s", usn)
            return Response({'success': True, 'photos': []})
        photo_files = [os.path.basename(f) for f in glob.glob(os.path.join(photo_dir, "*.jpg"))]
        photo_urls = [f"/api/student-photo/{usn}/{filename}" for filename in photo_files]
        logger.info("Fetched %d photos for student %s", len(photo_urls), usn)
        return Response({'success': True, 'photos': photo_urls})
    except Exception as e:
        logger.error("Error fetching student photos: %s", str(e))
        return Response({'success': False, 'message': f'Error fetching photos: {str(e)}'}, status=500)

@api_view(['GET'])
@permission_classes([IsTeacher])
def serve_student_photo(request, usn: str, filename: str) -> FileResponse:
    logger.info("Received serve_student_photo request for %s/%s", usn, filename)
    photo_path = os.path.join(settings.STUDENT_DATA_PATH, usn, filename)
    if os.path.exists(photo_path):
        logger.info("Serving photo: %s", photo_path)
        return FileResponse(open(photo_path, 'rb'), content_type='image/jpeg')
    else:
        logger.error("Photo not found: %s", photo_path)
        return Response({'success': False, 'message': 'Photo not found'}, status=404)

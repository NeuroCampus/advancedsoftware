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

# Set up logging
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
    enrolled_students = load_all_students()
    class_students = [s for s in enrolled_students if s['semester'] == semester and s['section'] == section]
    logger.info("Loaded %d students from pickle for semester %s, section %s", len(class_students), semester, section)
    
    if not class_students:
        logger.warning("No students loaded from pickle; falling back to database")
        db_students = Student.objects.filter(semester=semester, section=section)
        class_students = [{'name': s.name, 'usn': s.usn, 'semester': s.semester, 'section': s.section, 'encodings': []} for s in db_students]
        logger.info("Loaded %d students from database for semester %s, section %s", len(class_students), semester, section)
    
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

    # Check if required fields are present (relaxed for updates)
    if not usn:
        logger.error("Missing required field: usn")
        return Response({'success': False, 'message': 'USN is required'}, status=400)
    if not photos:
        logger.error("No photos provided")
        return Response({'success': False, 'message': 'At least one photo is required'}, status=400)

    try:
        # Check if student exists before processing
        existing_student = Student.objects.filter(usn=usn).first()
        is_update = bool(existing_student)  # True if updating, False if enrolling

        if existing_student:
            # Update existing student
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
            # Create new student
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

        # Process photos for face encodings
        photo_dir = os.path.join(settings.STUDENT_DATA_PATH, usn)
        os.makedirs(photo_dir, exist_ok=True)
        encodings = []
        for idx, photo in enumerate(photos):
            photo_path = os.path.join(photo_dir, f"photo_{idx}_{datetime.now().strftime('%Y%m%d%H%M%S')}.jpg")
            with open(photo_path, 'wb') as f:
                f.write(photo.read())
            logger.debug("Saved photo %s for student %s", photo_path, usn)
            
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

        # Load existing student data from pickle, if any
        all_students = load_all_students()
        student_data = next((s for s in all_students if s['usn'] == usn), None)
        if student_data:
            # Append new encodings to existing ones
            student_data['encodings'].extend(encodings)
            logger.info("Appended %d new encodings to existing student %s", len(encodings), usn)
        else:
            # Create new student data
            student_data = {
                'name': student.name,
                'usn': usn,
                'semester': student.semester,
                'section': student.section,
                'encodings': encodings
            }
            logger.info("Created new student data for %s with %d encodings", usn, len(encodings))

        # Rewrite the pickle file with updated data
        updated_students = [s for s in all_students if s['usn'] != usn] + [student_data]
        with open(settings.PICKLE_FILE, 'wb') as f:
            for s in updated_students:
                pickle.dump(s, f)

        # Construct message based on whether it was an update or enrollment
        message = f"Student {student.name} ({usn}) {'updated' if is_update else 'enrolled'} successfully."
        if not is_update:  # Only include password for new enrollments
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
        
        # Parse all sessions from the attendance file
        attendance_records = parse_attendance(record.file_path)
        if not attendance_records:
            logger.warning("No valid attendance data in file %s", record.file_path)
            return Response({'success': False, 'message': 'No valid attendance data in file'}, status=404)
        
        # Calculate statistics
        stats = calculate_statistics(attendance_records)
        total_sessions = len(attendance_records)
        
        # Generate PDF
        pdf_filename = f"attendance_report_{record.semester}_{record.subject}_{record.section}_{record.date.strftime('%Y%m%d')}.pdf"
        pdf_path = os.path.join(settings.MEDIA_ROOT, pdf_filename)
        os.makedirs(os.path.dirname(pdf_path), exist_ok=True)
        generate_pdf(stats, pdf_path, record)
        
        # Prepare detailed response
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
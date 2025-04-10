from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.http import FileResponse
from ..permissions import IsTeacher, IsTeacherOrHOD
from .utils import face_detector, shape_predictor, face_recognizer, load_all_students, is_same_person, get_google_sheet_id, update_attendance_in_sheet, parse_attendance, calculate_statistics, generate_pdf
from ..models import AttendanceRecord, AttendanceDetail, Student, User, LeaveRequest, StudentLeaveRequest, FacultyAssignment
import os
import cv2
import numpy as np
from datetime import datetime
from django.conf import settings
import logging
from django.contrib.auth.hashers import make_password
import pickle
import glob
from django.utils import timezone
import pandas as pd

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([IsTeacher])
def take_attendance(request) -> Response:
    logger.info("Received take_attendance request")
    if face_detector is None or shape_predictor is None or face_recognizer is None:
        return Response({'success': False, 'message': 'Face recognition models not loaded'}, status=500)
    
    token = request.headers.get('Authorization', '').replace('Bearer ', '').strip()
    if not token:
        return Response({'success': False, 'message': 'Authentication token required'}, status=401)
    
    branch_id = request.data.get('branch')
    subject = request.data.get('subject')
    section = request.data.get('section')
    semester = request.data.get('semester')
    files = request.FILES.getlist('class_images')
    if not all([branch_id, subject, section, semester, files]):
        return Response({'success': False, 'message': 'Missing required fields'}, status=400)
    
    try:
        branch = Branch.objects.get(id=branch_id)
    except Branch.DoesNotExist:
        return Response({'success': False, 'message': 'Branch not found'}, status=404)
    
    faculty = request.user
    faculty_name = faculty.get_full_name() or faculty.username

    try:
        sheet_id = get_google_sheet_id(subject, section, semester)
    except Exception as e:
        logger.warning("Exception while fetching Google Sheet ID: %s", str(e))
        sheet_id = None
    
    try:
        attendance_record = AttendanceRecord.objects.create(
            branch=branch,
            semester=semester,
            section=section,
            subject=subject,
            sheet_id=sheet_id,
            faculty=faculty,
            status='completed'
        )
    except Exception as e:
        return Response({'success': False, 'message': f'Error creating attendance record: {str(e)}'}, status=500)
    
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    attendance_file = f"attendance_{branch.name}_{semester}_{subject}_{section}.txt"
    file_path = os.path.join(settings.STUDENT_DATA_PATH, attendance_file)
    attendance_record.file_path = file_path
    attendance_record.save()
    
    present_students = set()
    db_students = Student.objects.filter(branch=branch, semester=semester, section=section)
    class_students = [{'name': s.name, 'usn': s.usn, 'semester': s.semester, 'section': s.section, 'encodings': []} for s in db_students]
    
    enrolled_students = load_all_students()
    for student in class_students:
        pickle_student = next((s for s in enrolled_students if s['usn'] == student['usn']), None)
        if pickle_student and pickle_student['encodings']:
            student['encodings'] = pickle_student['encodings']
    
    for file in files:
        try:
            img_bytes = file.read()
            nparr = np.frombuffer(img_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if img is None or img.size == 0:
                return Response({'success': False, 'message': 'Invalid image file'}, status=400)
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
            return Response({'success': False, 'message': f'Error processing class image: {str(e)}'}, status=500)
    
    all_class_students = [(s['name'], s['usn']) for s in class_students]
    absent_students = [(name, usn) for name, usn in all_class_students if (name, usn) not in present_students]
    
    if sheet_id:
        try:
            update_attendance_in_sheet(sheet_id, list(present_students), absent_students, timestamp)
        except Exception as e:
            logger.warning("Error updating Google Sheet: %s", str(e))
    
    try:
        with open(file_path, 'a') as report:
            report.write(f"\n--- Attendance Session: {timestamp} ---\n")
            report.write(f"Faculty: {faculty_name}\n")
            report.write("Present Students: " + ", ".join([name for name, _ in present_students]) + "\n")
            report.write("Absent Students: " + ", ".join([name for name, _ in absent_students]) + "\n")
    except Exception as e:
        return Response({'success': False, 'message': f'Error writing to attendance file: {str(e)}'}, status=500)
    
    try:
        for name, usn in present_students:
            student = Student.objects.get(usn=usn)
            AttendanceDetail.objects.create(record=attendance_record, student=student, status=True)
        for name, usn in absent_students:
            student = Student.objects.get(usn=usn)
            AttendanceDetail.objects.create(record=attendance_record, student=student, status=False)
    except Exception as e:
        return Response({'success': False, 'message': f'Error saving attendance details: {str(e)}'}, status=500)
    
    sheet_url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/edit?usp=sharing" if sheet_id else None
    return Response({
        'success': True,
        'message': f"Attendance taken for {branch.name}, {semester} {subject} ({section})",
        'present_students': [f"{name} ({usn})" for name, usn in present_students],
        'absent_students': [f"{name} ({usn})" for name, usn in absent_students],
        'faculty_name': faculty_name,
        'sheet_url': sheet_url
    })

@api_view(['POST'])
@permission_classes([IsTeacher])
def enroll(request) -> Response:
    logger.info("Received enroll request")
    name = request.data.get('name')
    usn = request.data.get('usn')
    branch_id = request.data.get('branch')
    semester = request.data.get('semester')
    section = request.data.get('section')
    email = request.data.get('email')
    proctor_id = request.data.get('proctor')
    photos = request.FILES.getlist('photos')
    photos_to_delete = request.data.get('photos_to_delete', [])
    
    if not all([usn, branch_id]):
        return Response({'success': False, 'message': 'USN and branch are required'}, status=400)
    
    try:
        branch = Branch.objects.get(id=branch_id)
    except Branch.DoesNotExist:
        return Response({'success': False, 'message': 'Branch not found'}, status=404)
    
    proctor = User.objects.get(id=proctor_id, role='teacher') if proctor_id else None
    
    try:
        existing_student = Student.objects.filter(usn=usn).first()
        is_update = bool(existing_student)
        if existing_student:
            student = existing_student
            if name and name != student.name:
                student.name = name
            if branch != student.branch:
                student.branch = branch
            if semester and semester != student.semester:
                student.semester = semester
            if section and section != student.section:
                student.section = section
            if proctor and proctor != student.proctor:
                student.proctor = proctor
            if email and email != student.user.email:
                if User.objects.filter(email=email).exclude(id=student.user.id).exists():
                    return Response({'success': False, 'message': 'Email already in use'}, status=400)
                student.user.email = email
                student.user.save()
            student.save()
        else:
            if not all([name, semester, section, email]):
                return Response({'success': False, 'message': 'All fields required for new student'}, status=400)
            if User.objects.filter(email=email).exists():
                return Response({'success': False, 'message': 'Email already in use'}, status=400)
            user = User.objects.create(
                username=usn,
                email=email,
                password=make_password("default123"),
                role='student'
            )
            student = Student.objects.create(
                name=name,
                usn=usn,
                branch=branch,
                semester=semester,
                section=section,
                user=user,
                proctor=proctor
            )
        
        photo_dir = os.path.join(settings.STUDENT_DATA_PATH, usn)
        os.makedirs(photo_dir, exist_ok=True)
        
        if photos_to_delete:
            for photo_filename in photos_to_delete:
                photo_path = os.path.join(photo_dir, photo_filename)
                if os.path.exists(photo_path):
                    os.remove(photo_path)
        
        encodings = []
        if photos:
            for idx, photo in enumerate(photos):
                photo_filename = f"photo_{idx}_{datetime.now().strftime('%Y%m%d%H%M%S')}.jpg"
                photo_path = os.path.join(photo_dir, photo_filename)
                with open(photo_path, 'wb') as f:
                    f.write(photo.read())
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
        
        all_students = load_all_students()
        student_data = next((s for s in all_students if s['usn'] == usn), None)
        if student_data:
            student_data['encodings'] = encodings
            student_data.update({'name': student.name, 'semester': student.semester, 'section': student.section, 'branch': student.branch.name})
        else:
            student_data = {
                'name': student.name,
                'usn': usn,
                'branch': student.branch.name,
                'semester': student.semester,
                'section': student.section,
                'encodings': encodings
            }
            all_students.append(student_data)
        
        with open(settings.PICKLE_FILE, 'wb') as f:
            for s in all_students:
                pickle.dump(s, f)
        
        return Response({
            'success': True,
            'message': f"Student {student.name} ({usn}) {'updated' if is_update else 'enrolled'} successfully",
            'email': email
        }, status=200 if is_update else 201)
    except Exception as e:
        return Response({'success': False, 'message': f'Error processing request: {str(e)}'}, status=500)

@api_view(['POST'])
@permission_classes([IsTeacher])
def bulk_enroll(request) -> Response:
    excel_file = request.FILES.get('excel_file')
    if not excel_file or not excel_file.name.endswith(('.xls', '.xlsx')):
        return Response({'success': False, 'message': 'Valid Excel file required'}, status=400)
    
    try:
        df = pd.read_excel(excel_file)
        df.columns = df.columns.str.strip().str.upper()
        required_columns = ['NAME', 'USN', 'BRANCH', 'SEMESTER', 'SECTION', 'MAIL ID', 'PROCTOR_USERNAME']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            return Response({'success': False, 'message': f'Missing columns: {", ".join(missing_columns)}'}, status=400)
        
        enrolled_students = []
        updated_students = []
        warnings = []
        all_students = load_all_students()
        
        for index, row in df.iterrows():
            name = str(row['NAME']).strip()
            usn = str(row['USN']).strip()
            branch_name = str(row['BRANCH']).strip()
            semester = str(row['SEMESTER']).strip()
            section = str(row['SECTION']).strip()
            email = str(row['MAIL ID']).strip()
            proctor_username = str(row['PROCTOR_USERNAME']).strip()
            
            if not all([name, usn, branch_name, semester, section, email]):
                warnings.append(f"Row {index + 2}: Missing data")
                continue
            
            try:
                branch, _ = Branch.objects.get_or_create(name=branch_name)
                proctor = User.objects.filter(username=proctor_username, role='teacher').first() if proctor_username else None
                
                existing_student = Student.objects.filter(usn=usn).first()
                if existing_student:
                    student = existing_student
                    if name != student.name:
                        student.name = name
                    if branch != student.branch:
                        student.branch = branch
                    if semester != student.semester:
                        student.semester = semester
                    if section != student.section:
                        student.section = section
                    if proctor and proctor != student.proctor:
                        student.proctor = proctor
                    if email != student.user.email:
                        if User.objects.filter(email=email).exclude(id=student.user.id).exists():
                            warnings.append(f"Row {index + 2}: Email in use")
                            continue
                        student.user.email = email
                        student.user.save()
                    student.save()
                    updated_students.append({'name': name, 'usn': usn})
                else:
                    if User.objects.filter(email=email).exists():
                        warnings.append(f"Row {index + 2}: Email in use")
                        continue
                    user = User.objects.create_user(
                        username=usn,
                        email=email,
                        password="default123",
                        role='student'
                    )
                    student = Student.objects.create(
                        name=name,
                        usn=usn,
                        branch=branch,
                        semester=semester,
                        section=section,
                        user=user,
                        proctor=proctor
                    )
                    enrolled_students.append({'name': name, 'usn': usn})
                
                student_data = next((s for s in all_students if s['usn'] == usn), None)
                if student_data:
                    student_data.update({'name': name, 'branch': branch.name, 'semester': semester, 'section': section})
                else:
                    all_students.append({'name': name, 'usn': usn, 'branch': branch.name, 'semester': semester, 'section': section, 'encodings': []})
            
            except Exception as e:
                warnings.append(f"Row {index + 2}: Error - {str(e)}")
        
        with open(settings.PICKLE_FILE, 'wb') as f:
            for s in all_students:
                pickle.dump(s, f)
        
        response_data = {
            'success': True,
            'message': f"Enrolled {len(enrolled_students)} new students, updated {len(updated_students)}. Default password: 'default123'",
            'enrolled_students': enrolled_students,
            'updated_students': updated_students,
            'warnings': warnings
        }
        return Response(response_data, status=201)
    except Exception as e:
        return Response({'success': False, 'message': f'Error: {str(e)}'}, status=500)

@api_view(['POST'])
@permission_classes([IsTeacherOrHOD])
def generate_statistics(request) -> Response:
    file_id = request.data.get('file_id')
    if not file_id:
        return Response({'success': False, 'message': 'Missing file ID'}, status=400)
    try:
        record = AttendanceRecord.objects.get(id=file_id)
        if not record.file_path or not os.path.exists(record.file_path):
            return Response({'success': False, 'message': 'Attendance file not found'}, status=404)
        attendance_records = parse_attendance(record.file_path)
        stats = calculate_statistics(attendance_records)
        total_sessions = len(attendance_records)
        pdf_filename = f"attendance_report_{record.branch.name}_{record.semester}_{record.subject}_{record.section}_{record.date.strftime('%Y%m%d')}.pdf"
        pdf_path = os.path.join(settings.MEDIA_ROOT, pdf_filename)
        os.makedirs(os.path.dirname(pdf_path), exist_ok=True)
        generate_pdf(stats, pdf_path, record)
        detailed_stats = {
            student: {'percentage': round(p, 2), 'present': c, 'absent': total_sessions - c}
            for student, (c, p) in stats.items()
        }
        above_75 = [{'student': s, **data} for s, data in detailed_stats.items() if data['percentage'] >= 75]
        below_75 = [{'student': s, **data} for s, data in detailed_stats.items() if data['percentage'] < 75]
        above_75.sort(key=lambda x: x['percentage'], reverse=True)
        below_75.sort(key=lambda x: x['percentage'], reverse=True)
        return Response({
            'success': True,
            'total_sessions': total_sessions,
            'above_75': above_75,
            'below_75': below_75,
            'pdf_url': f"/api/faculty/download-pdf/{pdf_filename}"
        })
    except AttendanceRecord.DoesNotExist:
        return Response({'success': False, 'message': 'Attendance record not found'}, status=404)
    except Exception as e:
        return Response({'success': False, 'message': f'Error: {str(e)}'}, status=500)

@api_view(['GET'])
@permission_classes([IsTeacherOrHOD])
def download_pdf(request, filename: str) -> FileResponse:
    file_path = os.path.join(settings.MEDIA_ROOT, filename)
    if os.path.exists(file_path):
        return FileResponse(open(file_path, 'rb'), as_attachment=True, filename=os.path.basename(file_path))
    return Response({'success': False, 'message': 'File not found'}, status=404)

@api_view(['GET'])
@permission_classes([IsTeacherOrHOD])
def get_students(request) -> Response:
    branch_id = request.query_params.get('branch')
    semester = request.query_params.get('semester')
    section = request.query_params.get('section')
    if not all([branch_id, semester, section]):
        return Response({'success': False, 'message': 'Branch, semester, and section required'}, status=400)
    try:
        branch = Branch.objects.get(id=branch_id)
        students = Student.objects.filter(branch=branch, semester=semester, section=section)
        student_list = [{'usn': s.usn, 'name': s.name, 'email': s.user.email, 'proctor': s.proctor.username if s.proctor else None} for s in students]
        return Response({'success': True, 'students': student_list})
    except Branch.DoesNotExist:
        return Response({'success': False, 'message': 'Branch not found'}, status=404)
    except Exception as e:
        return Response({'success': False, 'message': f'Error: {str(e)}'}, status=500)

@api_view(['POST'])
@permission_classes([IsTeacher])
def submit_leave_request(request) -> Response:
    token = request.headers.get('Authorization', '').replace('Bearer ', '').strip()
    if not token:
        return Response({'success': False, 'message': 'Authentication token required'}, status=401)
    
    branch_ids = request.data.get('branches', [])  # List of branch IDs
    start_date = request.data.get('start_date')
    end_date = request.data.get('end_date')
    reason = request.data.get('reason')
    
    if not all([branch_ids, start_date, end_date, reason]):
        return Response({'success': False, 'message': 'Branches, dates, and reason required'}, status=400)
    
    try:
        start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        if start_date > end_date:
            return Response({'success': False, 'message': 'Start date must be before end date'}, status=400)
        
        faculty = request.user
        leave_requests = []
        for branch_id in branch_ids:
            branch = Branch.objects.get(id=branch_id)
            if not FacultyAssignment.objects.filter(faculty=faculty, branch=branch).exists():
                continue  # Skip if faculty not assigned to this branch
            leave_request = LeaveRequest.objects.create(
                faculty=faculty,
                branch=branch,
                start_date=start_date,
                end_date=end_date,
                reason=reason
            )
            leave_requests.append({
                'leave_id': str(leave_request.id),
                'branch': branch.name,
                'status': leave_request.status
            })
        
        if not leave_requests:
            return Response({'success': False, 'message': 'No valid branches for leave request'}, status=400)
        
        return Response({
            'success': True,
            'message': 'Leave requests submitted successfully',
            'leave_requests': leave_requests
        }, status=201)
    except Branch.DoesNotExist:
        return Response({'success': False, 'message': 'One or more branches not found'}, status=404)
    except Exception as e:
        return Response({'success': False, 'message': f'Error: {str(e)}'}, status=500)

@api_view(['GET'])
@permission_classes([IsTeacher])
def get_leave_requests(request) -> Response:
    try:
        faculty = request.user
        leave_requests = LeaveRequest.objects.filter(faculty=faculty).select_related('branch', 'reviewed_by')
        requests_data = [
            {
                'id': str(lr.id),
                'branch': lr.branch.name,
                'start_date': lr.start_date.strftime('%Y-%m-%d'),
                'end_date': lr.end_date.strftime('%Y-%m-%d'),
                'reason': lr.reason,
                'status': lr.status,
                'submitted_at': lr.submitted_at.strftime('%Y-%m-%d %H:%M:%S'),
                'reviewed_at': lr.reviewed_at.strftime('%Y-%m-%d %H:%M:%S') if lr.reviewed_at else None,
                'reviewed_by': lr.reviewed_by.username if lr.reviewed_by else None
            }
            for lr in leave_requests
        ]
        return Response({
            'success': True,
            'message': 'Leave requests retrieved successfully' if requests_data else 'No leave requests found',
            'leave_requests': requests_data
        })
    except Exception as e:
        return Response({'success': False, 'message': f'Error: {str(e)}'}, status=500)

@api_view(['GET'])
@permission_classes([IsTeacher])
def get_student_leave_requests(request) -> Response:
    try:
        user = request.user
        if user.role != 'teacher':
            return Response({'success': False, 'message': 'Only faculty can access this'}, status=403)
        
        leave_requests = StudentLeaveRequest.objects.filter(student__student_profile__proctor=user, status='PENDING').select_related('student')
        leave_data = [
            {
                'id': str(lr.id),
                'student': lr.student.username,
                'student_name': Student.objects.get(user=lr.student).name,
                'branch': Student.objects.get(user=lr.student).branch.name,
                'start_date': lr.start_date.strftime('%Y-%m-%d'),
                'end_date': lr.end_date.strftime('%Y-%m-%d'),
                'reason': lr.reason,
                'submitted_at': lr.submitted_at.strftime('%Y-%m-%d %H:%M:%S'),
            }
            for lr in leave_requests
        ]
        return Response({
            'success': True,
            'message': 'Student leave requests retrieved successfully' if leave_data else 'No pending requests',
            'leave_requests': leave_data
        })
    except Exception as e:
        return Response({'success': False, 'message': f'Error: {str(e)}'}, status=500)

@api_view(['POST'])
@permission_classes([IsTeacher])
def manage_student_leave_request(request) -> Response:
    leave_id = request.data.get('leave_id')
    action = request.data.get('action')
    if not all([leave_id, action]) or action not in ['APPROVE', 'REJECT']:
        return Response({'success': False, 'message': 'Leave ID and valid action required'}, status=400)
    
    try:
        user = request.user
        if user.role != 'teacher':
            return Response({'success': False, 'message': 'Only faculty can manage this'}, status=403)
        
        leave_request = StudentLeaveRequest.objects.get(id=leave_id, status='PENDING', student__student_profile__proctor=user)
        leave_request.status = 'APPROVED' if action == 'APPROVE' else 'REJECTED'
        leave_request.reviewed_at = timezone.now()
        leave_request.reviewed_by = user
        leave_request.save()
        return Response({
            'success': True,
            'message': f'Student leave request {action.lower()}d successfully'
        })
    except StudentLeaveRequest.DoesNotExist:
        return Response({'success': False, 'message': 'Leave request not found or not assigned to you'}, status=404)
    except Exception as e:
        return Response({'success': False, 'message': f'Error: {str(e)}'}, status=500)

@api_view(['GET'])
@permission_classes([IsTeacher])
def get_faculty_assignments(request) -> Response:
    try:
        faculty = request.user
        assignments = FacultyAssignment.objects.filter(faculty=faculty)
        assignment_data = [
            {
                'branch': a.branch.name,
                'semester': a.semester,
                'section': a.section,
                'subject': a.subject
            }
            for a in assignments
        ]
        return Response({
            'success': True,
            'message': 'Assignments retrieved successfully' if assignment_data else 'No assignments found',
            'assignments': assignment_data
        })
    except Exception as e:
        return Response({'success': False, 'message': f'Error: {str(e)}'}, status=500)
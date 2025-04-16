from django.http import FileResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from ..permissions import IsTeacher
from ..models import (
    User, Student, Subject, Semester, Section, LeaveRequest, StudentLeaveRequest,
    FacultyAssignment, Branch, Timetable, InternalMark, Announcement, ChatChannel,
    ChatMessage, Notification
)
import logging
from django.utils import timezone
from django.db.models import Avg, Count ,  Q
from datetime import datetime, timedelta
import pandas as pd
import os
import cv2
import numpy as np
from django.core.files.storage import default_storage
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator
from .utils import get_google_sheet_id, update_attendance_in_sheet, compute_face_distance, is_same_person , validate_image_size

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([IsTeacher])
def dashboard_overview(request):
    try:
        faculty = request.user
        today = timezone.now().date()
        assignments = FacultyAssignment.objects.filter(faculty=faculty).select_related('branch', 'semester', 'section', 'subject')
        
        # Today's classes
        classes = Timetable.objects.filter(
            faculty_assignment__faculty=faculty,
            day=timezone.now().strftime('%a').upper()[:3]
        ).select_related('faculty_assignment__subject', 'faculty_assignment__section')
        classes_data = [
            {
                'subject': t.faculty_assignment.subject.name,
                'section': t.faculty_assignment.section.name,
                'start_time': t.start_time.strftime('%H:%M'),
                'end_time': t.end_time.strftime('%H:%M'),
                'room': t.room
            } for t in classes
        ]
        
        # Attendance snapshot
        attendance_avg = AttendanceDetail.objects.filter(
            record__assignment__faculty=faculty,
            record__date__gte=today - timedelta(days=30)
        ).aggregate(avg=Avg('status'))['avg'] or 0
        attendance_avg = round(attendance_avg * 100, 2)
        
        logger.info("Dashboard overview retrieved for %s", faculty.username)
        return Response({
            'success': True,
            'data': {
                'today_classes': classes_data,
                'attendance_snapshot': attendance_avg,
                'quick_actions': ['take_attendance', 'upload_marks', 'apply_leave']
            }
        }, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error("Error in dashboard overview: %s", str(e))
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsTeacher])
def take_attendance(request):
    branch_id = request.data.get('branch_id')
    subject_id = request.data.get('subject_id')
    section_id = request.data.get('section_id')
    semester_id = request.data.get('semester_id')
    method = request.data.get('method')  # 'manual' or 'ai'
    files = request.FILES.getlist('class_images') if method == 'ai' else []
    manual_attendance = request.data.get('attendance', [])  # List of {'student_id': id, 'status': bool}
    
    if not all([branch_id, subject_id, section_id, semester_id, method]):
        return Response({
            'success': False,
            'message': 'All fields required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        branch = Branch.objects.get(id=branch_id)
        semester = Semester.objects.get(id=semester_id)
        section = Section.objects.get(id=section_id)
        subject = Subject.objects.get(id=subject_id)
        if semester.branch != branch or section.branch != branch or subject.branch != branch:
            return Response({
                'success': False,
                'message': 'Invalid branch relationships'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        faculty = request.user
        if not FacultyAssignment.objects.filter(
            faculty=faculty,
            branch=branch,
            semester=semester,
            section=section,
            subject=subject
        ).exists():
            return Response({
                'success': False,
                'message': 'Not assigned to this class'
            }, status=status.HTTP_403_FORBIDDEN)
        
        attendance_record = AttendanceRecord.objects.create(
            branch=branch,
            semester=semester,
            section=section,
            subject=subject,
            faculty=faculty,
            assignment=FacultyAssignment.objects.get(
                faculty=faculty, branch=branch, semester=semester, section=section, subject=subject
            ),
            status='completed',
            date=timezone.now()
        )
        
        students = Student.objects.filter(branch=branch, semester=semester, section=section)
        present_students = set()
        absent_students = set()
        
        if method == 'ai':
            if not files:
                return Response({
                    'success': False,
                    'message': 'Images required for AI attendance'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            for file in files:
                img_bytes = file.read()
                nparr = np.frombuffer(img_bytes, np.uint8)
                img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                
                try:
                    # Detect faces using DLib
                    from .utils import face_detector, shape_predictor, face_recognizer
                    if not face_detector:
                        raise ValueError("Face recognition models not initialized")
                    
                    faces = face_detector(gray)
                    if not faces:
                        continue
                        
                    for face in faces:
                        shape = shape_predictor(img, face)
                        face_encoding = np.array(face_recognizer.compute_face_descriptor(img, shape))
                        
                        # Match against student encodings
                        for student in students:
                            student_encodings = student.get_face_encodings()
                            if student_encodings and is_same_person(student_encodings, face_encoding, threshold=0.4):
                                present_students.add(student.id)
                except Exception as e:
                    logger.warning("AI face recognition failed for image: %s", str(e))
                    continue
            
            # Mark attendance
            for student in students:
                status = student.id in present_students
                AttendanceDetail.objects.create(
                    record=attendance_record,
                    student=student,
                    status=status
                )
                if status:
                    present_students.add((student.name, student.usn))
                else:
                    absent_students.add((student.name, student.usn))
                    
        else:  # Manual method
            if not manual_attendance:
                return Response({
                    'success': False,
                    'message': 'Attendance data required for manual method'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            valid_student_ids = set(students.values_list('id', flat=True))
            for entry in manual_attendance:
                student_id = entry.get('student_id')
                status_val = entry.get('status')
                if student_id not in valid_student_ids:
                    continue
                student = students.get(id=student_id)
                if student:
                    AttendanceDetail.objects.create(
                        record=attendance_record,
                        student=student,
                        status=status_val
                    )
                    if status_val:
                        present_students.add((student.name, student.usn))
                    else:
                        absent_students.add((student.name, student.usn))
        
        # Google Sheets integration
        sheet_id = get_google_sheet_id(branch.name, subject.name, section.name, semester.number)
        if sheet_id:
            update_attendance_in_sheet(
                sheet_id,
                [(name, usn) for name, usn in present_students if isinstance(name, str)],
                [(name, usn) for name, usn in absent_students if isinstance(name, str)],
                timezone.now().strftime('%Y-%m-%d %H:%M:%S')
            )
        
        # Notify students
        Notification.objects.create(
            title="Attendance Recorded",
            message=f"Attendance taken for {subject.name} ({section.name}) by {faculty.username}",
            target_role='student',
            created_by=faculty
        )
        
        return Response({
            'success': True,
            'message': 'Attendance recorded successfully'
        }, status=status.HTTP_200_OK)
    
    except Branch.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Branch not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Semester.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Semester not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Section.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Section not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Subject.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Subject not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except FacultyAssignment.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Not assigned to this class'
        }, status=status.HTTP_403_FORBIDDEN)
    except Exception as e:
        logger.error("Error taking attendance: %s", str(e))
        return Response({
            'success': False,
            'message': 'Failed to record attendance. Try manual method.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsTeacher])
def upload_internal_marks(request):
    branch_id = request.data.get('branch_id')
    semester_id = request.data.get('semester_id')
    section_id = request.data.get('section_id')
    subject_id = request.data.get('subject_id')
    test_number = request.data.get('test_number')
    marks = request.data.get('marks', [])  # [{'student_id': id, 'mark': value}]
    file = request.FILES.get('file')  # Optional Excel file
    
    if not all([branch_id, semester_id, section_id, subject_id, test_number]):
        return Response({
            'success': False,
            'message': 'All fields required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        branch = Branch.objects.get(id=branch_id)
        semester = Semester.objects.get(id=semester_id)
        section = Section.objects.get(id=section_id)
        subject = Subject.objects.get(id=subject_id)
        test_number = int(test_number)
        if semester.branch != branch or section.branch != branch or subject.branch != branch:
            return Response({
                'success': False,
                'message': 'Invalid relationships'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        faculty = request.user
        if not FacultyAssignment.objects.filter(
            faculty=faculty, branch=branch, semester=semester, section=section, subject=subject
        ).exists():
            return Response({
                'success': False,
                'message': 'Not assigned to this class'
            }, status=status.HTTP_403_FORBIDDEN)
        
        students = Student.objects.filter(branch=branch, semester=semester, section=section)
        if file:
            df = pd.read_excel(file) if file.name.endswith('.xlsx') else pd.read_csv(file)
            for _, row in df.iterrows():
                student = students.filter(usn=row['usn']).first()
                if student and 'mark' in row:
                    InternalMark.objects.update_or_create(
                        student=student,
                        subject=subject,
                        test_number=test_number,
                        defaults={'mark': int(row['mark']), 'faculty': faculty}
                    )
        else:
            for mark_data in marks:
                student = students.filter(id=mark_data.get('student_id')).first()
                if student and 'mark' in mark_data:
                    InternalMark.objects.update_or_create(
                        student=student,
                        subject=subject,
                        test_number=test_number,
                        defaults={'mark': int(mark_data['mark']), 'faculty': faculty}
                    )
        
        Notification.objects.create(
            title="Marks Uploaded",
            message=f"Internal marks for {subject.name} (Test {test_number}) uploaded",
            target_role='student',
            created_by=faculty
        )
        
        return Response({
            'success': True,
            'message': 'Marks uploaded'
        }, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error("Error uploading marks: %s", str(e))
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsTeacher])
def apply_leave(request):
    branch_ids = request.data.get('branch_ids', [])
    start_date = request.data.get('start_date')
    end_date = request.data.get('end_date')
    reason = request.data.get('reason')
    
    if not all([branch_ids, start_date, end_date, reason]):
        return Response({
            'success': False,
            'message': 'All fields required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        if start_date > end_date:
            return Response({
                'success': False,
                'message': 'Invalid date range'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        faculty = request.user
        leave_requests = []
        for branch_id in branch_ids:
            branch = Branch.objects.get(id=branch_id)
            if FacultyAssignment.objects.filter(faculty=faculty, branch=branch).exists():
                lr = LeaveRequest.objects.create(
                    faculty=faculty,
                    branch=branch,
                    start_date=start_date,
                    end_date=end_date,
                    reason=reason
                )
                leave_requests.append({'id': str(lr.id), 'branch': branch.name})
                Notification.objects.create(
                    title="New Leave Request",
                    message=f"{faculty.username} requested leave from {start_date} to {end_date}",
                    target_role='hod',
                    created_by=faculty
                )
        
        if not leave_requests:
            return Response({
                'success': False,
                'message': 'No valid branches'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            'success': True,
            'message': 'Leave request submitted',
            'data': leave_requests
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        logger.error("Error applying leave: %s", str(e))
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsTeacher])
def view_attendance_records(request):
    branch_id = request.query_params.get('branch_id')
    semester_id = request.query_params.get('semester_id')
    section_id = request.query_params.get('section_id')
    subject_id = request.query_params.get('subject_id')
    
    if not all([branch_id, semester_id, section_id, subject_id]):
        return Response({
            'success': False,
            'message': 'All parameters required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        branch = Branch.objects.get(id=branch_id)
        semester = Semester.objects.get(id=semester_id)
        section = Section.objects.get(id=section_id)
        subject = Subject.objects.get(id=subject_id)
        
        faculty = request.user
        if not FacultyAssignment.objects.filter(
            faculty=faculty, branch=branch, semester=semester, section=section, subject=subject
        ).exists():
            return Response({
                'success': False,
                'message': 'Not assigned to this class'
            }, status=status.HTTP_403_FORBIDDEN)
        
        records = AttendanceRecord.objects.filter(
            branch=branch, semester=semester, section=section, subject=subject, faculty=faculty
        ).select_related('section', 'subject')
        stats = AttendanceDetail.objects.filter(
            record__in=records
        ).values('student__name', 'student__usn').annotate(
            total=Count('id'),
            present=Count('id', filter=Q(status=True)),
            percentage=Avg('status') * 100
        )
        
        return Response({
            'success': True,
            'data': [
                {
                    'student': s['student__name'],
                    'usn': s['student__usn'],
                    'total_sessions': s['total'],
                    'present': s['present'],
                    'percentage': round(s['percentage'], 2)
                } for s in stats
            ]
        }, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error("Error viewing attendance: %s", str(e))
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsTeacher])
def create_announcement(request):
    branch_id = request.data.get('branch_id')
    semester_id = request.data.get('semester_id')
    section_id = request.data.get('section_id')
    title = request.data.get('title')
    content = request.data.get('content')
    target = request.data.get('target', 'student')  # student, faculty, both
    
    if not all([branch_id, semester_id, section_id, title, content]):
        return Response({
            'success': False,
            'message': 'All fields required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        branch = Branch.objects.get(id=branch_id)
        semester = Semester.objects.get(id=semester_id)
        section = Section.objects.get(id=section_id)
        faculty = request.user
        if not FacultyAssignment.objects.filter(
            faculty=faculty, branch=branch, semester=semester, section=section
        ).exists():
            return Response({
                'success': False,
                'message': 'Not assigned to this class'
            }, status=status.HTTP_403_FORBIDDEN)
        
        announcement = Announcement.objects.create(
            branch=branch,
            title=title,
            content=content,
            target=target,
            created_by=faculty
        )
        
        Notification.objects.create(
            title="New Announcement",
            message=f"{title}: {content[:50]}...",
            target_role=target if target != 'both' else 'all',
            created_by=faculty
        )
        
        return Response({
            'success': True,
            'message': 'Announcement created'
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        logger.error("Error creating announcement: %s", str(e))
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsTeacher])
def get_proctor_students(request):
    try:
        faculty = request.user
        students = Student.objects.filter(proctor=faculty).select_related('branch', 'semester', 'section')
        student_data = []
        for s in students:
            attendance = AttendanceDetail.objects.filter(
                student=s,
                record__date__gte=timezone.now().date() - timedelta(days=30)
            ).aggregate(avg=Avg('status'))['avg'] or 0
            leave = StudentLeaveRequest.objects.filter(
                student=s, status='PENDING'
            ).order_by('-submitted_at').first()
            student_data.append({
                'name': s.name,
                'usn': s.usn,
                'attendance': round(attendance * 100, 2),
                'latest_request': {
                    'id': str(leave.id),
                    'start_date': leave.start_date.strftime('%Y-%m-%d'),
                    'reason': leave.reason
                } if leave else None
            })
        
        return Response({
            'success': True,
            'data': student_data
        }, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error("Error getting proctor students: %s", str(e))
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsTeacher])
def manage_student_leave(request):
    leave_id = request.data.get('leave_id')
    action = request.data.get('action')
    
    if not all([leave_id, action]) or action not in ['APPROVE', 'REJECT']:
        return Response({
            'success': False,
            'message': 'Valid leave ID and action required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        leave = StudentLeaveRequest.objects.get(id=leave_id, student__proctor=request.user)
        leave.status = action
        leave.reviewed_at = timezone.now()
        leave.reviewed_by = request.user
        leave.save()
        
        Notification.objects.create(
            title=f"Leave {action}d",
            message=f"Your leave request has been {action.lower()}d",
            target_role='student',
            created_by=request.user
        )
        
        return Response({
            'success': True,
            'message': f'Leave {action.lower()}d'
        }, status=status.HTTP_200_OK)
    except StudentLeaveRequest.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Leave not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error("Error managing leave: %s", str(e))
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsTeacher])
def get_timetable(request):
    try:
        faculty = request.user
        timetable = Timetable.objects.filter(faculty_assignment__faculty=faculty).select_related(
            'faculty_assignment__subject', 'faculty_assignment__section', 'faculty_assignment__semester'
        )
        data = [
            {
                'day': t.day,
                'start_time': t.start_time.strftime('%H:%M'),
                'end_time': t.end_time.strftime('%H:%M'),
                'subject': t.faculty_assignment.subject.name,
                'section': t.faculty_assignment.section.name,
                'semester': t.faculty_assignment.semester.number,
                'room': t.room
            } for t in timetable
        ]
        
        return Response({
            'success': True,
            'data': data
        }, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error("Error getting timetable: %s", str(e))
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET', 'POST'])
@permission_classes([IsTeacher])
def manage_chat(request):
    if request.method == 'GET':
        try:
            faculty = request.user
            channels = ChatChannel.objects.filter(
                Q(faculty=faculty) | Q(students=faculty)
            ).select_related('subject', 'section')
            data = [
                {
                    'id': str(c.id),
                    'type': c.channel_type,
                    'subject': c.subject.name if c.subject else None,
                    'section': c.section.name if c.section else None,
                    'participants': [u.username for u in c.students.all()]
                } for c in channels
            ]
            
            return Response({
                'success': True,
                'data': data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error("Error getting chats: %s", str(e))
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    else:
        channel_id = request.data.get('channel_id')
        message = request.data.get('message')
        channel_type = request.data.get('type')  # subject, proctor, faculty
        branch_id = request.data.get('branch_id') if channel_type == 'subject' else None
        semester_id = request.data.get('semester_id') if channel_type == 'subject' else None
        subject_id = request.data.get('subject_id') if channel_type == 'subject' else None
        section_id = request.data.get('section_id') if channel_type == 'subject' else None
        
        if not message:
            return Response({
                'success': False,
                'message': 'Message content required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            faculty = request.user
            if channel_id:
                channel = ChatChannel.objects.get(id=channel_id)
                ChatMessage.objects.create(
                    channel=channel,
                    sender=faculty,
                    content=message
                )
            else:
                if channel_type == 'proctor':
                    channel = ChatChannel.objects.create(
                        channel_type='proctor',
                        faculty=faculty
                    )
                    students = Student.objects.filter(proctor=faculty)
                    if not students.exists():
                        return Response({
                            'success': False,
                            'message': 'No students assigned to this proctor'
                        }, status=status.HTTP_400_BAD_REQUEST)
                    channel.students.add(*[s.user for s in students])
                elif channel_type == 'subject':
                    if not all([branch_id, semester_id, subject_id, section_id]):
                        return Response({
                            'success': False,
                            'message': 'Branch, semester, subject, and section IDs required'
                        }, status=status.HTTP_400_BAD_REQUEST)
                    branch = Branch.objects.get(id=branch_id)
                    semester = Semester.objects.get(id=semester_id)
                    subject = Subject.objects.get(id=subject_id)
                    section = Section.objects.get(id=section_id)
                    if section.branch != branch or semester.branch != branch or subject.branch != branch:
                        return Response({
                            'success': False,
                            'message': 'Invalid branch relationships'
                        }, status=status.HTTP_400_BAD_REQUEST)
                    channel = ChatChannel.objects.create(
                        channel_type='subject',
                        subject=subject,
                        section=section,
                        semester=semester,
                        branch=branch,
                        faculty=faculty
                    )
                    students = Student.objects.filter(branch=branch, semester=semester, section=section)
                    if not students.exists():
                        return Response({
                            'success': False,
                            'message': 'No students found for this subject and section'
                        }, status=status.HTTP_400_BAD_REQUEST)
                    channel.students.add(*[s.user for s in students])
                elif channel_type == 'faculty':
                    channel = ChatChannel.objects.create(
                        channel_type='faculty',
                        faculty=faculty
                    )
                    hod = Branch.objects.filter(facultyassignment__faculty=faculty).first()
                    if hod and hod.hod:
                        channel.students.add(hod.hod)
                    else:
                        return Response({
                            'success': False,
                            'message': 'No HOD assigned to this faculty'
                        }, status=status.HTTP_400_BAD_REQUEST)
                else:
                    return Response({
                        'success': False,
                        'message': 'Invalid channel type'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                ChatMessage.objects.create(
                    channel=channel,
                    sender=faculty,
                    content=message
                )
            
            Notification.objects.create(
                title="New Chat Message",
                message=f"New message in {channel_type} channel",
                target_role='student' if channel_type in ['proctor', 'subject'] else 'hod',
                created_by=faculty
            )
            
            return Response({
                'success': True,
                'message': 'Message sent'
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error("Error managing chat: %s", str(e))
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET', 'POST'])
@permission_classes([IsTeacher])
def manage_profile(request):
    faculty = request.user
    if request.method == 'GET':
        try:
            return Response({
                'success': True,
                'data': {
                    'username': faculty.username,
                    'email': faculty.email,
                    'first_name': faculty.first_name,
                    'last_name': faculty.last_name,
                    'profile_picture': faculty.profile_picture.url if faculty.profile_picture else None
                }
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error("Error getting profile: %s", str(e))
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    email = request.data.get('email')
    first_name = request.data.get('first_name')
    last_name = request.data.get('last_name')
    profile_picture = request.FILES.get('profile_picture')
    
    try:
        if not any([email, first_name, last_name, profile_picture]):
            return Response({
                'success': False,
                'message': 'At least one field required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if email and email != faculty.email:
            if User.objects.filter(email=email).exclude(id=faculty.id).exists():
                return Response({
                    'success': False,
                    'message': 'Email already in use'
                }, status=status.HTTP_400_BAD_REQUEST)
            faculty.email = email.strip()
        if first_name:
            faculty.first_name = first_name.strip()
        if last_name:
            faculty.last_name = last_name.strip()
        if profile_picture:
            try:
                FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png'])(profile_picture)
                validate_image_size(profile_picture)
                if faculty.profile_picture:
                    default_storage.delete(faculty.profile_picture.path)
                faculty.profile_picture = profile_picture
            except ValidationError as e:
                return Response({
                    'success': False,
                    'message': str(e)
                }, status=status.HTTP_400_BAD_REQUEST)
        
        faculty.save()
        
        GenericNotification.objects.create(
            title="Profile Updated",
            message="Your profile has been updated",
            target_role='teacher',
            created_by=faculty
        )
        
        return Response({
            'success': True,
            'data': {
                'username': faculty.username,
                'email': faculty.email,
                'first_name': faculty.first_name,
                'last_name': faculty.last_name,
                'profile_picture': faculty.profile_picture.url if faculty.profile_picture else None
            }
        }, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error("Error updating profile: %s", str(e))
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsTeacher])
def schedule_mentoring(request):
    student_id = request.data.get('student_id')
    date = request.data.get('date')
    purpose = request.data.get('purpose')
    
    if not all([student_id, date, purpose]):
        return Response({
            'success': False,
            'message': 'All fields required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        student = Student.objects.get(id=student_id, proctor=request.user)
        Notification.objects.create(
            title="Mentoring Session Scheduled",
            message=f"Session scheduled on {date} for {purpose}",
            target_role='student',
            created_by=request.user
        )
        
        return Response({
            'success': True,
            'message': 'Session scheduled'
        }, status=status.HTTP_201_CREATED)
    except Student.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Student not assigned to you'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error("Error scheduling mentoring: %s", str(e))
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsTeacher])
def generate_statistics(request):
    file_id = request.query_params.get('file_id')
    if not file_id:
        return Response({
            'success': False,
            'message': 'File ID required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        record = AttendanceRecord.objects.get(id=file_id, faculty=request.user)
        stats = AttendanceDetail.objects.filter(record=record).values('student__name').annotate(
            percentage=Avg('status') * 100
        )
        pdf_filename = f"stats_{record.subject.name}_{record.date.strftime('%Y%m%d')}.pdf"
        pdf_path = os.path.join(settings.MEDIA_ROOT, pdf_filename)
        generate_pdf({s['student__name']: (0, s['percentage']) for s in stats}, pdf_path, record)
        
        return Response({
            'success': True,
            'data': {
                'pdf_url': f"/api/faculty/download-pdf/{pdf_filename}",
                'stats': stats
            }
        }, status=status.HTTP_200_OK)
    except AttendanceRecord.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Record not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error("Error generating statistics: %s", str(e))
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsTeacher])
def download_pdf(request, filename):
    file_path = os.path.join(settings.MEDIA_ROOT, filename)
    if os.path.exists(file_path):
        return FileResponse(open(file_path, 'rb'), as_attachment=True, filename=filename)
    return Response({
        'success': False,
        'message': 'File not found'
    }, status=status.HTTP_404_NOT_FOUND)
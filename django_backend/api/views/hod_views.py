from django.http import FileResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from ..permissions import IsHOD, IsTeacherOrHOD
from ..models import (
    AttendanceRecord, LeaveRequest, Student, FacultyAssignment, Branch, User,
    Timetable, InternalMark, Announcement, AttendanceDetail, Notification,
    Semester, Section, Subject, ChatChannel, ChatMessage, GenericNotification
)
import os
from django.conf import settings
import logging
from django.utils import timezone
from django.db.models import Count, Q
from rest_framework import status
from django.db import IntegrityError
from datetime import timedelta
from django.utils.timezone import now

logger = logging.getLogger(__name__)

def create_notification(recipient=None, message=None):
    """Create an in-app notification for a user."""
    try:
        notification = Notification.objects.create(
            student=recipient.student_profile if recipient.role == 'student' else None,
            title="System Update",
            message=message,
            created_at=timezone.now()
        )
        logger.info("Created notification for %s: %s", recipient.username, message)
        return notification
    except Exception as e:
        logger.error("Failed to create notification: %s", str(e))
        return None

@api_view(['GET'])
@permission_classes([IsHOD])
def dashboard_stats(request):
    """Get HOD dashboard statistics."""
    try:
        hod = request.user
        branch = Branch.objects.get(hod=hod)
        faculty_count = User.objects.filter(role='teacher', teaching_assignments__branch=branch).distinct().count()
        student_count = Student.objects.filter(branch=branch).count()
        pending_leaves = LeaveRequest.objects.filter(branch=branch, status='PENDING').count()
        attendance_stats = AttendanceDetail.objects.filter(record__branch=branch).aggregate(
            total=Count('id'), present=Count('id', filter=Q(status=True))
        )
        avg_attendance = round((attendance_stats['present'] / attendance_stats['total']) * 100, 2) if attendance_stats['total'] > 0 else 0
        trend = []
        today = now().date()
        for weeks_ago in range(4):
            start_date = today - timedelta(days=(weeks_ago + 1) * 7)
            end_date = today - timedelta(days=weeks_ago * 7)
            weekly_stats = AttendanceDetail.objects.filter(
                record__branch=branch, record__date__range=[start_date, end_date]
            ).aggregate(total=Count('id'), present=Count('id', filter=Q(status=True)))
            percentage = round((weekly_stats['present'] / weekly_stats['total']) * 100, 2) if weekly_stats['total'] > 0 else 0
            trend.append({
                'week': f"Week {4 - weeks_ago}",
                'start_date': start_date.strftime('%Y-%m-%d'),
                'end_date': end_date.strftime('%Y-%m-%d'),
                'attendance_percentage': percentage
            })
        trend.reverse()
        return Response({
            'success': True,
            'data': {
                'faculty_count': faculty_count,
                'student_count': student_count,
                'pending_leaves': pending_leaves,
                'average_attendance': avg_attendance,
                'attendance_trend': trend
            }
        })
    except Branch.DoesNotExist:
        return Response({'success': False, 'message': 'Branch not assigned'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error("Error in dashboard_stats: %s", str(e))
        return Response({'success': False, 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsHOD])
def low_attendance_students(request):
    """List students with low attendance."""
    threshold = float(request.query_params.get('threshold', 75))
    try:
        hod = request.user
        branch = Branch.objects.get(hod=hod)
        students = Student.objects.filter(branch=branch).select_related('user')
        low_attendance = []
        for student in students:
            details = student.attendance_details.filter(record__branch=branch)
            total = details.count()
            present = details.filter(status=True).count()
            percentage = round((present / total) * 100, 2) if total > 0 else 0
            if percentage < threshold:
                low_attendance.append({
                    'student_id': str(student.user.id),
                    'name': student.name,
                    'usn': student.usn,
                    'attendance_percentage': percentage,
                    'total_sessions': total,
                    'present_sessions': present
                })
        return Response({
            'success': True,
            'data': {'students': low_attendance}
        })
    except Branch.DoesNotExist:
        return Response({'success': False, 'message': 'Branch not assigned'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error("Error in low_attendance_students: %s", str(e))
        return Response({'success': False, 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsHOD])
def manage_semesters(request):
    """Create or update semesters."""
    action = request.data.get('action')  # 'create', 'update'
    semester_id = request.data.get('semester_id')
    number = request.data.get('number')
    try:
        hod = request.user
        branch = Branch.objects.get(hod=hod)
        if action == 'create':
            if not number:
                return Response({'success': False, 'message': 'Number required'}, status=status.HTTP_400_BAD_REQUEST)
            number = int(number)
            if not 1 <= number <= 8:
                return Response({'success': False, 'message': 'Number must be 1-8'}, status=status.HTTP_400_BAD_REQUEST)
            semester, created = Semester.objects.get_or_create(branch=branch, number=number)
            if not created:
                return Response({'success': False, 'message': 'Semester exists'}, status=status.HTTP_400_BAD_REQUEST)
            return Response({
                'success': True,
                'data': {'semester_id': str(semester.id)}
            }, status=status.HTTP_201_CREATED)
        elif action == 'update':
            if not all([semester_id, number]):
                return Response({'success': False, 'message': 'Semester ID and number required'}, status=status.HTTP_400_BAD_REQUEST)
            semester = Semester.objects.get(id=semester_id, branch=branch)
            number = int(number)
            if not 1 <= number <= 8:
                return Response({'success': False, 'message': 'Number must be 1-8'}, status=status.HTTP_400_BAD_REQUEST)
            semester.number = number
            semester.save()
            return Response({
                'success': True,
                'data': {'semester_id': str(semester.id)}
            })
        return Response({'success': False, 'message': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)
    except Branch.DoesNotExist:
        return Response({'success': False, 'message': 'Branch not assigned'}, status=status.HTTP_404_NOT_FOUND)
    except Semester.DoesNotExist:
        return Response({'success': False, 'message': 'Semester not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error("Error in manage_semesters: %s", str(e))
        return Response({'success': False, 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsHOD])
def manage_sections(request):
    """Create or update sections."""
    action = request.data.get('action')  # 'create', 'update'
    section_id = request.data.get('section_id')
    semester_id = request.data.get('semester_id')
    name = request.data.get('name')
    try:
        hod = request.user
        branch = Branch.objects.get(hod=hod)
        if action == 'create':
            if not all([semester_id, name]):
                return Response({'success': False, 'message': 'Semester ID and name required'}, status=status.HTTP_400_BAD_REQUEST)
            semester = Semester.objects.get(id=semester_id, branch=branch)
            name = name.strip().upper()
            if name not in 'ABCDEFG':
                return Response({'success': False, 'message': 'Name must be A-G'}, status=status.HTTP_400_BAD_REQUEST)
            section, created = Section.objects.get_or_create(branch=branch, semester=semester, name=name)
            if not created:
                return Response({'success': False, 'message': 'Section exists'}, status=status.HTTP_400_BAD_REQUEST)
            return Response({
                'success': True,
                'data': {'section_id': str(section.id)}
            }, status=status.HTTP_201_CREATED)
        elif action == 'update':
            if not all([section_id, name]):
                return Response({'success': False, 'message': 'Section ID and name required'}, status=status.HTTP_400_BAD_REQUEST)
            section = Section.objects.get(id=section_id, branch=branch)
            name = name.strip().upper()
            if name not in 'ABCDEFG':
                return Response({'success': False, 'message': 'Name must be A-G'}, status=status.HTTP_400_BAD_REQUEST)
            section.name = name
            section.save()
            return Response({
                'success': True,
                'data': {'section_id': str(section.id)}
            })
        return Response({'success': False, 'message': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)
    except Branch.DoesNotExist:
        return Response({'success': False, 'message': 'Branch not assigned'}, status=status.HTTP_404_NOT_FOUND)
    except Semester.DoesNotExist:
        return Response({'success': False, 'message': 'Semester not found'}, status=status.HTTP_404_NOT_FOUND)
    except Section.DoesNotExist:
        return Response({'success': False, 'message': 'Section not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error("Error in manage_sections: %s", str(e))
        return Response({'success': False, 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsHOD])
def manage_students(request):
    """Manage student enrollment with auto-generated credentials."""
    action = request.data.get('action')  # 'create', 'update', 'delete', 'bulk_update'
    student_id = request.data.get('student_id')
    usn = request.data.get('usn')
    name = request.data.get('name')
    email = request.data.get('email')
    semester_id = request.data.get('semester_id')
    section_id = request.data.get('section_id')
    bulk_data = request.data.get('bulk_data', [])  # List of {usn, name, email}
    try:
        hod = request.user
        branch = Branch.objects.get(hod=hod)
        if action == 'create':
            if not all([usn, name, email, semester_id, section_id]):
                return Response({'success': False, 'message': 'All fields required'}, status=status.HTTP_400_BAD_REQUEST)
            usn = usn.strip()
            name = name.strip()
            email = email.strip()
            semester = Semester.objects.get(id=semester_id, branch=branch)
            section = Section.objects.get(id=section_id, branch=branch, semester=semester)
            if User.objects.filter(username=usn).exists():
                return Response({'success': False, 'message': 'USN exists'}, status=status.HTTP_400_BAD_REQUEST)
            user = User.objects.create(
                username=usn, email=email, role='student',
                first_name=name.split()[0], last_name=' '.join(name.split()[1:]) if len(name.split()) > 1 else ''
            )
            user.set_password('default@123')
            user.save()
            student = Student.objects.create(
                user=user, name=name, usn=usn, branch=branch, semester=semester, section=section
            )
            create_notification(
                recipient=user,
                message=f"Account created. Username: {usn}, Password: default@123. Please change your password after login."
            )
            return Response({
                'success': True,
                'data': {'student_id': str(student.user.id)}
            }, status=status.HTTP_201_CREATED)
        elif action == 'update':
            if not all([student_id, semester_id, section_id]):
                return Response({'success': False, 'message': 'Student ID, semester, section required'}, status=status.HTTP_400_BAD_REQUEST)
            student = Student.objects.get(user__id=student_id, branch=branch)
            semester = Semester.objects.get(id=semester_id, branch=branch)
            section = Section.objects.get(id=section_id, branch=branch, semester=semester)
            if usn:
                usn = usn.strip()
                if usn != student.usn and User.objects.filter(username=usn).exists():
                    return Response({'success': False, 'message': 'USN exists'}, status=status.HTTP_400_BAD_REQUEST)
                student.usn = usn
                student.user.username = usn
            if name:
                student.name = name.strip()
                student.user.first_name = name.split()[0]
                student.user.last_name = ' '.join(name.split()[1:]) if len(name.split()) > 1 else ''
            if email:
                student.user.email = email.strip()
            student.semester = semester
            student.section = section
            student.user.save()
            student.save()
            create_notification(
                recipient=student.user,
                message=f"Your profile updated by HOD {hod.username}."
            )
            return Response({
                'success': True,
                'data': {'student_id': str(student.user.id)}
            })
        elif action == 'delete':
            if not student_id:
                return Response({'success': False, 'message': 'Student ID required'}, status=status.HTTP_400_BAD_REQUEST)
            student = Student.objects.get(user__id=student_id, branch=branch)
            student.user.delete()
            return Response({'success': True, 'data': {}})
        elif action == 'bulk_update':
            if not all([semester_id, section_id]):
                return Response({'success': False, 'message': 'Semester and section required'}, status=status.HTTP_400_BAD_REQUEST)
            semester = Semester.objects.get(id=semester_id, branch=branch)
            section = Section.objects.get(id=section_id, branch=branch, semester=semester)
            created_count = 0
            for data in bulk_data:
                usn = data.get('usn')
                name = data.get('name')
                email = data.get('email')
                if not all([usn, name, email]):
                    continue
                if User.objects.filter(username=usn).exists():
                    continue
                user = User.objects.create(
                    username=usn, email=email, role='student',
                    first_name=name.split()[0], last_name=' '.join(name.split()[1:]) if len(name.split()) > 1 else ''
                )
                user.set_password('default@123')
                user.save()
                student = Student.objects.create(
                    user=user, name=name, usn=usn, branch=branch, semester=semester, section=section
                )
                create_notification(
                    recipient=user,
                    message=f"Account created. Username: {usn}, Password: default@123. Please change your password after login."
                )
                created_count += 1
            return Response({
                'success': True,
                'data': {'created_count': created_count}
            })
        return Response({'success': False, 'message': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)
    except Branch.DoesNotExist:
        return Response({'success': False, 'message': 'Branch not assigned'}, status=status.HTTP_404_NOT_FOUND)
    except (Semester.DoesNotExist, Section.DoesNotExist, Student.DoesNotExist, User.DoesNotExist):
        return Response({'success': False, 'message': 'Invalid reference'}, status=status.HTTP_404_NOT_FOUND)
    except IntegrityError:
        return Response({'success': False, 'message': 'Database error'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error("Error in manage_students: %s", str(e))
        return Response({'success': False, 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsHOD])
def manage_subjects(request):
    """Create or update subjects."""
    action = request.data.get('action')  # 'create', 'update'
    subject_id = request.data.get('subject_id')
    name = request.data.get('name')
    semester_id = request.data.get('semester_id')
    try:
        hod = request.user
        branch = Branch.objects.get(hod=hod)
        if action == 'create':
            if not all([name, semester_id]):
                return Response({'success': False, 'message': 'Name and semester required'}, status=status.HTTP_400_BAD_REQUEST)
            semester = Semester.objects.get(id=semester_id, branch=branch)
            subject, created = Subject.objects.get_or_create(branch=branch, semester=semester, name=name.strip())
            if not created:
                return Response({'success': False, 'message': 'Subject exists'}, status=status.HTTP_400_BAD_REQUEST)
            return Response({
                'success': True,
                'data': {'subject_id': str(subject.id)}
            }, status=status.HTTP_201_CREATED)
        elif action == 'update':
            if not all([subject_id, name]):
                return Response({'success': False, 'message': 'Subject ID and name required'}, status=status.HTTP_400_BAD_REQUEST)
            subject = Subject.objects.get(id=subject_id, branch=branch)
            subject.name = name.strip()
            if semester_id:
                subject.semester = Semester.objects.get(id=semester_id, branch=branch)
            subject.save()
            return Response({
                'success': True,
                'data': {'subject_id': str(subject.id)}
            })
        return Response({'success': False, 'message': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)
    except Branch.DoesNotExist:
        return Response({'success': False, 'message': 'Branch not assigned'}, status=status.HTTP_404_NOT_FOUND)
    except Semester.DoesNotExist:
        return Response({'success': False, 'message': 'Semester not found'}, status=status.HTTP_404_NOT_FOUND)
    except Subject.DoesNotExist:
        return Response({'success': False, 'message': 'Subject not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error("Error in manage_subjects: %s", str(e))
        return Response({'success': False, 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET', 'POST'])
@permission_classes([IsHOD])
def manage_faculty_assignments(request):
    """Manage faculty assignments."""
    if request.method == 'GET':
        try:
            hod = request.user
            branch = Branch.objects.get(hod=hod)
            assignments = FacultyAssignment.objects.filter(branch=branch).select_related('faculty', 'subject', 'semester', 'section')
            data = [{
                'id': str(a.id),
                'faculty': a.faculty.username,
                'subject': a.subject.name,
                'semester': a.semester.number,
                'section': a.section.name
            } for a in assignments]
            return Response({'success': True, 'data': {'assignments': data}})
        except Branch.DoesNotExist:
            return Response({'success': False, 'message': 'Branch not assigned'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error("Error in get_faculty_assignments: %s", str(e))
            return Response({'success': False, 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    action = request.data.get('action')  # 'create', 'update', 'delete'
    assignment_id = request.data.get('assignment_id')
    faculty_id = request.data.get('faculty_id')
    subject_id = request.data.get('subject_id')
    semester_id = request.data.get('semester_id')
    section_id = request.data.get('section_id')
    try:
        hod = request.user
        branch = Branch.objects.get(hod=hod)
        if action == 'create':
            if not all([faculty_id, subject_id, semester_id, section_id]):
                return Response({'success': False, 'message': 'All fields required'}, status=status.HTTP_400_BAD_REQUEST)
            faculty = User.objects.get(id=faculty_id, role='teacher')
            semester = Semester.objects.get(id=semester_id, branch=branch)
            section = Section.objects.get(id=section_id, branch=branch, semester=semester)
            subject = Subject.objects.get(id=subject_id, branch=branch, semester=semester)
            assignment, created = FacultyAssignment.objects.get_or_create(
                faculty=faculty, branch=branch, semester=semester, section=section, subject=subject
            )
            if not created:
                return Response({'success': False, 'message': 'Assignment exists'}, status=status.HTTP_400_BAD_REQUEST)
            create_notification(
                recipient=faculty,
                message=f"Assigned to {subject.name} (Sem {semester.number}, Sec {section.name})."
            )
            return Response({
                'success': True,
                'data': {'assignment_id': str(assignment.id)}
            }, status=status.HTTP_201_CREATED)
        elif action == 'update':
            if not all([assignment_id, faculty_id, subject_id, semester_id, section_id]):
                return Response({'success': False, 'message': 'All fields required'}, status=status.HTTP_400_BAD_REQUEST)
            assignment = FacultyAssignment.objects.get(id=assignment_id, branch=branch)
            faculty = User.objects.get(id=faculty_id, role='teacher')
            semester = Semester.objects.get(id=semester_id, branch=branch)
            section = Section.objects.get(id=section_id, branch=branch, semester=semester)
            subject = Subject.objects.get(id=subject_id, branch=branch, semester=semester)
            assignment.faculty = faculty
            assignment.semester = semester
            assignment.section = section
            assignment.subject = subject
            assignment.save()
            create_notification(
                recipient=faculty,
                message=f"Assignment updated to {subject.name} (Sem {semester.number}, Sec {section.name})."
            )
            return Response({
                'success': True,
                'data': {'assignment_id': str(assignment.id)}
            })
        elif action == 'delete':
            if not assignment_id:
                return Response({'success': False, 'message': 'Assignment ID required'}, status=status.HTTP_400_BAD_REQUEST)
            assignment = FacultyAssignment.objects.get(id=assignment_id, branch=branch)
            faculty = assignment.faculty
            subject = assignment.subject
            semester = assignment.semester
            section = assignment.section
            assignment.delete()
            create_notification(
                recipient=faculty,
                message=f"Assignment for {subject.name} (Sem {semester.number}, Sec {section.name}) removed."
            )
            return Response({'success': True, 'data': {}})
        return Response({'success': False, 'message': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)
    except Branch.DoesNotExist:
        return Response({'success': False, 'message': 'Branch not assigned'}, status=status.HTTP_404_NOT_FOUND)
    except (User.DoesNotExist, Semester.DoesNotExist, Section.DoesNotExist, Subject.DoesNotExist, FacultyAssignment.DoesNotExist):
        return Response({'success': False, 'message': 'Invalid reference'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error("Error in manage_faculty_assignments: %s", str(e))
        return Response({'success': False, 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsHOD])
def manage_timetable(request):
    """Manage timetable with conflict detection."""
    action = request.data.get('action')  # 'create', 'update', 'delete'
    timetable_id = request.data.get('timetable_id')
    assignment_id = request.data.get('assignment_id')
    day = request.data.get('day')
    start_time = request.data.get('start_time')
    end_time = request.data.get('end_time')
    room = request.data.get('room', '')
    try:
        hod = request.user
        branch = Branch.objects.get(hod=hod)
        if action in ['create', 'update']:
            if not all([assignment_id, day, start_time, end_time]):
                return Response({'success': False, 'message': 'All fields required'}, status=status.HTTP_400_BAD_REQUEST)
            assignment = FacultyAssignment.objects.get(id=assignment_id, branch=branch)
            start = timezone.datetime.strptime(start_time, '%H:%M').time()
            end = timezone.datetime.strptime(end_time, '%H:%M').time()
            day = day.strip().upper()
            if day not in [c[0] for c in Timetable.DAY_CHOICES]:
                return Response({'success': False, 'message': 'Invalid day'}, status=status.HTTP_400_BAD_REQUEST)
            if start >= end:
                return Response({'success': False, 'message': 'Start time must be before end time'}, status=status.HTTP_400_BAD_REQUEST)
            conflicts = Timetable.objects.filter(
                faculty_assignment__faculty=assignment.faculty, day=day
            ).exclude(id=timetable_id if action == 'update' else None)
            for entry in conflicts:
                if start < entry.end_time and end > entry.start_time:
                    return Response({
                        'success': False,
                        'message': f"Conflict for {assignment.faculty.username} on {day} from {entry.start_time} to {entry.end_time}"
                    }, status=status.HTTP_400_BAD_REQUEST)
            if action == 'create':
                timetable = Timetable.objects.create(
                    faculty_assignment=assignment, day=day, start_time=start, end_time=end, room=room.strip()
                )
                create_notification(
                    recipient=assignment.faculty,
                    message=f"Timetable added: {assignment.subject.name} on {day} from {start} to {end}."
                )
                return Response({
                    'success': True,
                    'data': {'timetable_id': str(timetable.id)}
                }, status=status.HTTP_201_CREATED)
            elif action == 'update':
                timetable = Timetable.objects.get(id=timetable_id, faculty_assignment__branch=branch)
                timetable.day = day
                timetable.start_time = start
                timetable.end_time = end
                timetable.room = room.strip()
                timetable.save()
                create_notification(
                    recipient=assignment.faculty,
                    message=f"Timetable updated: {assignment.subject.name} on {day} from {start} to {end}."
                )
                return Response({
                    'success': True,
                    'data': {'timetable_id': str(timetable.id)}
                })
        elif action == 'delete':
            if not timetable_id:
                return Response({'success': False, 'message': 'Timetable ID required'}, status=status.HTTP_400_BAD_REQUEST)
            timetable = Timetable.objects.get(id=timetable_id, faculty_assignment__branch=branch)
            faculty = timetable.faculty_assignment.faculty
            subject = timetable.faculty_assignment.subject
            timetable.delete()
            create_notification(
                recipient=faculty,
                message=f"Timetable for {subject.name} on {timetable.day} removed."
            )
            return Response({'success': True, 'data': {}})
        return Response({'success': False, 'message': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)
    except Branch.DoesNotExist:
        return Response({'success': False, 'message': 'Branch not assigned'}, status=status.HTTP_404_NOT_FOUND)
    except (FacultyAssignment.DoesNotExist, Timetable.DoesNotExist):
        return Response({'success': False, 'message': 'Invalid reference'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error("Error in manage_timetable: %s", str(e))
        return Response({'success': False, 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET', 'POST'])
@permission_classes([IsHOD])
def manage_leaves(request):
    """Manage faculty and HOD leaves."""
    if request.method == 'GET':
        try:
            hod = request.user
            branch = Branch.objects.get(hod=hod)
            leaves = LeaveRequest.objects.filter(branch=branch, status='PENDING').select_related('faculty')
            data = [{
                'id': str(l.id),
                'faculty': l.faculty.username,
                'start_date': l.start_date.strftime('%Y-%m-%d'),
                'end_date': l.end_date.strftime('%Y-%m-%d'),
                'reason': l.reason
            } for l in leaves]
            return Response({'success': True, 'data': {'leaves': data}})
        except Branch.DoesNotExist:
            return Response({'success': False, 'message': 'Branch not assigned'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error("Error in get_leaves: %s", str(e))
            return Response({'success': False, 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    action = request.data.get('action')  # 'create', 'approve', 'reject'
    leave_id = request.data.get('leave_id')
    faculty_id = request.data.get('faculty_id')
    start_date = request.data.get('start_date')
    end_date = request.data.get('end_date')
    reason = request.data.get('reason')
    try:
        hod = request.user
        branch = Branch.objects.get(hod=hod)
        if action == 'create':
            if not all([faculty_id, start_date, end_date, reason]):
                return Response({'success': False, 'message': 'All fields required'}, status=status.HTTP_400_BAD_REQUEST)
            faculty = User.objects.get(id=faculty_id, role__in=['teacher', 'hod'])
            start = timezone.datetime.strptime(start_date, '%Y-%m-%d').date()
            end = timezone.datetime.strptime(end_date, '%Y-%m-%d').date()
            if start > end:
                return Response({'success': False, 'message': 'Invalid date range'}, status=status.HTTP_400_BAD_REQUEST)
            leave = LeaveRequest.objects.create(
                faculty=faculty, branch=branch, start_date=start, end_date=end, reason=reason.strip(), status='PENDING'
            )
            create_notification(
                recipient=faculty,
                message=f"Leave request submitted for {start} to {end} by HOD {hod.username}."
            )
            return Response({
                'success': True,
                'data': {'leave_id': str(leave.id)}
            }, status=status.HTTP_201_CREATED)
        elif action in ['approve', 'reject']:
            if not leave_id:
                return Response({'success': False, 'message': 'Leave ID required'}, status=status.HTTP_400_BAD_REQUEST)
            leave = LeaveRequest.objects.get(id=leave_id, branch=branch, status='PENDING')
            leave.status = 'APPROVED' if action == 'approve' else 'REJECTED'
            leave.reviewed_at = timezone.now()
            leave.reviewed_by = hod
            leave.save()
            create_notification(
                recipient=leave.faculty,
                message=f"Your leave request from {leave.start_date} to {leave.end_date} has been {leave.status.lower()}."
            )
            return Response({
                'success': True,
                'data': {'leave_id': str(leave.id), 'status': leave.status}
            })
        return Response({'success': False, 'message': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)
    except Branch.DoesNotExist:
        return Response({'success': False, 'message': 'Branch not assigned'}, status=status.HTTP_404_NOT_FOUND)
    except (User.DoesNotExist, LeaveRequest.DoesNotExist):
        return Response({'success': False, 'message': 'Invalid reference'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error("Error in manage_leaves: %s", str(e))
        return Response({'success': False, 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsHOD])
def get_attendance(request):
    """Retrieve attendance records."""
    semester_id = request.query_params.get('semester_id')
    section_id = request.query_params.get('section_id')
    subject_id = request.query_params.get('subject_id')
    try:
        hod = request.user
        branch = Branch.objects.get(hod=hod)
        records = AttendanceRecord.objects.filter(branch=branch)
        if semester_id:
            records = records.filter(semester__id=semester_id)
        if section_id:
            records = records.filter(section__id=section_id)
        if subject_id:
            records = records.filter(subject__id=subject_id)
        data = [{
            'id': str(r.id),
            'subject': r.subject.name,
            'semester': r.semester.number,
            'section': r.section.name,
            'date': r.date.strftime('%Y-%m-%d')
        } for r in records]
        return Response({'success': True, 'data': {'records': data}})
    except Branch.DoesNotExist:
        return Response({'success': False, 'message': 'Branch not assigned'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error("Error in get_attendance: %s", str(e))
        return Response({'success': False, 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsHOD])
def get_marks(request):
    """Retrieve internal marks."""
    semester_id = request.query_params.get('semester_id')
    section_id = request.query_params.get('section_id')
    subject_id = request.query_params.get('subject_id')
    try:
        hod = request.user
        branch = Branch.objects.get(hod=hod)
        marks = InternalMark.objects.filter(student__branch=branch)
        if semester_id:
            marks = marks.filter(student__semester__id=semester_id)
        if section_id:
            marks = marks.filter(student__section__id=section_id)
        if subject_id:
            marks = marks.filter(subject__id=subject_id)
        data = [{
            'student_id': str(m.student.user.id),
            'student': m.student.name,
            'usn': m.student.usn,
            'subject': m.subject.name,
            'test_number': m.test_number,
            'mark': m.mark,
            'max_mark': m.max_mark
        } for m in marks]
        return Response({'success': True, 'data': {'marks': data}})
    except Branch.DoesNotExist:
        return Response({'success': False, 'message': 'Branch not assigned'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error("Error in get_marks: %s", str(e))
        return Response({'success': False, 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsHOD])
def create_announcement(request):
    """Create branch-specific announcements."""
    title = request.data.get('title')
    content = request.data.get('content')
    target = request.data.get('target')  # 'faculty', 'students', 'both'
    try:
        if not all([title, content, target]) or target not in ['faculty', 'students', 'both']:
            return Response({'success': False, 'message': 'Invalid parameters'}, status=status.HTTP_400_BAD_REQUEST)
        hod = request.user
        branch = Branch.objects.get(hod=hod)
        announcement = Announcement.objects.create(
            title=title.strip(), content=content.strip(), branch=branch, target=target, created_by=hod
        )
        if target == 'faculty':
            recipients = User.objects.filter(role='teacher', teaching_assignments__branch=branch).distinct()
        elif target == 'students':
            recipients = Student.objects.filter(branch=branch).values_list('user', flat=True)
        else:
            recipients = list(User.objects.filter(role='teacher', teaching_assignments__branch=branch).distinct().values_list('id', flat=True))
            recipients.extend(Student.objects.filter(branch=branch).values_list('user', flat=True))
        for user_id in recipients:
            user = User.objects.get(id=user_id)
            create_notification(
                recipient=user,
                message=f"New announcement: {title} - {content}"
            )
        return Response({
            'success': True,
            'data': {'announcement_id': str(announcement.id)}
        }, status=status.HTTP_201_CREATED)
    except Branch.DoesNotExist:
        return Response({'success': False, 'message': 'Branch not assigned'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error("Error in create_announcement: %s", str(e))
        return Response({'success': False, 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsHOD])
def send_notification(request):
    """Send role-based notifications."""
    title = request.data.get('title')
    message = request.data.get('message')
    target_role = request.data.get('target_role')  # 'student', 'teacher', 'all'
    try:
        if not all([title, message, target_role]) or target_role not in ['student', 'teacher', 'all']:
            return Response({'success': False, 'message': 'Invalid parameters'}, status=status.HTTP_400_BAD_REQUEST)
        hod = request.user
        branch = Branch.objects.get(hod=hod)
        notification = GenericNotification.objects.create(
            title=title.strip(), message=message.strip(), target_role=target_role, created_by=hod
        )
        if target_role == 'student':
            recipients = Student.objects.filter(branch=branch).values_list('user', flat=True)
        elif target_role == 'teacher':
            recipients = User.objects.filter(role='teacher', teaching_assignments__branch=branch).distinct()
        else:
            recipients = list(User.objects.filter(role='teacher', teaching_assignments__branch=branch).distinct().values_list('id', flat=True))
            recipients.extend(Student.objects.filter(branch=branch).values_list('user', flat=True))
        for user_id in recipients:
            user = User.objects.get(id=user_id)
            create_notification(
                recipient=user,
                message=f"Notification: {title} - {message}"
            )
        return Response({
            'success': True,
            'data': {'notification_id': str(notification.id)}
        }, status=status.HTTP_201_CREATED)
    except Branch.DoesNotExist:
        return Response({'success': False, 'message': 'Branch not assigned'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error("Error in send_notification: %s", str(e))
        return Response({'success': False, 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsHOD])
def assign_proctor(request):
    """Assign proctors to students."""
    student_id = request.data.get('student_id')
    faculty_id = request.data.get('faculty_id')
    try:
        if not all([student_id, faculty_id]):
            return Response({'success': False, 'message': 'Student and faculty IDs required'}, status=status.HTTP_400_BAD_REQUEST)
        hod = request.user
        branch = Branch.objects.get(hod=hod)
        student = Student.objects.get(user__id=student_id, branch=branch)
        faculty = User.objects.get(id=faculty_id, role='teacher')
        if not FacultyAssignment.objects.filter(faculty=faculty, branch=branch).exists():
            return Response({'success': False, 'message': 'Faculty not in branch'}, status=status.HTTP_400_BAD_REQUEST)
        student.proctor = faculty
        student.save()
        create_notification(
            recipient=faculty,
            message=f"Assigned as proctor for {student.name} (USN: {student.usn})."
        )
        create_notification(
            recipient=student.user,
            message=f"{faculty.username} assigned as your proctor."
        )
        return Response({
            'success': True,
            'data': {'student_id': str(student.user.id), 'faculty_id': str(faculty.id)}
        })
    except Branch.DoesNotExist:
        return Response({'success': False, 'message': 'Branch not assigned'}, status=status.HTTP_404_NOT_FOUND)
    except (Student.DoesNotExist, User.DoesNotExist):
        return Response({'success': False, 'message': 'Invalid reference'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error("Error in assign_proctor: %s", str(e))
        return Response({'success': False, 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET', 'POST'])
@permission_classes([IsHOD])
def manage_chat(request):
    """Manage in-app chat channels and messages."""
    if request.method == 'GET':
        try:
            hod = request.user
            branch = Branch.objects.get(hod=hod)
            channels = ChatChannel.objects.filter(branch=branch, participants=hod)
            data = [{
                'id': str(c.id),
                'name': c.name,
                'type': c.channel_type,
                'subject': c.subject.name if c.subject else None,
                'section': c.section.name if c.section else None,
                'last_message': c.messages.order_by('-sent_at').first().content if c.messages.exists() else None
            } for c in channels]
            return Response({'success': True, 'data': {'channels': data}})
        except Branch.DoesNotExist:
            return Response({'success': False, 'message': 'Branch not assigned'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error("Error in get_chat: %s", str(e))
            return Response({'success': False, 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    action = request.data.get('action')  # 'create_channel', 'send_message'
    channel_id = request.data.get('channel_id')
    name = request.data.get('name')
    channel_type = request.data.get('channel_type')
    subject_id = request.data.get('subject_id')
    section_id = request.data.get('section_id')
    participant_ids = request.data.get('participant_ids', [])
    content = request.data.get('content')
    try:
        hod = request.user
        branch = Branch.objects.get(hod=hod)
        if action == 'create_channel':
            if not all([name, channel_type]) or channel_type not in ['subject', 'section', 'private', 'faculty']:
                return Response({'success': False, 'message': 'Invalid parameters'}, status=status.HTTP_400_BAD_REQUEST)
            channel_data = {'branch': branch, 'name': name.strip(), 'channel_type': channel_type}
            if channel_type == 'subject':
                if not subject_id:
                    return Response({'success': False, 'message': 'Subject required'}, status=status.HTTP_400_BAD_REQUEST)
                channel_data['subject'] = Subject.objects.get(id=subject_id, branch=branch)
            elif channel_type == 'section':
                if not section_id:
                    return Response({'success': False, 'message': 'Section required'}, status=status.HTTP_400_BAD_REQUEST)
                channel_data['section'] = Section.objects.get(id=section_id, branch=branch)
            channel = ChatChannel.objects.create(**channel_data)
            participants = User.objects.filter(id__in=participant_ids, role__in=['teacher', 'student', 'hod'])
            channel.participants.add(hod, *participants)
            create_notification(
                recipient=hod,
                message=f"Chat channel '{name}' created."
            )
            return Response({
                'success': True,
                'data': {'channel_id': str(channel.id)}
            }, status=status.HTTP_201_CREATED)
        elif action == 'send_message':
            if not all([channel_id, content]):
                return Response({'success': False, 'message': 'Channel ID and content required'}, status=status.HTTP_400_BAD_REQUEST)
            channel = ChatChannel.objects.get(id=channel_id, branch=branch, participants=hod)
            message = ChatMessage.objects.create(channel=channel, sender=hod, content=content.strip())
            for participant in channel.participants.exclude(id=hod.id):
                create_notification(
                    recipient=participant,
                    message=f"New message in '{channel.name}': {content[:50]}..."
                )
            return Response({
                'success': True,
                'data': {'message_id': str(message.id)}
            }, status=status.HTTP_201_CREATED)
        return Response({'success': False, 'message': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)
    except Branch.DoesNotExist:
        return Response({'success': False, 'message': 'Branch not assigned'}, status=status.HTTP_404_NOT_FOUND)
    except (Subject.DoesNotExist, Section.DoesNotExist, ChatChannel.DoesNotExist):
        return Response({'success': False, 'message': 'Invalid reference'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error("Error in manage_chat: %s", str(e))
        return Response({'success': False, 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET', 'PATCH'])
@permission_classes([IsHOD])
def manage_profile(request):
    """Manage HOD profile."""
    hod = request.user
    if request.method == 'GET':
        try:
            data = {
                'username': hod.username,
                'email': hod.email,
                'first_name': hod.first_name,
                'last_name': hod.last_name
            }
            return Response({'success': True, 'data': data})
        except Exception as e:
            logger.error("Error in get_profile: %s", str(e))
            return Response({'success': False, 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    email = request.data.get('email')
    first_name = request.data.get('first_name')
    last_name = request.data.get('last_name')
    try:
        if not any([email, first_name, last_name]):
            return Response({'success': False, 'message': 'At least one field required'}, status=status.HTTP_400_BAD_REQUEST)
        if email:
            hod.email = email.strip()
        if first_name:
            hod.first_name = first_name.strip()
        if last_name:
            hod.last_name = last_name.strip()
        hod.save()
        create_notification(
            recipient=hod,
            message="Your profile has been updated."
        )
        return Response({
            'success': True,
            'data': {
                'username': hod.username,
                'email': hod.email,
                'first_name': hod.first_name,
                'last_name': hod.last_name
            }
        })
    except Exception as e:
        logger.error("Error in update_profile: %s", str(e))
        return Response({'success': False, 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
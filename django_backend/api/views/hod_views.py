from django.http import FileResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from ..permissions import IsHOD, IsTeacherOrHOD
from .utils import get_google_sheet_id, parse_attendance, calculate_statistics, generate_pdf
from ..models import AttendanceRecord, LeaveRequest, Student, FacultyAssignment, Branch, User
import os
from django.conf import settings
import logging
from django.utils import timezone

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([IsHOD])
def get_subjects(request) -> Response:
    try:
        hod = request.user
        branch = Branch.objects.get(hod=hod)
        subjects = AttendanceRecord.objects.filter(branch=branch).values_list('subject', flat=True).distinct()
        semesters = AttendanceRecord.objects.filter(branch=branch).values_list('semester', flat=True).distinct()
        sections = AttendanceRecord.objects.filter(branch=branch).values_list('section', flat=True).distinct()
        return Response({
            'success': True,
            'message': 'Data retrieved successfully' if subjects else 'No data found',
            'subjects': list(subjects),
            'semesters': list(semesters),
            'sections': list(sections),
            'branch': branch.name
        })
    except Branch.DoesNotExist:
        return Response({'success': False, 'message': 'Branch not assigned to HOD'}, status=404)
    except Exception as e:
        return Response({'success': False, 'message': f'Error: {str(e)}'}, status=500)

@api_view(['GET'])
@permission_classes([IsTeacherOrHOD])
def get_attendance_files(request) -> Response:
    semester = request.query_params.get('semester')
    section = request.query_params.get('section')
    subject = request.query_params.get('subject')
    if not all([semester, section, subject]):
        return Response({'success': False, 'message': 'Missing required parameters'}, status=400)
    try:
        hod = request.user
        branch = Branch.objects.get(hod=hod)
        record = AttendanceRecord.objects.filter(branch=branch, semester=semester, section=section, subject=subject).order_by('-date').first()
        if not record or not record.file_path or not os.path.exists(record.file_path):
            return Response({'success': False, 'message': f'No attendance file found'}, status=404)
        files = [{'id': str(record.id), 'name': f"Attendance - {subject} ({semester} {section})"}]
        return Response({'success': True, 'files': files})
    except Branch.DoesNotExist:
        return Response({'success': False, 'message': 'Branch not assigned to HOD'}, status=404)
    except Exception as e:
        return Response({'success': False, 'message': f'Error: {str(e)}'}, status=500)

@api_view(['POST'])
@permission_classes([IsTeacherOrHOD])
def generate_statistics(request) -> Response:
    file_id = request.data.get('file_id')
    if not file_id:
        return Response({'success': False, 'message': 'Missing file ID'}, status=400)
    try:
        hod = request.user
        branch = Branch.objects.get(hod=hod)
        record = AttendanceRecord.objects.get(id=file_id, branch=branch)
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
            'pdf_url': f"/api/hod/download-file/{pdf_filename}"
        })
    except (AttendanceRecord.DoesNotExist, Branch.DoesNotExist):
        return Response({'success': False, 'message': 'Record or branch not found'}, status=404)
    except Exception as e:
        return Response({'success': False, 'message': f'Error: {str(e)}'}, status=500)

@api_view(['GET'])
@permission_classes([IsHOD])
def download_file(request, filename: str) -> FileResponse:
    file_path = os.path.join(settings.MEDIA_ROOT, filename)
    if os.path.exists(file_path):
        return FileResponse(open(file_path, 'rb'), as_attachment=True, filename=os.path.basename(file_path))
    return Response({'success': False, 'message': 'File not found'}, status=404)

@api_view(['GET'])
@permission_classes([IsHOD])
def get_leave_requests(request) -> Response:
    try:
        hod = request.user
        branch = Branch.objects.get(hod=hod)
        leave_requests = LeaveRequest.objects.filter(branch=branch, status='PENDING').select_related('faculty')
        requests_data = [
            {
                'id': str(lr.id),
                'faculty': lr.faculty.username,
                'branch': lr.branch.name,
                'start_date': lr.start_date.strftime('%Y-%m-%d'),
                'end_date': lr.end_date.strftime('%Y-%m-%d'),
                'reason': lr.reason,
                'submitted_at': lr.submitted_at.strftime('%Y-%m-%d %H:%M:%S')
            }
            for lr in leave_requests
        ]
        return Response({
            'success': True,
            'message': 'Leave requests retrieved successfully' if requests_data else 'No pending requests',
            'leave_requests': requests_data
        })
    except Branch.DoesNotExist:
        return Response({'success': False, 'message': 'Branch not assigned to HOD'}, status=404)
    except Exception as e:
        return Response({'success': False, 'message': f'Error: {str(e)}'}, status=500)

@api_view(['POST'])
@permission_classes([IsHOD])
def manage_leave_request(request) -> Response:
    leave_id = request.data.get('leave_id')
    action = request.data.get('action')
    if not all([leave_id, action]) or action not in ['APPROVE', 'REJECT']:
        return Response({'success': False, 'message': 'Leave ID and valid action required'}, status=400)
    
    try:
        hod = request.user
        branch = Branch.objects.get(hod=hod)
        leave_request = LeaveRequest.objects.get(id=leave_id, branch=branch, status='PENDING')
        leave_request.status = 'APPROVED' if action == 'APPROVE' else 'REJECTED'
        leave_request.reviewed_at = timezone.now()
        leave_request.reviewed_by = hod
        leave_request.save()
        return Response({
            'success': True,
            'message': f'Leave request {action.lower()}d successfully',
            'leave_id': str(leave_request.id),
            'status': leave_request.status
        })
    except (LeaveRequest.DoesNotExist, Branch.DoesNotExist):
        return Response({'success': False, 'message': 'Leave request or branch not found'}, status=404)
    except Exception as e:
        return Response({'success': False, 'message': f'Error: {str(e)}'}, status=500)

@api_view(['POST'])
@permission_classes([IsHOD])
def assign_proctor(request) -> Response:
    student_id = request.data.get('student_id')
    proctor_id = request.data.get('proctor_id')
    if not all([student_id, proctor_id]):
        return Response({'success': False, 'message': 'Student ID and proctor ID required'}, status=400)
    
    try:
        hod = request.user
        branch = Branch.objects.get(hod=hod)
        student = Student.objects.get(user__id=student_id, branch=branch)
        proctor = User.objects.get(id=proctor_id, role='teacher')
        student.proctor = proctor
        student.save()
        return Response({
            'success': True,
            'message': f"Proctor {proctor.username} assigned to {student.name}"
        })
    except (Student.DoesNotExist, User.DoesNotExist, Branch.DoesNotExist):
        return Response({'success': False, 'message': 'Student, proctor, or branch not found'}, status=404)
    except Exception as e:
        return Response({'success': False, 'message': f'Error: {str(e)}'}, status=500)

@api_view(['POST'])
@permission_classes([IsHOD])
def assign_faculty(request) -> Response:
    faculty_id = request.data.get('faculty_id')
    branch_id = request.data.get('branch_id')
    semester = request.data.get('semester')
    section = request.data.get('section')
    subject = request.data.get('subject')
    if not all([faculty_id, branch_id, semester, section, subject]):
        return Response({'success': False, 'message': 'All fields required'}, status=400)
    
    try:
        hod = request.user
        branch = Branch.objects.get(id=branch_id, hod=hod)
        faculty = User.objects.get(id=faculty_id, role='teacher')
        assignment, created = FacultyAssignment.objects.get_or_create(
            faculty=faculty,
            branch=branch,
            semester=semester,
            section=section,
            subject=subject
        )
        action = 'created' if created else 'updated'
        return Response({
            'success': True,
            'message': f"Faculty assignment {action} for {faculty.username} in {branch.name}"
        })
    except (Branch.DoesNotExist, User.DoesNotExist):
        return Response({'success': False, 'message': 'Branch or faculty not found'}, status=404)
    except Exception as e:
        return Response({'success': False, 'message': f'Error: {str(e)}'}, status=500)

@api_view(['GET'])
@permission_classes([IsHOD])
def get_branches(request) -> Response:
    try:
        branches = Branch.objects.all()
        branch_data = [{'id': b.id, 'name': b.name, 'hod': b.hod.username if b.hod else None} for b in branches]
        return Response({
            'success': True,
            'branches': branch_data
        })
    except Exception as e:
        return Response({'success': False, 'message': f'Error: {str(e)}'}, status=500)
    
@api_view(['GET'])
@permission_classes([IsHOD])
def get_faculty(request) -> Response:
    try:
        hod = request.user
        branch = Branch.objects.get(hod=hod)
        faculty = User.objects.filter(role='teacher', teaching_assignments__branch=branch).distinct()
        faculty_data = [{'id': str(f.id), 'username': f.username} for f in faculty]
        return Response({'success': True, 'faculty': faculty_data})
    except Branch.DoesNotExist:
        return Response({'success': False, 'message': 'Branch not assigned to HOD'}, status=404)
    except Exception as e:
        return Response({'success': False, 'message': f'Error: {str(e)}'}, status=500)
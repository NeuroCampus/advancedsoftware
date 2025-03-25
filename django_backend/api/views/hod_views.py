from django.http import FileResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from ..permissions import IsHOD, IsTeacherOrHOD
from .utils import get_google_sheet_id, parse_attendance, calculate_statistics, generate_pdf
from ..models import AttendanceRecord, LeaveRequest
import os
from django.conf import settings
import logging
from django.utils import timezone  # For timezone-aware datetime

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([IsHOD])
def get_subjects(request) -> Response:
    """Fetch unique subjects, semesters, and sections for HOD dashboard."""
    token = request.headers.get('Authorization', '').replace('Bearer ', '').strip()
    if not token:
        logger.error("Authentication token missing")
        return Response({'success': False, 'message': 'Authentication token required'}, status=401)
    try:
        subjects = AttendanceRecord.objects.values_list('subject', flat=True).distinct()
        semesters = AttendanceRecord.objects.values_list('semester', flat=True).distinct()
        sections = AttendanceRecord.objects.values_list('section', flat=True).distinct()
        response_data = {
            'success': True,
            'message': 'Data retrieved successfully' if subjects else 'No data found',
            'subjects': list(subjects),
            'semesters': list(semesters),
            'sections': list(sections),
        }
        logger.info("Retrieved subjects: %s, semesters: %s, sections: %s", list(subjects), list(semesters), list(sections))
        return Response(response_data)
    except Exception as e:
        logger.error("Error retrieving subjects data: %s", str(e))
        return Response({'success': False, 'message': f'Error retrieving data: {str(e)}'}, status=500)

@api_view(['GET'])
@permission_classes([IsTeacherOrHOD])
def get_attendance_files(request) -> Response:
    """Fetch the latest attendance file for a given semester, section, and subject."""
    token = request.headers.get('Authorization', '').replace('Bearer ', '').strip()
    if not token:
        logger.error("Authentication token missing")
        return Response({'success': False, 'message': 'Authentication token required'}, status=401)
    semester = request.query_params.get('semester')
    section = request.query_params.get('section')
    subject = request.query_params.get('subject')
    if not all([semester, section, subject]):
        logger.error("Missing required parameters: semester=%s, section=%s, subject=%s", semester, section, subject)
        return Response({'success': False, 'message': 'Missing required parameters'}, status=400)
    try:
        record = AttendanceRecord.objects.filter(semester=semester, section=section, subject=subject).order_by('-date').first()
        if not record or not record.file_path or not os.path.exists(record.file_path):
            logger.warning("No attendance file found for %s_%s_%s", semester, subject, section)
            return Response({'success': False, 'message': f'No attendance file found for {subject} ({semester} {section})'}, status=404)
        files = [{
            'id': str(record.id),
            'name': f"Attendance - {subject} ({semester} {section})"
        }]
        logger.info("Retrieved attendance file for %s_%s_%s: %s", semester, subject, section, record.file_path)
        return Response({'success': True, 'files': files})
    except Exception as e:
        logger.error("Error retrieving attendance files: %s", str(e))
        return Response({'success': False, 'message': f'Error retrieving attendance files: {str(e)}'}, status=500)

@api_view(['POST'])
@permission_classes([IsTeacherOrHOD])
def generate_statistics(request) -> Response:
    """Generate attendance statistics and PDF for a given attendance record."""
    token = request.headers.get('Authorization', '').replace('Bearer ', '').strip()
    if not token:
        logger.error("Authentication token missing")
        return Response({'success': False, 'message': 'Authentication token required'}, status=401)
    file_id = request.data.get('file_id')
    if not file_id:
        logger.error("Missing file_id")
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
        
        logger.info("Generated statistics for %s_%s_%s: %d sessions, %d students", 
                    record.semester, record.subject, record.section, total_sessions, len(stats))
        return Response({
            'success': True,
            'total_sessions': total_sessions,
            'above_75': above_75,
            'below_75': below_75,
            'pdf_url': f"/api/hod/download-file/{pdf_filename}"  # Updated to match URL pattern
        })
    except AttendanceRecord.DoesNotExist:
        logger.error("Attendance record with ID %s not found", file_id)
        return Response({'success': False, 'message': 'Attendance record not found'}, status=404)
    except Exception as e:
        logger.error("Error generating statistics: %s", str(e))
        return Response({'success': False, 'message': f'Error generating statistics: {str(e)}'}, status=500)

@api_view(['GET'])
@permission_classes([IsHOD])
def download_file(request, filename: str) -> FileResponse:
    """Serve a file for download (e.g., attendance PDF)."""
    token = request.headers.get('Authorization', '').replace('Bearer ', '').strip()
    if not token:
        logger.error("Authentication token missing")
        return Response({'success': False, 'message': 'Authentication token required'}, status=401)
    file_path = os.path.join(settings.MEDIA_ROOT, filename)
    if os.path.exists(file_path):
        logger.info("Serving file: %s", file_path)
        return FileResponse(open(file_path, 'rb'), as_attachment=True, filename=os.path.basename(file_path))
    logger.error("File not found: %s", file_path)
    return Response({'success': False, 'message': 'File not found'}, status=404)

@api_view(['GET'])
@permission_classes([IsHOD])
def get_leave_requests(request) -> Response:
    """Fetch all pending faculty leave requests for HOD review."""
    token = request.headers.get('Authorization', '').replace('Bearer ', '').strip()
    if not token:
        logger.error("Authentication token missing")
        return Response({'success': False, 'message': 'Authentication token required'}, status=401)
    try:
        leave_requests = LeaveRequest.objects.filter(status='PENDING').select_related('faculty')
        requests_data = [
            {
                'id': str(lr.id),
                'faculty': lr.faculty.username,
                'start_date': lr.start_date.strftime('%Y-%m-%d'),
                'end_date': lr.end_date.strftime('%Y-%m-%d'),
                'reason': lr.reason,
                'submitted_at': lr.submitted_at.strftime('%Y-%m-%d %H:%M:%S')
            }
            for lr in leave_requests
        ]
        logger.info("Retrieved %d pending leave requests", len(requests_data))
        return Response({
            'success': True,
            'message': 'Leave requests retrieved successfully' if requests_data else 'No pending leave requests',
            'leave_requests': requests_data
        })
    except Exception as e:
        logger.error("Error retrieving leave requests: %s", str(e))
        return Response({'success': False, 'message': f'Error retrieving leave requests: {str(e)}'}, status=500)

@api_view(['POST'])
@permission_classes([IsHOD])
def manage_leave_request(request) -> Response:
    """Approve or reject a faculty leave request."""
    token = request.headers.get('Authorization', '').replace('Bearer ', '').strip()
    if not token:
        logger.error("Authentication token missing")
        return Response({'success': False, 'message': 'Authentication token required'}, status=401)

    leave_id = request.data.get('leave_id')
    action = request.data.get('action')  # 'APPROVE' or 'REJECT'

    if not all([leave_id, action]):
        logger.error("Missing required fields: leave_id=%s, action=%s", leave_id, action)
        return Response({'success': False, 'message': 'Leave ID and action are required'}, status=400)

    if action not in ['APPROVE', 'REJECT']:
        logger.error("Invalid action: %s", action)
        return Response({'success': False, 'message': 'Action must be APPROVE or REJECT'}, status=400)

    try:
        leave_request = LeaveRequest.objects.get(id=leave_id, status='PENDING')
        hod = request.user
        leave_request.status = 'APPROVED' if action == 'APPROVE' else 'REJECTED'
        leave_request.reviewed_at = timezone.now()  # Use timezone-aware datetime
        leave_request.reviewed_by = hod
        leave_request.save()
        logger.info("Leave request %s %s by %s", leave_id, leave_request.status.lower(), hod.username)
        return Response({
            'success': True,
            'message': f'Leave request {leave_request.status.lower()} successfully',
            'leave_id': str(leave_request.id),
            'status': leave_request.status
        })
    except LeaveRequest.DoesNotExist:
        logger.error("Leave request with ID %s not found or already processed", leave_id)
        return Response({'success': False, 'message': 'Leave request not found or already processed'}, status=404)
    except Exception as e:
        logger.error("Error managing leave request: %s", str(e))
        return Response({'success': False, 'message': f'Error managing leave request: {str(e)}'}, status=500)
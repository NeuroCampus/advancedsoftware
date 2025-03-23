from django.http import JsonResponse, FileResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from ..permissions import IsHOD, IsTeacherOrHOD  # Import updated permissions
from .utils import get_google_sheet_id, parse_attendance, calculate_statistics, generate_pdf
from ..models import AttendanceRecord
import os
from django.conf import settings

@api_view(['GET'])
@permission_classes([IsHOD])
def get_subjects(request) -> Response:
    token = request.headers.get('Authorization', '').replace('Bearer ', '').strip()
    if not token:
        return Response({'success': False, 'message': 'Authentication token required'}, status=401)
    try:
        subjects = AttendanceRecord.objects.values_list('subject', flat=True).distinct()
        return Response({
            'success': True,
            'message': 'Subjects retrieved successfully' if subjects else 'No subjects found',
            'subjects': list(subjects)
        })
    except Exception as e:
        return Response({'success': False, 'message': f'Error retrieving subjects: {str(e)}'}, status=500)

@api_view(['GET'])
@permission_classes([IsTeacherOrHOD])  # Updated to allow teacher and hod
def get_attendance_files(request) -> Response:
    token = request.headers.get('Authorization', '').replace('Bearer ', '').strip()
    if not token:
        return Response({'success': False, 'message': 'Authentication token required'}, status=401)
    semester = request.query_params.get('semester')
    section = request.query_params.get('section')
    subject = request.query_params.get('subject')
    if not all([semester, section, subject]):
        return Response({'success': False, 'message': 'Missing required parameters'})
    try:
        records = AttendanceRecord.objects.filter(semester=semester, section=section, subject=subject).order_by('-date')
        files = [
            {'id': str(record.id), 'name': f"{record.date.strftime('%Y-%m-%d')} - {subject}"}
            for record in records if record.file_path and os.path.exists(record.file_path)
        ]
        return Response({'success': True, 'files': files})
    except Exception as e:
        return Response({'success': False, 'message': f'Error retrieving attendance files: {str(e)}'})

@api_view(['POST'])
@permission_classes([IsTeacherOrHOD])  # Updated to allow teacher and hod
def generate_statistics(request) -> Response:
    token = request.headers.get('Authorization', '').replace('Bearer ', '').strip()
    if not token:
        return Response({'success': False, 'message': 'Authentication token required'}, status=401)
    file_id = request.data.get('file_id')
    if not file_id:
        return Response({'success': False, 'message': 'Missing file ID'})
    try:
        record = AttendanceRecord.objects.get(id=file_id)
        if not record.file_path or not os.path.exists(record.file_path):
            return Response({'success': False, 'message': 'Attendance file not found'})
        attendance_records = parse_attendance(record.file_path)
        if not attendance_records:
            return Response({'success': False, 'message': 'Failed to parse attendance file'})
        stats = calculate_statistics(attendance_records)
        pdf_filename = f"attendance_report_{record.semester}_{record.subject}_{record.section}_{record.date.strftime('%Y%m%d')}.pdf"
        pdf_path = os.path.join(settings.MEDIA_ROOT, pdf_filename)
        os.makedirs(os.path.dirname(pdf_path), exist_ok=True)
        generate_pdf(stats, pdf_path, record)
        above_75 = [{'student': s, 'percentage': p} for s, p in stats.items() if p >= 75]
        below_75 = [{'student': s, 'percentage': p} for s, p in stats.items() if p < 75]
        above_75.sort(key=lambda x: x['percentage'], reverse=True)
        below_75.sort(key=lambda x: x['percentage'], reverse=True)
        return Response({
            'success': True,
            'above_75': above_75,
            'below_75': below_75,
            'pdf_url': f"/media/{pdf_filename}"
        })
    except AttendanceRecord.DoesNotExist:
        return Response({'success': False, 'message': 'Attendance record not found'})
    except Exception as e:
        return Response({'success': False, 'message': f'Error generating statistics: {str(e)}'})

@api_view(['GET'])
@permission_classes([IsHOD])
def download_file(request, filename: str) -> FileResponse:
    token = request.headers.get('Authorization', '').replace('Bearer ', '').strip()
    if not token:
        return JsonResponse({'error': 'Authentication token required'}, status=401)
    file_path = os.path.join(settings.MEDIA_ROOT, filename)
    if os.path.exists(file_path):
        return FileResponse(open(file_path, 'rb'), as_attachment=True, filename=os.path.basename(file_path))
    return JsonResponse({'error': 'File not found'}, status=404)
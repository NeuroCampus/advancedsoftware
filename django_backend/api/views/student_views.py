from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django_otp.plugins.otp_email.models import EmailDevice
from django.contrib.auth.hashers import make_password
from django.utils import timezone
from datetime import datetime
from ..permissions import IsStudent
from ..models import User, Student, AttendanceRecord, AttendanceDetail, StudentLeaveRequest
from rest_framework import status

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request) -> Response:
    username = request.data.get('username')
    password = request.data.get('password')
    if not username or not password:
        return Response({'success': False, 'message': 'Username and password are required'}, status=400)
    if username == '1AM22CI' and password == 'CI@2024':  # Hardcoded check (consider removing in production)
        return Response({'success': True})
    try:
        user = User.objects.get(username=username)
        if user.check_password(password):
            if user.role == 'student':
                otp_device, _ = EmailDevice.objects.get_or_create(user=user, email=user.email, defaults={'name': 'default'})
                otp_device.generate_challenge()
                return Response({'success': True, 'message': 'OTP sent to your email', 'user_id': user.id})
            refresh = RefreshToken.for_user(user)
            return Response({
                'success': True,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'role': user.role
            })
        return Response({'success': False, 'message': 'Invalid password'}, status=401)
    except User.DoesNotExist:
        return Response({'success': False, 'message': 'User not found'}, status=404)
    except Exception as e:
        return Response({'success': False, 'message': f'Login error: {str(e)}'}, status=500)

@api_view(['POST'])
@permission_classes([AllowAny])
def verify_otp(request) -> Response:
    user_id = request.data.get('user_id')
    otp = request.data.get('otp')
    if not user_id or not otp:
        return Response({'success': False, 'message': 'User ID and OTP are required'}, status=400)
    try:
        user = User.objects.get(id=user_id, role='student')
        otp_device = EmailDevice.objects.get(user=user, email=user.email)
        if otp_device.verify_token(otp):
            refresh = RefreshToken.for_user(user)
            return Response({
                'success': True,
                'message': 'Login successful',
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'role': user.role,
                'user_id': user.id
            })
        return Response({'success': False, 'message': 'Invalid or expired OTP'}, status=400)
    except (User.DoesNotExist, EmailDevice.DoesNotExist):
        return Response({'success': False, 'message': 'Invalid user or OTP device'}, status=404)
    except Exception as e:
        return Response({'success': False, 'message': f'OTP verification error: {str(e)}'}, status=500)

@api_view(['POST'])
@permission_classes([AllowAny])
def resend_otp(request) -> Response:
    user_id = request.data.get('user_id')
    if not user_id:
        return Response({'success': False, 'message': 'User ID is required'}, status=400)
    try:
        user = User.objects.get(id=user_id, role='student')
        otp_device = EmailDevice.objects.get(user=user, email=user.email)
        otp_device.generate_challenge()
        return Response({'success': True, 'message': 'OTP resent successfully'})
    except (User.DoesNotExist, EmailDevice.DoesNotExist):
        return Response({'success': False, 'message': 'Invalid user or OTP device'}, status=404)
    except Exception as e:
        return Response({'success': False, 'message': f'Error resending OTP: {str(e)}'}, status=500)

@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request) -> Response:
    email = request.data.get('email')
    if not email:
        return Response({'success': False, 'message': 'Email is required'}, status=400)
    try:
        user = User.objects.get(email=email)
        if user.role != 'student':
            return Response({'success': False, 'message': 'Only students can reset passwords via this method'}, status=403)
        otp_device, _ = EmailDevice.objects.get_or_create(user=user, email=user.email, defaults={'name': 'default'})
        otp_device.generate_challenge()
        return Response({'success': True, 'message': 'OTP sent to your email', 'user_id': user.id})
    except User.DoesNotExist:
        return Response({'success': False, 'message': 'No student found with this email'}, status=404)
    except Exception as e:
        return Response({'success': False, 'message': f'Failed to send OTP: {str(e)}'}, status=500)

@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request) -> Response:
    user_id = request.data.get('user_id')
    otp = request.data.get('otp')
    new_password = request.data.get('new_password')
    if not all([user_id, otp, new_password]):
        return Response({'success': False, 'message': 'User ID, OTP, and new password are required'}, status=400)
    try:
        user = User.objects.get(id=user_id)
        if user.role != 'student':
            return Response({'success': False, 'message': 'Only students can reset passwords via this method'}, status=403)
        otp_device = EmailDevice.objects.get(user=user, email=user.email)
        if not otp_device.verify_token(otp):
            return Response({'success': False, 'message': 'Invalid or expired OTP'}, status=400)
        user.password = make_password(new_password)
        user.save()
        return Response({'success': True, 'message': 'Password reset successfully. Please log in with your new password.'})
    except (User.DoesNotExist, EmailDevice.DoesNotExist):
        return Response({'success': False, 'message': 'Invalid user or OTP device'}, status=404)
    except Exception as e:
        return Response({'success': False, 'message': f'Password reset failed: {str(e)}'}, status=500)

@api_view(['POST'])
@permission_classes([AllowAny])
def register_student(request) -> Response:
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    name = request.data.get('name')
    usn = request.data.get('usn')
    semester = request.data.get('semester')
    section = request.data.get('section')
    if not all([username, email, password, name, usn, semester, section]):
        return Response({'success': False, 'message': 'All fields are required'}, status=400)
    if User.objects.filter(username=username).exists():
        return Response({'success': False, 'message': 'Username already taken'}, status=400)
    if User.objects.filter(email=email).exists():
        return Response({'success': False, 'message': 'Email already registered'}, status=400)
    try:
        user = User.objects.create(username=username, email=email, password=make_password(password), role='student')
        Student.objects.create(user=user, name=name, usn=usn, semester=semester, section=section)
        return Response({'success': True, 'message': 'Student registered successfully. Please log in.'}, status=201)
    except Exception as e:
        return Response({'success': False, 'message': f'Registration failed: {str(e)}'}, status=500)

@api_view(['GET'])
@permission_classes([IsStudent])
def get_student_attendance(request) -> Response:
    token = request.headers.get('Authorization', '').replace('Bearer ', '').strip()
    if not token:
        return Response({'success': False, 'message': 'Authentication token required'}, status=401)
    try:
        user = request.user
        if user.role != 'student':  # Redundant due to IsStudent, but kept for clarity
            return Response({'success': False, 'message': 'Only students can access this endpoint'}, status=403)
        student = Student.objects.get(user=user)
        attendance_details = AttendanceDetail.objects.filter(student=student).select_related('record')
        attendance_data = {}
        for detail in attendance_details:
            record = detail.record
            subject = record.subject
            date = record.date.strftime('%Y-%m-%d')
            if subject not in attendance_data:
                attendance_data[subject] = []
            attendance_data[subject].append({'date': date, 'status': 1 if detail.status else 0})
        return Response({
            'success': True,
            'message': 'Attendance data retrieved successfully',
            'attendance': attendance_data
        })
    except Student.DoesNotExist:
        return Response({'success': False, 'message': 'Student not found'}, status=404)
    except Exception as e:
        return Response({'success': False, 'message': f'Error retrieving attendance: {str(e)}'}, status=500)

@api_view(['POST'])
@permission_classes([IsStudent])
def submit_student_leave_request(request) -> Response:
    token = request.headers.get('Authorization', '').replace('Bearer ', '').strip()
    if not token:
        return Response({'success': False, 'message': 'Authentication token required'}, status=401)

    start_date = request.data.get('start_date')  # Expected format: YYYY-MM-DD
    end_date = request.data.get('end_date')      # Expected format: YYYY-MM-DD
    reason = request.data.get('reason')

    if not all([start_date, end_date, reason]):
        return Response({'success': False, 'message': 'Start date, end date, and reason are required'}, status=400)

    try:
        start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        if start_date > end_date:
            return Response({'success': False, 'message': 'Start date must be before end date'}, status=400)

        student = request.user
        if student.role != 'student':
            return Response({'success': False, 'message': 'Only students can submit leave requests'}, status=403)

        leave_request = StudentLeaveRequest.objects.create(
            student=student,
            start_date=start_date,
            end_date=end_date,
            reason=reason
        )
        return Response({
            'success': True,
            'message': 'Leave request submitted successfully',
            'leave_id': str(leave_request.id),
            'status': leave_request.status
        }, status=201)
    except ValueError as e:
        return Response({'success': False, 'message': 'Invalid date format. Use YYYY-MM-DD'}, status=400)
    except Exception as e:
        return Response({'success': False, 'message': f'Error submitting leave request: {str(e)}'}, status=500)

@api_view(['GET'])
@permission_classes([IsStudent])
def get_student_leave_requests(request) -> Response:
    token = request.headers.get('Authorization', '').replace('Bearer ', '').strip()
    if not token:
        return Response({'success': False, 'message': 'Authentication token required'}, status=401)

    try:
        student = request.user
        if student.role != 'student':
            return Response({'success': False, 'message': 'Only students can access this endpoint'}, status=403)

        leave_requests = StudentLeaveRequest.objects.filter(student=student).select_related('reviewed_by')
        requests_data = [
            {
                'id': str(lr.id),
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
        return Response({'success': False, 'message': f'Error retrieving leave requests: {str(e)}'}, status=500)
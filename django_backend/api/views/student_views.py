from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django_otp.plugins.otp_email.models import EmailDevice
from django.contrib.auth.hashers import make_password
from django.utils import timezone
from datetime import datetime
from ..permissions import IsStudent
from ..models import User, Student, AttendanceRecord, AttendanceDetail, StudentLeaveRequest, FacultyAssignment, Branch
from rest_framework import status

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request) -> Response:
    username = request.data.get('username')
    password = request.data.get('password')
    if not username or not password:
        return Response({'success': False, 'message': 'Username and password required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(username=username)
        if user.check_password(password):
            if user.role == 'student':
                otp_device, _ = EmailDevice.objects.get_or_create(user=user, email=user.email, defaults={'name': 'default'})
                otp_device.generate_challenge()
                return Response({'success': True, 'message': 'OTP sent to your email', 'user_id': user.id}, status=status.HTTP_200_OK)
            refresh = RefreshToken.for_user(user)
            extra_data = {}
            if user.role == 'teacher':
                assignments = FacultyAssignment.objects.filter(faculty=user)
                extra_data['branches'] = list(set(a.branch.name for a in assignments)) if assignments.exists() else []
            elif user.role == 'hod':
                branch = Branch.objects.filter(hod=user).first()
                extra_data['branch'] = branch.name if branch else None
            return Response({
                'success': True,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'role': user.role,
                **extra_data
            }, status=status.HTTP_200_OK)
        return Response({'success': False, 'message': 'Invalid password'}, status=status.HTTP_401_UNAUTHORIZED)
    except User.DoesNotExist:
        return Response({'success': False, 'message': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'success': False, 'message': f'Login error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def verify_otp(request) -> Response:
    user_id = request.data.get('user_id')
    otp = request.data.get('otp')
    if not user_id or not otp:
        return Response({'success': False, 'message': 'User ID and OTP required'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        user = User.objects.get(id=user_id, role='student')
        otp_device = EmailDevice.objects.get(user=user, email=user.email)
        if otp_device.verify_token(otp):
            refresh = RefreshToken.for_user(user)
            student = Student.objects.get(user=user)
            return Response({
                'success': True,
                'message': 'Login successful',
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'role': user.role,
                'user_id': user.id,
                'branch': student.branch.name,
                'semester': student.semester,
                'section': student.section,
                'proctor': student.proctor.username if student.proctor else None
            }, status=status.HTTP_200_OK)
        return Response({'success': False, 'message': 'Invalid or expired OTP'}, status=status.HTTP_400_BAD_REQUEST)
    except (User.DoesNotExist, EmailDevice.DoesNotExist):
        return Response({'success': False, 'message': 'Invalid user or OTP device'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'success': False, 'message': f'OTP verification error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def resend_otp(request) -> Response:
    user_id = request.data.get('user_id')
    if not user_id:
        return Response({'success': False, 'message': 'User ID required'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        user = User.objects.get(id=user_id, role='student')
        otp_device = EmailDevice.objects.get(user=user, email=user.email)
        otp_device.generate_challenge()
        return Response({'success': True, 'message': 'OTP resent successfully'}, status=status.HTTP_200_OK)
    except (User.DoesNotExist, EmailDevice.DoesNotExist):
        return Response({'success': False, 'message': 'Invalid user or OTP device'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'success': False, 'message': f'Error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request) -> Response:
    email = request.data.get('email')
    if not email:
        return Response({'success': False, 'message': 'Email required'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        user = User.objects.get(email=email, role='student')
        otp_device, _ = EmailDevice.objects.get_or_create(user=user, email=user.email, defaults={'name': 'default'})
        otp_device.generate_challenge()
        return Response({'success': True, 'message': 'OTP sent to your email', 'user_id': user.id}, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return Response({'success': False, 'message': 'No student found with this email'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'success': False, 'message': f'Error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request) -> Response:
    user_id = request.data.get('user_id')
    otp = request.data.get('otp')
    new_password = request.data.get('new_password')
    if not all([user_id, otp, new_password]):
        return Response({'success': False, 'message': 'User ID, OTP, and new password required'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        user = User.objects.get(id=user_id, role='student')
        otp_device = EmailDevice.objects.get(user=user, email=user.email)
        if not otp_device.verify_token(otp):
            return Response({'success': False, 'message': 'Invalid or expired OTP'}, status=status.HTTP_400_BAD_REQUEST)
        user.password = make_password(new_password)
        user.save()
        return Response({'success': True, 'message': 'Password reset successfully'}, status=status.HTTP_200_OK)
    except (User.DoesNotExist, EmailDevice.DoesNotExist):
        return Response({'success': False, 'message': 'Invalid user or OTP device'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'success': False, 'message': f'Error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def register_student(request) -> Response:
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    name = request.data.get('name')
    usn = request.data.get('usn')
    branch_id = request.data.get('branch')
    semester = request.data.get('semester')
    section = request.data.get('section')
    if not all([username, email, password, name, usn, branch_id, semester, section]):
        return Response({'success': False, 'message': 'All fields required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        branch = Branch.objects.get(id=branch_id)
    except Branch.DoesNotExist:
        return Response({'success': False, 'message': 'Branch not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if User.objects.filter(username=username).exists():
        return Response({'success': False, 'message': 'Username already taken'}, status=status.HTTP_400_BAD_REQUEST)
    if User.objects.filter(email=email).exists():
        return Response({'success': False, 'message': 'Email already registered'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        user = User.objects.create(username=username, email=email, password=make_password(password), role='student')
        Student.objects.create(user=user, name=name, usn=usn, branch=branch, semester=semester, section=section)
        return Response({'success': True, 'message': 'Student registered successfully'}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'success': False, 'message': f'Error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsStudent])
def get_student_attendance(request) -> Response:
    try:
        user = request.user
        if user.role != 'student':
            return Response({'success': False, 'message': 'Only students can access this'}, status=status.HTTP_403_FORBIDDEN)
        student = Student.objects.get(user=user)
        attendance_details = AttendanceDetail.objects.filter(student=student).select_related('record__faculty')
        attendance_data = {}
        for detail in attendance_details:
            record = detail.record
            subject = record.subject
            date = record.date.strftime('%Y-%m-%d')
            faculty_name = record.faculty.get_full_name() or record.faculty.username if record.faculty else 'Unknown'
            if subject not in attendance_data:
                attendance_data[subject] = []
            attendance_data[subject].append({
                'date': date,
                'status': 'Present' if detail.status else 'Absent',
                'faculty': faculty_name,
                'branch': record.branch.name
            })
        return Response({
            'success': True,
            'message': 'Attendance data retrieved successfully',
            'attendance': attendance_data
        }, status=status.HTTP_200_OK)
    except Student.DoesNotExist:
        return Response({'success': False, 'message': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'success': False, 'message': f'Error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsStudent])
def submit_student_leave_request(request) -> Response:
    start_date = request.data.get('start_date')
    end_date = request.data.get('end_date')
    reason = request.data.get('reason')
    if not all([start_date, end_date, reason]):
        return Response({'success': False, 'message': 'Dates and reason required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        if start_date > end_date:
            return Response({'success': False, 'message': 'Start date must be before end date'}, status=status.HTTP_400_BAD_REQUEST)
        
        student = request.user
        if student.role != 'student':
            return Response({'success': False, 'message': 'Only students can submit this'}, status=status.HTTP_403_FORBIDDEN)
        
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
        }, status=status.HTTP_201_CREATED)
    except ValueError:
        return Response({'success': False, 'message': 'Invalid date format (YYYY-MM-DD)'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'success': False, 'message': f'Error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsStudent])
def get_student_leave_requests(request) -> Response:
    try:
        student = request.user
        if student.role != 'student':
            return Response({'success': False, 'message': 'Only students can access this'}, status=status.HTTP_403_FORBIDDEN)
        
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
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'success': False, 'message': f'Error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
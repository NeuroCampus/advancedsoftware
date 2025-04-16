from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django_otp.plugins.otp_email.models import EmailDevice
from django.contrib.auth.hashers import make_password
from django.utils import timezone
from datetime import datetime, timedelta
from dateutil.parser import parse
from ..permissions import IsStudent
from ..models import (
    User, Student, AttendanceRecord, AttendanceDetail, StudentLeaveRequest,
    FacultyAssignment, Branch, Timetable, InternalMark, Announcement, Semester,
    Section, Notification, Certificate, Subject, ChatChannel, ChatMessage
)
from rest_framework import status, views
import logging
import os
import numpy as np
import cv2
import logging
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator
from .utils import validate_image_size

logger = logging.getLogger(__name__)

# 1. Check Auth
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_auth(request):
    try:
        user = request.user
        profile_image = None
        department = None

        if user.role == 'student' and hasattr(user, 'student_profile'):
            profile_image = user.student_profile.profile_picture.url if user.student_profile.profile_picture else None
            department = user.student_profile.branch.name if user.student_profile.branch else None
        elif user.role == 'faculty' and hasattr(user, 'faculty_profile'):
            profile_image = user.faculty_profile.profile_picture.url if user.faculty_profile.profile_picture else None
            department = user.faculty_profile.department if user.faculty_profile.department else None
        elif user.role == 'hod' and hasattr(user, 'hod_profile'):
            profile_image = user.hod_profile.profile_picture.url if user.hod_profile.profile_picture else None
            department = user.hod_profile.department if user.hod_profile.department else None
        elif user.role == 'admin':
            department = 'Administration'

        return Response({
            'success': True,
            'user_id': user.id,
            'username': user.username,  # Changed from user.name
            'email': user.email,
            'role': user.role,
            'department': department,
            'profile_image': profile_image
        }, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error("Check auth error: %s", str(e))
        return Response({'success': False, 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# 2. Logout
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    try:
        refresh_token = request.data.get('refresh')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        return Response({'success': True, 'message': 'Logged out'}, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error("Logout error: %s", str(e))
        return Response({'success': False, 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# 3. Login View
@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    if not all([username, password]):
        return Response({'success': False, 'message': 'Username and password required'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        user = User.objects.get(username=username)
        if not user.check_password(password):
            return Response({'success': False, 'message': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        
        if user.role == 'student':
            logger.info(f"Sending OTP to {user.email}")
            otp_device, _ = EmailDevice.objects.get_or_create(user=user, email=user.email, defaults={'name': 'default'})
            otp_device.generate_challenge()
            logger.info("OTP sent successfully")
            Notification.objects.create(
                student=user.student_profile,
                title="Login OTP Sent",
                message="An OTP has been sent to your email for login verification."
            )
            return Response({'success': True, 'message': 'OTP sent', 'user_id': user.id}, status=status.HTTP_200_OK)
        else:
            refresh = RefreshToken.for_user(user)
            profile_data = {
                'user_id': user.id,
                'username': user.username,
                'email': user.email,
                'role': user.role
            }
            if user.role == 'admin':
                profile_data['department'] = 'Administration'
            elif user.role == 'hod':
                profile_data['department'] = user.hod_profile.department if hasattr(user, 'hod_profile') else None
                profile_data['profile_image'] = user.hod_profile.profile_picture.url if hasattr(user, 'hod_profile') and user.hod_profile.profile_picture else None
            elif user.role == 'faculty':
                profile_data['department'] = user.faculty_profile.department if hasattr(user, 'faculty_profile') else None
                profile_data['profile_image'] = user.faculty_profile.profile_picture.url if hasattr(user, 'faculty_profile') and user.faculty_profile.profile_picture else None
            
            return Response({
                'success': True,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'role': user.role,
                'profile': profile_data
            }, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return Response({'success': False, 'message': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error("Login error: %s", str(e))
        return Response({'success': False, 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# 4. Verify OTP
@api_view(['POST'])
@permission_classes([AllowAny])
def verify_otp(request):
    user_id = request.data.get('user_id')
    otp = request.data.get('otp')
    if not all([user_id, otp]):
        return Response({'success': False, 'message': 'User ID and OTP required'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        user = User.objects.get(id=user_id)
        otp_device = EmailDevice.objects.get(user=user, email=user.email)
        if otp_device.verify_token(otp):
            refresh = RefreshToken.for_user(user)
            profile_data = {
                'user_id': user.id,
                'username': user.username,  # Changed from user.name
                'email': user.email,
                'role': user.role
            }
            if user.role == 'student':
                student = Student.objects.get(user=user)
                profile_data.update({
                    'branch': student.branch.name,
                    'semester': student.semester.number,
                    'section': student.section.name
                })
                Notification.objects.create(
                    student=student,
                    title="Login Successful",
                    message="You have successfully logged in."
                )
            return Response({
                'success': True,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'role': user.role,
                'profile': profile_data
            }, status=status.HTTP_200_OK)
        return Response({'success': False, 'message': 'Invalid OTP'}, status=status.HTTP_400_BAD_REQUEST)
    except (User.DoesNotExist, EmailDevice.DoesNotExist):
        return Response({'success': False, 'message': 'Invalid user or OTP'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error("OTP verification error: %s", str(e))
        return Response({'success': False, 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# 5. Resend OTP
@api_view(['POST'])
@permission_classes([AllowAny])
def resend_otp(request):
    user_id = request.data.get('user_id')
    if not user_id:
        return Response({'success': False, 'message': 'User ID required'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        user = User.objects.get(id=user_id)
        otp_device = EmailDevice.objects.get(user=user, email=user.email)
        otp_device.generate_challenge()
        if user.role == 'student':
            Notification.objects.create(
                student=user.student_profile,
                title="OTP Resent",
                message="A new OTP has been sent to your email."
            )
        return Response({'success': True, 'message': 'OTP resent'}, status=status.HTTP_200_OK)
    except (User.DoesNotExist, EmailDevice.DoesNotExist):
        return Response({'success': False, 'message': 'Invalid user or OTP'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error("Resend OTP error: %s", str(e))
        return Response({'success': False, 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# 6. Forgot Password
@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    email = request.data.get('email')
    if not email:
        return Response({'success': False, 'message': 'Email required'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        user = User.objects.get(email=email)
        otp_device, _ = EmailDevice.objects.get_or_create(user=user, email=user.email, defaults={'name': 'default'})
        otp_device.generate_challenge()
        if user.role == 'student':
            Notification.objects.create(
                student=user.student_profile,
                title="Password Reset OTP",
                message="An OTP has been sent to reset your password."
            )
        return Response({'success': True, 'message': 'OTP sent', 'user_id': user.id}, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return Response({'success': False, 'message': 'No user found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error("Forgot password error: %s", str(e))
        return Response({'success': False, 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# 7. Reset Password
@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    user_id = request.data.get('user_id')
    otp = request.data.get('otp')
    new_password = request.data.get('new_password')
    confirm_password = request.data.get('confirm_password')
    if not all([user_id, otp, new_password, confirm_password]):
        return Response({'success': False, 'message': 'All fields required'}, status=status.HTTP_400_BAD_REQUEST)
    if new_password != confirm_password:
        return Response({'success': False, 'message': 'Passwords do not match'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        user = User.objects.get(id=user_id)
        otp_device = EmailDevice.objects.get(user=user, email=user.email)
        if otp_device.verify_token(otp):
            user.password = make_password(new_password)
            user.save()
            if user.role == 'student':
                Notification.objects.create(
                    student=user.student_profile,
                    title="Password Reset",
                    message="Your password has been successfully reset."
                )
            return Response({'success': True, 'message': 'Password reset, please login'}, status=status.HTTP_200_OK)
        return Response({'success': False, 'message': 'Invalid OTP'}, status=status.HTTP_400_BAD_REQUEST)
    except (User.DoesNotExist, EmailDevice.DoesNotExist):
        return Response({'success': False, 'message': 'Invalid user or OTP'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error("Reset password error: %s", str(e))
        return Response({'success': False, 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# 8. Dashboard Overview
@api_view(['GET'])
@permission_classes([IsStudent])
def dashboard_overview(request):
    try:
        student = Student.objects.get(user=request.user)
        today = timezone.now()
        timetable = Timetable.objects.filter(
            faculty_assignment__branch=student.branch,
            faculty_assignment__semester=student.semester,
            faculty_assignment__section=student.section,
            day=today.strftime('%a').upper()[:3]
        ).select_related('faculty_assignment__subject')
        classes = [
            {
                'subject': t.faculty_assignment.subject.name,
                'start_time': t.start_time.strftime('%H:%M'),
                'room': t.room
            } for t in timetable
        ]
        attendance = AttendanceDetail.objects.filter(student=student).aggregate(
            avg=models.Avg('status')
        )['avg'] or 0
        below_75 = AttendanceDetail.objects.filter(
            student=student
        ).values('record__subject__name').annotate(
            percentage=models.Avg('status') * 100
        ).filter(percentage__lt=75)
        notifications = Notification.objects.filter(student=student, read=False).count()
        return Response({
            'success': True,
            'data': {
                'today_date': today.strftime('%Y-%m-%d'),
                'next_class': classes[0] if classes else None,
                'attendance_status': {
                    'average': round(attendance * 100, 2),
                    'below_75_count': below_75.count()
                },
                'notifications': notifications
            }
        }, status=status.HTTP_200_OK)
    except Student.DoesNotExist:
        return Response({'success': False, 'message': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error("Dashboard error: %s", str(e))
        return Response({'success': False, 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# 9. Get Timetable
@api_view(['GET'])
@permission_classes([IsStudent])
def get_timetable(request):
    try:
        student = Student.objects.get(user=request.user)
        timetable = Timetable.objects.filter(
            faculty_assignment__branch=student.branch,
            faculty_assignment__semester=student.semester,
            faculty_assignment__section=student.section
        ).select_related('faculty_assignment__subject')
        data = [
            {
                'day': t.day,
                'start_time': t.start_time.strftime('%H:%M'),
                'end_time': t.end_time.strftime('%H:%M'),
                'subject': t.faculty_assignment.subject.name,
                'room': t.room
            } for t in timetable
        ]
        return Response({
            'success': True,
            'data': data
        }, status=status.HTTP_200_OK)
    except Student.DoesNotExist:
        return Response({'success': False, 'message': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error("Timetable error: %s", str(e))
        return Response({'success': False, 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# 10. Get Student Attendance
@api_view(['GET'])
@permission_classes([IsStudent])
def get_student_attendance(request):
    try:
        student = Student.objects.get(user=request.user)
        details = AttendanceDetail.objects.filter(student=student).select_related('record__subject')
        data = {}
        for d in details:
            subject = d.record.subject.name
            if subject not in data:
                data[subject] = {'records': [], 'present': 0, 'total': 0}
            data[subject]['records'].append({
                'date': d.record.date.strftime('%Y-%m-%d'),
                'status': 'Present' if d.status else 'Absent'
            })
            data[subject]['total'] += 1
            if d.status:
                data[subject]['present'] += 1
        for subject in data:
            percentage = round((data[subject]['present'] / data[subject]['total']) * 100, 2) if data[subject]['total'] else 0
            data[subject]['percentage'] = percentage
            if percentage < 75 and data[subject]['total'] >= 5:
                Notification.objects.get_or_create(
                    student=student,
                    title=f"Low Attendance: {subject}",
                    message=f"Your attendance in {subject} is {percentage}%."
                )
        return Response({
            'success': True,
            'data': data
        }, status=status.HTTP_200_OK)
    except Student.DoesNotExist:
        return Response({'success': False, 'message': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error("Attendance error: %s", str(e))
        return Response({'success': False, 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# 11. Get Internal Marks
@api_view(['GET'])
@permission_classes([IsStudent])
def get_internal_marks(request):
    try:
        student = Student.objects.get(user=request.user)
        marks = InternalMark.objects.filter(student=student).select_related('subject')
        data = {}
        for m in marks:
            subject = m.subject.name
            if subject not in data:
                data[subject] = []
            data[subject].append({
                'test_number': m.test_number,
                'mark': m.mark,
                'max_mark': m.max_mark
            })
        return Response({
            'success': True,
            'data': data
        }, status=status.HTTP_200_OK)
    except Student.DoesNotExist:
        return Response({'success': False, 'message': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error("Marks error: %s", str(e))
        return Response({'success': False, 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# 12. Submit Leave Request
@api_view(['POST'])
@permission_classes([IsStudent])
def submit_student_leave_request(request):
    start_date = request.data.get('start_date')
    end_date = request.data.get('end_date')
    reason = request.data.get('reason')
    if not all([start_date, end_date, reason]):
        return Response({'success': False, 'message': 'All fields required'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        if start_date > end_date:
            return Response({'success': False, 'message': 'Invalid date range'}, status=status.HTTP_400_BAD_REQUEST)
        student = Student.objects.get(user=request.user)
        leave = StudentLeaveRequest.objects.create(
            student=student.user,
            start_date=start_date,
            end_date=end_date,
            reason=reason
        )
        Notification.objects.create(
            student=student,
            title="Leave Request Submitted",
            message=f"Leave request from {start_date} to {end_date} submitted."
        )
        if student.proctor:
            Notification.objects.create(
                student=student,
                title="Leave Request Sent",
                message=f"Leave request sent to proctor {student.proctor.username}."
            )
        return Response({
            'success': True,
            'data': {'leave_id': str(leave.id), 'status': leave.status}
        }, status=status.HTTP_201_CREATED)
    except Student.DoesNotExist:
        return Response({'success': False, 'message': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error("Leave request error: %s", str(e))
        return Response({'success': False, 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# 13. Get Leave Requests
@api_view(['GET'])
@permission_classes([IsStudent])
def get_student_leave_requests(request):
    try:
        student = Student.objects.get(user=request.user)
        leaves = StudentLeaveRequest.objects.filter(student=student.user)
        data = [
            {
                'id': str(l.id),
                'start_date': l.start_date.strftime('%Y-%m-%d'),
                'end_date': l.end_date.strftime('%Y-%m-%d'),
                'reason': l.reason,
                'status': l.status
            } for l in leaves
        ]
        return Response({
            'success': True,
            'data': data
        }, status=status.HTTP_200_OK)
    except Student.DoesNotExist:
        return Response({'success': False, 'message': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error("Get leaves error: %s", str(e))
        return Response({'success': False, 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# 14. Upload Certificate
@api_view(['POST'])
@permission_classes([IsStudent])
def upload_certificate(request):
    title = request.data.get('title')
    file = request.FILES.get('certificate')
    if not all([title, file]):
        return Response({'success': False, 'message': 'Title and file required'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        student = Student.objects.get(user=request.user)
        certificate = Certificate.objects.create(student=student, title=title, file=file)
        Notification.objects.create(
            student=student,
            title="Certificate Uploaded",
            message=f"Certificate '{title}' uploaded successfully."
        )
        return Response({
            'success': True,
            'data': {
                'id': str(certificate.id),
                'title': certificate.title,
                'file': certificate.file.url
            }
        }, status=status.HTTP_201_CREATED)
    except Student.DoesNotExist:
        return Response({'success': False, 'message': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error("Certificate upload error: %s", str(e))
        return Response({'success': False, 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# 15. Get Certificates
@api_view(['GET'])
@permission_classes([IsStudent])
def get_certificates(request):
    try:
        student = Student.objects.get(user=request.user)
        certificates = Certificate.objects.filter(student=student)
        data = [
            {
                'id': str(c.id),
                'title': c.title,
                'file': c.file.url,
                'uploaded_at': c.uploaded_at.strftime('%Y-%m-%d')
            } for c in certificates
        ]
        return Response({
            'success': True,
            'data': data
        }, status=status.HTTP_200_OK)
    except Student.DoesNotExist:
        return Response({'success': False, 'message': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error("Get certificates error: %s", str(e))
        return Response({'success': False, 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# 16. Delete Certificate
@api_view(['DELETE'])
@permission_classes([IsStudent])
def delete_certificate(request):
    certificate_id = request.data.get('certificate_id')
    if not certificate_id:
        return Response({'success': False, 'message': 'Certificate ID required'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        student = Student.objects.get(user=request.user)
        certificate = Certificate.objects.get(id=certificate_id, student=student)
        if certificate.file:
            os.remove(certificate.file.path)
        certificate.delete()
        Notification.objects.create(
            student=student,
            title="Certificate Deleted",
            message=f"Certificate '{certificate.title}' deleted."
        )
        return Response({'success': True, 'message': 'Certificate deleted'}, status=status.HTTP_200_OK)
    except (Student.DoesNotExist, Certificate.DoesNotExist):
        return Response({'success': False, 'message': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error("Delete certificate error: %s", str(e))
        return Response({'success': False, 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# 17. Update Profile
@api_view(['POST'])
@permission_classes([IsStudent])
def update_profile(request):
    email = request.data.get('email')
    first_name = request.data.get('first_name')
    last_name = request.data.get('last_name')
    profile_picture = request.FILES.get('profile_picture')
    
    try:
        student = Student.objects.get(user=request.user)
        user = student.user

        if not any([email, first_name, last_name, profile_picture]):
            return Response({
                'success': False,
                'message': 'At least one field required'
            }, status=status.HTTP_400_BAD_REQUEST)

        if email and email != user.email:
            if User.objects.filter(email=email).exclude(id=user.id).exists():
                return Response({
                    'success': False,
                    'message': 'Email is already taken'
                }, status=status.HTTP_400_BAD_REQUEST)
            user.email = email

        if first_name:
            user.first_name = first_name.strip()
        if last_name:
            user.last_name = last_name.strip()

        if profile_picture:
            try:
                # Validate file extension and size
                FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png'])(profile_picture)
                validate_image_size(profile_picture)
                if user.profile_picture:
                    if os.path.exists(user.profile_picture.path):
                        os.remove(user.profile_picture.path)
                user.profile_picture = profile_picture
            except ValidationError as e:
                return Response({
                    'success': False,
                    'message': str(e)
                }, status=status.HTTP_400_BAD_REQUEST)

        user.save()

        GenericNotification.objects.create(
            title="Profile Updated",
            message="Your profile has been updated.",
            target_role='student',
            created_by=user
        )

        return Response({
            'success': True,
            'data': {
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'profile_picture': user.profile_picture.url if user.profile_picture else None
            }
        }, status=status.HTTP_200_OK)

    except Student.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Student not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error("Profile update error: %s", str(e))
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# 18. Get Announcements
@api_view(['GET'])
@permission_classes([IsStudent])
def get_announcements(request):
    try:
        student = Student.objects.get(user=request.user)
        announcements = Announcement.objects.filter(
            branch=student.branch,
            target__in=['students', 'both']
        ).order_by('-created_at')
        data = [
            {
                'title': a.title,
                'content': a.content,
                'created_at': a.created_at.strftime('%Y-%m-%d')
            } for a in announcements
        ]
        return Response({
            'success': True,
            'data': data
        }, status=status.HTTP_200_OK)
    except Student.DoesNotExist:
        return Response({'success': False, 'message': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error("Announcements error: %s", str(e))
        return Response({'success': False, 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# 20. Manage Chat
@api_view(['GET', 'POST'])
@permission_classes([IsStudent])
def manage_chat(request):
    try:
        student = Student.objects.get(user=request.user)
        if request.method == 'GET':
            channels = ChatChannel.objects.filter(participants=student.user)
            data = [
                {
                    'id': str(c.id),
                    'type': c.channel_type,
                    'subject': c.subject.name if c.subject else None,
                    'participants': [p.username for p in c.participants.all()]
                } for c in channels
            ]
            return Response({'success': True, 'data': data}, status=status.HTTP_200_OK)
        else:
            channel_id = request.data.get('channel_id')
            message = request.data.get('message')
            if not message:
                return Response({'success': False, 'message': 'Message required'}, status=status.HTTP_400_BAD_REQUEST)
            if channel_id:
                channel = ChatChannel.objects.get(id=channel_id, participants=student.user)
            else:
                proctor = student.proctor
                if not proctor:
                    return Response({'success': False, 'message': 'No proctor assigned'}, status=status.HTTP_400_BAD_REQUEST)
                channel, _ = ChatChannel.objects.get_or_create(
                    channel_type='private',
                    branch=student.branch,
                    name=f"{student.usn}_proctor"
                )
                channel.participants.add(student.user, proctor)
            ChatMessage.objects.create(channel=channel, sender=student.user, content=message)
            Notification.objects.create(
                student=student,
                title="Message Sent",
                message=f"Message sent in {channel.name}."
            )
            return Response({'success': True, 'message': 'Message sent'}, status=status.HTTP_201_CREATED)
    except (Student.DoesNotExist, ChatChannel.DoesNotExist):
        return Response({'success': False, 'message': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error("Chat error: %s", str(e))
        return Response({'success': False, 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# 21. Get Notifications
@api_view(['GET'])
@permission_classes([IsStudent])
def get_notifications(request):
    try:
        student = Student.objects.get(user=request.user)
        notifications = Notification.objects.filter(student=student).order_by('-created_at')
        data = [
            {
                'id': str(n.id),
                'title': n.title,
                'message': n.message,
                'created_at': n.created_at.strftime('%Y-%m-%d'),
                'read': n.read
            } for n in notifications
        ]
        notifications.filter(read=False).update(read=True)
        return Response({
            'success': True,
            'data': data
        }, status=status.HTTP_200_OK)
    except Student.DoesNotExist:
        return Response({'success': False, 'message': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error("Notifications error: %s", str(e))
        return Response({'success': False, 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# 22. Weekly Schedule
class WeeklyScheduleView(views.APIView):
    permission_classes = [IsStudent]
    def get(self, request):
        try:
            student = Student.objects.get(user=request.user)
            timetable = Timetable.objects.filter(
                faculty_assignment__branch=student.branch,
                faculty_assignment__semester=student.semester,
                faculty_assignment__section=student.section
            ).select_related('faculty_assignment__subject')
            schedule = {day: [] for day in ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']}
            for t in timetable:
                schedule[t.get_day_display()].append({
                    'subject': t.faculty_assignment.subject.name,
                    'start_time': t.start_time.strftime('%H:%M'),
                    'end_time': t.end_time.strftime('%H:%M')
                })
            return Response({
                'success': True,
                'data': schedule
            }, status=status.HTTP_200_OK)
        except Student.DoesNotExist:
            return Response({'success': False, 'message': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error("Weekly schedule error: %s", str(e))
            return Response({'success': False, 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
@api_view(['POST'])
@permission_classes([IsStudent])
def upload_face_encodings(request):
    """Upload and validate face images for encoding."""
    files = request.FILES.getlist('images')
    if len(files) < 3:
        return Response({
            'success': False,
            'message': 'At least 3 images required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        student = Student.objects.get(user=request.user)
        encodings = []
        
        for file in files:
            img_bytes = file.read()
            nparr = np.frombuffer(img_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # Validate single face and quality using DLib
            from .utils import face_detector, shape_predictor, face_recognizer
            if not face_detector:
                return Response({
                    'success': False,
                    'message': 'Face recognition system unavailable'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            faces = face_detector(gray)
            if len(faces) != 1:
                return Response({
                    'success': False,
                    'message': f'Image {file.name} must contain exactly one face'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Check lighting (basic brightness check)
            if np.mean(gray) < 50:
                return Response({
                    'success': False,
                    'message': f'Image {file.name} is too dark'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Extract encoding
            shape = shape_predictor(img, faces[0])
            encoding = np.array(face_recognizer.compute_face_descriptor(img, shape))
            encodings.append(encoding)
        
        # Verify consistency across encodings
        from .utils import compute_face_distance
        for i in range(len(encodings)):
            for j in range(i + 1, len(encodings)):
                distance = compute_face_distance(encodings[i], encodings[j])
                if distance > 0.4:
                    return Response({
                        'success': False,
                        'message': 'Images do not depict the same person'
                    }, status=status.HTTP_400_BAD_REQUEST)
        
        # Store encodings
        student.set_face_encodings(encodings)
        
        # Notify student
        Notification.objects.create(
            title="Face Encoding Registered",
            message="Your face encodings have been successfully uploaded",
            target_role='student',
            created_by=request.user
        )
        
        logger.info("Face encodings uploaded for student %s", student.usn)
        return Response({
            'success': True,
            'message': 'Face encodings registered successfully'
        }, status=status.HTTP_201_CREATED)
    
    except Exception as e:
        logger.error("Error uploading face encodings: %s", str(e))
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
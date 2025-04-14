from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from ..permissions import IsAdmin
from ..models import User, Branch, Student, Subject, Semester, Section, LeaveRequest, GenericNotification
import logging
from django.contrib.auth.hashers import make_password
from django.utils import timezone
from django.core.exceptions import ValidationError
import pandas as pd
import re
from datetime import datetime, timedelta
from calendar import monthrange
from uuid import uuid4

logger = logging.getLogger(__name__)

# 1. Dashboard Overview (Stats)
@api_view(['GET'])
@permission_classes([IsAdmin])
def stats_overview(request):
    try:
        total_students = Student.objects.count()
        total_faculty = User.objects.filter(role='teacher').count()
        total_hods = User.objects.filter(role='hod').count()
        total_branches = Branch.objects.count()
        branch_distribution = [
            {'name': b.name, 'students': b.students.count(), 'faculty': b.faculty_assignments.count()}
            for b in Branch.objects.all()
        ]
        data = {
            'total_students': total_students,
            'total_faculty': total_faculty,
            'total_hods': total_hods,
            'total_branches': total_branches,
            'branch_distribution': branch_distribution,
            'role_distribution': {
                'students': total_students,
                'faculty': total_faculty,
                'hods': total_hods,
                'admins': User.objects.filter(role='admin').count()
            }
        }
        return Response({'success': True, 'data': data}, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error fetching stats: {str(e)}")
        return Response({'success': False, 'message': f'Error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# 2. User Enrollment (Manual HOD/Faculty)
@api_view(['POST'])
@permission_classes([IsAdmin])
def enroll_user(request):
    username = request.data.get('username')
    email = request.data.get('email')
    role = request.data.get('role')
    first_name = request.data.get('first_name')
    last_name = request.data.get('last_name', '')

    if not all([username, email, role, first_name]):
        return Response({'success': False, 'message': 'Username, email, role, and first name required'}, status=status.HTTP_400_BAD_REQUEST)
    if role not in ['hod', 'teacher']:
        return Response({'success': False, 'message': 'Role must be hod or teacher'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        if User.objects.filter(username=username).exists():
            return Response({'success': False, 'message': 'Username already taken'}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(email=email).exists():
            return Response({'success': False, 'message': 'Email already in use'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create(
            username=username,
            email=email,
            password=make_password('default@123'),
            role=role,
            first_name=first_name,
            last_name=last_name,
            is_active=True
        )
        GenericNotification.objects.create(
            title="Account Created",
            message=f"Your account has been created. Username: {username}, Password: default@123",
            target_role=role,
            created_by=request.user
        )
        return Response({'success': True, 'message': f'{role.capitalize()} enrolled successfully'}, status=status.HTTP_201_CREATED)
    except Exception as e:
        logger.error(f"Error enrolling user: {str(e)}")
        return Response({'success': False, 'message': f'Error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# 3. Bulk Faculty Enrollment
@api_view(['POST'])
@permission_classes([IsAdmin])
def bulk_upload_faculty(request):
    try:
        file = request.FILES.get('file')
        if not file or not file.name.endswith(('.xlsx', '.csv')):
            return Response({'success': False, 'message': 'Upload a valid Excel (.xlsx) or CSV (.csv) file'}, status=status.HTTP_400_BAD_REQUEST)

        # Read file
        if file.name.endswith('.xlsx'):
            df = pd.read_excel(file)
        else:
            df = pd.read_csv(file)
        
        required_columns = ['name', 'email']
        if not all(col in df.columns for col in required_columns):
            return Response({'success': False, 'message': 'File must contain name and email columns'}, status=status.HTTP_400_BAD_REQUEST)

        created_faculty = []
        errors = []
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'

        for index, row in df.iterrows():
            name = str(row['name']).strip()
            email = str(row['email']).strip()

            # Validate inputs
            if not name:
                errors.append(f"Row {index + 2}: Name is empty")
                continue
            if not email or not re.match(email_regex, email):
                errors.append(f"Row {index + 2}: Invalid email format: {email}")
                continue
            if User.objects.filter(email=email).exists():
                errors.append(f"Row {index + 2}: Email already in use: {email}")
                continue

            # Derive username
            username = email.split('@')[0]
            if User.objects.filter(username=username).exists():
                username = f"{username}_{uuid4().hex[:4]}"
            first_name = name.split()[0]
            last_name = ' '.join(name.split()[1:]) if len(name.split()) > 1 else ''

            # Create user
            user = User.objects.create(
                username=username,
                email=email,
                password=make_password('default@123'),
                role='teacher',
                first_name=first_name,
                last_name=last_name,
                is_active=True
            )
            GenericNotification.objects.create(
                title="Faculty Account Created",
                message=f"Your faculty account has been created. Username: {username}, Password: default@123",
                target_role='teacher',
                created_by=request.user
            )
            created_faculty.append({'name': name, 'email': email, 'username': username})

        response = {
            'success': bool(created_faculty),
            'created': created_faculty,
            'errors': errors,
            'message': f"Processed {len(df)} rows: {len(created_faculty)} faculty created, {len(errors)} errors"
        }
        status_code = status.HTTP_201_CREATED if created_faculty else status.HTTP_400_BAD_REQUEST
        return Response(response, status=status_code)
    except Exception as e:
        logger.error(f"Error in bulk faculty upload: {str(e)}")
        return Response({'success': False, 'message': f'Error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# 4. Branch Management
@api_view(['GET', 'POST', 'PUT', 'DELETE'])
@permission_classes([IsAdmin])
def manage_branches(request, branch_id=None):
    try:
        if request.method == 'GET':
            branches = Branch.objects.all()
            branches_data = [
                {
                    'id': b.id,
                    'name': b.name,
                    'hod': {'id': b.hod.id, 'username': b.hod.username} if b.hod else None,
                    'semesters': [s.number for s in b.semesters.all()],
                    'sections': [{'name': sec.name, 'semester': sec.semester.number} for sec in Section.objects.filter(branch=b)]
                } for b in branches
            ]
            return Response({'success': True, 'branches': branches_data}, status=status.HTTP_200_OK)

        elif request.method == 'POST':
            name = request.data.get('name')
            hod_id = request.data.get('hod_id')
            if not name:
                return Response({'success': False, 'message': 'Branch name required'}, status=status.HTTP_400_BAD_REQUEST)
            if Branch.objects.filter(name=name).exists():
                return Response({'success': False, 'message': 'Branch already exists'}, status=status.HTTP_400_BAD_REQUEST)

            hod = User.objects.get(id=hod_id, role='hod') if hod_id else None
            branch = Branch.objects.create(name=name, hod=hod)
            
            # Auto-generate semesters and sections
            for sem in range(1, 9):
                semester = Semester.objects.create(number=sem, branch=branch)
                for sec in 'ABCDEFG':
                    Section.objects.create(name=sec, branch=branch, semester=semester)

            if hod:
                GenericNotification.objects.create(
                    title="HOD Assignment",
                    message=f"You have been assigned as HOD for branch: {name}",
                    target_role='hod',
                    created_by=request.user
                )
            return Response({'success': True, 'message': 'Branch created successfully'}, status=status.HTTP_201_CREATED)

        elif request.method == 'PUT':
            if not branch_id:
                return Response({'success': False, 'message': 'Branch ID required'}, status=status.HTTP_400_BAD_REQUEST)
            branch = Branch.objects.get(id=branch_id)
            name = request.data.get('name', branch.name)
            hod_id = request.data.get('hod_id')

            if Branch.objects.filter(name=name).exclude(id=branch_id).exists():
                return Response({'success': False, 'message': 'Branch name already taken'}, status=status.HTTP_400_BAD_REQUEST)

            old_hod = branch.hod
            branch.name = name
            branch.hod = User.objects.get(id=hod_id, role='hod') if hod_id else None
            branch.save()

            if branch.hod and branch.hod != old_hod:
                GenericNotification.objects.create(
                    title="HOD Assignment",
                    message=f"You have been assigned as HOD for branch: {name}",
                    target_role='hod',
                    created_by=request.user
                )
            if old_hod and old_hod != branch.hod:
                GenericNotification.objects.create(
                    title="HOD Removal",
                    message=f"You have been removed as HOD from branch: {name}",
                    target_role='hod',
                    created_by=request.user
                )
            return Response({'success': True, 'message': 'Branch updated successfully'}, status=status.HTTP_200_OK)

        elif request.method == 'DELETE':
            if not branch_id:
                return Response({'success': False, 'message': 'Branch ID required'}, status=status.HTTP_400_BAD_REQUEST)
            branch = Branch.objects.get(id=branch_id)
            if branch.hod:
                GenericNotification.objects.create(
                    title="Branch Deletion",
                    message=f"Branch {branch.name} has been deleted, and your HOD assignment has been removed",
                    target_role='hod',
                    created_by=request.user
                )
            branch.delete()
            return Response({'success': True, 'message': 'Branch deleted successfully'}, status=status.HTTP_200_OK)

    except User.DoesNotExist:
        return Response({'success': False, 'message': 'HOD not found'}, status=status.HTTP_404_NOT_FOUND)
    except Branch.DoesNotExist:
        return Response({'success': False, 'message': 'Branch not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error managing branch: {str(e)}")
        return Response({'success': False, 'message': f'Error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# 5. Notifications Center
@api_view(['GET', 'POST'])
@permission_classes([IsAdmin])
def manage_notifications(request):
    try:
        if request.method == 'GET':
            notifications = GenericNotification.objects.all().order_by('-created_at')
            notifications_data = [
                {
                    'id': n.id,
                    'title': n.title,
                    'message': n.message,
                    'target_role': n.target_role,
                    'created_at': n.created_at,
                    'scheduled_at': n.scheduled_at
                } for n in notifications
            ]
            return Response({'success': True, 'notifications': notifications_data}, status=status.HTTP_200_OK)

        elif request.method == 'POST':
            title = request.data.get('title')
            message = request.data.get('message')
            target_role = request.data.get('target_role', 'all')
            scheduled_at = request.data.get('scheduled_at')

            if not all([title, message]):
                return Response({'success': False, 'message': 'Title and message required'}, status=status.HTTP_400_BAD_REQUEST)
            if target_role not in ['student', 'teacher', 'hod', 'admin', 'all']:
                return Response({'success': False, 'message': 'Invalid target role'}, status=status.HTTP_400_BAD_REQUEST)

            notification_data = {
                'title': title,
                'message': message,
                'target_role': target_role,
                'created_by': request.user
            }
            if scheduled_at:
                try:
                    notification_data['scheduled_at'] = datetime.fromisoformat(scheduled_at)
                except ValueError:
                    return Response({'success': False, 'message': 'Invalid scheduled_at format (use ISO format)'}, status=status.HTTP_400_BAD_REQUEST)

            GenericNotification.objects.create(**notification_data)
            return Response({'success': True, 'message': 'Notification created successfully'}, status=status.HTTP_201_CREATED)

    except Exception as e:
        logger.error(f"Error managing notifications: {str(e)}")
        return Response({'success': False, 'message': f'Error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# 6. Leave Management
@api_view(['GET', 'POST'])
@permission_classes([IsAdmin])
def manage_hod_leaves(request):
    try:
        if request.method == 'GET':
            month = request.query_params.get('month', datetime.now().strftime('%Y-%m'))
            try:
                year, month = map(int, month.split('-'))
                start_date = datetime(year, month, 1)
                _, last_day = monthrange(year, month)
                end_date = datetime(year, month, last_day)
            except ValueError:
                return Response({'success': False, 'message': 'Invalid month format (use YYYY-MM)'}, status=status.HTTP_400_BAD_REQUEST)

            leaves = LeaveRequest.objects.filter(
                faculty__role='hod',
                start_date__lte=end_date,
                end_date__gte=start_date
            ).select_related('faculty', 'branch')
            
            leave_data = [
                {
                    'id': lr.id,
                    'hod': {'id': lr.faculty.id, 'username': lr.faculty.username},
                    'branch': lr.branch.name,
                    'start_date': lr.start_date,
                    'end_date': lr.end_date,
                    'reason': lr.reason,
                    'status': lr.status,
                    'submitted_at': lr.submitted_at
                } for lr in leaves
            ]
            
            # Calendar view
            calendar = []
            current_date = start_date
            while current_date <= end_date:
                day_leaves = [lr for lr in leave_data if lr['start_date'] <= current_date.date() <= lr['end_date']]
                calendar.append({
                    'date': current_date.date(),
                    'leaves': [{'id': lr['id'], 'hod': lr['hod']['username'], 'status': lr['status']} for lr in day_leaves]
                })
                current_date += timedelta(days=1)

            return Response({
                'success': True,
                'leaves': leave_data,
                'calendar': calendar
            }, status=status.HTTP_200_OK)

        elif request.method == 'POST':
            leave_id = request.data.get('leave_id')
            action = request.data.get('action')
            if not all([leave_id, action]):
                return Response({'success': False, 'message': 'Leave ID and action required'}, status=status.HTTP_400_BAD_REQUEST)
            if action not in ['APPROVE', 'REJECT']:
                return Response({'success': False, 'message': 'Action must be APPROVE or REJECT'}, status=status.HTTP_400_BAD_REQUEST)

            leave = LeaveRequest.objects.get(id=leave_id, faculty__role='hod')
            leave.status = action
            leave.reviewed_at = timezone.now()
            leave.reviewed_by = request.user
            leave.save()

            GenericNotification.objects.create(
                title=f"Leave Request {action}d",
                message=f"Your leave request from {leave.start_date} to {leave.end_date} has been {action.lower()}d.",
                target_role='hod',
                created_by=request.user
            )
            return Response({'success': True, 'message': f'Leave {action.lower()}d successfully'}, status=status.HTTP_200_OK)

    except LeaveRequest.DoesNotExist:
        return Response({'success': False, 'message': 'Leave request not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error managing HOD leaves: {str(e)}")
        return Response({'success': False, 'message': f'Error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# 7. User Directory
@api_view(['GET', 'POST'])
@permission_classes([IsAdmin])
def user_directory(request):
    try:
        if request.method == 'GET':
            users = User.objects.all().select_related('student_profile')
            users_data = [
                {
                    'id': u.id,
                    'username': u.username,
                    'email': u.email,
                    'role': u.role,
                    'first_name': u.first_name,
                    'last_name': u.last_name,
                    'is_active': u.is_active,
                    'extra': (
                        {'usn': u.student_profile.usn, 'branch': u.student_profile.branch.name}
                        if u.role == 'student' and hasattr(u, 'student_profile') else
                        {'branches': list(u.teaching_assignments.values_list('branch__name', flat=True))}
                        if u.role == 'teacher' else
                        {'branch': u.managed_branch.name} if u.role == 'hod' and hasattr(u, 'managed_branch') else
                        {}
                    )
                } for u in users
            ]
            return Response({'success': True, 'users': users_data}, status=status.HTTP_200_OK)

        elif request.method == 'POST':
            user_id = request.data.get('user_id')
            action = request.data.get('action')
            updates = request.data.get('updates', {})

            if not all([user_id, action]):
                return Response({'success': False, 'message': 'User ID and action required'}, status=status.HTTP_400_BAD_REQUEST)
            if action not in ['edit', 'deactivate', 'delete']:
                return Response({'success': False, 'message': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)

            user = User.objects.get(id=user_id)
            
            if action == 'edit':
                username = updates.get('username', user.username)
                email = updates.get('email', user.email)
                first_name = updates.get('first_name', user.first_name)
                last_name = updates.get('last_name', user.last_name)

                if User.objects.filter(username=username).exclude(id=user_id).exists():
                    return Response({'success': False, 'message': 'Username already taken'}, status=status.HTTP_400_BAD_REQUEST)
                if email and User.objects.filter(email=email).exclude(id=user_id).exists():
                    return Response({'success': False, 'message': 'Email already in use'}, status=status.HTTP_400_BAD_REQUEST)

                user.username = username
                user.email = email
                user.first_name = first_name
                user.last_name = last_name
                user.save()
                
                GenericNotification.objects.create(
                    title="Account Updated",
                    message=f"Your account details have been updated. New email: {email}",
                    target_role=user.role,
                    created_by=request.user
                )
                return Response({'success': True, 'message': 'User updated successfully'}, status=status.HTTP_200_OK)

            elif action == 'deactivate':
                if user.role == 'hod':
                    Branch.objects.filter(hod=user).update(hod=None)
                user.is_active = False
                user.save()
                GenericNotification.objects.create(
                    title="Account Deactivated",
                    message="Your account has been deactivated by the admin.",
                    target_role=user.role,
                    created_by=request.user
                )
                return Response({'success': True, 'message': 'User deactivated successfully'}, status=status.HTTP_200_OK)

            elif action == 'delete':
                if user.role == 'teacher':
                    user.teaching_assignments.all().delete()
                elif user.role == 'hod':
                    Branch.objects.filter(hod=user).update(hod=None)
                user.delete()
                return Response({'success': True, 'message': 'User deleted successfully'}, status=status.HTTP_200_OK)

    except User.DoesNotExist:
        return Response({'success': False, 'message': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error in user directory: {str(e)}")
        return Response({'success': False, 'message': f'Error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
from django.urls import path
from .views import hod_views, student_views, admin_views, faculty_views

urlpatterns = [
    # Student endpoints (unprefixed as per original design)
    path('login/', student_views.login_view, name='login'),
    path('verify-otp/', student_views.verify_otp, name='verify_otp'),
    path('resend-otp/', student_views.resend_otp, name='resend_otp'),
    path('forgot-password/', student_views.forgot_password, name='forgot_password'),
    path('reset-password/', student_views.reset_password, name='reset_password'),
    path('register/', student_views.register_student, name='register_student'),
    path('student-attendance/', student_views.get_student_attendance, name='get_student_attendance'),
    path('submit-student-leave-request/', student_views.submit_student_leave_request, name='submit_student_leave_request'),
    path('student-leave-requests/', student_views.get_student_leave_requests, name='student_get_leave_requests'),

    # Faculty endpoints
    path('faculty/take-attendance/', faculty_views.take_attendance, name='take_attendance'),
    path('faculty/enroll/', faculty_views.enroll, name='enroll_student'),
    path('faculty/generate-statistics/', faculty_views.generate_statistics, name='faculty_generate_statistics'),
    path('faculty/download-pdf/<str:filename>/', faculty_views.download_pdf, name='download_pdf'),
    path('faculty/students/', faculty_views.get_students, name='get_students'),
    path('faculty/submit-leave-request/', faculty_views.submit_leave_request, name='submit_leave_request'),
    path('faculty/leave-requests/', faculty_views.get_leave_requests, name='faculty_get_leave_requests'),
    path('faculty/student-leave-requests/', faculty_views.get_student_leave_requests, name='get_student_leave_requests'),
    path('faculty/manage-student-leave-request/', faculty_views.manage_student_leave_request, name='manage_student_leave_request'),

    # HOD endpoints
    path('hod/subjects/', hod_views.get_subjects, name='get_subjects'),
    path('hod/attendance-files/', hod_views.get_attendance_files, name='get_attendance_files'),
    path('hod/generate-statistics/', hod_views.generate_statistics, name='hod_generate_statistics'),
    path('hod/download-file/<str:filename>/', hod_views.download_file, name='download_file'),  # Updated to match hod_views.py
    path('hod/leave-requests/', hod_views.get_leave_requests, name='hod_get_leave_requests'),
    path('hod/manage-leave-request/', hod_views.manage_leave_request, name='manage_leave_request'),

    # Admin endpoints (assuming admin_views is empty or placeholder for now)
    # Add admin paths here if needed, e.g., path('admin/some-endpoint/', admin_views.some_view, name='some_view'),
]
from django.urls import path
from .views import hod_views, student_views, admin_views, faculty_views

app_name = 'api'

urlpatterns = [
    # Authentication endpoints
    path('login/', student_views.login_view, name='login'),
    path('forgot-password/', student_views.forgot_password, name='forgot_password'),
    path('verify-otp/', student_views.verify_otp, name='verify_otp'),
    path('resend-otp/', student_views.resend_otp, name='resend_otp'),
    path('reset-password/', student_views.reset_password, name='reset_password'),

    # Student endpoints
    path('student/dashboard/', student_views.dashboard_overview, name='student_dashboard'),
    path('student/timetable/', student_views.get_timetable, name='get_student_timetable'),
    path('student/weekly-schedule/', student_views.WeeklyScheduleView.as_view(), name='student_weekly_schedule'),
    path('student/attendance/', student_views.get_student_attendance, name='get_student_attendance'),
    path('student/internal-marks/', student_views.get_internal_marks, name='get_student_internal_marks'),
    path('student/submit-leave-request/', student_views.submit_student_leave_request, name='submit_student_leave_request'),
    path('student/leave-requests/', student_views.get_student_leave_requests, name='get_student_leave_requests'),
    path('student/upload-certificate/', student_views.upload_certificate, name='upload_certificate'),
    path('student/certificates/', student_views.get_certificates, name='get_certificates'),
    path('student/delete-certificate/', student_views.delete_certificate, name='delete_certificate'),
    path('student/update-profile/', student_views.update_profile, name='update_profile'),
    path('student/announcements/', student_views.get_announcements, name='get_student_announcements'),
    path('student/chat/', student_views.manage_chat, name='student_chat'),
    path('student/notifications/', student_views.get_notifications, name='get_student_notifications'),
    path('check-auth/', student_views.check_auth, name='check_auth'),
    path('logout/', student_views.logout, name='logout'),
    path('student/upload-face-encodings/', student_views.upload_face_encodings, name='upload_face_encodings'),

    # Faculty endpoints
    path('faculty/dashboard/', faculty_views.dashboard_overview, name='faculty_dashboard'),
    path('faculty/take-attendance/', faculty_views.take_attendance, name='take_attendance'),
    path('faculty/upload-marks/', faculty_views.upload_internal_marks, name='upload_internal_marks'),
    path('faculty/apply-leave/', faculty_views.apply_leave, name='apply_leave'),
    path('faculty/attendance-records/', faculty_views.view_attendance_records, name='view_attendance_records'),
    path('faculty/announcements/', faculty_views.create_announcement, name='create_announcement'),
    path('faculty/proctor-students/', faculty_views.get_proctor_students, name='get_proctor_students'),
    path('faculty/manage-student-leave/', faculty_views.manage_student_leave, name='manage_student_leave'),
    path('faculty/timetable/', faculty_views.get_timetable, name='get_faculty_timetable'),
    path('faculty/chat/', faculty_views.manage_chat, name='manage_chat'),
    path('faculty/profile/', faculty_views.manage_profile, name='manage_profile'),
    path('faculty/schedule-mentoring/', faculty_views.schedule_mentoring, name='schedule_mentoring'),
    path('faculty/generate-statistics/', faculty_views.generate_statistics, name='generate_statistics'),
    path('faculty/download-pdf/<str:filename>/', faculty_views.download_pdf, name='download_pdf'),

    # HOD endpoints
    path('hod/dashboard-stats/', hod_views.dashboard_stats, name='hod_stats'),
    path('hod/low-attendance/', hod_views.low_attendance_students, name='hod_low_attendance'),
    path('hod/semesters/', hod_views.manage_semesters, name='hod_semesters'),
    path('hod/sections/', hod_views.manage_sections, name='hod_sections'),
    path('hod/students/', hod_views.manage_students, name='hod_manage_students'),
    path('hod/subjects/', hod_views.manage_subjects, name='hod_subjects'),
    path('hod/faculty-assignments/', hod_views.manage_faculty_assignments, name='hod_faculty_assignments'),
    path('hod/timetable/', hod_views.manage_timetable, name='hod_timetable'),
    path('hod/leaves/', hod_views.manage_leaves, name='hod_leaves'),
    path('hod/attendance/', hod_views.get_attendance, name='hod_attendance'),
    path('hod/marks/', hod_views.get_marks, name='hod_marks'),
    path('hod/announcements/', hod_views.create_announcement, name='hod_create_announcement'),
    path('hod/notifications/', hod_views.send_notification, name='hod_notifications'),
    path('hod/proctors/', hod_views.assign_proctor, name='hod_assign_proctor'),
    path('hod/chat/', hod_views.manage_chat, name='hod_chat'),
    path('hod/profile/', hod_views.manage_profile, name='hod_profile'),

    # Admin endpoints
    path('admin/stats-overview/', admin_views.stats_overview, name='admin_stats_overview'),
    path('admin/enroll-user/', admin_views.enroll_user, name='admin_enroll_user'),
    path('admin/bulk-upload-faculty/', admin_views.bulk_upload_faculty, name='admin_bulk_upload_faculty'),
    path('admin/branches/', admin_views.manage_branches, name='admin_manage_branches'),
    path('admin/branches/<int:branch_id>/', admin_views.manage_branches, name='admin_manage_branch'),
    path('admin/notifications/', admin_views.manage_notifications, name='admin_manage_notifications'),
    path('admin/hod-leaves/', admin_views.manage_hod_leaves, name='admin_manage_hod_leaves'),
    path('admin/users/', admin_views.user_directory, name='admin_user_directory'),
]
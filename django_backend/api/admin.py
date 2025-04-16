from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.hashers import make_password
from django.utils import timezone
from django import forms
from .models import (
    User, Student, Branch, Semester, Section, Subject, FacultyAssignment,
    AttendanceRecord, AttendanceDetail, LeaveRequest, StudentLeaveRequest,
    Certificate, Timetable, InternalMark, Announcement, Notification
)
import logging

# Set up logging
logger = logging.getLogger(__name__)

class CertificateInline(admin.TabularInline):
    model = Certificate
    extra = 1
    fields = ('title', 'file', 'uploaded_at')
    readonly_fields = ('uploaded_at',)

class UserChoiceField(forms.ModelChoiceField):
    """Custom field to ensure User dropdowns show only first_name and role."""
    def label_from_instance(self, obj):
        return str(obj)  # Explicitly use User.__str__

class StudentInline(admin.StackedInline):
    model = Student
    can_delete = False
    fk_name = 'user'
    fields = ('name', 'usn', 'branch', 'semester', 'section', 'proctor')  # Removed profile_picture
    autocomplete_fields = ('semester', 'section', 'branch', 'user')

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == 'proctor':
            kwargs['queryset'] = User.objects.filter(role='teacher').order_by('first_name')
            kwargs['form_class'] = UserChoiceField
            logger.debug(f"Proctor queryset: {[str(u) for u in kwargs['queryset']]}")
        elif db_field.name == 'user':
            kwargs['queryset'] = User.objects.filter(role='student').order_by('first_name')
            kwargs['form_class'] = UserChoiceField
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    inlines = [StudentInline]
    list_display = ('username', 'email', 'role', 'first_name', 'last_name', 'is_staff', 'is_superuser')
    list_filter = ('role', 'is_staff', 'is_superuser')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('username',)
    
    add_fieldsets = (
        (None, {'fields': ('username', 'email', 'role', 'first_name', 'last_name', 'password1', 'password2', 'profile_picture')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
    )
    fieldsets = (
        (None, {'fields': ('username', 'email', 'password', 'first_name', 'last_name', 'profile_picture')}),
        ('Personal Info', {'fields': ('role',)}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
    )
    readonly_fields = ('password',)
    
    actions = ['reset_passwords']

    def reset_passwords(self, request, queryset):
        default_password = 'newpassword123'
        updated = queryset.update(password=make_password(default_password))
        self.message_user(request, f"Reset passwords for {updated} users to '{default_password}'.")

@admin.register(Branch)
class BranchAdmin(admin.ModelAdmin):
    list_display = ('name', 'hod')
    search_fields = ('name',)
    autocomplete_fields = ('hod',)

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == 'hod':
            kwargs['queryset'] = User.objects.filter(role='hod').order_by('first_name')
            kwargs['form_class'] = UserChoiceField
            logger.debug(f"HOD queryset: {[str(u) for u in kwargs['queryset']]}")
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

@admin.register(Semester)
class SemesterAdmin(admin.ModelAdmin):
    list_display = ('number', 'branch')
    list_filter = ('branch', 'number')
    search_fields = ('branch__name',)
    ordering = ('branch', 'number')

    def formfield_for_choice_field(self, db_field, request, **kwargs):
        if db_field.name == 'number':
            kwargs['choices'] = [(i, str(i)) for i in range(1, 9)]
        return super().formfield_for_choice_field(db_field, request, **kwargs)

@admin.register(Section)
class SectionAdmin(admin.ModelAdmin):
    list_display = ('name', 'semester', 'branch')
    list_filter = ('branch', 'semester__number', 'name')
    search_fields = ('branch__name', 'name')
    ordering = ('branch', 'semester__number', 'name')
    autocomplete_fields = ('semester', 'branch')

@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'branch', 'semester')
    list_filter = ('branch', 'semester__number')
    search_fields = ('name', 'branch__name')
    ordering = ('branch', 'semester__number', 'name')
    autocomplete_fields = ('branch', 'semester')

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('name', 'usn', 'branch', 'semester', 'section', 'proctor', 'user', 'has_face_encoding', 'last_modified')
    list_filter = ('branch', 'semester__number', 'section__name', 'last_modified')
    search_fields = ('name', 'usn', 'user__username', 'user__email', 'user__first_name', 'user__last_name')
    fields = ('name', 'usn', 'branch', 'semester', 'section', 'proctor', 'user', 'last_modified')  # Removed profile_picture
    readonly_fields = ('last_modified',)
    autocomplete_fields = ('user', 'branch', 'semester', 'section')
    inlines = [CertificateInline]
    actions = ['update_semester', 'update_section']
    list_per_page = 50

    def has_face_encoding(self, obj):
        return obj.face_encoding is not None
    has_face_encoding.boolean = True
    has_face_encoding.short_description = 'Face Encoding'

    def update_semester(self, request, queryset):
        semester = Semester.objects.filter(number=6).first()
        if semester:
            updated = queryset.update(semester=semester)
            self.message_user(request, f"Updated semester to '{semester}' for {updated} students.")
        else:
            self.message_user(request, "Semester 6 not found.", level='error')

    def update_section(self, request, queryset):
        section = Section.objects.filter(name='B').first()
        if section:
            updated = queryset.update(section=section)
            self.message_user(request, f"Updated section to '{section}' for {updated} students.")
        else:
            self.message_user(request, "Section B not found.", level='error')

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == 'proctor':
            kwargs['queryset'] = User.objects.filter(role='teacher').order_by('first_name')
            kwargs['form_class'] = UserChoiceField
            logger.debug(f"Student proctor queryset: {[str(u) for u in kwargs['queryset']]}")
        elif db_field.name == 'user':
            kwargs['queryset'] = User.objects.filter(role='student').order_by('first_name')
            kwargs['form_class'] = UserChoiceField
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = ('title', 'student', 'uploaded_at')
    list_filter = ('student__branch', 'uploaded_at')
    search_fields = ('title', 'student__name')
    autocomplete_fields = ('student',)

@admin.register(FacultyAssignment)
class FacultyAssignmentAdmin(admin.ModelAdmin):
    list_display = ('faculty', 'branch', 'semester', 'section', 'subject')
    list_filter = ('branch', 'semester__number', 'section__name')
    search_fields = ('faculty__username', 'faculty__first_name', 'subject__name', 'branch__name')
    autocomplete_fields = ('subject', 'semester', 'section', 'branch')

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == 'faculty':
            kwargs['queryset'] = User.objects.filter(role='teacher').order_by('first_name')
            kwargs['form_class'] = UserChoiceField
            logger.debug(f"Faculty queryset: {[str(u) for u in kwargs['queryset']]}")
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

@admin.register(Timetable)
class TimetableAdmin(admin.ModelAdmin):
    list_display = ('faculty_assignment', 'day', 'start_time', 'end_time', 'room')
    list_filter = ('day', 'faculty_assignment__branch', 'faculty_assignment__semester__number')
    search_fields = ('faculty_assignment__subject__name', 'room')
    autocomplete_fields = ('faculty_assignment',)

@admin.register(AttendanceRecord)
class AttendanceRecordAdmin(admin.ModelAdmin):
    list_display = ('subject', 'branch', 'date', 'semester', 'section', 'faculty', 'status')
    list_filter = ('branch', 'semester__number', 'section__name', 'subject', 'date', 'status')
    search_fields = ('subject__name', 'branch__name', 'faculty__username', 'faculty__first_name')
    autocomplete_fields = ('assignment', 'semester', 'section', 'subject')

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == 'faculty':
            kwargs['queryset'] = User.objects.filter(role='teacher').order_by('first_name')
            kwargs['form_class'] = UserChoiceField
            logger.debug(f"Attendance faculty queryset: {[str(u) for u in kwargs['queryset']]}")
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

@admin.register(AttendanceDetail)
class AttendanceDetailAdmin(admin.ModelAdmin):
    list_display = ('record', 'student', 'status')
    list_filter = ('status', 'record__subject', 'record__date', 'record__branch')
    search_fields = ('student__name', 'student__usn', 'record__subject__name')
    autocomplete_fields = ('student', 'record')
    actions = ['mark_present', 'mark_absent']
    list_per_page = 50

    def mark_present(self, request, queryset):
        updated = queryset.update(status=True)
        self.message_user(request, f"Marked {updated} attendance records as Present.")

    def mark_absent(self, request, queryset):
        updated = queryset.update(status=False)
        self.message_user(request, f"Marked {updated} attendance records as Absent.")

@admin.register(LeaveRequest)
class LeaveRequestAdmin(admin.ModelAdmin):
    list_display = ('faculty', 'branch', 'start_date', 'end_date', 'status', 'submitted_at', 'reviewed_by')
    list_filter = ('status', 'branch', 'submitted_at', 'reviewed_at')
    search_fields = ('faculty__username', 'faculty__first_name', 'reason')
    fields = ('faculty', 'branch', 'start_date', 'end_date', 'reason', 'status', 'submitted_at', 'reviewed_at', 'reviewed_by')
    readonly_fields = ('submitted_at', 'reviewed_at', 'reviewed_by')
    autocomplete_fields = ('branch',)

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == 'faculty':
            kwargs['queryset'] = User.objects.filter(role__in=['teacher', 'hod']).order_by('first_name')
            kwargs['form_class'] = UserChoiceField
            logger.debug(f"Leave faculty queryset: {[str(u) for u in kwargs['queryset']]}")
        elif db_field.name == 'reviewed_by':
            kwargs['queryset'] = User.objects.filter(role='hod').order_by('first_name')
            kwargs['form_class'] = UserChoiceField
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def approve_requests(self, request, queryset):
        updated = queryset.filter(status='PENDING').update(
            status='APPROVED',
            reviewed_at=timezone.now(),
            reviewed_by=request.user
        )
        self.message_user(request, f"Approved {updated} leave requests.")

    def reject_requests(self, request, queryset):
        updated = queryset.filter(status='PENDING').update(
            status='REJECTED',
            reviewed_at=timezone.now(),
            reviewed_by=request.user
        )
        self.message_user(request, f"Rejected {updated} leave requests.")

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if not request.user.is_superuser and request.user.role == 'hod':
            return qs.filter(branch__hod=request.user, status='PENDING')
        return qs

@admin.register(StudentLeaveRequest)
class StudentLeaveRequestAdmin(admin.ModelAdmin):
    list_display = ('student', 'start_date', 'end_date', 'status', 'submitted_at', 'reviewed_by')
    list_filter = ('status', 'submitted_at', 'reviewed_at')
    search_fields = ('student__username', 'student__first_name', 'reason')
    fields = ('student', 'start_date', 'end_date', 'reason', 'status', 'submitted_at', 'reviewed_at', 'reviewed_by')
    readonly_fields = ('submitted_at', 'reviewed_at', 'reviewed_by')
    autocomplete_fields = ('student',)

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == 'student':
            kwargs['queryset'] = User.objects.filter(role='student').order_by('first_name')
            kwargs['form_class'] = UserChoiceField
        elif db_field.name == 'reviewed_by':
            kwargs['queryset'] = User.objects.filter(role='teacher').order_by('first_name')
            kwargs['form_class'] = UserChoiceField
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def approve_requests(self, request, queryset):
        updated = queryset.filter(status='PENDING').update(
            status='APPROVED',
            reviewed_at=timezone.now(),
            reviewed_by=request.user
        )
        self.message_user(request, f"Approved {updated} student leave requests.")

    def reject_requests(self, request, queryset):
        updated = queryset.filter(status='PENDING').update(
            status='REJECTED',
            reviewed_at=timezone.now(),
            reviewed_by=request.user
        )
        self.message_user(request, f"Rejected {updated} student leave requests.")

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if not request.user.is_superuser and request.user.role == 'teacher':
            return qs.filter(student__student_profile__proctor=request.user, status='PENDING')
        return qs

@admin.register(InternalMark)
class InternalMarkAdmin(admin.ModelAdmin):
    list_display = ('student', 'subject', 'test_number', 'mark', 'max_mark', 'recorded_at')
    list_filter = ('subject__branch', 'test_number', 'recorded_at')
    search_fields = ('student__name', 'subject__name')
    autocomplete_fields = ('student', 'subject')

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == 'faculty':
            kwargs['queryset'] = User.objects.filter(role='teacher').order_by('first_name')
            kwargs['form_class'] = UserChoiceField
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ('title', 'branch', 'target', 'created_at', 'created_by')
    list_filter = ('branch', 'target', 'created_at')
    search_fields = ('title', 'content')
    autocomplete_fields = ('branch',)

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == 'created_by':
            kwargs['queryset'] = User.objects.filter(role__in=['teacher', 'hod']).order_by('first_name')
            kwargs['form_class'] = UserChoiceField
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('title', 'student', 'created_at', 'read')
    list_filter = ('read', 'created_at')
    search_fields = ('title', 'message', 'student__name')
    autocomplete_fields = ('student',)
# api/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.hashers import make_password
from django.utils import timezone
from .models import User, Student, Branch, FacultyAssignment, AttendanceRecord, AttendanceDetail, LeaveRequest, StudentLeaveRequest
from .views.utils import sync_pickle_with_database

class StudentInline(admin.StackedInline):
    model = Student
    can_delete = False
    fk_name = 'user'  # Specify that the inline uses the 'user' ForeignKey

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    inlines = [StudentInline]
    list_display = ('username', 'email', 'role', 'is_staff', 'is_superuser')
    list_filter = ('role', 'is_staff', 'is_superuser')
    search_fields = ('username', 'email')
    
    add_fieldsets = (
        (None, {'fields': ('username', 'email', 'role', 'password1', 'password2')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
    )
    fieldsets = (
        (None, {'fields': ('username', 'email', 'password')}),
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

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('name', 'usn', 'branch', 'semester', 'section', 'proctor', 'user', 'last_modified')
    list_filter = ('branch', 'semester', 'section', 'last_modified')
    search_fields = ('name', 'usn')
    fields = ('name', 'usn', 'branch', 'semester', 'section', 'proctor', 'user', 'last_modified')
    readonly_fields = ('last_modified',)
    actions = ['update_semester', 'update_section', 'sync_with_pickle']

    def update_semester(self, request, queryset):
        updated = queryset.update(semester='6')
        self.message_user(request, f"Updated semester to '6' for {updated} students.")
        sync_pickle_with_database()

    def update_section(self, request, queryset):
        updated = queryset.update(section='B')
        self.message_user(request, f"Updated section to 'B' for {updated} students.")
        sync_pickle_with_database()

    def sync_with_pickle(self, request, queryset):
        sync_pickle_with_database()
        self.message_user(request, "Synced student data with pickle file.")

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        sync_pickle_with_database()

    def delete_model(self, request, obj):
        super().delete_model(request, obj)
        sync_pickle_with_database()

    def delete_queryset(self, request, queryset):
        super().delete_queryset(request, queryset)
        sync_pickle_with_database()

@admin.register(FacultyAssignment)
class FacultyAssignmentAdmin(admin.ModelAdmin):
    list_display = ('faculty', 'branch', 'semester', 'section', 'subject')
    list_filter = ('branch', 'semester', 'section')
    search_fields = ('faculty__username', 'subject')

@admin.register(AttendanceRecord)
class AttendanceRecordAdmin(admin.ModelAdmin):
    list_display = ('subject', 'branch', 'date', 'semester', 'section', 'sheet_id')
    list_filter = ('branch', 'semester', 'section', 'subject', 'date')
    search_fields = ('subject', 'branch__name')

@admin.register(AttendanceDetail)
class AttendanceDetailAdmin(admin.ModelAdmin):
    list_display = ('record', 'student', 'status')
    list_filter = ('status', 'record__subject', 'record__date')
    search_fields = ('student__name', 'student__usn', 'record__subject')
    actions = ['mark_present', 'mark_absent']

    def mark_present(self, request, queryset):
        queryset.update(status=True)

    def mark_absent(self, request, queryset):
        queryset.update(status=False)

@admin.register(LeaveRequest)
class LeaveRequestAdmin(admin.ModelAdmin):
    list_display = ('faculty', 'branch', 'start_date', 'end_date', 'status', 'submitted_at', 'reviewed_by')
    list_filter = ('status', 'branch', 'submitted_at', 'reviewed_at')
    search_fields = ('faculty__username', 'reason')
    fields = ('faculty', 'branch', 'start_date', 'end_date', 'reason', 'status', 'submitted_at', 'reviewed_at', 'reviewed_by')
    readonly_fields = ('submitted_at', 'reviewed_at', 'reviewed_by')
    actions = ['approve_requests', 'reject_requests']

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

    def save_model(self, request, obj, form, change):
        if change and obj.status in ['APPROVED', 'REJECTED'] and not obj.reviewed_by:
            obj.reviewed_by = request.user
            obj.reviewed_at = timezone.now()
        super().save_model(request, obj, form, change)

@admin.register(StudentLeaveRequest)
class StudentLeaveRequestAdmin(admin.ModelAdmin):
    list_display = ('student', 'start_date', 'end_date', 'status', 'submitted_at', 'reviewed_by')
    list_filter = ('status', 'submitted_at', 'reviewed_at')
    search_fields = ('student__username', 'reason')
    fields = ('student', 'start_date', 'end_date', 'reason', 'status', 'submitted_at', 'reviewed_at', 'reviewed_by')
    readonly_fields = ('submitted_at', 'reviewed_at', 'reviewed_by')
    actions = ['approve_requests', 'reject_requests']

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

    def save_model(self, request, obj, form, change):
        if change and obj.status in ['APPROVED', 'REJECTED'] and not obj.reviewed_by:
            obj.reviewed_by = request.user
            obj.reviewed_at = timezone.now()
        super().save_model(request, obj, form, change)
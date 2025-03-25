from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.hashers import make_password
from django.utils import timezone
from .models import User, Student, AttendanceRecord, AttendanceDetail, LeaveRequest, StudentLeaveRequest
from .views.utils import sync_pickle_with_database

# Inline for Student within UserAdmin
class StudentInline(admin.StackedInline):
    model = Student
    can_delete = False

# Custom UserAdmin inheriting from BaseUserAdmin
@admin.register(User)
class UserAdmin(BaseUserAdmin):
    inlines = [StudentInline]
    list_display = ('username', 'email', 'role', 'is_staff', 'is_superuser')
    list_filter = ('role', 'is_staff', 'is_superuser')
    search_fields = ('username', 'email')
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'role', 'password1', 'password2'),
        }),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
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
        self.message_user(request, f"Successfully reset passwords for {updated} users to '{default_password}'.")
    reset_passwords.short_description = "Reset selected users' passwords to 'newpassword123'"

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('name', 'usn', 'semester', 'section', 'user')
    list_filter = ('semester', 'section')
    search_fields = ('name', 'usn')
    fields = ('name', 'usn', 'semester', 'section', 'user')

    def delete_model(self, request, obj):
        super().delete_model(request, obj)
        sync_pickle_with_database()

    def delete_queryset(self, request, queryset):
        super().delete_queryset(request, queryset)
        sync_pickle_with_database()

@admin.register(AttendanceRecord)
class AttendanceRecordAdmin(admin.ModelAdmin):
    list_display = ('subject', 'date', 'semester', 'section', 'sheet_id')
    list_filter = ('semester', 'section', 'subject', 'date')
    search_fields = ('subject', 'semester', 'section')

@admin.register(AttendanceDetail)
class AttendanceDetailAdmin(admin.ModelAdmin):
    list_display = ('record', 'student', 'status')
    list_filter = ('status', 'record__subject', 'record__date')
    search_fields = ('student__name', 'student__usn', 'record__subject')
    actions = ['mark_present', 'mark_absent']

    def mark_present(self, request, queryset):
        queryset.update(status=True)
    mark_present.short_description = "Mark selected as Present"

    def mark_absent(self, request, queryset):
        queryset.update(status=False)
    mark_absent.short_description = "Mark selected as Absent"

@admin.register(LeaveRequest)
class LeaveRequestAdmin(admin.ModelAdmin):
    list_display = ('faculty', 'start_date', 'end_date', 'status', 'submitted_at', 'reviewed_by', 'reviewed_at')
    list_filter = ('status', 'faculty__role', 'submitted_at', 'reviewed_at')
    search_fields = ('faculty__username', 'reason')
    fields = ('faculty', 'start_date', 'end_date', 'reason', 'status', 'submitted_at', 'reviewed_at', 'reviewed_by')
    readonly_fields = ('submitted_at', 'reviewed_at', 'reviewed_by')
    actions = ['approve_requests', 'reject_requests']

    def approve_requests(self, request, queryset):
        updated = queryset.filter(status='PENDING').update(
            status='APPROVED',
            reviewed_at=timezone.now(),
            reviewed_by=request.user
        )
        self.message_user(request, f"Successfully approved {updated} leave requests.")
    approve_requests.short_description = "Approve selected leave requests"

    def reject_requests(self, request, queryset):
        updated = queryset.filter(status='PENDING').update(
            status='REJECTED',
            reviewed_at=timezone.now(),
            reviewed_by=request.user
        )
        self.message_user(request, f"Successfully rejected {updated} leave requests.")
    reject_requests.short_description = "Reject selected leave requests"

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if not request.user.is_superuser and request.user.role == 'hod':
            return qs.filter(status='PENDING')
        return qs

    def save_model(self, request, obj, form, change):
        if change and obj.status in ['APPROVED', 'REJECTED'] and not obj.reviewed_by:
            obj.reviewed_by = request.user
            obj.reviewed_at = timezone.now()
        super().save_model(request, obj, form, change)

@admin.register(StudentLeaveRequest)
class StudentLeaveRequestAdmin(admin.ModelAdmin):
    list_display = ('student', 'start_date', 'end_date', 'status', 'submitted_at', 'reviewed_by', 'reviewed_at')
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
        self.message_user(request, f"Successfully approved {updated} student leave requests.")
    approve_requests.short_description = "Approve selected student leave requests"

    def reject_requests(self, request, queryset):
        updated = queryset.filter(status='PENDING').update(
            status='REJECTED',
            reviewed_at=timezone.now(),
            reviewed_by=request.user
        )
        self.message_user(request, f"Successfully rejected {updated} student leave requests.")
    reject_requests.short_description = "Reject selected student leave requests"

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if not request.user.is_superuser and request.user.role == 'teacher':
            return qs.filter(status='PENDING')
        return qs

    def save_model(self, request, obj, form, change):
        if change and obj.status in ['APPROVED', 'REJECTED'] and not obj.reviewed_by:
            obj.reviewed_by = request.user
            obj.reviewed_at = timezone.now()
        super().save_model(request, obj, form, change)
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.hashers import make_password
from .models import User, Student, AttendanceRecord, AttendanceDetail

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
    
    readonly_fields = ('password',)  # Keeps password read-only in edit mode
    
    # Add custom actions
    actions = ['reset_passwords']

    def reset_passwords(self, request, queryset):
        """
        Reset passwords for selected users to a default value (e.g., 'newpassword123').
        """
        default_password = 'newpassword123'  # Customize this as needed
        updated = queryset.update(password=make_password(default_password))
        self.message_user(request, f"Successfully reset passwords for {updated} users to '{default_password}'.")
    reset_passwords.short_description = "Reset selected users' passwords to 'newpassword123'"

# Register other models as before
@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('name', 'usn', 'semester', 'section', 'user')
    list_filter = ('semester', 'section')
    search_fields = ('name', 'usn')
    fields = ('name', 'usn', 'semester', 'section', 'user')

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
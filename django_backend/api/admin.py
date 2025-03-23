from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.hashers import make_password
from .models import User, Student, AttendanceRecord, AttendanceDetail
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

# Register Student with sync functionality
@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('name', 'usn', 'semester', 'section', 'user')
    list_filter = ('semester', 'section')
    search_fields = ('name', 'usn')
    fields = ('name', 'usn', 'semester', 'section', 'user')

    def delete_model(self, request, obj):
        """Override to sync pickle file after single deletion."""
        super().delete_model(request, obj)
        sync_pickle_with_database()

    def delete_queryset(self, request, queryset):
        """Override to sync pickle file after bulk deletion."""
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
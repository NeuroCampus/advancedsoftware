from rest_framework.permissions import BasePermission

class IsHOD(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'hod'

class IsTeacher(BasePermission):  # Renamed from IsFaculty
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'teacher'

class IsStudent(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'student'

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'

class IsTeacherOrHOD(BasePermission):
    def has_permission(self, request, view):
        print(f"Checking permission - User: {request.user}, Role: {request.user.role}")
        return request.user.is_authenticated and request.user.role in ['teacher', 'hod']
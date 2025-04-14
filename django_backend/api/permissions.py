from rest_framework.permissions import BasePermission
from typing import Any, Set
import logging

logger = logging.getLogger(__name__)

# Define role constants to avoid hardcoding strings
ROLE_ADMIN = 'admin'
ROLE_HOD = 'hod'
ROLE_TEACHER = 'teacher'
ROLE_STUDENT = 'student'
VALID_ROLES = {ROLE_ADMIN, ROLE_HOD, ROLE_TEACHER, ROLE_STUDENT}

class BaseRolePermission(BasePermission):
    """
    Base permission class for role-based access control.
    
    Subclasses must define `allowed_roles` as a set of permitted roles.
    """
    allowed_roles: Set[str] = set()

    def has_permission(self, request: Any, view: Any) -> bool:
        """
        Check if the user is authenticated and has a role in `allowed_roles`.
        Superusers bypass role checks and are granted access automatically.
        
        Args:
            request: The incoming request object.
            view: The view being accessed.
        
        Returns:
            bool: True if the user has permission, False otherwise.
        """
        if not request.user or not request.user.is_authenticated:
            logger.debug(f"{self.__class__.__name__} check - User not authenticated")
            return False
        
        if request.user.is_superuser:
            logger.info(f"Superuser {request.user.username} granted access to {view.__class__.__name__}")
            return True
        
        user_role = getattr(request.user, 'role', None)
        
        if user_role is None:
            logger.warning(f"{self.__class__.__name__} check - User {request.user} has no role attribute")
            return False
        
        if user_role not in VALID_ROLES:
            logger.warning(f"{self.__class__.__name__} check - Invalid role '{user_role}' for user {request.user}")
            return False
        
        has_perm = user_role in self.allowed_roles
        
        logger.debug(
            f"{self.__class__.__name__} check - "
            f"User: {request.user}, Role: {user_role}, "
            f"Allowed Roles: {self.allowed_roles}, Result: {has_perm}"
        )
        return has_perm

class IsHOD(BaseRolePermission):
    """Permission check for Head of Department (HOD) role."""
    allowed_roles = {ROLE_HOD}

class IsTeacher(BaseRolePermission):
    """Permission check for Teacher role."""
    allowed_roles = {ROLE_TEACHER}

class IsStudent(BaseRolePermission):
    """Permission check for Student role."""
    allowed_roles = {ROLE_STUDENT}

class IsAdmin(BaseRolePermission):
    """Permission check for Admin role."""
    allowed_roles = {ROLE_ADMIN}

class IsTeacherOrHOD(BaseRolePermission):
    """Permission check for either Teacher or HOD roles."""
    allowed_roles = {ROLE_TEACHER, ROLE_HOD}
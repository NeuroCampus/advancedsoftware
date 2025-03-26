from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from django.core.exceptions import ValidationError

class User(AbstractUser):
    ROLE_CHOICES = (
        ('student', 'Student'),
        ('teacher', 'Teacher'),
        ('hod', 'HOD'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='student')
    email = models.EmailField(unique=True)

    groups = models.ManyToManyField(
        'auth.Group',
        related_name='api_user_groups',
        blank=True,
        help_text='The groups this user belongs to.',
        verbose_name='groups',
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='api_user_permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        verbose_name='user permissions',
    )

    def __str__(self):
        return self.username

class Student(models.Model):
    name = models.CharField(max_length=100)
    usn = models.CharField(max_length=50, unique=True)
    semester = models.CharField(max_length=10)
    section = models.CharField(max_length=10)
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        null=True,
        related_name='student_profile'
    )
    last_modified = models.DateTimeField(auto_now=True)  # Added to track updates

    def __str__(self):
        return f"{self.name} ({self.usn})"

    def clean(self):
        if self.user and self.user.role != 'student':
            raise ValidationError("The linked User must have the 'student' role.")

class AttendanceRecord(models.Model):
    date = models.DateField(auto_now_add=True)
    semester = models.CharField(max_length=10)
    section = models.CharField(max_length=10)
    subject = models.CharField(max_length=100)
    sheet_id = models.CharField(max_length=255, blank=True, null=True)
    file_path = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f"{self.subject} - {self.date} - Sem {self.semester} Sec {self.section}"

class AttendanceDetail(models.Model):
    record = models.ForeignKey(AttendanceRecord, on_delete=models.CASCADE, related_name='details')
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    status = models.BooleanField(default=False)

    class Meta:
        unique_together = ('record', 'student')

    def __str__(self):
        status = "Present" if self.status else "Absent"
        return f"{self.student.name} - {status}"

class LeaveRequest(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    )
    faculty = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='faculty_leave_requests',
        limit_choices_to={'role__in': ('teacher', 'hod')},
    )
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')
    submitted_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='faculty_reviewed_leaves',
        limit_choices_to={'role': 'hod'}
    )

    def __str__(self):
        return f"{self.faculty.username} - {self.start_date} to {self.end_date} ({self.status})"

    def clean(self):
        if self.start_date > self.end_date:
            raise ValidationError("Start date must be before or equal to end date.")

    class Meta:
        ordering = ['-submitted_at']

class StudentLeaveRequest(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    )
    student = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='student_leave_requests',
        limit_choices_to={'role': 'student'}
    )
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')
    submitted_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='student_reviewed_leaves',
        limit_choices_to={'role': 'teacher'}
    )

    def __str__(self):
        return f"{self.student.username} - {self.start_date} to {self.end_date} ({self.status})"

    def clean(self):
        if self.start_date > self.end_date:
            raise ValidationError("Start date must be before or equal to end date.")

    class Meta:
        ordering = ['-submitted_at']
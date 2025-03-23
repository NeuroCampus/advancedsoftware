from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = (
        ('student', 'Student'),
        ('teacher', 'Teacher'),
        ('hod', 'HOD'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='student')
    email = models.EmailField(unique=True)  # Required for OTP

    # Override groups and user_permissions to avoid reverse accessor clash
    groups = models.ManyToManyField(
        'auth.Group',
        related_name='api_user_groups',  # Unique related_name
        blank=True,
        help_text='The groups this user belongs to.',
        verbose_name='groups',
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='api_user_permissions',  # Unique related_name
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
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True)  # Link to User

    def __str__(self):
        return f"{self.name} ({self.usn})"

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
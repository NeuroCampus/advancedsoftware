from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator, MinValueValidator, MaxValueValidator
import numpy as np
import os
import json


def validate_image_size(value):
    """Validate that the uploaded image is within 5MB."""
    max_size = 5 * 1024 * 1024
    if value.size > max_size:
        raise ValidationError(f"Image size must not exceed 5MB. Current size: {value.size / 1024 / 1024:.2f}MB")


def validate_file_size(value):
    """Validate that the uploaded file is within 10MB."""
    max_size = 10 * 1024 * 1024
    if value.size > max_size:
        raise ValidationError(f"File size must not exceed 10MB. Current size: {value.size / 1024 / 1024:.2f}MB")


class User(AbstractUser):
    ROLE_CHOICES = (
        ('student', 'Student'),
        ('teacher', 'Teacher'),
        ('hod', 'HOD'),
        ('admin', 'Admin'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='student')
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=50, blank=False, null=False)
    last_name = models.CharField(max_length=50, blank=True, null=True)

    groups = models.ManyToManyField(
        'auth.Group',
        related_name='api_user_groups',
        blank=True,
        help_text='The groups this user belongs to.',
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='api_user_permissions',
        blank=True,
        help_text='Specific permissions for this user.',
    )

    def __str__(self):
        return f"{self.first_name} ({self.get_role_display()})"

    def clean(self):
        if not self.first_name.strip():
            raise ValidationError("First name cannot be empty.")


class Branch(models.Model):
    name = models.CharField(max_length=100, unique=True)
    hod = models.OneToOneField(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        limit_choices_to={'role': 'hod'},
        related_name='managed_branch'
    )

    def __str__(self):
        return self.name


class Semester(models.Model):
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='semesters')
    number = models.PositiveIntegerField(
        choices=[(i, str(i)) for i in range(1, 9)],
        validators=[MinValueValidator(1), MaxValueValidator(8)]
    )

    class Meta:
        unique_together = ('branch', 'number')
        indexes = [models.Index(fields=['branch', 'number'])]

    def __str__(self):
        return f"Semester {self.number} - {self.branch.name}"


class Section(models.Model):
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='sections')
    semester = models.ForeignKey(Semester, on_delete=models.CASCADE, related_name='sections')
    name = models.CharField(max_length=1, choices=[(c, c) for c in 'ABCDEFG'])

    class Meta:
        unique_together = ('branch', 'semester', 'name')
        indexes = [models.Index(fields=['branch', 'semester', 'name'])]

    def __str__(self):
        return f"Section {self.name} - Semester {self.semester.number} - {self.branch.name}"


class Subject(models.Model):
    name = models.CharField(max_length=100)
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='subjects')
    semester = models.ForeignKey(Semester, on_delete=models.CASCADE, related_name='subjects')

    class Meta:
        unique_together = ('branch', 'semester', 'name')
        indexes = [models.Index(fields=['branch', 'semester'])]

    def __str__(self):
        return f"{self.name} - {self.branch.name} (Sem {self.semester.number})"


class Student(models.Model):
    name = models.CharField(max_length=100)
    usn = models.CharField(max_length=50, unique=True)
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='students')
    semester = models.ForeignKey(Semester, on_delete=models.CASCADE, related_name='students')
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name='students')
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        null=True,
        related_name='student_profile'
    )
    proctor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='proctor_students',
        limit_choices_to={'role': 'teacher'}
    )
    last_modified = models.DateTimeField(auto_now=True)
    face_encoding = models.JSONField(null=True, blank=True)
    profile_picture = models.ImageField(
        upload_to='student_profiles/',
        null=True,
        blank=True,
        validators=[
            FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png']),
            validate_image_size
        ]
    )

    def set_face_encoding(self, encoding):
        """Store face encoding as JSON."""
        if not isinstance(encoding, np.ndarray):
            raise ValidationError("Encoding must be a NumPy array")
        if encoding.size != 128:
            raise ValidationError("Encoding must be a 128-dimensional array")
        self.face_encoding = json.dumps(encoding.tolist())
        self.save()

    def get_face_encoding(self):
        """Convert JSON back to NumPy array."""
        if self.face_encoding:
            try:
                return np.array(json.loads(self.face_encoding), dtype=np.float64)
            except ValueError as e:
                raise ValidationError(f"Invalid face encoding data: {str(e)}")
        return None

    def __str__(self):
        return f"{self.name} ({self.usn}) - {self.branch.name}"

    def clean(self):
        if self.user and self.user.role != 'student':
            raise ValidationError("The linked User must have the 'student' role.")
        if self.proctor and self.proctor.role != 'teacher':
            raise ValidationError("Proctor must be a teacher.")
        if self.semester and self.semester.branch != self.branch:
            raise ValidationError(f"Semester {self.semester} does not belong to branch {self.branch.name}.")
        if self.section and (self.section.branch != self.branch or self.section.semester != self.semester):
            raise ValidationError(f"Section {self.section.name} does not match branch {self.branch.name} or semester {self.semester.number}.")

    def save(self, *args, **kwargs):
        if self.pk:
            try:
                old_student = Student.objects.get(pk=self.pk)
                if old_student.profile_picture and self.profile_picture != old_student.profile_picture:
                    if os.path.exists(old_student.profile_picture.path):
                        os.remove(old_student.profile_picture.path)
            except Student.DoesNotExist:
                pass
        super().save(*args, **kwargs)


class Certificate(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='certificates')
    title = models.CharField(max_length=255)
    file = models.FileField(
        upload_to='certificates/',
        validators=[
            FileExtensionValidator(allowed_extensions=['pdf', 'jpg', 'jpeg', 'png']),
            validate_file_size
        ]
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.student.name}"

    def clean(self):
        if self.file.size == 0:
            raise ValidationError("Certificate file cannot be empty.")

    def save(self, *args, **kwargs):
        if self.pk:
            try:
                old_cert = Certificate.objects.get(pk=self.pk)
                if old_cert.file and self.file != old_cert.file:
                    if os.path.exists(old_cert.file.path):
                        os.remove(old_cert.file.path)
            except Certificate.DoesNotExist:
                pass
        super().save(*args, **kwargs)

    class Meta:
        indexes = [models.Index(fields=['student', 'uploaded_at'])]
        ordering = ['-uploaded_at']


class FacultyAssignment(models.Model):
    faculty = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='teaching_assignments',
        limit_choices_to={'role': 'teacher'}
    )
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='faculty_assignments')
    semester = models.ForeignKey(Semester, on_delete=models.CASCADE, related_name='faculty_assignments')
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name='faculty_assignments')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='faculty_assignments')

    class Meta:
        unique_together = ('faculty', 'branch', 'semester', 'section', 'subject')
        indexes = [models.Index(fields=['faculty', 'branch'])]

    def __str__(self):
        return f"{self.faculty.first_name} {self.faculty.last_name} - {self.subject.name} ({self.branch.name}, Sem {self.semester.number}, Sec {self.section.name})"

    def clean(self):
        if self.semester.branch != self.branch:
            raise ValidationError(f"Semester {self.semester} does not belong to branch {self.branch.name}.")
        if self.section.branch != self.branch or self.section.semester != self.semester:
            raise ValidationError(f"Section {self.section.name} does not match branch {self.branch.name} or semester {self.semester.number}.")
        if self.subject.branch != self.branch or self.subject.semester != self.semester:
            raise ValidationError(f"Subject {self.subject.name} does not match branch {self.branch.name} or semester {self.semester.number}.")


class Timetable(models.Model):
    DAY_CHOICES = (
        ('MON', 'Monday'),
        ('TUE', 'Tuesday'),
        ('WED', 'Wednesday'),
        ('THU', 'Thursday'),
        ('FRI', 'Friday'),
        ('SAT', 'Saturday'),
    )
    faculty_assignment = models.ForeignKey(
        FacultyAssignment,
        on_delete=models.CASCADE,
        related_name='timetable_entries'
    )
    day = models.CharField(max_length=3, choices=DAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    room = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        unique_together = ('faculty_assignment', 'day', 'start_time')
        indexes = [models.Index(fields=['faculty_assignment', 'day'])]

    def __str__(self):
        return f"{self.faculty_assignment.subject.name} - {self.day} {self.start_time}-{self.end_time} ({self.room})"

    def clean(self):
        if self.start_time >= self.end_time:
            raise ValidationError("Start time must be before end time.")


class AttendanceRecord(models.Model):
    date = models.DateField(auto_now_add=True)
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='attendance_records')
    semester = models.ForeignKey(Semester, on_delete=models.CASCADE, related_name='attendance_records')
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name='attendance_records')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='attendance_records')
    sheet_id = models.CharField(max_length=255, blank=True, null=True)
    file_path = models.CharField(max_length=255, blank=True, null=True)
    faculty = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='attendance_records',
        limit_choices_to={'role': 'teacher'}
    )
    assignment = models.ForeignKey(
        FacultyAssignment,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='attendance_records'
    )
    status = models.CharField(
        max_length=20,
        choices=(('pending', 'Pending'), ('completed', 'Completed')),
        default='completed'
    )

    def __str__(self):
        faculty_name = f"{self.faculty.first_name} {self.faculty.last_name}" if self.faculty else "Unknown"
        return f"{self.subject.name} - {self.date} - {self.branch.name}, Sem {self.semester.number}, Sec {self.section.name} by {faculty_name}"

    def clean(self):
        if self.semester.branch != self.branch:
            raise ValidationError(f"Semester {self.semester} does not belong to branch {self.branch.name}.")
        if self.section.branch != self.branch or self.section.semester != self.semester:
            raise ValidationError(f"Section {self.section.name} does not match branch {self.branch.name} or semester {self.semester.number}.")
        if self.subject.branch != self.branch or self.subject.semester != self.semester:
            raise ValidationError(f"Subject {self.subject.name} does not match branch {self.branch.name} or semester {self.semester.number}.")

    def save(self, *args, **kwargs):
        if not self.file_path and self.branch and self.subject and self.section and self.semester:
            timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
            self.file_path = f"attendance_{self.branch.name}_{self.semester.number}_{self.subject.name}_{self.section.name}_{timestamp}.txt"
        super().save(*args, **kwargs)


class AttendanceDetail(models.Model):
    record = models.ForeignKey(AttendanceRecord, on_delete=models.CASCADE, related_name='details')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='attendance_details')
    status = models.BooleanField(default=False)

    class Meta:
        unique_together = ('record', 'student')
        indexes = [models.Index(fields=['student'])]

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
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='leave_requests')
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

    def __str__():
        return f"{self.faculty.first_name} {self.faculty.last_name} - {self.branch.name} - {self.start_date} to {self.end_date} ({self.status})"

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
        return f"{self.student.first_name} {self.student.last_name} - {self.start_date} to {self.end_date} ({self.status})"

    def clean(self):
        if self.start_date > self.end_date:
            raise ValidationError("Start date must be before or equal to end date.")

    class Meta:
        ordering = ['-submitted_at']


class InternalMark(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='internal_marks')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='internal_marks')
    mark = models.IntegerField()
    max_mark = models.IntegerField(default=40)
    faculty = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='entered_marks',
        limit_choices_to={'role': 'teacher'}
    )
    test_number = models.IntegerField(default=1)
    recorded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('student', 'subject', 'test_number')
        indexes = [models.Index(fields=['student', 'subject'])]

    def __str__(self):
        return f"{self.student.name} - {self.subject.name} (Test {self.test_number}): {self.mark}/{self.max_mark}"

    def clean(self):
        if self.mark < 0 or self.mark > self.max_mark:
            raise ValidationError("Mark must be between 0 and the maximum mark.")
        if self.student.semester.branch != self.subject.branch or self.subject.semester != self.student.semester:
            raise ValidationError(f"Subject {self.subject.name} does not match student's branch or semester.")


class Announcement(models.Model):
    TARGET_CHOICES = (
        ('faculty', 'Faculty'),
        ('students', 'Students'),
        ('both', 'Both'),
    )
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='announcements')
    title = models.CharField(max_length=100)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='announcements',
        limit_choices_to={'role__in': ('teacher', 'hod')}
    )
    target = models.CharField(max_length=10, choices=TARGET_CHOICES, default='both')

    def __str__(self):
        return f"{self.title} - {self.branch.name} ({self.created_at})"

    class Meta:
        ordering = ['-created_at']
        indexes = [models.Index(fields=['branch', 'created_at'])]


class Notification(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    read = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.title} - {self.student.name}"

    class Meta:
        ordering = ['-created_at']
        indexes = [models.Index(fields=['student', 'created_at'])]


class GenericNotification(models.Model):
    TARGET_ROLE_CHOICES = (
        ('student', 'Student'),
        ('teacher', 'Teacher'),
        ('hod', 'HOD'),
        ('admin', 'Admin'),
        ('all', 'All'),
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    target_role = models.CharField(max_length=10, choices=TARGET_ROLE_CHOICES, default='all')
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='generic_notifications',
        limit_choices_to={'role': 'admin'}
    )
    scheduled_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.title} - {self.get_target_role_display()}"

    class Meta:
        ordering = ['-created_at']
        indexes = [models.Index(fields=['target_role', 'created_at'])]


class ChatChannel(models.Model):
    CHANNEL_TYPE_CHOICES = (
        ('subject', 'Subject'),
        ('section', 'Section'),
        ('private', 'Private'),
        ('faculty', 'Faculty'),
    )
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='chat_channels')
    name = models.CharField(max_length=100)
    channel_type = models.CharField(max_length=10, choices=CHANNEL_TYPE_CHOICES)
    subject = models.ForeignKey(
        Subject,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='chat_channels'
    )
    section = models.ForeignKey(
        Section,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='chat_channels'
    )
    participants = models.ManyToManyField(
        User,
        related_name='chat_channels',
        limit_choices_to={'role__in': ('teacher', 'student', 'hod')}
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.get_channel_type_display()}) - {self.branch.name}"

    def clean(self):
        if self.channel_type == 'subject' and not self.subject:
            raise ValidationError("Subject is required for subject-type channels.")
        if self.channel_type == 'section' and not self.section:
            raise ValidationError("Section is required for section-type channels.")
        if self.subject and self.subject.branch != self.branch:
            raise ValidationError("Subject must belong to the channel's branch.")
        if self.section and self.section.branch != self.branch:
            raise ValidationError("Section must belong to the channel's branch.")

    class Meta:
        unique_together = ('branch', 'name', 'channel_type')
        indexes = [models.Index(fields=['branch', 'channel_type'])]


class ChatMessage(models.Model):
    channel = models.ForeignKey(ChatChannel, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='chat_messages',
        limit_choices_to={'role__in': ('teacher', 'student', 'hod')}
    )
    content = models.TextField()
    sent_at = models.DateTimeField(auto_now_add=True)
    read_by = models.ManyToManyField(
        User,
        related_name='read_messages',
        blank=True,
        limit_choices_to={'role__in': ('teacher', 'student', 'hod')}
    )

    def __str__(self):
        return f"Message by {self.sender.username} in {self.channel.name} at {self.sent_at}"

    def clean(self):
        if self.sender not in self.channel.participants.all():
            raise ValidationError("Sender must be a participant in the channel.")

    class Meta:
        ordering = ['sent_at']
        indexes = [models.Index(fields=['channel', 'sent_at'])]
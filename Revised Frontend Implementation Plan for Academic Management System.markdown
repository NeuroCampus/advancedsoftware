# Revised Frontend Implementation Plan for Academic Management System

This plan outlines the exact specifications for building a frontend for the Academic Management System API, covering all endpoints defined in `urls.py` for Admin, HOD, Faculty, and Student dashboards. It includes precise GET/POST requests, request/response data, sample returns, and UI instructions to ensure no extra elements are added. The frontend uses React with Tailwind CSS, focusing on the implemented APIs and role-specific authentication flows (OTP for students, direct login for others).

---

## General Requirements

- **Tech Stack**: React (via CDN), Tailwind CSS (via CDN), modern JavaScript with JSX.
- **Authentication**:
  - JWT for secured endpoints (`BearerAuth`). Store `access_token`, `refresh_token`, and `role` in `localStorage`.
  - Student login uses OTP; Admin, HOD, Faculty use direct username/password login.
- **API Base URL**: `https://api.academic-system.com/v1`
- **UI Design**:
  - Minimalist layout: sidebar for navigation, main content area.
  - Responsive for desktop/mobile using Tailwind classes (e.g., `bg-blue-500`, `p-4`, `flex`).
  - No additional elements beyond specified endpoints.
- **Error Handling**: Display API error messages in `<div className="bg-red-500 text-white p-2 rounded">`.
- **Success Messages**: Show in `<div className="bg-green-500 text-white p-2 rounded">`.
- **Navigation**: Role-based dashboards with logout clearing `localStorage`.
- **No Forms**: Use `div` with inputs and buttons (`onClick`) due to sandbox restrictions.
- **File Uploads**: Use `<input type="file">` with `FormData` for multipart requests.

---

## Authentication Flows

### 1. Common Authentication Endpoints

- **POST /check-auth/**

  - **Purpose**: Verify user authentication.

  - **Method**: GET

  - **Headers**: `Authorization: Bearer {access_token}`

  - **Sample Response**:

    ```json
    {
      "success": true,
      "user_id": "123e4567-e89b-12d3-a456-426614174000",
      "username": "john.doe",
      "email": "john.doe@example.com",
      "role": "student",
      "department": "Computer Science",
      "profile_image": "/media/profiles/john.jpg"
    }
    ```

  - **Error Response**:

    ```json
    { "success": false, "message": "Authentication failed" }
    ```

  - **UI**: Check on app load; redirect to login if failed.

- **POST /logout/**

  - **Purpose**: Log out user, blacklist token.

  - **Method**: POST

  - **Headers**: `Authorization: Bearer {access_token}`

  - **Request Body**:

    ```json
    { "refresh": "string" }
    ```

  - **Sample Request**:

    ```json
    { "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..." }
    ```

  - **Sample Response**:

    ```json
    { "success": true, "message": "Logged out" }
    ```

  - **Error Response**:

    ```json
    { "success": false, "message": "Invalid token" }
    ```

  - **UI**: Button in sidebar; clear `localStorage`, redirect to login.

### 2. Student Login

- **POST /login/**

  - **Purpose**: Initiate OTP for student login.

  - **Request Body**:

    ```json
    { "username": "string", "password": "string" }
    ```

  - **Sample Request**:

    ```json
    { "username": "john.doe", "password": "Pass123!" }
    ```

  - **Sample Response**:

    ```json
    { "success": true, "message": "OTP sent", "user_id": "123e4567-e89b-12d3-a456-426614174000" }
    ```

  - **Error Response**:

    ```json
    { "success": false, "message": "Invalid credentials" }
    ```

- **POST /verify-otp/**

  - **Purpose**: Verify OTP, receive JWT.

  - **Request Body**:

    ```json
    { "user_id": "string", "otp": "string" }
    ```

  - **Sample Request**:

    ```json
    { "user_id": "123e4567-e89b-12d3-a456-426614174000", "otp": "123456" }
    ```

  - **Sample Response**:

    ```json
    {
      "success": true,
      "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
      "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
      "role": "student",
      "profile": {
        "user_id": "123e4567-e89b-12d3-a456-426614174000",
        "username": "john.doe",
        "email": "john.doe@example.com",
        "role": "student",
        "branch": "Computer Science",
        "semester": 5,
        "section": "A"
      }
    }
    ```

  - **Error Response**:

    ```json
    { "success": false, "message": "Invalid OTP" }
    ```

- **POST /resend-otp/**

  - **Purpose**: Resend OTP.

  - **Request Body**:

    ```json
    { "user_id": "string" }
    ```

  - **Sample Request**:

    ```json
    { "user_id": "123e4567-e89b-12d3-a456-426614174000" }
    ```

  - **Sample Response**:

    ```json
    { "success": true, "message": "OTP resent" }
    ```

  - **Error Response**:

    ```json
    { "success": false, "message": "Invalid user" }
    ```

- **POST /forgot-password/**

  - **Purpose**: Send OTP for password reset.

  - **Request Body**:

    ```json
    { "email": "string" }
    ```

  - **Sample Request**:

    ```json
    { "email": "john.doe@example.com" }
    ```

  - **Sample Response**:

    ```json
    { "success": true, "message": "OTP sent", "user_id": "123e4567-e89b-12d3-a456-426614174000" }
    ```

  - **Error Response**:

    ```json
    { "success": false, "message": "No user found" }
    ```

- **POST /reset-password/**

  - **Purpose**: Reset password with OTP.

  - **Request Body**:

    ```json
    {
      "user_id": "string",
      "otp": "string",
      "new_password": "string",
      "confirm_password": "string"
    }
    ```

  - **Sample Request**:

    ```json
    {
      "user_id": "123e4567-e89b-12d3-a456-426614174000",
      "otp": "123456",
      "new_password": "NewPass123!",
      "confirm_password": "NewPass123!"
    }
    ```

  - **Sample Response**:

    ```json
    { "success": true, "message": "Password reset, please login" }
    ```

  - **Error Response**:

    ```json
    { "success": false, "message": "Invalid OTP" }
    ```

- **UI Components**:

  - **Login Page**:
    - Inputs: `username`, `password`.
    - Buttons: "Send OTP", "Forgot Password".
    - On OTP success, redirect to OTP page.
  - **OTP Page**:
    - Inputs: `user_id` (pre-filled), `otp`.
    - Buttons: "Verify OTP", "Resend OTP".
    - On success, store tokens, redirect to Student Dashboard.
  - **Forgot Password Page**:
    - Input: `email`.
    - Button: "Send OTP".
    - Redirect to Reset Password page.
  - **Reset Password Page**:
    - Inputs: `user_id` (pre-filled), `otp`, `new_password`, `confirm_password`.
    - Button: "Reset Password".
    - On success, redirect to Login page.
  - **Error Display**: Red alert below inputs.

### 3. Other Roles Login (Admin, HOD, Faculty)

- **POST /login/**

  - **Purpose**: Direct login.

  - **Request Body**:

    ```json
    { "username": "string", "password": "string" }
    ```

  - **Sample Request**:

    ```json
    { "username": "jane.smith", "password": "Pass123!" }
    ```

  - **Sample Response**:

    ```json
    {
      "success": true,
      "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
      "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
      "role": "admin",
      "profile": {
        "user_id": "123e4567-e89b-12d3-a456-426614174001",
        "username": "jane.smith",
        "email": "jane.smith@example.com",
        "role": "admin",
        "department": "Administration"
      }
    }
    ```

  - **Error Response**:

    ```json
    { "success": false, "message": "Invalid credentials" }
    ```

- **UI Components**:

  - **Login Page**:
    - Inputs: `username`, `password`.
    - Button: "Login".
    - On success, store tokens, redirect to respective dashboard.
  - **Error Display**: Red alert below inputs.

---

## Dashboard Specifications

### 1. Admin Dashboard

- **Endpoints**:

  - **GET /admin/stats-overview/**

    - **Purpose**: System-wide stats.

    - **Headers**: `Authorization: Bearer {access_token}`

    - **Sample Response**:

      ```json
      {
        "success": true,
        "data": {
          "total_students": 500,
          "total_faculty": 50,
          "total_hods": 10,
          "branch_distribution": [
            { "branch": "Computer Science", "students": 200, "faculty": 20 },
            { "branch": "Mechanical", "students": 150, "faculty": 15 }
          ]
        }
      }
      ```

    - **Error Response**:

      ```json
      { "success": false, "message": "Forbidden" }
      ```

  - **POST /admin/enroll-user/**

    - **Purpose**: Enroll HOD/teacher.

    - **Request Body**:

      ```json
      { "email": "string", "first_name": "string", "last_name": "string", "role": "hod | teacher" }
      ```

    - **Sample Request**:

      ```json
      { "email": "new.hod@example.com", "first_name": "Alice", "last_name": "Brown", "role": "hod" }
      ```

    - **Sample Response**:

      ```json
      { "success": true, "message": "User enrolled successfully" }
      ```

  - **POST /admin/bulk-upload-faculty/**

    - **Purpose**: Upload faculty via file.

    - **Request Body**: multipart/form-data

      - `file`: CSV/Excel

    - **Sample Response**:

      ```json
      { "success": true, "message": "Faculty uploaded successfully" }
      ```

  - **GET/POST/PUT/DELETE /admin/branches/**, **PUT/DELETE /admin/branches/int:branch_id/**

    - **Purpose**: Manage branches.

    - **GET Sample Response**:

      ```json
      { "success": true, "data": [{ "id": 1, "name": "Computer Science" }, { "id": 2, "name": "Mechanical" }]}
      ```

    - **POST Request**:

      ```json
      { "name": "string", "hod_id": "string" }
      ```

    - **PUT Request** (branch_id):

      ```json
      { "name": "string", "hod_id": "string" }
      ```

    - **DELETE**: No body, use `branch_id` in URL.

  - **GET/POST /admin/notifications/**

    - **Purpose**: Create/list notifications.

    - **GET Sample Response**:

      ```json
      { "success": true, "data": [{ "title": "Update", "message": "System update", "target_role": "all" }]}
      ```

    - **POST Request**:

      ```json
      { "title": "string", "message": "string", "target_role": "admin | hod | teacher | student | all" }
      ```

  - **GET/POST /admin/hod-leaves/**

    - **Purpose**: Manage HOD leaves.

    - **GET Sample Response**:

      ```json
      { "success": true, "data": [{ "id": "uuid", "start_date": "2025-04-16", "end_date": "2025-04-18", "status": "PENDING" }]}
      ```

    - **POST Request**:

      ```json
      { "leave_id": "uuid", "status": "APPROVED | REJECTED" }
      ```

  - **GET/POST /admin/users/**

    - **Purpose**: Manage users.

    - **GET Sample Response**:

      ```json
      { "success": true, "data": [{ "id": "uuid", "username": "john.doe", "role": "student" }]}
      ```

    - **POST Request**:

      ```json
      { "user_id": "uuid", "action": "edit | deactivate | delete", "data": {} }
      ```

- **UI Components**:

  - **Sidebar**: Links: "Stats", "Enroll User", "Bulk Upload", "Branches", "Notifications", "HOD Leaves", "Users", "Logout".
  - **Stats Page**:
    - Cards: Total Students, Faculty, HODs.
    - Table: Branch, Students, Faculty.
  - **Enroll User Page**:
    - Inputs: `email`, `first_name`, `last_name`, `role` (dropdown).
    - Button: "Enroll".
  - **Bulk Upload Page**:
    - File input: CSV/Excel.
    - Button: "Upload".
  - **Branches Page**:
    - Table: ID, Name, HOD; buttons for Edit/Delete.
    - Add Branch: Inputs for `name`, `hod_id`.
  - **Notifications Page**:
    - Table: Title, Message, Target Role.
    - Add Notification: Inputs for `title`, `message`, `target_role`.
  - **HOD Leaves Page**:
    - Table: ID, Start Date, End Date, Status; Approve/Reject buttons.
  - **Users Page**:
    - Table: ID, Username, Role; Edit/Deactivate/Delete buttons.
  - **Alerts**: Green for success, red for errors.

### 2. HOD Dashboard

- **Endpoints**:

  - **GET /hod/dashboard-stats/**

    - **Purpose**: Branch stats.

    - **Sample Response**:

      ```json
      {
        "success": true,
        "data": {
          "faculty_count": 20,
          "student_count": 200,
          "pending_leaves": 5
        }
      }
      ```

  - **GET /hod/low-attendance/**

    - **Purpose**: List low-attendance students.

    - **Sample Response**:

      ```json
      { "success": true, "data": [{ "usn": "CS001", "name": "John", "percentage": 70 }]}
      ```

  - **POST /hod/semesters/**

    - **Purpose**: Manage semesters.

    - **Request Body**:

      ```json
      { "number": 1, "action": "create | update" }
      ```

  - **POST /hod/sections/**

    - **Purpose**: Manage sections.

    - **Request Body**:

      ```json
      { "name": "A", "action": "create | update" }
      ```

  - **POST /hod/students/**

    - **Purpose**: Manage students.

    - **Request Body**:

      ```json
      {
        "students": [
          { "name": "string", "usn": "string", "email": "string" }
        ],
        "action": "create | update | delete"
      }
      ```

  - **POST /hod/subjects/**

    - **Purpose**: Manage subjects.

    - **Request Body**:

      ```json
      { "name": "string", "code": "string", "action": "create | update" }
      ```

  - **GET/POST /hod/faculty-assignments/**

    - **Purpose**: Assign faculty.

    - **GET Sample Response**:

      ```json
      { "success": true, "data": [{ "faculty_id": "uuid", "subject_id": "uuid", "section_id": "uuid" }]}
      ```

    - **POST Request**:

      ```json
      { "faculty_id": "uuid", "subject_id": "uuid", "section_id": "uuid" }
      ```

  - **POST /hod/timetable/**

    - **Purpose**: Manage timetable.

    - **Request Body**:

      ```json
      {
        "entries": [
          { "day": "MON", "start_time": "09:00", "end_time": "10:00", "subject_id": "uuid", "room": "string" }
        ],
        "file": "file"
      }
      ```

  - **GET/POST /hod/leaves/**

    - **Purpose**: Manage faculty leaves.

    - **GET Sample Response**:

      ```json
      { "success": true, "data": [{ "id": "uuid", "start_date": "2025-04-16", "status": "PENDING" }]}
      ```

    - **POST Request**:

      ```json
      { "leave_id": "uuid", "status": "APPROVED | REJECTED" }
      ```

  - **GET /hod/attendance/**

    - **Purpose**: View attendance.

    - **Sample Response**:

      ```json
      { "success": true, "data": [{ "subject": "Math", "date": "2025-04-16", "status": "Present" }]}
      ```

  - **GET /hod/marks/**

    - **Purpose**: View marks.

    - **Sample Response**:

      ```json
      { "success": true, "data": [{ "subject": "Math", "test_number": 1, "mark": 85 }]}
      ```

  - **POST /hod/announcements/**

    - **Purpose**: Create announcement.

    - **Request Body**:

      ```json
      { "title": "string", "content": "string", "target": "students | faculty | both" }
      ```

  - **POST /hod/notifications/**

    - **Purpose**: Send notification.

    - **Request Body**:

      ```json
      { "title": "string", "message": "string", "target_role": "student | faculty" }
      ```

  - **POST /hod/proctors/**

    - **Purpose**: Assign proctors.

    - **Request Body**:

      ```json
      { "faculty_id": "uuid", "student_ids": ["uuid"] }
      ```

  - **GET/POST /hod/chat/**

    - **Purpose**: Manage chats.

    - **GET Sample Response**:

      ```json
      { "success": true, "data": [{ "id": "uuid", "type": "private", "participants": ["user1"] }]}
      ```

    - **POST Request**:

      ```json
      { "channel_id": "uuid", "message": "string" }
      ```

  - **GET/PATCH /hod/profile/**

    - **Purpose**: Manage profile.

    - **GET Sample Response**:

      ```json
      { "success": true, "data": { "email": "hod@example.com", "first_name": "Jane" } }
      ```

    - **PATCH Request**:

      ```json
      { "email": "string", "first_name": "string", "profile_picture": "file" }
      ```

- **UI Components**:

  - **Sidebar**: Links: "Stats", "Low Attendance", "Semesters", "Sections", "Students", "Subjects", "Faculty Assignments", "Timetable", "Leaves", "Attendance", "Marks", "Announcements", "Notifications", "Proctors", "Chat", "Profile", "Logout".
  - **Stats Page**: Cards for Faculty Count, Student Count, Pending Leaves.
  - **Low Attendance Page**: Table of USN, Name, Percentage.
  - **Semesters/Sections/Subjects Pages**: Input forms for creation/update.
  - **Students Page**: Table for input: Name, USN, Email; buttons for Create/Update/Delete.
  - **Faculty Assignments Page**: Form to assign faculty to subjects/sections.
  - **Timetable Page**: Table for entries or file upload.
  - **Leaves Page**: Table with Approve/Reject buttons.
  - **Attendance/Marks Pages**: Display tables.
  - **Announcements/Notifications Pages**: Forms to create.
  - **Proctors Page**: Form to assign faculty to students.
  - **Chat Page**: List channels, send messages.
  - **Profile Page**: Display/edit email, name, picture.
  - **Alerts**: Green/red for success/errors.

### 3. Faculty Dashboard

- **Endpoints**:

  - **GET /faculty/dashboard/**

    - **Purpose**: Faculty stats.

    - **Sample Response**:

      ```json
      {
        "success": true,
        "data": {
          "today_classes": 3,
          "attendance_avg": 85.5
        }
      }
      ```

  - **POST /faculty/take-attendance/**

    - **Purpose**: Record attendance.

    - **Request Body**: multipart/form-data

      ```json
      {
        "branch_id": "string",
        "subject_id": "string",
        "section_id": "string",
        "semester_id": "string",
        "method": "manual | ai",
        "class_images": ["file"],
        "attendance": [
          { "student_id": "uuid", "status": true }
        ]
      }
      ```

  - **POST /faculty/upload-marks/**

    - **Purpose**: Upload marks.

    - **Request Body**: multipart/form-data

      ```json
      {
        "branch_id": "string",
        "semester_id": "string",
        "section_id": "string",
        "subject_id": "string",
        "test_number": 1,
        "marks": [
          { "student_id": "uuid", "mark": 0 }
        ],
        "file": "file"
      }
      ```

  - **POST /faculty/apply-leave/**

    - **Purpose**: Apply for leave.

    - **Request Body**:

      ```json
      { "start_date": "2025-04-16", "end_date": "2025-04-18", "reason": "string" }
      ```

  - **GET /faculty/attendance-records/**

    - **Purpose**: View attendance.

    - **Sample Response**:

      ```json
      { "success": true, "data": [{ "subject": "Math", "student": "John", "percentage": 85 }]}
      ```

  - **POST /faculty/announcements/**

    - **Purpose**: Create announcement.

    - **Request Body**:

      ```json
      { "title": "string", "content": "string", "target": "students | faculty | both" }
      ```

  - **GET /faculty/proctor-students/**

    - **Purpose**: List proctored students.

    - **Sample Response**:

      ```json
      { "success": true, "data": [{ "usn": "CS001", "name": "John" }]}
      ```

  - **POST /faculty/manage-student-leave/**

    - **Purpose**: Approve/reject student leaves.

    - **Request Body**:

      ```json
      { "leave_id": "uuid", "status": "APPROVED | REJECTED" }
      ```

  - **GET /faculty/timetable/**

    - **Purpose**: View timetable.

    - **Sample Response**:

      ```json
      { "success": true, "data": [{ "day": "MON", "start_time": "09:00", "subject": "Math" }]}
      ```

  - **GET/POST /faculty/chat/**

    - **Purpose**: Manage chats.

    - **GET Sample Response**:

      ```json
      { "success": true, "data": [{ "id": "uuid", "type": "subject", "subject": "Math" }]}
      ```

  - **GET/POST /faculty/profile/**

    - **Purpose**: Manage profile.

    - **PATCH Request**:

      ```json
      { "email": "string", "first_name": "string", "profile_picture": "file" }
      ```

  - **POST /faculty/schedule-mentoring/**

    - **Purpose**: Schedule mentoring.

    - **Request Body**:

      ```json
      { "student_id": "uuid", "date": "2025-04-16", "time": "14:00" }
      ```

  - **GET /faculty/generate-statistics/**

    - **Purpose**: Generate attendance stats.

    - **Sample Response**:

      ```json
      { "success": true, "filename": "stats.pdf" }
      ```

  - **GET /faculty/download-pdf/str:filename/**

    - **Purpose**: Download PDF.
    - **Sample Response**: Binary PDF file.

- **UI Components**:

  - **Sidebar**: Links: "Dashboard", "Take Attendance", "Upload Marks", "Apply Leave", "Attendance Records", "Announcements", "Proctor Students", "Student Leaves", "Timetable", "Chat", "Profile", "Mentoring", "Statistics", "Logout".
  - **Dashboard Page**: Cards for Today’s Classes, Attendance Average.
  - **Take Attendance Page**: Dropdowns, manual table or image upload.
  - **Upload Marks Page**: Dropdowns, manual table or file upload.
  - **Apply Leave Page**: Inputs for dates, reason.
  - **Attendance Records Page**: Table of subjects, students, percentages.
  - **Announcements Page**: Form for title, content, target.
  - **Proctor Students Page**: Table of students.
  - **Student Leaves Page**: Table with Approve/Reject buttons.
  - **Timetable Page**: Display table.
  - **Chat Page**: List channels, send messages.
  - **Profile Page**: Edit email, name, picture.
  - **Mentoring Page**: Form to schedule.
  - **Statistics Page**: Button to generate, link to download PDF.
  - **Alerts**: Green/red for success/errors.

### 4. Student Dashboard

- **Endpoints**:

  - **GET /student/dashboard/**

    - **Purpose**: Student stats.

    - **Sample Response**:

      ```json
      {
        "success": true,
        "data": {
          "today_date": "2025-04-16",
          "next_class": { "subject": "Math", "start_time": "09:00", "room": "A101" },
          "attendance_status": { "average": 85.5, "below_75_count": 1 },
          "notifications": 3
        }
      }
      ```

  - **GET /student/timetable/**

    - **Purpose**: View timetable.

    - **Sample Response**:

      ```json
      { "success": true, "data": [{ "day": "MON", "start_time": "09:00", "subject": "Math" }]}
      ```

  - **GET /student/weekly-schedule/**

    - **Purpose**: Weekly schedule.

    - **Sample Response**:

      ```json
      {
        "success": true,
        "data": {
          "Monday": [{ "subject": "Math", "start_time": "09:00", "end_time": "10:00" }],
          "Tuesday": []
        }
      }
      ```

  - **GET /student/attendance/**

    - **Purpose**: View attendance.

    - **Sample Response**:

      ```json
      {
        "success": true,
        "data": {
          "Math": {
            "records": [{ "date": "2025-04-16", "status": "Present" }],
            "present": 10,
            "total": 12,
            "percentage": 83.33
          }
        }
      }
      ```

  - **GET /student/internal-marks/**

    - **Purpose**: View marks.

    - **Sample Response**:

      ```json
      {
        "success": true,
        "data": {
          "Math": [
            { "test_number": 1, "mark": 85, "max_mark": 100 }
          ]
        }
      }
      ```

  - **POST /student/submit-leave-request/**

    - **Purpose**: Submit leave.

    - **Request Body**:

      ```json
      { "start_date": "2025-04-16", "end_date": "2025-04-18", "reason": "string" }
      ```

  - **GET /student/leave-requests/**

    - **Purpose**: List leaves.

    - **Sample Response**:

      ```json
      { "success": true, "data": [{ "id": "uuid", "start_date": "2025-04-16", "status": "PENDING" }]}
      ```

  - **POST /student/upload-certificate/**

    - **Purpose**: Upload certificate.

    - **Request Body**: multipart/form-data

      ```json
      { "title": "string", "certificate": "file" }
      ```

  - **GET /student/certificates/**

    - **Purpose**: List certificates.

    - **Sample Response**:

      ```json
      { "success": true, "data": [{ "id": "uuid", "title": "Award", "file": "/media/cert.pdf" }]}
      ```

  - **DELETE /student/delete-certificate/**

    - **Purpose**: Delete certificate.

    - **Request Body**:

      ```json
      { "certificate_id": "uuid" }
      ```

  - **POST /student/update-profile/**

    - **Purpose**: Update profile.

    - **Request Body**: multipart/form-data

      ```json
      { "email": "string", "first_name": "string", "last_name": "string", "profile_picture": "file" }
      ```

  - **GET /student/announcements/**

    - **Purpose**: View announcements.

    - **Sample Response**:

      ```json
      { "success": true, "data": [{ "title": "Event", "content": "Details", "created_at": "2025-04-16" }]}
      ```

  - **GET/POST /student/chat/**

    - **Purpose**: Manage chats.

    - **GET Sample Response**:

      ```json
      { "success": true, "data": [{ "id": "uuid", "type": "private", "participants": ["proctor"] }]}
      ```

  - **GET /student/notifications/**

    - **Purpose**: View notifications.

    - **Sample Response**:

      ```json
      { "success": true, "data": [{ "id": "uuid", "title": "Update", "message": "Info" }]}
      ```

  - **POST /student/upload-face-encodings/**

    - **Purpose**: Upload face images.

    - **Request Body**: multipart/form-data

      - `images`: \[file1.jpg, file2.jpg, file3.jpg\]

    - **Sample Response**:

      ```json
      { "success": true, "message": "Face encodings registered successfully" }
      ```

- **UI Components**:

  - **Sidebar**: Links: "Dashboard", "Timetable", "Weekly Schedule", "Attendance", "Marks", "Leave Request", "Leave Status", "Certificates", "Profile", "Announcements", "Chat", "Notifications", "Face Recognition", "Logout".
  - **Dashboard Page**: Cards for Date, Next Class, Attendance, Notifications.
  - **Timetable/Weekly Schedule Pages**: Display tables.
  - **Attendance/Marks Pages**: Tables per subject.
  - **Leave Request Page**: Inputs for dates, reason.
  - **Leave Status Page**: Table of leaves.
  - **Certificates Page**: Upload form, list with delete buttons.
  - **Profile Page**: Edit email, name, picture.
  - **Announcements/Notifications Pages**: Display lists.
  - **Chat Page**: List channels, send messages.
  - **Face Recognition Page**: Upload multiple images.
  - **Alerts**: Green/red for success/errors.

---

## Implementation Instructions for AI

- **File Structure**:

  - `index.html`: Entry point.
  - Components:
    - `Login.js`, `OTP.js`, `ForgotPassword.js`, `ResetPassword.js`.
    - `AdminDashboard.js`, `HODDashboard.js`, `FacultyDashboard.js`, `StudentDashboard.js`.
    - `Sidebar.js`, `Alert.js`.
    - Sub-components for each page (e.g., `AdminStats.js`, `StudentAttendance.js`).

- **Code Guidelines**:

  - CDNs:
    - React: `https://cdn.jsdelivr.net/npm/react@18.2.0/umd/react.production.min.js`
    - ReactDOM: `https://cdn.jsdelivr.net/npm/react-dom@18.2.0/umd/react-dom.production.min.js`
    - Babel: `https://unpkg.com/@babel/standalone@7.20.5/babel.min.js`
    - Tailwind: `https://cdn.tailwindcss.com`
  - Use Fetch API with headers (`Authorization: Bearer {token}`).
  - Store `access_token`, `refresh_token`, `role` in `localStorage`.
  - Route via state (no React Router).
  - Use `div` with inputs, buttons (`onClick`).
  - Tailwind classes: `flex`, `grid`, `p-4`, `bg-blue-500`, `text-white`, `text-lg`, `font-bold`.

- **Sample Component (Student Dashboard)**:

  ```jsx
  const StudentDashboard = ({ setPage }) => {
    const [data, setData] = React.useState(null);
    const [error, setError] = React.useState(null);
  
    React.useEffect(() => {
      fetch('https://api.academic-system.com/v1/student/dashboard', {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
      })
        .then(res => res.json())
        .then(res => {
          if (res.success) setData(res.data);
          else setError(res.message);
        });
    }, []);
  
    return (
      <div className="flex">
        <Sidebar role="student" setPage={setPage} />
        <div className="p-4 w-full">
          {error && <div className="bg-red-500 text-white p-2 rounded">{error}</div>}
          {data && (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-500 text-white p-4 rounded">
                <h2>Today</h2>
                <p>{data.today_date}</p>
              </div>
              <div className="bg-blue-500 text-white p-4 rounded">
                <h2>Next Class</h2>
                <p>{data.next_class ? `${data.next_class.subject} at ${data.next_class.start_time}` : 'None'}</p>
              </div>
              <div className="bg-blue-500 text-white p-4 rounded">
                <h2>Attendance</h2>
                <p>{data.attendance_status.average}%</p>
              </div>
              <div className="bg-blue-500 text-white p-4 rounded">
                <h2>Notifications</h2>
                <p>{data.notifications}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };
  ```

- **Exact Features**:

  - Implement all `urls.py` endpoints.
  - No extra endpoints or UI elements.
  - Role-based access enforced.
  - Match response structures exactly.

- **Styling**:

  - Tailwind for layout, spacing, colors.
  - No animations or icons unless specified.

---

## Sample `index.html`

```html
<!DOCTYPE html>
<html>
<head>
  <title>Academic Management System</title>
  <script src="https://cdn.jsdelivr.net/npm/react@18.2.0/umd/react.production.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/react-dom@18.2.0/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone@7.20.5/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    const App = () => {
      const [role, setRole] = React.useState(localStorage.getItem('role'));
      const [page, setPage] = React.useState('login');

      if (!role && !['login', 'otp', 'forgot-password', 'reset-password'].includes(page)) {
        return <Login setRole={setRole} setPage={setPage} />;
      }
      if (page === 'otp') return <OTPPage setRole={setRole} setPage={setPage} />;
      if (page === 'forgot-password') return <ForgotPassword setPage={setPage} />;
      if (page === 'reset-password') return <ResetPassword setPage={setPage} />;
      if (role === 'admin') return <AdminDashboard setPage={setPage} />;
      if (role === 'hod') return <HODDashboard setPage={setPage} />;
      if (role === 'teacher') return <FacultyDashboard setPage={setPage} />;
      if (role === 'student') return <StudentDashboard setPage={setPage} />;
      return <Login setRole={setRole} setPage={setPage} />;
    };

    ReactDOM.render(<App />, document.getElementById('root'));
  </script>
</body>
</html>
```

---

## Notes

- **Completeness**: All `urls.py` endpoints are included, covering every feature.
- **No Extras**: Strictly adheres to provided APIs and backend logic.
- **Token Handling**: Assume tokens are valid; refresh logic not implemented unless specified.
- **File Uploads**: Use `FormData` for multipart endpoints (e.g., `/student/upload-certificate`).
- **Role Persistence**: Store `role` in `localStorage`.
- **Error Handling**: Display all API errors clearly.

This revised plan ensures a frontend that fully aligns with the backend, covering all four dashboards comprehensively.
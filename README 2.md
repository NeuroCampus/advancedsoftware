# Attendance System with Face Recognition

This project is a comprehensive attendance system that uses face recognition technology to automate student attendance tracking. It consists of a React frontend with Tailwind CSS and a Django backend.

## Features

- User authentication
- Student enrollment with face recognition
- Automated attendance taking using facial recognition
- Attendance statistics and reports
- Google Sheets integration for attendance records

## Project Structure

The project is divided into two main parts:

1. **Frontend (React + Tailwind CSS)**
   - User interface for all features
   - Webcam integration for capturing photos
   - Responsive design

2. **Backend (Django + REST API)**
   - Face recognition processing
   - Database for storing student information
   - Google Sheets API integration
   - PDF report generation

## Prerequisites

- Node.js and npm for the frontend
- Python 3.8+ for the backend
- dlib and OpenCV for face recognition
- Google API credentials for Sheets integration

## Setup Instructions

### Frontend Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm run dev
   ```

### Backend Setup

1. Navigate to the Django backend directory:
   ```
   cd django_backend
   ```

2. Create a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Download face recognition models:
   - Download `shape_predictor_68_face_landmarks.dat` and `dlib_face_recognition_resnet_model_v1.dat` from the dlib website
   - Place them in the Django backend root directory

5. Set up Google API credentials:
   - Create a service account in Google Cloud Console
   - Download the credentials JSON file and rename it to `credentials.json`
   - Place it in the Django backend root directory

6. Run migrations:
   ```
   python manage.py makemigrations
   python manage.py migrate
   ```

7. Start the Django server:
   ```
   python manage.py runserver
   ```

## Usage

1. Access the frontend at `http://localhost:5173`
2. Login with default credentials: Username: `1AM22CI`, Password: `CI@2024`
3. Select semester, section, and subject
4. Use the options to enroll students, take attendance, or view statistics

## License

This project is licensed under the MIT License.
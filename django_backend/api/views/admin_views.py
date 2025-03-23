from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from ..permissions import IsAdmin  # Import custom permission
from .utils import face_detector, shape_predictor, face_recognizer, load_all_students, is_same_person
from ..models import Student
import os
import cv2
import numpy as np
import pickle
from django.conf import settings

@api_view(['POST'])
@permission_classes([IsAdmin])
def enroll_student(request) -> Response:
    if face_detector is None or shape_predictor is None or face_recognizer is None:
        return Response({'success': False, 'message': 'Face recognition models not loaded'})
    token = request.headers.get('Authorization', '').replace('Bearer ', '').strip()
    if not token:
        return Response({'success': False, 'message': 'Authentication token required'}, status=401)
    name = request.data.get('name')
    usn = request.data.get('usn')
    semester = request.data.get('semester')
    section = request.data.get('section')
    files = request.FILES.getlist('photos')
    if not all([name, usn, semester, section, files]):
        return Response({'success': False, 'message': 'Missing required fields'})
    encodings = []
    for file in files:
        try:
            img_bytes = file.read()
            nparr = np.frombuffer(img_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if img is None or img.size == 0:
                return Response({'success': False, 'message': 'Invalid image file'})
            rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            if rgb_img.shape[0] < 100 or rgb_img.shape[1] < 100:
                return Response({'success': False, 'message': 'Image too small'})
            faces = face_detector(rgb_img)
            if not faces:
                return Response({'success': False, 'message': 'No face detected'})
            if len(faces) > 1:
                return Response({'success': False, 'message': 'Multiple faces detected'})
            shape = shape_predictor(rgb_img, faces[0])
            face_encoding = np.array(face_recognizer.compute_face_descriptor(rgb_img, shape))
            encodings.append(face_encoding)
        except Exception as e:
            return Response({'success': False, 'message': f'Error processing image: {str(e)}'})
    if not encodings:
        return Response({'success': False, 'message': 'No valid face encodings generated'})
    existing_students = load_all_students()
    for student in existing_students:
        if student['usn'] != usn:
            for encoding in encodings:
                if is_same_person(student['encodings'], encoding):
                    return Response({'success': False, 'message': f'Face matches existing student ({student["name"]})'})
    student_exists = False
    for student in existing_students:
        if student['usn'] == usn:
            student.update({'name': name, 'encodings': encodings, 'semester': semester, 'section': section})
            student_exists = True
            break
    if not student_exists:
        existing_students.append({'name': name, 'usn': usn, 'encodings': encodings, 'semester': semester, 'section': section})
    try:
        with open(settings.PICKLE_FILE, 'wb') as f:
            for student in existing_students:
                pickle.dump(student, f)
    except Exception as e:
        return Response({'success': False, 'message': f'Error saving student data: {str(e)}'})
    try:
        Student.objects.update_or_create(usn=usn, defaults={'name': name, 'semester': semester, 'section': section})
    except Exception as e:
        return Response({'success': False, 'message': f'Error updating database: {str(e)}'})
    return Response({'success': True, 'message': f"Student {'updated' if student_exists else 'enrolled'} successfully"})
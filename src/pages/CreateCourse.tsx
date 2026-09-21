import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiError } from '../api/axios';
import CourseForm from '../components/CourseForm';
import { courseService } from '../services/course.service';
import type { CourseInput } from '../types';

export default function CreateCourse() {
  const navigate = useNavigate(); const [error, setError] = useState('');
  const save = async (input: CourseInput) => { setError(''); try { await courseService.create(input); navigate('/courses', { replace: true }); } catch (reason) { setError(getApiError(reason, 'Could not create the course.')); throw reason; } };
  return <div className="form-page">{error && <div className="form-error">{error}</div>}<CourseForm onSubmit={save} submitLabel="Create course" /></div>;
}

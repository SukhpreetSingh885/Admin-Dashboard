import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { getApiError } from '../api/axios';
import CourseForm from '../components/CourseForm';
import { ErrorState, LoadingState } from '../components/PageState';
import { courseService } from '../services/course.service';
import type { Course, CourseInput } from '../types';
import { entityId } from '../types';

export default function EditCourse() {
  const { id = '' } = useParams(); const location = useLocation(); const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>((location.state as { course?: Course } | null)?.course ?? null); const [error, setError] = useState('');
  const load = useCallback(async () => { try { const items = await courseService.list(); const found = items.find((item) => entityId(item) === id); if (!found) throw new Error('Course not found.'); setCourse(found); } catch (reason) { setError(getApiError(reason, reason instanceof Error ? reason.message : 'Could not load course.')); } }, [id]);
  useEffect(() => { if (!course) void load(); }, [course, load]);
  const save = async (input: CourseInput) => { setError(''); try { await courseService.update(id, input); navigate('/courses', { replace: true }); } catch (reason) { setError(getApiError(reason, 'Could not update the course.')); throw reason; } };
  if (!course && !error) return <LoadingState />;
  if (!course) return <ErrorState message={error} onRetry={() => void load()} />;
  const initial: CourseInput = {
    title: course.title,
    description: course.description,
    instructor: course.instructor,
    category: course.category,
    thumbnail: course.thumbnail ?? '',
    price: course.price ?? 0,
    originalPrice: course.originalPrice ?? 0,
    duration: course.duration ?? '',
    language: course.language ?? '',
    level: course.level ?? 'Beginner',
    lessons: course.lessons ?? 0,
    status: course.status,
    featured: course.featured ?? false,
    popular: course.popular ?? false,
  };
  return <div className="form-page">{error && <div className="form-error">{error}</div>}<CourseForm initial={initial} onSubmit={save} submitLabel="Save changes" /></div>;
}

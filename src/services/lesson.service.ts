import api from '../api/axios';
import type { Lesson, LessonInput } from '../types';

export const lessonService = {
  async byCourse(courseId: string) { return (await api.get<Lesson[]>(`/lessons/course/${courseId}`)).data; },
  async create(input: LessonInput) { return (await api.post<Lesson>('/lessons', input)).data; },
  async update(id: string, input: Partial<LessonInput>) { return (await api.patch<Lesson>(`/lessons/${id}`, input)).data; },
  async remove(id: string) { await api.delete(`/lessons/${id}`); },
};

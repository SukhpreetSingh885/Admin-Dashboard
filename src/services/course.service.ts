import api from '../api/axios';
import type { Course, CourseInput } from '../types';

export const courseService = {
  async list() { return (await api.get<Course[]>('/admin/courses')).data; },
  async create(input: CourseInput) { return (await api.post<Course>('/courses', input)).data; },
  async update(id: string, input: Partial<CourseInput>) { return (await api.patch<Course>(`/courses/${id}`, input)).data; },
  async remove(id: string) { await api.delete(`/courses/${id}`); },
  async publish(id: string) { return (await api.patch<Course>(`/courses/${id}/publish`)).data; },
};

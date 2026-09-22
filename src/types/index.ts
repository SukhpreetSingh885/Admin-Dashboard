export type Id = string;

export interface User {
  id: Id;
  name: string;
  email: string;
  role: 'admin' | 'student';
  createdAt?: string;
  updatedAt?: string;
}

export interface Course {
  _id?: Id;
  id?: Id;
  title: string;
  description: string;
  instructor: string;
  category: string;
  thumbnail: string;
  price: number;
  originalPrice: number;
  duration: string;
  language: string;
  level: string;
  lessons: number;
  status: 'draft' | 'published';
  featured: boolean;
  popular: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type CourseInput = Pick<
  Course,
  | 'title'
  | 'description'
  | 'instructor'
  | 'category'
  | 'thumbnail'
  | 'price'
  | 'originalPrice'
  | 'duration'
  | 'language'
  | 'level'
  | 'lessons'
  | 'status'
  | 'featured'
  | 'popular'
>;

export interface Lesson {
  _id?: Id;
  id?: Id;
  courseId: Id;
  title: string;
  description: string;
  videoSource: 'upload' | 'url';
  videoUrl: string;
  videoPublicId?: string;
  duration: string;
  order: number;
  isPreview?: boolean;
  createdAt?: string;
}

export type LessonInput = Pick<
  Lesson,
  | 'courseId'
  | 'title'
  | 'description'
  | 'videoSource'
  | 'videoUrl'
  | 'videoPublicId'
  | 'duration'
  | 'order'
  | 'isPreview'
>;

export interface Enrollment {
  _id?: Id;
  id?: Id;
  userId: Id;
  courseId: Id;
  status: 'active' | 'completed' | 'cancelled';
  enrollmentDate: string;
  createdAt?: string;
}

export interface ProgressRecord {
  _id?: Id;
  id?: Id;
  userId: Id;
  courseId: Id;
  lessonId: Id;
  completed: boolean;
  lastWatchedPosition: number;
  updatedAt?: string;
  createdAt?: string;
}

export interface DashboardSummary {
  users: number;
  courses: number;
  enrollments: number;
  completedLessons: number;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export const entityId = (entity: { _id?: string; id?: string }) =>
  entity.id ?? entity._id ?? '';
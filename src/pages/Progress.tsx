import { useCallback, useEffect, useMemo, useState } from 'react';
import { getApiError } from '../api/axios';
import DataTable, { type Column } from '../components/DataTable';
import { ErrorState, LoadingState } from '../components/PageState';
import { adminService } from '../services/admin.service';
import type { Course, Lesson, ProgressRecord, User } from '../types';
import { entityId } from '../types';

type Row = { userId: string; courseId: string; tracked: number; completed: number; lastActive?: string };
export default function Progress() {
  const [data, setData] = useState<{ progress: ProgressRecord[]; users: User[]; courses: Course[]; lessons: Lesson[] } | null>(null), [error, setError] = useState('');
  const load = useCallback(async () => { setError(''); try { const [progress, users, courses] = await Promise.all([adminService.progress(), adminService.users(), adminService.courses()]); const lessons = await adminService.lessons().catch(() => [] as Lesson[]); setData({ progress, users, courses, lessons }); } catch (reason) { setError(getApiError(reason)); } }, []);
  useEffect(() => { void load(); }, [load]);
  const users = useMemo(() => new Map(data?.users.map((item) => [item.id, item])), [data]);
  const courses = useMemo(() => new Map(data?.courses.map((item) => [entityId(item), item])), [data]);
  const lessonCounts = useMemo(() => { const map = new Map<string, number>(); data?.lessons.forEach((item) => map.set(item.courseId, (map.get(item.courseId) ?? 0) + 1)); return map; }, [data]);
  const grouped = useMemo(() => { const map = new Map<string, Row>(); data?.progress.forEach((item) => { const key = `${item.userId}:${item.courseId}`, date = item.updatedAt ?? item.createdAt; const row = map.get(key) ?? { userId: item.userId, courseId: item.courseId, tracked: 0, completed: 0, lastActive: date }; row.tracked++; if (item.completed) row.completed++; if (date && (!row.lastActive || date > row.lastActive)) row.lastActive = date; map.set(key, row); }); return [...map.values()]; }, [data]);
  const columns: Column<Row>[] = [
    { key: 'student', header: 'Student', render: (item) => <div className="primary-cell"><strong>{users.get(item.userId)?.name ?? 'Unknown student'}</strong><span>{users.get(item.userId)?.email ?? item.userId}</span></div> },
    { key: 'course', header: 'Course', render: (item) => courses.get(item.courseId)?.title ?? item.courseId },
    { key: 'lessons', header: 'Lessons', render: (item) => `${item.completed} complete · ${item.tracked} tracked` },
    { key: 'progress', header: 'Completion', render: (item) => { const total = lessonCounts.get(item.courseId) ?? courses.get(item.courseId)?.lessons; if (!total) return <span className="muted">Lesson total unavailable</span>; const value = Math.min(100, Math.round(item.completed / total * 100)); return <div className="progress-cell"><div><span style={{ width: `${value}%` }} /></div><strong>{value}%</strong></div>; } },
    { key: 'active', header: 'Last activity', render: (item) => item.lastActive ? new Date(item.lastActive).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : 'Date unavailable' },
  ];
  return <div className="page-stack"><div className="page-toolbar filter-toolbar"><div><span className="eyebrow dark">LEARNING ANALYTICS</span><h2>Student progress</h2><p>{data ? `${grouped.length} student-course records · ${data.progress.filter((item) => item.completed).length} completed lessons` : 'Follow lesson completion across your academy.'}</p></div></div><section className="panel table-panel">{error ? <ErrorState message={error} onRetry={() => void load()} /> : !data ? <LoadingState label="Analyzing learning activity…" /> : <DataTable columns={columns} data={grouped} rowKey={(item) => `${item.userId}:${item.courseId}`} emptyTitle="No learning activity yet" emptyText="Progress appears when students begin watching lessons." />}</section></div>;
}

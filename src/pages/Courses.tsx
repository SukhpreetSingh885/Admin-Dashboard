import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { getApiError } from '../api/axios';
import DataTable, { type Column } from '../components/DataTable';
import { ErrorState, LoadingState } from '../components/PageState';
import { adminService } from '../services/admin.service';
import { courseService } from '../services/course.service';
import type { Course, Enrollment } from '../types';
import { entityId } from '../types';

export default function Courses() {
  const [courses, setCourses] = useState<Course[] | null>(null);

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);

  const [revenueByCourse, setRevenueByCourse] = useState<
    {
      courseId: string;
      totalRevenue: number;
      totalPayments: number;
    }[]
  >([]);

  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  const [params] = useSearchParams();

  const [query, setQuery] = useState(
    params.get('q') ?? '',
  );

  const [page, setPage] = useState(1);

  const navigate = useNavigate();

  useEffect(() => {
    setQuery(params.get('q') ?? '');
    setPage(1);
  }, [params]);

  const load = useCallback(async () => {
    setError('');

    try {
      const [
        items,
        enrollmentItems,
        revenue,
      ] = await Promise.all([
        courseService.list(),
        adminService.enrollments(),
        adminService.revenue(),
      ]);

      setCourses(items);
      setEnrollments(enrollmentItems);
      setRevenueByCourse(revenue.byCourse);
    } catch (reason) {
      setError(getApiError(reason));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(() => {
    const map = new Map<
      string,
      {
        enrollments: number;
        students: Set<string>;
      }
    >();

    enrollments.forEach((item) => {
      const current = map.get(item.courseId) ?? {
        enrollments: 0,
        students: new Set<string>(),
      };

      current.enrollments++;
      current.students.add(item.userId);

      map.set(item.courseId, current);
    });

    return map;
  }, [enrollments]);

  const revenueMap = useMemo(() => {
    return new Map(
      revenueByCourse.map((item) => [
        item.courseId,
        item.totalRevenue,
      ]),
    );
  }, [revenueByCourse]);

  const filtered = useMemo(
    () =>
      (courses ?? []).filter((item) =>
        `${item.title} ${item.category} ${item.instructor}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [courses, query],
  );

  const pages = Math.max(
    1,
    Math.ceil(filtered.length / 10),
  );

  const remove = async (course: Course) => {
    const id = entityId(course);

    if (
      !confirm(
        `Delete “${course.title}”? This cannot be undone.`,
      )
    ) {
      return;
    }

    setBusy(id);

    try {
      await courseService.remove(id);

      setCourses(
        (items) =>
          items?.filter(
            (item) => entityId(item) !== id,
          ) ?? [],
      );
    } catch (reason) {
      alert(
        getApiError(
          reason,
          'Could not delete this course.',
        ),
      );
    } finally {
      setBusy('');
    }
  };

  const toggle = async (course: Course) => {
    const id = entityId(course);

    setBusy(id);

    try {
      const updated =
        course.status === 'published'
          ? await courseService.update(id, {
              status: 'draft',
            })
          : await courseService.publish(id);

      setCourses(
        (items) =>
          items?.map((item) =>
            entityId(item) === id
              ? updated
              : item,
          ) ?? [],
      );
    } catch (reason) {
      alert(getApiError(reason));
    } finally {
      setBusy('');
    }
  };

  const columns: Column<Course>[] = [
    {
      key: 'course',
      header: 'Course',
      render: (course) => (
        <div className="course-cell">
          {course.thumbnail ? (
            <img
              className="course-thumbnail"
              src={course.thumbnail}
              alt=""
            />
          ) : (
            <div className="course-monogram">
              {course.title
                .slice(0, 2)
                .toUpperCase()}
            </div>
          )}

          <div>
            <strong>{course.title}</strong>

            <span>
              {course.category} · {course.instructor}
            </span>
          </div>
        </div>
      ),
    },

    {
      key: 'students',
      header: 'Students',
      render: (course) =>
        counts.get(entityId(course))?.students
          .size ?? 0,
    },

    {
      key: 'enrollments',
      header: 'Enrollments',
      render: (course) =>
        counts.get(entityId(course))
          ?.enrollments ?? 0,
    },

    {
      key: 'revenue',
      header: 'Revenue',
      render: (course) => {
        const revenue =
          revenueMap.get(entityId(course)) ?? 0;

        return (
          <strong>
            ₹{revenue.toLocaleString('en-IN')}
          </strong>
        );
      },
    },

    {
      key: 'status',
      header: 'Status',
      render: (course) => (
        <span
          className={`status ${course.status}`}
        >
          {course.status}
        </span>
      ),
    },

    {
      key: 'actions',
      header: 'Actions',
      className: 'actions-cell',
      render: (course) => (
        <div className="table-actions">
          <button
            disabled={
              busy === entityId(course)
            }
            onClick={() =>
              void toggle(course)
            }
          >
            {course.status === 'published'
              ? 'Unpublish'
              : 'Publish'}
          </button>

          <button
            onClick={() =>
              navigate(
                `/courses/${entityId(
                  course,
                )}/edit`,
                {
                  state: { course },
                },
              )
            }
          >
            Edit
          </button>

          <button
            className="danger-link"
            disabled={
              busy === entityId(course)
            }
            onClick={() =>
              void remove(course)
            }
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-stack">
      <div className="page-toolbar filter-toolbar">
        <div>
          <span className="eyebrow dark">
            COURSE CATALOG
          </span>

          <h2>
            {filtered.length} courses
          </h2>

          <p>
            Manage content and keep your academy
            organized.
          </p>
        </div>

        <div className="toolbar-controls">
          <input
            aria-label="Search courses"
            placeholder="Search courses"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
          />

          <Link
            className="button primary"
            to="/courses/new"
          >
            + New course
          </Link>
        </div>
      </div>

      <section className="panel table-panel">
        {error ? (
          <ErrorState
            message={error}
            onRetry={() => void load()}
          />
        ) : !courses ? (
          <LoadingState />
        ) : (
          <DataTable
            columns={columns}
            data={filtered.slice(
              (page - 1) * 10,
              page * 10,
            )}
            rowKey={entityId}
            emptyTitle="No courses found"
            emptyText="Create a course or try another search."
          />
        )}
      </section>

      {filtered.length > 10 && (
        <div className="pagination">
          <span>
            Page {page} of {pages}
          </span>

          <div>
            <button
              disabled={page === 1}
              onClick={() =>
                setPage(page - 1)
              }
            >
              Previous
            </button>

            <button
              disabled={page === pages}
              onClick={() =>
                setPage(page + 1)
              }
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { getApiError } from '../api/axios';
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

  const visibleCourses = filtered.slice(
    (page - 1) * 10,
    page * 10,
  );

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

      <section className="course-catalog-panel">
        {error ? (
          <div className="panel">
            <ErrorState
              message={error}
              onRetry={() => void load()}
            />
          </div>
        ) : !courses ? (
          <div className="panel">
            <LoadingState />
          </div>
        ) : visibleCourses.length ? (
          <div className="course-admin-grid">
            {visibleCourses.map((course) => {
              const id = entityId(course);
              const courseCounts = counts.get(id);
              const revenue = revenueMap.get(id) ?? 0;
              const discount = course.originalPrice > course.price
                ? Math.round(
                    ((course.originalPrice - course.price) /
                      course.originalPrice) * 100,
                  )
                : 0;

              return (
                <article className="course-admin-card" key={id}>
                  <div className="course-admin-media">
                    {course.thumbnail ? (
                      <img src={course.thumbnail} alt="" />
                    ) : (
                      <div className="course-admin-placeholder">
                        {course.title.slice(0, 2).toUpperCase()}
                      </div>
                    )}

                    <span className={`status ${course.status}`}>
                      {course.status}
                    </span>

                    <div className="course-admin-flags">
                      {course.featured ? <span>Featured</span> : null}
                      {course.popular ? <span>Popular</span> : null}
                    </div>
                  </div>

                  <div className="course-admin-body">
                    <div className="course-admin-heading">
                      <span>{course.category}</span>
                      <h3>{course.title}</h3>
                      <p>{course.instructor}</p>
                    </div>

                    <div className="course-admin-price">
                      <strong>
                        {course.price === 0
                          ? 'Free'
                          : `₹${course.price.toLocaleString('en-IN')}`}
                      </strong>
                      {discount > 0 ? (
                        <>
                          <del>₹{course.originalPrice.toLocaleString('en-IN')}</del>
                          <span>{discount}% off</span>
                        </>
                      ) : null}
                    </div>

                    <div className="course-admin-metrics">
                      <div><strong>{courseCounts?.students.size ?? 0}</strong><span>Students</span></div>
                      <div><strong>{courseCounts?.enrollments ?? 0}</strong><span>Enrollments</span></div>
                      <div><strong>₹{revenue.toLocaleString('en-IN')}</strong><span>Revenue</span></div>
                    </div>

                    <div className="course-admin-actions">
                      <button
                        disabled={busy === id}
                        onClick={() => void toggle(course)}
                      >
                        {course.status === 'published' ? 'Unpublish' : 'Publish'}
                      </button>
                      <button
                        className="primary-action"
                        onClick={() =>
                          navigate(`/courses/${id}/edit`, {
                            state: { course },
                          })
                        }
                      >
                        Edit course
                      </button>
                      <button
                        className="danger-action"
                        aria-label={`Delete ${course.title}`}
                        disabled={busy === id}
                        onClick={() => void remove(course)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="panel empty-state">
            <div className="empty-icon">◇</div>
            <h3>No courses found</h3>
            <p>Create a course or try another search.</p>
          </div>
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

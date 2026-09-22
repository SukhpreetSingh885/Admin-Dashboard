import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from 'react';

import { getApiError } from '../api/axios';
import DataTable, {
  type Column,
} from '../components/DataTable';
import {
  ErrorState,
  LoadingState,
} from '../components/PageState';
import { adminService } from '../services/admin.service';
import { courseService } from '../services/course.service';
import { lessonService } from '../services/lesson.service';
import type {
  Course,
  Lesson,
  LessonInput,
} from '../types';
import { entityId } from '../types';

const emptyLesson = (
  courseId: string,
): LessonInput => ({
  courseId,
  title: '',
  description: '',
  videoSource: 'upload',
  videoUrl: '',
  videoPublicId: undefined,
  duration: '',
  order: 1,
  isPreview: false,
});

export default function Lessons() {
  const [courses, setCourses] =
    useState<Course[] | null>(null);

  const [courseId, setCourseId] =
    useState('');

  const [lessons, setLessons] =
    useState<Lesson[] | null>(null);

  const [error, setError] =
    useState('');

  const [editing, setEditing] =
    useState<
      Lesson | null | undefined
    >(undefined);

  const [form, setForm] =
    useState<LessonInput>(
      emptyLesson(''),
    );

  const [videoFile, setVideoFile] =
    useState<File | null>(null);

  const [
    uploadProgress,
    setUploadProgress,
  ] = useState(0);

  const [saving, setSaving] =
    useState(false);

  const loadCourses =
    useCallback(async () => {
      try {
        const items =
          await courseService.list();

        setCourses(items);

        const firstPublished =
          items.find(
            (item) =>
              item.status ===
              'published',
          );

        if (firstPublished) {
          setCourseId(
            entityId(firstPublished),
          );
        }
      } catch (reason) {
        setError(
          getApiError(reason),
        );
      }
    }, []);

  useEffect(() => {
    void loadCourses();
  }, [loadCourses]);

  const loadLessons =
    useCallback(async () => {
      if (!courseId) {
        setLessons([]);
        return;
      }

      setLessons(null);
      setError('');

      try {
        setLessons(
          await lessonService.byCourse(
            courseId,
          ),
        );
      } catch (reason) {
        setError(
          getApiError(reason),
        );
      }
    }, [courseId]);

  useEffect(() => {
    void loadLessons();
  }, [loadLessons]);

  const openForm = (
    lesson?: Lesson,
  ) => {
    setEditing(lesson ?? null);
    setVideoFile(null);
    setUploadProgress(0);

    setForm(
      lesson
        ? {
            courseId:
              lesson.courseId,
            title: lesson.title,
            description:
              lesson.description,
            videoSource:
              lesson.videoSource ??
              'url',
            videoUrl:
              lesson.videoUrl,
            videoPublicId:
              lesson.videoPublicId,
            duration:
              lesson.duration,
            order: lesson.order,
            isPreview: lesson.isPreview ?? false,
          }
        : emptyLesson(courseId),
    );
  };

  const submit = async (
    event: FormEvent,
  ) => {
    event.preventDefault();

    setSaving(true);
    setUploadProgress(0);

    try {
      let lessonData: LessonInput =
        {
          ...form,
        };

      if (
        form.videoSource ===
        'upload'
      ) {
        if (
          videoFile
        ) {
          const uploaded =
            await adminService.uploadVideo(
              videoFile,
              setUploadProgress,
            );

          lessonData = {
            ...lessonData,
            videoSource: 'upload',
            videoUrl:
              uploaded.url,
            videoPublicId:
              uploaded.publicId,
          };
        } else if (
          !form.videoUrl
        ) {
          throw new Error(
            'Please choose a video file',
          );
        }
      } else {
        if (
          !form.videoUrl.trim()
        ) {
          throw new Error(
            'Please enter a video URL',
          );
        }

        lessonData = {
          ...lessonData,
          videoSource: 'url',
          videoUrl:
            form.videoUrl.trim(),
          videoPublicId:
            undefined,
        };
      }
if (editing) {
  const {
    courseId: _courseId,
    ...updateData
  } = lessonData;

  await lessonService.update(
    entityId(editing),
    updateData,
  );
} else {
  await lessonService.create(
    lessonData,
  );
}
    
      setEditing(undefined);
      setVideoFile(null);
      setUploadProgress(0);

      await loadLessons();
    } catch (reason) {
      if (
        reason instanceof Error &&
        !(
          'response' in reason
        )
      ) {
        alert(reason.message);
      } else {
        alert(
          getApiError(reason),
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const remove = async (
    lesson: Lesson,
  ) => {
    if (
      !confirm(
        `Delete “${lesson.title}”?`,
      )
    ) {
      return;
    }

    try {
      await lessonService.remove(
        entityId(lesson),
      );

      await loadLessons();
    } catch (reason) {
      alert(
        getApiError(reason),
      );
    }
  };

  const columns: Column<Lesson>[] =
    [
      {
        key: 'order',
        header: '#',
        render: (lesson) => (
          <span className="order-badge">
            {lesson.order}
          </span>
        ),
      },
      {
        key: 'title',
        header: 'Lesson',
        render: (lesson) => (
          <div className="primary-cell">
            <strong>
              {lesson.title}
            </strong>
            <span>
              {
                lesson.description
              }
            </span>
          </div>
        ),
      },
      {
        key: 'duration',
        header: 'Duration',
        render: (lesson) =>
          lesson.duration,
      },
      {
        key: 'video',
        header: 'Video',
        render: (lesson) => (
          <a
            className="table-link"
            href={
              lesson.videoUrl
            }
            target="_blank"
            rel="noreferrer"
          >
            Open video ↗
          </a>
        ),
      },
      {
        key: 'actions',
        header: '',
        className:
          'actions-cell',
        render: (lesson) => (
          <div className="table-actions">
            <button
              onClick={() =>
                openForm(lesson)
              }
            >
              Edit
            </button>

            <button
              className="danger-link"
              onClick={() =>
                void remove(
                  lesson,
                )
              }
            >
              Delete
            </button>
          </div>
        ),
      },
    ];

  const publishedCourses =
    courses?.filter(
      (course) =>
        course.status ===
        'published',
    ) ?? [];

  return (
    <div className="page-stack">
      <div className="page-toolbar">
        <label className="course-picker">
          <span>Course</span>

          <select
            value={courseId}
            onChange={(e) =>
              setCourseId(
                e.target.value,
              )
            }
          >
            <option value="">
              Select a published
              course
            </option>

            {publishedCourses.map(
              (course) => (
                <option
                  value={entityId(
                    course,
                  )}
                  key={entityId(
                    course,
                  )}
                >
                  {course.title}
                </option>
              ),
            )}
          </select>
        </label>

        <button
          className="button primary"
          disabled={!courseId}
          onClick={() =>
            openForm()
          }
        >
          + Add lesson
        </button>
      </div>

      <section className="panel table-panel">
        {error ? (
          <ErrorState
            message={error}
            onRetry={() =>
              void loadLessons()
            }
          />
        ) : !courses ||
          lessons === null ? (
          <LoadingState />
        ) : (
          <DataTable
            columns={columns}
            data={lessons}
            rowKey={entityId}
            emptyTitle="No lessons in this course"
            emptyText="Add the first lesson to start building the curriculum."
          />
        )}
      </section>

      {editing !== undefined && (
        <div
          className="modal-backdrop"
          onMouseDown={() =>
            setEditing(undefined)
          }
        >
          <form
            className="modal"
            onSubmit={submit}
            onMouseDown={(e) =>
              e.stopPropagation()
            }
          >
            <div className="modal-head">
              <div>
                <span className="eyebrow dark">
                  CURRICULUM
                </span>

                <h2>
                  {editing
                    ? 'Edit lesson'
                    : 'Add lesson'}
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setEditing(
                    undefined,
                  )
                }
              >
                ×
              </button>
            </div>

            <div className="form-grid">
              <label className="field span-2">
                <span>
                  Title
                </span>

                <input
                  required
                  value={
                    form.title
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      title:
                        e.target
                          .value,
                    })
                  }
                />
              </label>

              <label className="field span-2">
                <span>
                  Description
                </span>

                <textarea
                  required
                  rows={3}
                  value={
                    form.description
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      description:
                        e.target
                          .value,
                    })
                  }
                />
              </label>

              <label className="field span-2">
                <span>
                  Video source
                </span>

                <select
                  value={
                    form.videoSource
                  }
                  onChange={(e) => {
                    const source =
                      e.target
                        .value as
                        | 'upload'
                        | 'url';

                    setVideoFile(
                      null,
                    );

                    setUploadProgress(
                      0,
                    );

                    setForm({
                      ...form,
                      videoSource:
                        source,
                      videoUrl:
                        source ===
                        'url'
                          ? form.videoUrl
                          : '',
                      videoPublicId:
                        undefined,
                    });
                  }}
                >
                  <option value="url">
                    Paste video URL
                  </option>

                  <option value="upload">
                    Upload video
                  </option>
                </select>
              </label>

              {form.videoSource ===
              'upload' ? (
                <label className="field span-2">
                  <span>
                    Video file
                  </span>

                  <input
                    type="file"
                    accept="video/*"
                    disabled={
                      saving
                    }
                    onChange={(e) =>
                      setVideoFile(
                        e.target
                          .files?.[0] ??
                          null,
                      )
                    }
                  />

                  {videoFile && (
                    <small>
                      {
                        videoFile.name
                      }
                    </small>
                  )}

                  {!videoFile &&
                    form.videoUrl && (
                      <small>
                        Current
                        uploaded video
                        will be kept.
                      </small>
                    )}

                  {saving &&
                    uploadProgress >
                      0 && (
                      <small>
                        Uploading:{' '}
                        {
                          uploadProgress
                        }
                        %
                      </small>
                    )}
                </label>
              ) : (
                <label className="field span-2">
                  <span>
                    Video URL
                  </span>

                  <input
                    type="url"
                    required
                    value={
                      form.videoUrl
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        videoUrl:
                          e.target
                            .value,
                      })
                    }
                    placeholder="https://…"
                  />
                </label>
              )}

              <label className="field">
                <span>
                  Duration
                </span>

                <input
                  required
                  value={
                    form.duration
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      duration:
                        e.target
                          .value,
                    })
                  }
                  placeholder="12 min"
                />
              </label>

              <label className="field">
                <span>
                  Order
                </span>

                <input
                  type="number"
                  min="1"
                  required
                  value={
                    form.order
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      order:
                        Number(
                          e.target
                            .value,
                        ),
                    })
                  }
                />
              </label>
              <label className="field span-2">
  <span>Free Preview</span>

  <input
    type="checkbox"
    checked={form.isPreview ?? false}
    onChange={(e) =>
      setForm({
        ...form,
        isPreview: e.target.checked,
      })
    }
  />
</label>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="button ghost"
                disabled={saving}
                onClick={() =>
                  setEditing(
                    undefined,
                  )
                }
              >
                Cancel
              </button>

              <button
                className="button primary"
                disabled={saving}
              >
                {saving
                  ? uploadProgress >
                    0
                    ? `Uploading ${uploadProgress}%`
                    : 'Saving…'
                  : 'Save lesson'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
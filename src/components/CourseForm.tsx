import {
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';

import { adminService } from '../services/admin.service';
import type { CourseInput } from '../types';

const blank: CourseInput = {
  title: '',
  description: '',
  instructor: '',
  category: '',
  thumbnail: '',
  price: 0,
  originalPrice: 0,
  duration: '',
  language: '',
  level: 'Beginner',
  lessons: 0,
  status: 'draft',
  featured: false,
  popular: false,
};

export default function CourseForm({
  initial = blank,
  onSubmit,
  submitLabel,
}: {
  initial?: CourseInput;
  onSubmit: (
    data: CourseInput,
  ) => Promise<void>;
  submitLabel: string;
}) {
  const [form, setForm] =
    useState<CourseInput>(initial);

  const [thumbnailFile, setThumbnailFile] =
    useState<File | null>(null);

  const [saving, setSaving] =
    useState(false);

  const thumbnailInputRef =
    useRef<HTMLInputElement>(null);

  const set = <K extends keyof CourseInput>(
    key: K,
    value: CourseInput[K],
  ) =>
    setForm((current) => ({
      ...current,
      [key]: value,
    }));

  const handleThumbnailChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file =
      event.target.files?.[0] ?? null;

    setThumbnailFile(file);
  };

  const clearThumbnail = () => {
    setThumbnailFile(null);
    set('thumbnail', '');

    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.value = '';
    }
  };

  const submit = async (
    event: FormEvent,
  ) => {
    event.preventDefault();
    setSaving(true);

    try {
      let data = form;

      if (thumbnailFile) {
        const uploaded =
          await adminService.uploadImage(
            thumbnailFile,
          );

        data = {
          ...form,
          thumbnail: uploaded.url,
        };
      }

      await onSubmit(data);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      className="form-card"
      onSubmit={submit}
    >
      <div className="form-section-head">
        <div>
          <h2>Course information</h2>

          <p>
            Give students a clear,
            compelling overview of this
            course.
          </p>
        </div>

        <span
          className={`status ${form.status}`}
        >
          {form.status}
        </span>
      </div>

      <div className="form-grid">
        <label className="field span-2">
          <span>Course title</span>

          <input
            required
            value={form.title}
            onChange={(e) =>
              set(
                'title',
                e.target.value,
              )
            }
            placeholder="e.g. Instagram Growth Masterclass"
          />
        </label>

        <label className="field span-2">
          <span>Description</span>

          <textarea
            required
            rows={6}
            value={form.description}
            onChange={(e) =>
              set(
                'description',
                e.target.value,
              )
            }
            placeholder="What will students learn?"
          />
        </label>

        <label className="field">
          <span>Instructor</span>

          <input
            required
            value={form.instructor}
            onChange={(e) =>
              set(
                'instructor',
                e.target.value,
              )
            }
            placeholder="Instructor name"
          />
        </label>

        <label className="field">
          <span>Category</span>

          <input
            required
            value={form.category}
            onChange={(e) =>
              set(
                'category',
                e.target.value,
              )
            }
            placeholder="e.g. Social Media"
          />
        </label>

        <label className="field span-2">
          <span>Choose Image</span>

          <input
            ref={thumbnailInputRef}
            type="file"
            accept="image/*"
            onChange={
              handleThumbnailChange
            }
          />

          {(thumbnailFile ||
            form.thumbnail) && (
            <button
              type="button"
              onClick={
                clearThumbnail
              }
            >
              Clear image
            </button>
          )}
        </label>

        <label className="field">
          <span>Price</span>

          <input
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={(e) =>
              set(
                'price',
                Number(
                  e.target.value,
                ),
              )
            }
          />
        </label>

        <label className="field">
          <span>Original Price</span>

          <input
            type="number"
            min="0"
            step="0.01"
            value={
              form.originalPrice
            }
            onChange={(e) =>
              set(
                'originalPrice',
                Number(
                  e.target.value,
                ),
              )
            }
          />
        </label>

        <label className="field">
          <span>Duration</span>

          <input
            value={form.duration}
            onChange={(e) =>
              set(
                'duration',
                e.target.value,
              )
            }
            placeholder="e.g. 10 hours"
          />
        </label>

        <label className="field">
          <span>Language</span>

          <input
            value={form.language}
            onChange={(e) =>
              set(
                'language',
                e.target.value,
              )
            }
            placeholder="e.g. English"
          />
        </label>

        <label className="field">
          <span>Level</span>

          <select
            value={form.level}
            onChange={(e) =>
              set(
                'level',
                e.target.value,
              )
            }
          >
            <option value="Beginner">
              Beginner
            </option>

            <option value="Intermediate">
              Intermediate
            </option>

            <option value="Advanced">
              Advanced
            </option>
          </select>
        </label>

        <label className="field">
          <span>Lessons</span>

          <input
            type="number"
            min="0"
            step="1"
            value={form.lessons}
            onChange={(e) =>
              set(
                'lessons',
                Number(
                  e.target.value,
                ),
              )
            }
          />
        </label>

        <label className="field">
          <span>Publishing status</span>

          <select
            value={form.status}
            onChange={(e) =>
              set(
                'status',
                e.target
                  .value as CourseInput['status'],
              )
            }
          >
            <option value="draft">
              Draft
            </option>

            <option value="published">
              Published
            </option>
          </select>
        </label>

        <label className="toggle-field">
          <span>
            <strong>
              Featured course
            </strong>

            <small>
              Highlight this course in
              the student experience.
            </small>
          </span>

          <input
            type="checkbox"
            checked={form.featured}
            onChange={(e) =>
              set(
                'featured',
                e.target.checked,
              )
            }
          />
        </label>

        <label className="toggle-field">
          <span>
            <strong>
              Popular course
            </strong>

            <small>
              Show this course in the
              popular courses section.
            </small>
          </span>

          <input
            type="checkbox"
            checked={form.popular}
            onChange={(e) =>
              set(
                'popular',
                e.target.checked,
              )
            }
          />
        </label>
      </div>

      <div className="form-actions">
        <button
          type="button"
          className="button ghost"
          onClick={() =>
            history.back()
          }
        >
          Cancel
        </button>

        <button
          className="button primary"
          disabled={saving}
        >
          {saving
            ? 'Saving…'
            : submitLabel}
        </button>
      </div>
    </form>
  );
}
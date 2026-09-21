import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { getApiError } from '../api/axios';

import DateRangeFilter, {
  inDateRange,
  initialDateSelection,
} from '../components/DateRangeFilter';

import DataTable, {
  type Column,
} from '../components/DataTable';

import {
  ErrorState,
  LoadingState,
} from '../components/PageState';

import { adminService } from '../services/admin.service';

import type {
  Course,
  Enrollment,
  User,
} from '../types';

import { entityId } from '../types';

type PaymentRecord = {
  _id: string;
  userId: string;
  courseId: string;
  amount: number;
  currency: string;
  status: string;
  stripePaymentIntentId?: string;
  paidAt?: string;
  createdAt?: string;
  refundedAmount?: number;
  refundedAt?: string;
};

const csvCell = (value: string) =>
  `"${value.replaceAll('"', '""')}"`;

const getNetPaymentAmount = (
  payment: PaymentRecord,
) => {
  const refundedAmount =
    Number(payment.refundedAmount ?? 0);

  return Math.max(
    0,
    Number(payment.amount) - refundedAmount,
  );
};

export default function Enrollments() {
  const [data, setData] = useState<{
    enrollments: Enrollment[];
    users: User[];
    courses: Course[];
    payments: PaymentRecord[];
  } | null>(null);

  const [error, setError] = useState('');

  const [selection, setSelection] =
    useState(initialDateSelection);

  const [query, setQuery] =
    useState('');

  const [page, setPage] =
    useState(1);

  const load = useCallback(async () => {
    setError('');

    try {
      const [
        enrollments,
        users,
        courses,
        payments,
      ] = await Promise.all([
        adminService.enrollments(),
        adminService.users(),
        adminService.courses(),
        adminService.payments(),
      ]);

      setData({
        enrollments,
        users,
        courses,
        payments,
      });
    } catch (reason) {
      setError(
        getApiError(reason),
      );
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const users = useMemo(
    () =>
      new Map(
        data?.users.map((item) => [
          item.id,
          item,
        ]),
      ),
    [data],
  );

  const courses = useMemo(
    () =>
      new Map(
        data?.courses.map((item) => [
          entityId(item),
          item,
        ]),
      ),
    [data],
  );

  /*
   * Payments are returned newest first.
   *
   * If there are multiple payment attempts for the
   * same student/course, prefer an actual paid/refunded
   * transaction over pending or failed attempts.
   */
  const payments = useMemo(() => {
    const map =
      new Map<string, PaymentRecord>();

    const completedStatuses =
      new Set([
        'SUCCESS',
        'PARTIALLY_REFUNDED',
        'REFUNDED',
      ]);

    for (
      const payment of data?.payments ?? []
    ) {
      const key =
        `${payment.userId}:${payment.courseId}`;

      const existing =
        map.get(key);

      if (!existing) {
        map.set(key, payment);
        continue;
      }

      const paymentIsCompleted =
        completedStatuses.has(
          payment.status,
        );

      const existingIsCompleted =
        completedStatuses.has(
          existing.status,
        );

      if (
        paymentIsCompleted &&
        !existingIsCompleted
      ) {
        map.set(key, payment);
      }
    }

    return map;
  }, [data]);

  const getPayment = (
    item: Enrollment,
  ) => {
    return payments.get(
      `${item.userId}:${item.courseId}`,
    );
  };

  const filtered = useMemo(
    () =>
      (data?.enrollments ?? [])
        .filter(
          (item) =>
            inDateRange(
              item.enrollmentDate ||
                item.createdAt,
              selection,
            ) &&
            `${users.get(item.userId)?.name ?? ''} ${
              users.get(item.userId)?.email ?? ''
            } ${
              courses.get(item.courseId)?.title ?? ''
            }`
              .toLowerCase()
              .includes(
                query.toLowerCase(),
              ),
        )
        .sort(
          (a, b) =>
            new Date(
              b.enrollmentDate ||
                b.createdAt ||
                0,
            ).getTime() -
            new Date(
              a.enrollmentDate ||
                a.createdAt ||
                0,
            ).getTime(),
        ),
    [
      data,
      selection,
      query,
      users,
      courses,
    ],
  );

  const pages = Math.max(
    1,
    Math.ceil(
      filtered.length / 10,
    ),
  );

  const exportCsv = () => {
    const rows = [
      [
        'Student',
        'Email',
        'Course',
        'Enrollment date',
        'Enrollment status',
        'Payment status',
        'Amount',
        'Refunded amount',
        'Net amount',
      ],

      ...filtered.map((item) => {
        const payment =
          getPayment(item);

        const refundedAmount =
          Number(
            payment?.refundedAmount ??
              0,
          );

        const netAmount =
          payment
            ? getNetPaymentAmount(
                payment,
              )
            : 0;

        return [
          users.get(item.userId)
            ?.name ?? '',

          users.get(item.userId)
            ?.email ?? '',

          courses.get(item.courseId)
            ?.title ?? '',

          item.enrollmentDate ?? '',

          item.status,

          payment?.status ??
            'NO PAYMENT',

          payment
            ? `₹${payment.amount}`
            : '',

          payment
            ? `₹${refundedAmount}`
            : '',

          payment
            ? `₹${netAmount}`
            : '',
        ];
      }),
    ];

    const blob = new Blob(
      [
        rows
          .map((row) =>
            row
              .map((value) =>
                csvCell(
                  String(value),
                ),
              )
              .join(','),
          )
          .join('\r\n'),
      ],
      {
        type: 'text/csv;charset=utf-8',
      },
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement('a');

    link.href = url;

    link.download =
      'viralstan-enrollments.csv';

    link.click();

    URL.revokeObjectURL(url);
  };

  const columns:
    Column<Enrollment>[] = [
    {
      key: 'student',
      header: 'Student',

      render: (item) => (
        <div className="primary-cell">
          <strong>
            {users.get(item.userId)
              ?.name ??
              'Unknown student'}
          </strong>

          <span>
            {users.get(item.userId)
              ?.email ??
              item.userId}
          </span>
        </div>
      ),
    },

    {
      key: 'course',
      header: 'Course',

      render: (item) => (
        <strong>
          {courses.get(item.courseId)
            ?.title ??
            item.courseId}
        </strong>
      ),
    },

    {
      key: 'date',
      header: 'Enrollment date',

      render: (item) =>
        item.enrollmentDate
          ? new Date(
              item.enrollmentDate,
            ).toLocaleDateString(
              'en-IN',
              {
                dateStyle: 'medium',
              },
            )
          : 'Date unavailable',
    },

    {
      key: 'status',
      header: 'Enrollment',

      render: (item) => (
        <span
          className={`status ${item.status}`}
        >
          {item.status}
        </span>
      ),
    },

    {
      key: 'payment',
      header: 'Payment',

      render: (item) => {
        const payment =
          getPayment(item);

        if (!payment) {
          const course =
            courses.get(
              item.courseId,
            );

          if (
            course &&
            Number(
              course.price ?? 0,
            ) <= 0
          ) {
            return (
              <span className="status active">
                Free
              </span>
            );
          }

          return (
            <span className="status unavailable">
              No payment
            </span>
          );
        }

        if (
          payment.status ===
          'SUCCESS'
        ) {
          return (
            <div className="primary-cell">
              <strong>
                ₹
                {payment.amount.toLocaleString(
                  'en-IN',
                )}
              </strong>

              <span
                className="status active"
                style={{
                  marginTop: '4px',
                  width: 'fit-content',
                }}
              >
                Paid
              </span>
            </div>
          );
        }

        if (
          payment.status ===
          'PARTIALLY_REFUNDED'
        ) {
          const refundedAmount =
            Number(
              payment.refundedAmount ??
                0,
            );

          const netAmount =
            getNetPaymentAmount(
              payment,
            );

          return (
            <div className="primary-cell">
              <strong>
                ₹
                {netAmount.toLocaleString(
                  'en-IN',
                )}
              </strong>

              <span
                style={{
                  fontSize: '12px',
                  color: '#667085',
                  marginTop: '2px',
                }}
              >
                Refunded ₹
                {refundedAmount.toLocaleString(
                  'en-IN',
                )}
              </span>

              <span
                className="status pending"
                style={{
                  marginTop: '4px',
                  width: 'fit-content',
                }}
              >
                Partially Refunded
              </span>
            </div>
          );
        }

        if (
          payment.status ===
          'REFUNDED'
        ) {
          return (
            <div className="primary-cell">
              <strong>
                ₹0
              </strong>

              <span
                className="status unavailable"
                style={{
                  marginTop: '4px',
                  width: 'fit-content',
                }}
              >
                Refunded
              </span>
            </div>
          );
        }

        if (
          payment.status ===
          'FAILED'
        ) {
          return (
            <span className="status failed">
              Failed
            </span>
          );
        }

        return (
          <span className="status pending">
            Pending
          </span>
        );
      },
    },
  ];

  return (
    <div className="page-stack">
      <div className="page-toolbar filter-toolbar">
        <div>
          <span className="eyebrow dark">
            COURSE ACCESS
          </span>

          <h2>
            {filtered.length}{' '}
            enrollments
          </h2>

          <p>
            Review student access and
            payment status.
          </p>
        </div>

        <div className="toolbar-controls">
          <input
            aria-label="Search enrollments"
            placeholder="Search student or course"
            value={query}
            onChange={(event) => {
              setQuery(
                event.target.value,
              );

              setPage(1);
            }}
          />

          <DateRangeFilter
            value={selection}
            onChange={(value) => {
              setSelection(value);
              setPage(1);
            }}
          />

          <button
            className="button secondary"
            disabled={
              !filtered.length
            }
            onClick={exportCsv}
          >
            Export CSV
          </button>
        </div>
      </div>

      <section className="panel table-panel">
        {error ? (
          <ErrorState
            message={error}
            onRetry={() =>
              void load()
            }
          />
        ) : !data ? (
          <LoadingState
            label="Loading enrollments…"
          />
        ) : (
          <DataTable
            columns={columns}
            data={filtered.slice(
              (page - 1) * 10,
              page * 10,
            )}
            rowKey={entityId}
            emptyTitle="No enrollments found"
            emptyText="Try another search or date range."
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
              disabled={
                page === 1
              }
              onClick={() =>
                setPage(
                  page - 1,
                )
              }
            >
              Previous
            </button>

            <button
              disabled={
                page === pages
              }
              onClick={() =>
                setPage(
                  page + 1,
                )
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
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { getApiError } from '../api/axios';

import {
  ErrorState,
  LoadingState,
} from '../components/PageState';

import StatCard from '../components/StatCard';

import { adminService } from '../services/admin.service';

import type {
  Course,
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

type Data = {
  payments: PaymentRecord[];
  users: User[];
  courses: Course[];
};

const formatDate = (value?: string) => {
  if (!value) return '—';

  return new Date(value).toLocaleDateString(
    'en-IN',
    {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    },
  );
};

export default function Payments() {
  const [data, setData] =
    useState<Data | null>(null);

  const [error, setError] =
    useState('');

  const [actionError, setActionError] =
    useState('');

  const [query, setQuery] =
    useState('');

  const [refundingId, setRefundingId] =
    useState<string | null>(null);

  const load = useCallback(async () => {
    setError('');

    try {
      const [
        payments,
        users,
        courses,
      ] = await Promise.all([
        adminService.payments(),
        adminService.users(),
        adminService.courses(),
      ]);

      setData({
        payments,
        users,
        courses,
      });
    } catch (reason) {
      setError(
        getApiError(
          reason,
          'Unable to load payments.',
        ),
      );
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const view = useMemo(() => {
    if (!data) return null;

    const userMap = new Map(
      data.users.map((user) => [
        user.id,
        user,
      ]),
    );

    const courseMap = new Map(
      data.courses.map((course) => [
        entityId(course),
        course,
      ]),
    );

    const search =
      query.trim().toLowerCase();

    const payments =
      [...data.payments]
        .filter((payment) => {
          if (!search) return true;

          const student =
            userMap.get(
              payment.userId,
            )?.name ?? '';

          const course =
            courseMap.get(
              payment.courseId,
            )?.title ?? '';

          const paymentId =
            payment.stripePaymentIntentId ??
            '';

          return `${student} ${course} ${paymentId} ${payment.status}`
            .toLowerCase()
            .includes(search);
        })
        .sort((a, b) => {
          const aDate =
            a.paidAt ??
            a.createdAt ??
            '';

          const bDate =
            b.paidAt ??
            b.createdAt ??
            '';

          return (
            new Date(bDate).getTime() -
            new Date(aDate).getTime()
          );
        });

    const successfulPayments =
      data.payments.filter(
        (payment) =>
          payment.status === 'SUCCESS' ||
          payment.status ===
            'PARTIALLY_REFUNDED' ||
          payment.status === 'REFUNDED',
      );

    const totalRevenue =
      data.payments.reduce(
        (total, payment) => {
          if (
            payment.status !== 'SUCCESS' &&
            payment.status !==
              'PARTIALLY_REFUNDED'
          ) {
            return total;
          }

          const refunded =
            Number(
              payment.refundedAmount ??
                0,
            );

          const netAmount =
            Number(payment.amount) -
            refunded;

          return (
            total +
            Math.max(0, netAmount)
          );
        },
        0,
      );

    const pendingPayments =
      data.payments.filter(
        (payment) =>
          payment.status ===
          'PENDING',
      ).length;

    const failedPayments =
      data.payments.filter(
        (payment) =>
          payment.status ===
          'FAILED',
      ).length;

    return {
      payments,
      userMap,
      courseMap,
      totalRevenue,
      successfulPayments:
        successfulPayments.length,
      pendingPayments,
      failedPayments,
    };
  }, [data, query]);

  const handleRefund = async (
    payment: PaymentRecord,
  ) => {
    const refundedAmount =
      Number(
        payment.refundedAmount ?? 0,
      );

    const remainingAmount =
      Math.max(
        0,
        Number(payment.amount) -
          refundedAmount,
      );

    if (remainingAmount <= 0) {
      setActionError(
        'This payment has already been fully refunded.',
      );

      return;
    }

    const value = window.prompt(
      `Enter refund amount in INR.\nMaximum refundable amount: ₹${remainingAmount.toLocaleString(
        'en-IN',
      )}`,
      String(remainingAmount),
    );

    if (value === null) {
      return;
    }

    const amount =
      Number(value.trim());

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      setActionError(
        'Enter a valid refund amount greater than zero.',
      );

      return;
    }

    if (amount > remainingAmount) {
      setActionError(
        `Refund cannot exceed ₹${remainingAmount.toLocaleString(
          'en-IN',
        )}.`,
      );

      return;
    }

    const confirmed =
      window.confirm(
        `Refund ₹${amount.toLocaleString(
          'en-IN',
        )} for this payment?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setActionError('');
      setRefundingId(payment._id);

      await adminService.refundPayment(
        payment._id,
        amount,
      );

      await load();
    } catch (reason) {
      setActionError(
        getApiError(
          reason,
          'Unable to refund payment.',
        ),
      );
    } finally {
      setRefundingId(null);
    }
  };

  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={() =>
          void load()
        }
      />
    );
  }

  if (!view) {
    return (
      <LoadingState
        label="Loading payments…"
      />
    );
  }

  return (
    <div className="page-stack">
      <div className="dashboard-intro">
        <div>
          <span className="eyebrow dark">
            TRANSACTIONS
          </span>

          <h2>Payments</h2>

          <p>
            View payments, refunds and
            transaction history.
          </p>
        </div>
      </div>

      <section className="stats-grid four">
        <StatCard
          label="Total Revenue"
          value={`₹${view.totalRevenue.toLocaleString(
            'en-IN',
          )}`}
          icon="₹"
          tone="green"
          helper="Net revenue after refunds"
        />

        <StatCard
          label="Successful"
          value={
            view.successfulPayments
          }
          icon="✓"
          tone="blue"
          helper="Completed transactions"
        />

        <StatCard
          label="Pending"
          value={
            view.pendingPayments
          }
          icon="…"
          tone="violet"
          helper="Awaiting completion"
        />

        <StatCard
          label="Failed"
          value={
            view.failedPayments
          }
          icon="×"
          tone="cyan"
          helper="Unsuccessful payments"
        />
      </section>

      {actionError && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '10px',
            background: '#FEF3F2',
            color: '#B42318',
            fontSize: '14px',
          }}
        >
          {actionError}
        </div>
      )}

      <article className="panel data-card">
        <div className="panel-head">
          <div>
            <span className="eyebrow dark">
              PAYMENT HISTORY
            </span>

            <h2>
              {view.payments.length}{' '}
              payments
            </h2>
          </div>
        </div>

        <div className="panel-search">
          <input
            aria-label="Search payments"
            placeholder="Search student, course or payment ID"
            value={query}
            onChange={(event) =>
              setQuery(
                event.target.value,
              )
            }
          />
        </div>

        {view.payments.length ? (
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Course</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>
                    Payment ID
                  </th>
                  <th>
                    Paid date
                  </th>
                  <th>
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {view.payments.map(
                  (payment) => {
                    const student =
                      view.userMap.get(
                        payment.userId,
                      );

                    const course =
                      view.courseMap.get(
                        payment.courseId,
                      );

                    const refunded =
                      Number(
                        payment.refundedAmount ??
                          0,
                      );

                    const canRefund =
                      payment.status ===
                        'SUCCESS' ||
                      payment.status ===
                        'PARTIALLY_REFUNDED';

                    const isRefunding =
                      refundingId ===
                      payment._id;

                    return (
                      <tr
                        key={
                          payment._id
                        }
                      >
                        <td>
                          <strong>
                            {student?.name ??
                              'Student unavailable'}
                          </strong>
                        </td>

                        <td>
                          {course?.title ??
                            'Course unavailable'}
                        </td>

                        <td>
                          <strong>
                            ₹
                            {payment.amount.toLocaleString(
                              'en-IN',
                            )}
                          </strong>

                          {refunded >
                            0 && (
                            <small
                              style={{
                                display:
                                  'block',
                                marginTop:
                                  '4px',
                                color:
                                  '#667085',
                              }}
                            >
                              Refunded ₹
                              {refunded.toLocaleString(
                                'en-IN',
                              )}
                            </small>
                          )}
                        </td>

                        <td>
                          {payment.status ===
                          'SUCCESS' ? (
                            <span className="status active">
                              Paid
                            </span>
                          ) : payment.status ===
                            'PARTIALLY_REFUNDED' ? (
                            <span className="status pending">
                              Partially
                              refunded
                            </span>
                          ) : payment.status ===
                            'REFUNDED' ? (
                            <span className="status unavailable">
                              Refunded
                            </span>
                          ) : payment.status ===
                            'FAILED' ? (
                            <span className="status failed">
                              Failed
                            </span>
                          ) : (
                            <span className="status pending">
                              {
                                payment.status
                              }
                            </span>
                          )}
                        </td>

                        <td>
                          <span
                            title={
                              payment.stripePaymentIntentId
                            }
                          >
                            {payment.stripePaymentIntentId ??
                              '—'}
                          </span>
                        </td>

                        <td>
                          {formatDate(
                            payment.paidAt ??
                              payment.createdAt,
                          )}
                        </td>

                        <td>
                          {canRefund ? (
                            <button
                              type="button"
                              className="text-link"
                              disabled={
                                isRefunding
                              }
                              onClick={() =>
                                void handleRefund(
                                  payment,
                                )
                              }
                              style={{
                                border: 0,
                                background:
                                  'transparent',
                                cursor:
                                  isRefunding
                                    ? 'not-allowed'
                                    : 'pointer',
                                padding: 0,
                              }}
                            >
                              {isRefunding
                                ? 'Refunding…'
                                : 'Refund'}
                            </button>
                          ) : (
                            <span
                              style={{
                                color:
                                  '#98A2B3',
                              }}
                            >
                              —
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="compact-empty">
            <strong>
              No payments found
            </strong>

            <span>
              Payment transactions will
              appear here.
            </span>
          </div>
        )}
      </article>
    </div>
  );
}
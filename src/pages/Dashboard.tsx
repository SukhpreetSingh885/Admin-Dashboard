import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getApiError } from '../api/axios';
import DateRangeFilter, { dateBounds, inDateRange, initialDateSelection, type DateSelection } from '../components/DateRangeFilter';
import { ErrorState, LoadingState } from '../components/PageState';
import StatCard from '../components/StatCard';
import { adminService } from '../services/admin.service';
import type { Course, Enrollment, Lesson, ProgressRecord, User } from '../types';
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
type RevenueSummary = {
  totalRevenue: number;
  totalPayments: number;
  currency: string;
};
type Data = {
  users: User[];
  courses: Course[];
  enrollments: Enrollment[];
  progress: ProgressRecord[];
  lessons: Lesson[];
  revenue: RevenueSummary;
  payments: PaymentRecord[];
};
const dateText = (value?: string) => value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date unavailable';
const enrollmentDate = (item: Enrollment) => item.enrollmentDate || item.createdAt;
function growth(dates: (string | undefined)[], selection: DateSelection): string | undefined {
  const { start, end } = dateBounds(selection);
  if (!start || !end) return undefined;
  const width = end.getTime() - start.getTime();
  const current = dates.filter((value) => value && new Date(value).getTime() >= start.getTime() && new Date(value).getTime() < end.getTime()).length;
  const previous = dates.filter((value) => value && new Date(value).getTime() >= start.getTime() - width && new Date(value).getTime() < start.getTime()).length;
  return previous ? `${Math.round((current - previous) / previous * 100)}% vs previous period` : 'No previous period data';
}

function GrowthChart({ dates, selection }: { dates: string[]; selection: DateSelection }) {
  const bounds = dateBounds(selection);
  const end = bounds.end ?? new Date();
  const start = bounds.start ?? new Date(Math.min(...dates.map((date) => new Date(date).getTime())));
  const span = Math.max(1, end.getTime() - start.getTime());
  const buckets = Array.from({ length: 7 }, (_, index) => {
    const from = start.getTime() + span * index / 7, to = start.getTime() + span * (index + 1) / 7;
    return { label: new Date(from).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), value: dates.filter((date) => { const time = new Date(date).getTime(); return time >= from && time < to; }).length };
  });
  const max = Math.max(1, ...buckets.map((item) => item.value));
  const points = buckets.map((item, index) => `${42 + index * 88},${178 - item.value / max * 135}`).join(' ');
  return <div className="growth-chart"><svg viewBox="0 0 620 215" role="img" aria-label={`Student registrations: ${buckets.map((item) => `${item.label} ${item.value}`).join(', ')}`}>
    {[0, 1, 2, 3].map((tick) => <g key={tick}><line x1="42" x2="602" y1={178 - tick * 45} y2={178 - tick * 45} stroke="#e6eaf1" /><text x="5" y={182 - tick * 45} className="chart-axis">{Math.round(max * tick / 3)}</text></g>)}
    <polyline points={points} fill="none" stroke="#6257e8" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
    {buckets.map((item, index) => <g key={index}><circle cx={42 + index * 88} cy={178 - item.value / max * 135} r="5" fill="#fff" stroke="#6257e8" strokeWidth="3"><title>{item.label}: {item.value} registrations</title></circle><text x={42 + index * 88} y="204" textAnchor="middle" className="chart-axis">{item.label}</text></g>)}
  </svg></div>;
}

export default function Dashboard() {
  const [data, setData] = useState<Data | null>(null), [error, setError] = useState('');
  const [selection, setSelection] = useState(initialDateSelection), [query, setQuery] = useState('');
const load = useCallback(async () => {
  setError('');

  try {
    const [
      users,
      courses,
      enrollments,
      progress,
      revenue,
      payments,
    ] = await Promise.all([
      adminService.users(),
      adminService.courses(),
      adminService.enrollments(),
      adminService.progress(),
      adminService.revenue(),
      adminService.payments(),
    ]);

    const lessons = await adminService
      .lessons()
      .catch(() => [] as Lesson[]);

    setData({
      users,
      courses,
      enrollments,
      progress,
      lessons,
      revenue,
      payments,
    });
  } catch (reason) {
    setError(
      getApiError(
        reason,
        'Unable to load academy data.',
      ),
    );
  }
}, []);
  useEffect(() => { void load(); }, [load]);
  const view = useMemo(() => {
    if (!data) return null;
    const students = data.users.filter((item) => item.role === 'student' && inDateRange(item.createdAt, selection));
    const courses = data.courses.filter((item) => inDateRange(item.createdAt, selection));
    const enrollments = data.enrollments.filter((item) => inDateRange(enrollmentDate(item), selection));
    const progress = data.progress.filter((item) => inDateRange(item.updatedAt ?? item.createdAt, selection));
    const lessons = data.lessons.filter((item) => inDateRange(item.createdAt, selection));
    const userMap = new Map(data.users.map((item) => [item.id, item]));
    const courseMap = new Map(data.courses.map((item) => [entityId(item), item]));
    const counts = new Map<string, number>(); enrollments.forEach((item) => counts.set(item.courseId, (counts.get(item.courseId) ?? 0) + 1));
    const topCourses = [...data.courses].filter((item) => (counts.get(entityId(item)) ?? 0) > 0).sort((a, b) => (counts.get(entityId(b)) ?? 0) - (counts.get(entityId(a)) ?? 0)).slice(0, 5);
    const activities = [
      ...students.map((item) => ({ date: item.createdAt!, icon: 'S', title: 'Student registered', detail: item.name })),
      ...courses.map((item) => ({ date: item.createdAt!, icon: 'C', title: 'Course created', detail: item.title })),
      ...enrollments.map((item) => ({ date: enrollmentDate(item)!, icon: 'E', title: 'New enrollment', detail: `${userMap.get(item.userId)?.name ?? 'Student'} · ${courseMap.get(item.courseId)?.title ?? 'Course'}` })),
      ...lessons.map((item) => ({ date: item.createdAt!, icon: 'L', title: 'Lesson uploaded', detail: `${item.title} · ${courseMap.get(item.courseId)?.title ?? 'Course'}` })),
    ].filter((item) => item.date).sort((a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime()).slice(0, 6);
    return { students, courses, enrollments, progress, userMap, courseMap, counts, topCourses, activities };
  }, [data, selection]);
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;
  if (!view) return <LoadingState label="Loading academy overview…" />;
  const recent = [...view.enrollments].sort((a, b) => new Date(enrollmentDate(b) ?? 0).getTime() - new Date(enrollmentDate(a) ?? 0).getTime()).filter((item) => `${view.userMap.get(item.userId)?.name ?? ''} ${view.courseMap.get(item.courseId)?.title ?? ''}`.toLowerCase().includes(query.toLowerCase())).slice(0, 5);
  const paymentMap = new Map<string, PaymentRecord>();

data!.payments.forEach((payment) => {
  const key = `${payment.userId}:${payment.courseId}`;
  const existing = paymentMap.get(key);

  if (!existing) {
    paymentMap.set(key, payment);
    return;
  }

  if (
    payment.status === 'SUCCESS' &&
    existing.status !== 'SUCCESS'
  ) {
    paymentMap.set(key, payment);
  }
});

  const courseRevenueMap = new Map<string, number>();

data!.payments
  .filter(
    (payment) =>
      payment.status === 'SUCCESS' ||
      payment.status === 'PARTIALLY_REFUNDED',
  )
  .forEach((payment) => {
    const refundedAmount =
      Number(payment.refundedAmount ?? 0);

    const netAmount = Math.max(
      0,
      Number(payment.amount) - refundedAmount,
    );

    const current =
      courseRevenueMap.get(payment.courseId) ?? 0;

    courseRevenueMap.set(
      payment.courseId,
      current + netAmount,
    );
  });
  return <div className="page-stack dashboard-page">
    <div className="dashboard-intro"><div><span className="eyebrow dark">ACADEMY OVERVIEW</span><h2>Performance at a glance</h2><p>Monitor your academy performance and student activity.</p></div><DateRangeFilter value={selection} onChange={setSelection} /></div>
   <section className="stats-grid five">
  <StatCard
    label="Total Students"
    value={view.students.length}
    icon="◉"
    tone="blue"
    trend={growth(
      data!.users
        .filter((item) => item.role === "student")
        .map((item) => item.createdAt),
      selection
    )}
    helper="Registered in period"
  />

  <StatCard
    label="Total Courses"
    value={view.courses.length}
    icon="▣"
    tone="violet"
    trend={growth(
      data!.courses.map((item) => item.createdAt),
      selection
    )}
    helper="Created in period"
  />

  <StatCard
    label="Total Enrollments"
    value={view.enrollments.length}
    icon="↗"
    tone="cyan"
    trend={growth(
      data!.enrollments.map(enrollmentDate),
      selection
    )}
    helper="Started in period"
  />

  <StatCard
    label="Revenue"
  value={`₹${data!.revenue.totalRevenue.toLocaleString("en-IN")}`}
    icon="₹"
    tone="green"
helper={`${data!.revenue.totalPayments} successful payments`}
  />

  <StatCard
    label="Completed Lessons"
    value={view.progress.filter((item) => item.completed).length}
    icon="✓"
    tone="blue"
    trend={growth(
      data!.progress
        .filter((item) => item.completed)
        .map((item) => item.updatedAt ?? item.createdAt),
      selection
    )}
    helper="Records updated in period"
  />
</section>
<section className="analytics-grid">
  <article className="panel chart-card">
    <div className="panel-head">
      <div>
        <span className="eyebrow dark">GROWTH</span>
        <h2>Student growth</h2>
        <p>Registrations for the selected period</p>
      </div>
    </div>

    {view.students.some((item) => item.createdAt) ? (
      <GrowthChart
        dates={view.students
          .map((item) => item.createdAt!)
          .filter(Boolean)}
        selection={selection}
      />
    ) : (
      <div className="chart-empty">
        <strong>No student registrations in this period</strong>
        <span>Choose another date range to view growth.</span>
      </div>
    )}
  </article>

  <article className="panel chart-card">
    <div className="panel-head">
      <div>
        <span className="eyebrow dark">REVENUE</span>
        <h2>Revenue overview</h2>
        <p>Revenue from successful course payments</p>
      </div>
    </div>

    <div className="chart-empty">
      <strong
        style={{
          fontSize: "32px",
          color: "#0f172a",
        }}
      >
        ₹{data!.revenue.totalRevenue.toLocaleString("en-IN")}
      </strong>

      <span>
        {data!.revenue.totalPayments} successful payments
      </span>
    </div>
  </article>
</section>
    <section className="data-grid"><article className="panel data-card"><div className="panel-head"><div><span className="eyebrow dark">LATEST</span><h2>Recent enrollments</h2></div><Link className="text-link" to="/enrollments">View all →</Link></div><div className="panel-search"><input aria-label="Search recent enrollments" placeholder="Search student or course" value={query} onChange={(event) => setQuery(event.target.value)} /></div>{recent.length ? <div className="dashboard-table-wrap"><table className="dashboard-table"><thead><tr><th>Student</th><th>Course</th><th>Date</th><th>Payment</th></tr></thead><tbody>{recent.map((item) => <tr key={entityId(item)}><td><strong>{view.userMap.get(item.userId)?.name ?? 'Student unavailable'}</strong></td><td>{view.courseMap.get(item.courseId)?.title ?? 'Course unavailable'}</td><td>{dateText(enrollmentDate(item))}</td>
  <td>
  {(() => {
    const payment = paymentMap.get(
      `${item.userId}:${item.courseId}`,
    );

    if (!payment) {
      return (
        <span className="status unavailable">
          No payment
        </span>
      );
    }

    if (payment.status === 'SUCCESS') {
      return (
        <div className="primary-cell">
          <strong>
            ₹{payment.amount.toLocaleString('en-IN')}
          </strong>
          <span className="status active">
            Paid
          </span>
        </div>
      );
    }

    if (payment.status === 'PARTIALLY_REFUNDED') {
      const refunded =
        Number(payment.refundedAmount ?? 0);

      const netAmount =
        Number(payment.amount) - refunded;

      return (
        <div className="primary-cell">
          <strong>
            ₹{Math.max(0, netAmount).toLocaleString('en-IN')}
          </strong>
          <span className="status pending">
            Partially Refunded
          </span>
        </div>
      );
    }

    if (payment.status === 'REFUNDED') {
      return (
        <span className="status unavailable">
          Refunded
        </span>
      );
    }

    if (payment.status === 'FAILED') {
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
  })()}
</td></tr>)}</tbody></table></div> : <div className="compact-empty"><strong>No enrollments found</strong><span>New enrollments in this period will appear here.</span></div>}</article><article className="panel data-card"><div className="panel-head"><div><span className="eyebrow dark">POPULAR</span><h2>Top courses</h2></div><Link className="text-link" to="/courses">View courses →</Link></div>{view.topCourses.length ? <div className="dashboard-table-wrap"><table className="dashboard-table"><thead><tr><th>Course</th><th>Students</th><th>Revenue</th><th>Completion</th></tr></thead><tbody>{view.topCourses.map((course) => { const items = view.enrollments.filter((item) => item.courseId === entityId(course)); return <tr key={entityId(course)}><td><strong>{course.title}</strong></td><td>{new Set(items.map((item) => item.userId)).size}</td><td>
  ₹{(
    courseRevenueMap.get(entityId(course)) ?? 0
  ).toLocaleString('en-IN')}
</td><td>{items.length ? `${Math.round(items.filter((item) => item.status === 'completed').length / items.length * 100)}%` : '—'}</td></tr>; })}</tbody></table></div> : <div className="compact-empty"><strong>No course enrollments in this period</strong><span>Course rankings will appear after students enroll.</span></div>}</article></section>
    <section className="panel activity-panel"><div className="panel-head"><div><span className="eyebrow dark">ACTIVITY</span><h2>Recent activity</h2></div></div>{view.activities.length ? <div className="activity-feed">{view.activities.map((item, index) => <div className="activity-entry" key={`${item.title}-${item.date}-${index}`}><span className="activity-icon">{item.icon}</span><div><strong>{item.title}</strong><p>{item.detail}</p></div><time>{dateText(item.date)}</time></div>)}</div> : <div className="compact-empty"><strong>No activity in this period</strong><span>Registrations, courses, and enrollments will appear here.</span></div>}</section>
  </div>;
}

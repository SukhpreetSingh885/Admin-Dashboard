import { useCallback, useEffect, useMemo, useState } from 'react';
import { getApiError } from '../api/axios';
import DateRangeFilter, { inDateRange, initialDateSelection } from '../components/DateRangeFilter';
import DataTable, { type Column } from '../components/DataTable';
import { ErrorState, LoadingState } from '../components/PageState';
import { adminService } from '../services/admin.service';
import type { User } from '../types';

const formatDate = (value?: string) => value ? new Date(value).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : 'Date unavailable';
export default function Students() {
  const [users, setUsers] = useState<User[] | null>(null), [error, setError] = useState('');
  const [query, setQuery] = useState(''), [selection, setSelection] = useState(initialDateSelection), [sort, setSort] = useState('newest'), [page, setPage] = useState(1);
  const load = useCallback(async () => { setError(''); try { setUsers(await adminService.users()); } catch (reason) { setError(getApiError(reason)); } }, []);
  useEffect(() => { void load(); }, [load]);
  const filtered = useMemo(() => (users ?? []).filter((user) => user.role === 'student' && inDateRange(user.createdAt, selection) && `${user.name} ${user.email}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name) : sort === 'oldest' ? new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime() : new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()), [users, query, selection, sort]);
  const pages = Math.max(1, Math.ceil(filtered.length / 10));
  const columns: Column<User>[] = [
    { key: 'student', header: 'Student', render: (user) => <div className="person-cell"><div className="person-avatar">{user.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</div><div><strong>{user.name}</strong><span>ID · {user.id.slice(-7)}</span></div></div> },
    { key: 'email', header: 'Email address', render: (user) => <a href={`mailto:${user.email}`} className="table-link">{user.email}</a> },
    { key: 'role', header: 'Role', render: () => <span className="role-badge student">Student</span> },
    { key: 'created', header: 'Joined', render: (user) => formatDate(user.createdAt) },
  ];
  return <div className="page-stack"><div className="page-toolbar filter-toolbar"><div><span className="eyebrow dark">STUDENT DIRECTORY</span><h2>{filtered.length} students</h2><p>Search and review registered learners.</p></div><div className="toolbar-controls"><input aria-label="Search students" placeholder="Search name or email" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} /><DateRangeFilter value={selection} onChange={(value) => { setSelection(value); setPage(1); }} /><select aria-label="Sort students" value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="name">Name A–Z</option></select></div></div><section className="panel table-panel">{error ? <ErrorState message={error} onRetry={() => void load()} /> : !users ? <LoadingState label="Loading students…" /> : <DataTable columns={columns} data={filtered.slice((page - 1) * 10, page * 10)} rowKey={(user) => user.id} emptyTitle="No students found" emptyText="Try another search or date range." />}</section>{filtered.length > 10 && <div className="pagination"><span>Page {page} of {pages}</span><div><button disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button><button disabled={page === pages} onClick={() => setPage(page + 1)}>Next</button></div></div>}</div>;
}

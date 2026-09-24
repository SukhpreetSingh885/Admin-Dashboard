import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';

import { getApiError } from '../api/axios';
import { ErrorState, LoadingState } from '../components/PageState';
import {
  withdrawalService,
  type AdminWithdrawal,
  type WithdrawalStatus,
} from '../services/withdrawal.service';

type Action = { withdrawal: AdminWithdrawal; status: WithdrawalStatus };

const LABELS: Record<WithdrawalStatus, string> = {
  pending: 'Pending', processing: 'Processing', paid: 'Paid', failed: 'Failed', rejected: 'Rejected',
};

export default function Withdrawals() {
  const [items, setItems] = useState<AdminWithdrawal[] | null>(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [action, setAction] = useState<Action | null>(null);
  const [reason, setReason] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [providerReference, setProviderReference] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setError('');
      setItems(await withdrawalService.list());
    } catch (value) {
      setError(getApiError(value, 'Unable to load withdrawals.'));
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const visibleItems = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!items || !search) return items;
    return items.filter((item) =>
      `${item.student.name} ${item.student.email} ${item.status} ${item.providerReference ?? ''}`
        .toLowerCase().includes(search),
    );
  }, [items, query]);

  const openAction = (withdrawal: AdminWithdrawal, status: WithdrawalStatus) => {
    setAction({ withdrawal, status });
    setReason('');
    setAdminNote(withdrawal.adminNote ?? '');
    setProviderReference(withdrawal.providerReference ?? '');
    setError('');
  };

  const submitAction = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!action || saving) return;
    const requiresReason = action.status === 'failed' || action.status === 'rejected';
    if (requiresReason && !reason.trim()) {
      setError('Enter a failure or rejection reason.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      const updated = await withdrawalService.updateStatus(action.withdrawal._id, {
        status: action.status,
        ...(reason.trim() ? { failureReason: reason.trim() } : {}),
        ...(adminNote.trim() ? { adminNote: adminNote.trim() } : {}),
        ...(providerReference.trim() ? { providerReference: providerReference.trim() } : {}),
      });
      setItems((current) => current?.map((item) => item._id === updated._id ? updated : item) ?? null);
      setAction(null);
    } catch (value) {
      setError(getApiError(value, 'Unable to update withdrawal.'));
    } finally {
      setSaving(false);
    }
  };

  if (error && !items) return <ErrorState message={error} onRetry={() => void load()} />;
  if (!items || !visibleItems) return <LoadingState label="Loading withdrawals…" />;

  return (
    <div className="page-stack">
      <div className="dashboard-intro">
        <div>
          <span className="eyebrow dark">PAYOUT OPERATIONS</span>
          <h2>Withdrawals</h2>
          <p>Review requests and record payments handled externally.</p>
        </div>
      </div>

      {error ? <p className="error-message">{error}</p> : null}

      <article className="panel data-card">
        <div className="panel-head">
          <div><span className="eyebrow dark">REQUEST QUEUE</span><h2>{visibleItems.length} withdrawals</h2></div>
        </div>
        <div className="panel-search">
          <input aria-label="Search withdrawals" placeholder="Search student, status or reference" value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>

        {visibleItems.length ? (
          <div className="dashboard-table-wrap">
            <table className="dashboard-table withdrawals-table">
              <thead><tr><th>Student</th><th>Amount</th><th>Payout destination</th><th>Created</th><th>Status</th><th>Provider reference</th><th>Actions</th></tr></thead>
              <tbody>
                {visibleItems.map((item) => (
                  <tr key={item._id}>
                    <td><div className="primary-cell"><strong>{item.student.name}</strong><span>{item.student.email}</span></div></td>
                    <td><strong>₹{item.amount.toLocaleString('en-IN')}</strong></td>
                    <td><strong>{item.payoutMethod === 'upi' ? 'UPI' : 'Bank'}</strong><div className="muted">{item.payoutDestination ?? '—'}</div></td>
                    <td>{new Date(item.createdAt).toLocaleString('en-IN')}</td>
                    <td><span className={`status ${item.status}`}>{LABELS[item.status]}</span></td>
                    <td>{item.providerReference ?? '—'}</td>
                    <td>
                      <div className="withdrawal-actions">
                        {item.status === 'pending' ? <><button onClick={() => openAction(item, 'processing')}>Mark Processing</button><button className="danger-link" onClick={() => openAction(item, 'rejected')}>Reject</button></> : null}
                        {item.status === 'processing' ? <><button onClick={() => openAction(item, 'paid')}>Mark Paid</button><button className="danger-link" onClick={() => openAction(item, 'failed')}>Mark Failed</button></> : null}
                        {item.status !== 'pending' && item.status !== 'processing' ? '—' : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="compact-empty"><strong>No withdrawals found</strong><span>New payout requests will appear here.</span></div>}
      </article>

      {action ? (
        <div className="withdrawal-modal-backdrop" role="presentation">
          <form className="modal withdrawal-modal" onSubmit={submitAction}>
            <div className="modal-head">
              <div><span className="eyebrow dark">UPDATE STATUS</span><h2>{LABELS[action.status]}</h2></div>
              <button type="button" className="modal-close" onClick={() => setAction(null)} aria-label="Close">×</button>
            </div>
            <div className="withdrawal-modal-body">
              <p>{action.status === 'paid' ? 'This only records that payment was handled externally.' : `Update ${action.withdrawal.student.name}'s request.`}</p>
              {action.status === 'failed' || action.status === 'rejected' ? <label className="field"><span>Reason</span><textarea value={reason} onChange={(event) => setReason(event.target.value)} required rows={3} /></label> : null}
              <label className="field"><span>Provider reference (optional)</span><input value={providerReference} onChange={(event) => setProviderReference(event.target.value)} /></label>
              <label className="field"><span>Admin note (optional)</span><textarea value={adminNote} onChange={(event) => setAdminNote(event.target.value)} rows={3} /></label>
              <div className="withdrawal-modal-actions">
                <button type="button" className="button ghost" onClick={() => setAction(null)} disabled={saving}>Cancel</button>
                <button type="submit" className="button primary" disabled={saving}>{saving ? 'Saving…' : `Confirm ${LABELS[action.status]}`}</button>
              </div>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

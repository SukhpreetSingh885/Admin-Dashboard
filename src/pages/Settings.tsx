import {
  useEffect,
  useState,
} from 'react';

import type {
  FormEvent,
} from 'react';

import { useAuth } from '../auth/AuthContext';
import { getApiError } from '../api/axios';
import { referralService } from '../services/referral.service';
import { withdrawalService } from '../services/withdrawal.service';

export default function Settings() {
  const { user } = useAuth();

  const [rewardAmount, setRewardAmount] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');

  const [withdrawalsEnabled, setWithdrawalsEnabled] = useState(true);
  const [minimumWithdrawalAmount, setMinimumWithdrawalAmount] = useState('');
  const [withdrawalLoading, setWithdrawalLoading] = useState(true);
  const [withdrawalSaving, setWithdrawalSaving] = useState(false);
  const [withdrawalError, setWithdrawalError] = useState('');
  const [withdrawalSuccess, setWithdrawalSuccess] = useState('');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setError('');

        const settings =
          await referralService.getSettings();

        setRewardAmount(
          settings
            ? String(settings.rewardAmount)
            : '0',
        );
      } catch (err) {
        setError(
          getApiError(
            err,
            'Unable to load referral settings',
          ),
        );
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  useEffect(() => {
    const loadWithdrawalSettings = async () => {
      try {
        setWithdrawalError('');
        const settings = await withdrawalService.getSettings();
        setWithdrawalsEnabled(settings.withdrawalsEnabled);
        setMinimumWithdrawalAmount(String(settings.minimumWithdrawalAmount));
      } catch (err) {
        setWithdrawalError(getApiError(err, 'Unable to load withdrawal settings'));
      } finally {
        setWithdrawalLoading(false);
      }
    };

    void loadWithdrawalSettings();
  }, []);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const amount =
      Number(rewardAmount);

    if (
      !Number.isFinite(amount) ||
      amount < 0
    ) {
      setError(
        'Enter a valid reward amount.',
      );
      setSuccess('');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const settings =
        await referralService.updateRewardAmount(
          amount,
        );

      setRewardAmount(
        String(settings.rewardAmount),
      );

      setSuccess(
        'Referral reward updated successfully.',
      );
    } catch (err) {
      setError(
        getApiError(
          err,
          'Unable to update referral reward',
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleWithdrawalSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    const minimum = Number(minimumWithdrawalAmount);

    if (!Number.isFinite(minimum) || minimum < 0) {
      setWithdrawalError('Enter a valid minimum amount.');
      setWithdrawalSuccess('');
      return;
    }

    try {
      setWithdrawalSaving(true);
      setWithdrawalError('');
      setWithdrawalSuccess('');
      const settings = await withdrawalService.updateSettings({
        withdrawalsEnabled,
        minimumWithdrawalAmount: minimum,
      });
      setWithdrawalsEnabled(settings.withdrawalsEnabled);
      setMinimumWithdrawalAmount(String(settings.minimumWithdrawalAmount));
      setWithdrawalSuccess('Withdrawal settings updated successfully.');
    } catch (err) {
      setWithdrawalError(getApiError(err, 'Unable to update withdrawal settings'));
    } finally {
      setWithdrawalSaving(false);
    }
  };

  return (
    <div className="settings-grid">
      <section className="panel settings-card">
        <span className="eyebrow dark">
          PROFILE
        </span>

        <h2>Administrator account</h2>

        <p>
          Your current sign-in details.
        </p>

        <dl>
          <div>
            <dt>Name</dt>
            <dd>
              {user?.name ?? 'Unavailable'}
            </dd>
          </div>

          <div>
            <dt>Email</dt>
            <dd>
              {user?.email ?? 'Unavailable'}
            </dd>
          </div>

          <div>
            <dt>Role</dt>
            <dd>Administrator</dd>
          </div>
        </dl>
      </section>

      <section className="panel settings-card">
        <span className="eyebrow dark">
          REFERRALS
        </span>

        <h2>Referral reward</h2>

        <p>
          Set the amount a student can earn
          for an eligible successful referral.
        </p>

        {loading ? (
          <p>Loading referral settings...</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <label htmlFor="rewardAmount">
              Reward amount (₹)
            </label>

            <input
              id="rewardAmount"
              type="number"
              min="0"
              step="1"
              value={rewardAmount}
              onChange={(event) => {
                setRewardAmount(
                  event.target.value,
                );

                setError('');
                setSuccess('');
              }}
              disabled={saving}
              required
            />

            {error ? (
              <p className="error-message">
                {error}
              </p>
            ) : null}

            {success ? (
              <p className="success-message">
                {success}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={saving}
            >
              {saving
                ? 'Saving...'
                : 'Save referral reward'}
            </button>
          </form>
        )}
      </section>

      <section className="panel settings-card">
        <span className="eyebrow dark">WITHDRAWALS</span>
        <h2>Withdrawal controls</h2>
        <p>Control availability and the minimum referral-wallet payout request.</p>

        {withdrawalLoading ? (
          <p>Loading withdrawal settings...</p>
        ) : (
          <form onSubmit={handleWithdrawalSubmit}>
            <label className="settings-checkbox" htmlFor="withdrawalsEnabled">
              <input
                id="withdrawalsEnabled"
                type="checkbox"
                checked={withdrawalsEnabled}
                onChange={(event) => setWithdrawalsEnabled(event.target.checked)}
                disabled={withdrawalSaving}
              />
              <span>Withdrawals enabled</span>
            </label>

            <label htmlFor="minimumWithdrawalAmount">Minimum withdrawal amount (₹)</label>
            <input
              id="minimumWithdrawalAmount"
              type="number"
              min="0"
              step="1"
              value={minimumWithdrawalAmount}
              onChange={(event) => setMinimumWithdrawalAmount(event.target.value)}
              disabled={withdrawalSaving}
              required
            />

            {withdrawalError ? <p className="error-message">{withdrawalError}</p> : null}
            {withdrawalSuccess ? <p className="success-message">{withdrawalSuccess}</p> : null}

            <button type="submit" disabled={withdrawalSaving}>
              {withdrawalSaving ? 'Saving...' : 'Save withdrawal settings'}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}

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
    </div>
  );
}
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { getApiError } from '../api/axios';
import ShellIcon from '../components/ShellIcon';
import {
  ErrorState,
  LoadingState,
} from '../components/PageState';
import {
  adminService,
  type AdminNotification,
} from '../services/admin.service';

type NotificationFilter = 'all' | 'unread';

const publishUnreadCount = (count: number) => {
  window.dispatchEvent(
    new CustomEvent<number>(
      'admin-notifications:unread',
      { detail: count },
    ),
  );
};

const notificationTime = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Date unavailable';
  }

  return date.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

export default function Notifications() {
  const [items, setItems] =
    useState<AdminNotification[] | null>(null);
  const [filter, setFilter] =
    useState<NotificationFilter>('all');
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] =
    useState<string | null>(null);
  const [markingAll, setMarkingAll] =
    useState(false);

  const load = useCallback(async () => {
    try {
      setError('');
      const notifications =
        await adminService.notifications();

      const hasUnread = notifications.some(
        (item) => !item.read,
      );

      if (hasUnread) {
        await adminService.markAllNotificationsRead();

        setItems(
          notifications.map((item) => ({
            ...item,
            read: true,
          })),
        );
        publishUnreadCount(0);
      } else {
        setItems(notifications);
        publishUnreadCount(0);
      }
    } catch (reason) {
      setError(
        getApiError(
          reason,
          'Unable to load notifications.',
        ),
      );
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const unreadCount = useMemo(
    () =>
      items?.filter((item) => !item.read).length ??
      0,
    [items],
  );

  const visibleItems = useMemo(
    () =>
      filter === 'unread'
        ? items?.filter((item) => !item.read) ?? []
        : items ?? [],
    [filter, items],
  );

  const markRead = async (
    notification: AdminNotification,
  ) => {
    if (notification.read || updatingId) {
      return;
    }

    try {
      setError('');
      setUpdatingId(notification._id);
      await adminService.markNotificationRead(
        notification._id,
      );

      const nextUnreadCount = Math.max(
        0,
        unreadCount - 1,
      );

      setItems((current) =>
        current?.map((item) =>
          item._id === notification._id
            ? { ...item, read: true }
            : item,
        ) ?? null,
      );
      publishUnreadCount(nextUnreadCount);
    } catch (reason) {
      setError(
        getApiError(
          reason,
          'Unable to mark the notification as read.',
        ),
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const markAllRead = async () => {
    if (!unreadCount || markingAll) {
      return;
    }

    try {
      setError('');
      setMarkingAll(true);
      await adminService.markAllNotificationsRead();
      setItems((current) =>
        current?.map((item) => ({
          ...item,
          read: true,
        })) ?? null,
      );
      publishUnreadCount(0);
    } catch (reason) {
      setError(
        getApiError(
          reason,
          'Unable to mark all notifications as read.',
        ),
      );
    } finally {
      setMarkingAll(false);
    }
  };

  if (!items && error) {
    return (
      <ErrorState
        message={error}
        onRetry={() => void load()}
      />
    );
  }

  if (!items) {
    return (
      <LoadingState label="Loading notifications…" />
    );
  }

  return (
    <div className="page-stack notifications-page">
      <div className="page-toolbar notifications-toolbar">
        <div>
          <span className="eyebrow dark">
            ADMIN INBOX
          </span>
          <h2>Notifications</h2>
          <p>
            {unreadCount
              ? `${unreadCount} unread notification${
                  unreadCount === 1 ? '' : 's'
                }`
              : 'You are all caught up.'}
          </p>
        </div>

        <button
          type="button"
          className="button secondary"
          onClick={() => void markAllRead()}
          disabled={!unreadCount || markingAll}
        >
          {markingAll ? 'Updating…' : 'Mark all as read'}
        </button>
      </div>

      {error ? (
        <p className="error-message" role="alert">
          {error}
        </p>
      ) : null}

      <section className="notifications-panel">
        <div
          className="notification-filters"
          aria-label="Notification filters"
        >
          <button
            type="button"
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            All <span>{items.length}</span>
          </button>
          <button
            type="button"
            className={
              filter === 'unread' ? 'active' : ''
            }
            onClick={() => setFilter('unread')}
          >
            Unread <span>{unreadCount}</span>
          </button>
        </div>

        {visibleItems.length ? (
          <div className="notifications-feed">
            {visibleItems.map((notification) => (
              <button
                type="button"
                key={notification._id}
                className={`notification-row ${
                  notification.read ? 'read' : 'unread'
                }`}
                onClick={() =>
                  void markRead(notification)
                }
                disabled={updatingId === notification._id}
              >
                <span className="notification-row-icon">
                  <ShellIcon name="bell" size={18} />
                </span>

                <span className="notification-row-copy">
                  <strong>{notification.title}</strong>
                  <span>{notification.message}</span>
                  <time
                    dateTime={notification.createdAt}
                  >
                    {notificationTime(
                      notification.createdAt,
                    )}
                  </time>
                </span>

                {!notification.read ? (
                  <span
                    className="notification-unread-dot"
                    aria-label="Unread"
                  />
                ) : null}
              </button>
            ))}
          </div>
        ) : (
          <div className="notifications-empty">
            <span>
              <ShellIcon name="bell" size={24} />
            </span>
            <strong>
              {filter === 'unread'
                ? 'No unread notifications'
                : 'No notifications yet'}
            </strong>
            <p>
              {filter === 'unread'
                ? 'New unread updates will appear here.'
                : 'Academy updates will appear here when they arrive.'}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

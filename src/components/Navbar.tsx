import {
  useEffect,
  useState,
  type FormEvent,
} from 'react';
import {
  Link,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
  adminService,
  type AdminNotification,
} from '../services/admin.service';

const titles: Record<string, [string, string]> = {
  '/courses': [
    'Courses',
    'Create, publish, and manage your learning catalog.',
  ],
  '/courses/new': [
    'Create course',
    'Build a new learning experience.',
  ],
  '/lessons': [
    'Lessons',
    'Organize your course content.',
  ],
  '/students': [
    'Students',
    'Explore your academy community.',
  ],
  '/enrollments': [
    'Enrollments',
    'Track student access across courses.',
  ],
  '/progress': [
    'Progress',
    'Follow learning activity and completion.',
  ],
  '/settings': [
    'Settings',
    'Your administrator workspace.',
  ],
};

const notificationTime = (value: string) =>
  new Date(value).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });

export default function Navbar({
  onMenu,
}: {
  onMenu: () => void;
}) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [search, setSearch] = useState('');
  const [notificationsOpen, setNotificationsOpen] =
    useState(false);
  const [profile, setProfile] = useState(false);

  const [notificationItems, setNotificationItems] =
    useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] =
    useState(false);

  const [title, subtitle] =
    pathname === '/'
      ? [
          'Welcome back, Admin',
          'Monitor your academy performance and student activity.',
        ]
      : pathname.startsWith('/courses/') &&
          pathname !== '/courses/new'
        ? [
            'Edit course',
            'Update course details and publishing status.',
          ]
        : titles[pathname] ?? [
            'Admin workspace',
            'Manage Viralstan Academy.',
          ];

  const initials =
    user?.name
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'VA';

  const loadUnreadCount = async () => {
    try {
      const result =
        await adminService.notificationUnreadCount();

      setUnreadCount(result.count);
    } catch {
      // Notification count should not break the navbar.
    }
  };

  const loadNotifications = async () => {
    setNotificationsLoading(true);

    try {
      const result =
        await adminService.notifications();

      setNotificationItems(result);
    } finally {
      setNotificationsLoading(false);
    }
  };

  useEffect(() => {
    void loadUnreadCount();
  }, []);

  const openNotifications = () => {
    const nextOpen = !notificationsOpen;

    setNotificationsOpen(nextOpen);
    setProfile(false);

    if (nextOpen) {
      void loadNotifications();
    }
  };

  const markRead = async (
    notification: AdminNotification,
  ) => {
    if (notification.read) {
      return;
    }

    await adminService.markNotificationRead(
      notification._id,
    );

    setNotificationItems((items) =>
      items.map((item) =>
        item._id === notification._id
          ? {
              ...item,
              read: true,
            }
          : item,
      ),
    );

    setUnreadCount((count) =>
      Math.max(0, count - 1),
    );
  };

  const markAllRead = async () => {
    if (!unreadCount) {
      return;
    }

    await adminService.markAllNotificationsRead();

    setNotificationItems((items) =>
      items.map((item) => ({
        ...item,
        read: true,
      })),
    );

    setUnreadCount(0);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();

    if (search.trim()) {
      navigate(
        `/courses?q=${encodeURIComponent(
          search.trim(),
        )}`,
      );
    }
  };

  return (
    <header className="navbar">
      <div className="nav-heading">
        <button
          className="icon-button menu-button"
          onClick={onMenu}
          aria-label="Open navigation"
        >
          ☰
        </button>

        <div className="page-heading">
          <span className="eyebrow dark">
            VIRALSTAN ACADEMY
          </span>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </div>

      <div className="nav-actions">
        <form
          className="nav-search"
          onSubmit={submit}
        >
          <span aria-hidden="true">⌕</span>

          <input
            aria-label="Search courses"
            placeholder="Search courses…"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </form>

        <div className="header-popover-wrap">
          <button
            className="icon-button notification-button"
            onClick={openNotifications}
            aria-label={`Notifications${
              unreadCount
                ? `, ${unreadCount} unread`
                : ''
            }`}
            aria-expanded={notificationsOpen}
          >
            ♧

            {unreadCount > 0 && (
              <span className="notification-badge">
                {unreadCount > 99
                  ? '99+'
                  : unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="header-popover notification-popover">
              <div className="notification-popover-head">
                <strong>Notifications</strong>

                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      void markAllRead()
                    }
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {notificationsLoading ? (
                <p>Loading notifications…</p>
              ) : notificationItems.length ? (
                <div className="notification-list">
                  {notificationItems.map(
                    (notification) => (
                      <button
                        type="button"
                        key={notification._id}
                        className={`notification-item ${
                          notification.read
                            ? 'read'
                            : 'unread'
                        }`}
                        onClick={() =>
                          void markRead(notification)
                        }
                      >
                        <strong>
                          {notification.title}
                        </strong>

                        <span>
                          {notification.message}
                        </span>

                        <small>
                          {notificationTime(
                            notification.createdAt,
                          )}
                        </small>
                      </button>
                    ),
                  )}
                </div>
              ) : (
                <p>
                  No notifications are available.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="header-popover-wrap">
          <button
            className="profile-trigger"
            onClick={() => {
              setProfile((value) => !value);
              setNotificationsOpen(false);
            }}
            aria-label="Admin profile menu"
            aria-expanded={profile}
          >
            <span className="avatar">
              {initials}
            </span>

            <span className="profile-copy">
              <strong>
                {user?.name ?? 'Administrator'}
              </strong>
              <small>Administrator</small>
            </span>

            <span aria-hidden="true">⌄</span>
          </button>

          {profile && (
            <div className="header-popover profile-popover">
              <strong>{user?.email}</strong>

              <Link
                to="/settings"
                onClick={() => setProfile(false)}
              >
                Settings
              </Link>

              <button
                onClick={() => {
                  logout();
                  navigate('/login', {
                    replace: true,
                  });
                }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
import api from '../api/axios';

import type {
  Course,
  DashboardSummary,
  Enrollment,
  Lesson,
  ProgressRecord,
  User,
} from '../types';
export type AdminNotification = {
  _id: string;
  recipientId: string;
  recipientType: 'admin';
  type: string;
  title: string;
  message: string;
  read: boolean;
  data?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type NotificationUnreadCount = {
  count: number;
};
export const adminService = {
  async dashboard() {
    return (
      await api.get<DashboardSummary>(
        '/admin/dashboard',
      )
    ).data;
  },

  async users() {
    return (
      await api.get<User[]>(
        '/admin/users',
      )
    ).data;
  },

  async courses() {
    return (
      await api.get<Course[]>(
        '/admin/courses',
      )
    ).data;
  },

  async enrollments() {
    return (
      await api.get<Enrollment[]>(
        '/admin/enrollments',
      )
    ).data;
  },

  async progress() {
    return (
      await api.get<ProgressRecord[]>(
        '/admin/progress',
      )
    ).data;
  },

  async lessons() {
    return (
      await api.get<Lesson[]>(
        '/admin/lessons',
      )
    ).data;
  },

  async revenue() {
    return (
      await api.get<{
        totalRevenue: number;
        totalPayments: number;
        currency: string;
        byCourse: {
          courseId: string;
          totalRevenue: number;
          totalPayments: number;
        }[];
      }>('/admin/revenue')
    ).data;
  },

  async payments() {
    return (
      await api.get<
        {
          _id: string;
          userId: string;
          courseId: string;
          amount: number;
          currency: string;
          status: string;
          stripePaymentIntentId?: string;
          paidAt?: string;
          createdAt?: string;
        }[]
      >('/admin/payments')
    ).data;
  },

  async uploadImage(file: File) {
    const formData = new FormData();

    formData.append('file', file);

    return (
      await api.post<{
        url: string;
        publicId: string;
      }>(
        '/admin/uploads/image',
        formData,
      )
    ).data;
  },

  async uploadVideo(
  file: File,
  onProgress?: (percent: number) => void,
) {
  const chunkSize = 10 * 1024 * 1024;
  const uploadId = crypto.randomUUID();

  let finalResult: {
    secure_url?: string;
    public_id?: string;
    done?: boolean;
    error?: {
      message?: string;
    };
  } | null = null;

  for (
    let start = 0;
    start < file.size;
    start += chunkSize
  ) {
    const end = Math.min(
      start + chunkSize,
      file.size,
    );

    const chunk = file.slice(start, end);

    const {
      timestamp,
      signature,
      folder,
      apiKey,
      cloudName,
    } = await this.videoUploadSignature();

    const formData = new FormData();

    formData.append(
      'file',
      chunk,
      file.name,
    );
    formData.append(
      'api_key',
      apiKey,
    );
    formData.append(
      'timestamp',
      String(timestamp),
    );
    formData.append(
      'signature',
      signature,
    );
    formData.append(
      'folder',
      folder,
    );

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
      {
        method: 'POST',
        headers: {
          'X-Unique-Upload-Id':
            uploadId,
          'Content-Range':
            `bytes ${start}-${end - 1}/${file.size}`,
        },
        body: formData,
      },
    );

    const result = (await response.json()) as {
      secure_url?: string;
      public_id?: string;
      done?: boolean;
      error?: {
        message?: string;
      };
    };

    if (!response.ok) {
      throw new Error(
        result.error?.message ??
          'Video upload failed',
      );
    }

    finalResult = result;

    onProgress?.(
      Math.round(
        (end / file.size) * 100,
      ),
    );
  }

  if (
    !finalResult?.secure_url ||
    !finalResult.public_id
  ) {
    throw new Error(
      'Video upload did not return a URL',
    );
  }

  return {
    url: finalResult.secure_url,
    publicId:
      finalResult.public_id,
  };
},
  async videoUploadSignature() {
  return (
    await api.get<{
      timestamp: number;
      signature: string;
      folder: string;
      apiKey: string;
      cloudName: string;
    }>(
      '/admin/uploads/video-signature',
    )
  ).data;
},
async notifications() {
  return (
    await api.get<AdminNotification[]>(
      '/admin/notifications',
    )
  ).data;
},

async notificationUnreadCount() {
  return (
    await api.get<NotificationUnreadCount>(
      '/admin/notifications/unread-count',
    )
  ).data;
},

async markNotificationRead(
  notificationId: string,
) {
  return (
    await api.patch<AdminNotification>(
      `/admin/notifications/${notificationId}/read`,
    )
  ).data;
},

async markAllNotificationsRead() {
  return (
    await api.patch(
      '/admin/notifications/read-all',
    )
  ).data;
},
};

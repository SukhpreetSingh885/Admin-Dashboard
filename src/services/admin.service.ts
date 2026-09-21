import api from '../api/axios';

import type {
  Course,
  DashboardSummary,
  Enrollment,
  Lesson,
  ProgressRecord,
  User,
} from '../types';

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
          refundedAmount?: number;
          refundedAt?: string;
        }[]
      >('/admin/payments')
    ).data;
  },

  async refundPayment(
    paymentId: string,
    amount?: number,
  ) {
    return (
      await api.post(
        `/admin/payments/${paymentId}/refund`,
        amount !== undefined
          ? { amount }
          : {},
      )
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

  async uploadVideo(file: File) {
    const formData = new FormData();

    formData.append('file', file);

    return (
      await api.post<{
        url: string;
        publicId: string;
      }>(
        '/admin/uploads/video',
        formData,
      )
    ).data;
  },
};
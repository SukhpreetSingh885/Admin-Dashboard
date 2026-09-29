import api from '../api/axios';
import type { LoginResponse } from '../types';

export const authService = {
  async login(identifier: string, password: string) {
    const { data } = await api.post<LoginResponse>(
      '/auth/login',
      {
        identifier,
        password,
      }
    );

    return data;
  },

  async sendPasswordResetOtp(email: string) {
    const { data } = await api.post<{ message: string }>(
      '/auth/forgot-password/send-otp',
      { email },
    );

    return data;
  },

  async verifyPasswordResetOtp(email: string, otp: string) {
    const { data } = await api.post<{ message: string }>(
      '/auth/forgot-password/verify-otp',
      { email, otp },
    );

    return data;
  },

  async resetPassword(email: string, password: string) {
    const { data } = await api.post<{ message: string }>(
      '/auth/forgot-password/reset',
      { email, password },
    );

    return data;
  },
};

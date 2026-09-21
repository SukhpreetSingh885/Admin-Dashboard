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
};

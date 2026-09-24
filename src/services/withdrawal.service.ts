import api from '../api/axios';

export type WithdrawalStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'rejected';

export type AdminWithdrawal = {
  _id: string;
  student: { id: string; name: string; email: string };
  amount: number;
  payoutMethod: 'upi' | 'bank';
  payoutDestination?: string;
  accountHolderName?: string;
  status: WithdrawalStatus;
  failureReason?: string;
  adminNote?: string;
  providerReference?: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
};

export type WithdrawalSettings = {
  withdrawalsEnabled: boolean;
  minimumWithdrawalAmount: number;
};

export type UpdateWithdrawalStatusInput = {
  status: WithdrawalStatus;
  adminNote?: string;
  failureReason?: string;
  providerReference?: string;
};

export const withdrawalService = {
  async list() {
    return (await api.get<AdminWithdrawal[]>('/admin/withdrawals')).data;
  },

  async updateStatus(id: string, input: UpdateWithdrawalStatusInput) {
    return (await api.patch<AdminWithdrawal>(`/admin/withdrawals/${id}/status`, input)).data;
  },

  async getSettings() {
    return (await api.get<WithdrawalSettings>('/admin/withdrawals/settings')).data;
  },

  async updateSettings(input: WithdrawalSettings) {
    return (await api.patch<WithdrawalSettings>('/admin/withdrawals/settings', input)).data;
  },
};

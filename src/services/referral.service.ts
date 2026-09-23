import api from '../api/axios';

export type ReferralSettings = {
  _id: string;
  rewardAmount: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export const referralService = {
  async getSettings() {
    return (
      await api.get<ReferralSettings | null>(
        '/referrals/settings',
      )
    ).data;
  },

  async updateRewardAmount(
    amount: number,
  ) {
    return (
      await api.post<ReferralSettings>(
        '/referrals/settings',
        { amount },
      )
    ).data;
  },
};
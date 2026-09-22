import api from "../api/axios";


export const adminSecurityService = {


  // ==========================
  // PASSWORD CHANGE
  // ==========================


  async requestPasswordChange() {

    return (
      await api.post(
        "/admin/security/request-password-change",
      )
    ).data;

  },



  async verifyOtp(
    otp: string,
  ) {

    return (
      await api.post(
        "/admin/security/verify-otp",
        {
          otp,
          purpose: "change-password",
        },
      )
    ).data;

  },



  async changePassword(
    newPassword: string,
  ) {

    return (
      await api.post(
        "/admin/security/change-password",
        {
          newPassword,
        },
      )
    ).data;

  },





  // ==========================
  // EMAIL CHANGE
  // ==========================


  // Step 1:
  // Send OTP to current email

  async requestOldEmailOtp() {

    return (
      await api.post(
        "/admin/security/request-old-email-otp",
      )
    ).data;

  },



  // Step 2:
  // Verify OTP from current email

  async verifyOldEmailOtp(
  otp: string,
) {

  return (
    await api.post(
      "/admin/security/verify-old-email-otp",
      {
        otp,
        purpose: "change-email",
      },
    )
  ).data;

},



  // Step 3:
  // Send OTP to new email

  async requestNewEmailOtp(
    newEmail: string,
  ) {

    return (
      await api.post(
        "/admin/security/request-new-email-otp",
        {
          newEmail,
        },
      )
    ).data;

  },



  // Step 4:
  // Verify OTP from new email

async verifyNewEmailOtp(
  otp: string,
) {

  return (
    await api.post(
      "/admin/security/verify-new-email-otp",
      {
        otp,
        purpose: "verify-new-email",
      },
    )
  ).data;

},



  // Step 5:
  // Update email in database

  async changeEmail(
    newEmail: string,
  ) {

    return (
      await api.post(
        "/admin/security/change-email",
        {
          newEmail,
        },
      )
    ).data;

  },


};
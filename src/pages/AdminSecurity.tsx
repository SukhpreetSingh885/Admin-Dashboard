import {
  useState,
} from "react";

import {
  adminSecurityService,
} from "../services/admin-security.service";


export default function AdminSecurity() {


  const [passwordStep, setPasswordStep] =
    useState(1);


  const [emailStep, setEmailStep] =
    useState(1);



  const [otp, setOtp] =
    useState("");

  const [password, setPassword] =
    useState("");



  const [oldEmailOtp, setOldEmailOtp] =
    useState("");

  const [newEmail, setNewEmail] =
    useState("");

  const [newEmailOtp, setNewEmailOtp] =
    useState("");



  const [oldEmailOtpSent, setOldEmailOtpSent] =
    useState(false);


  const [newEmailOtpSent, setNewEmailOtpSent] =
    useState(false);



  const [passwordCompleted, setPasswordCompleted] =
    useState(false);


  const [emailCompleted, setEmailCompleted] =
    useState(false);



  const [message, setMessage] =
    useState("");




  async function sendPasswordOtp() {

    await adminSecurityService
      .requestPasswordChange();


    setPasswordStep(2);


    setMessage(
      "Password OTP sent successfully",
    );

  }




  async function verifyPasswordOtp() {

    await adminSecurityService
      .verifyOtp(
        otp,
      );


    setPasswordStep(3);


    setMessage(
      "Password OTP verified successfully",
    );

  }




  async function changePassword() {

    await adminSecurityService
      .changePassword(
        password,
      );


    setPasswordCompleted(true);


    setMessage(
      "Password changed successfully",
    );

  }





  async function sendOldEmailOtp() {

    await adminSecurityService
      .requestOldEmailOtp();


    setOldEmailOtpSent(true);


    setMessage(
      "OTP sent to current email",
    );

  }





  async function verifyOldEmailOtp() {

    await adminSecurityService
      .verifyOldEmailOtp(
        oldEmailOtp,
      );


    setEmailStep(2);


    setMessage(
      "Current email verified successfully",
    );

  }





  async function sendNewEmailOtp() {

    await adminSecurityService
      .requestNewEmailOtp(
        newEmail,
      );


    setNewEmailOtpSent(true);


    setMessage(
      "OTP sent to new email",
    );

  }





  async function verifyNewEmailOtp() {

    await adminSecurityService
      .verifyNewEmailOtp(
        newEmailOtp,
      );


    setEmailStep(3);


    setMessage(
      "New email verified successfully",
    );

  }
async function changeEmail() {

  await adminSecurityService
    .changeEmail(
      newEmail,
    );


  setEmailCompleted(true);


  setMessage(
    "Email changed successfully",
  );


  window.location.reload();

}
    return (

    <div className="page-stack">

      <section className="panel security-panel">


        <h2>
          Admin Security
        </h2>



        <div className="security-overview">

          <h3>
            Security Overview
          </h3>


          <div className="security-item">

            <span>
              Email Verification
            </span>

            <strong>
              ✓ Verified
            </strong>

          </div>


          <div className="security-item">

            <span>
              OTP Protection
            </span>

            <strong>
              ✓ Enabled
            </strong>

          </div>


          <div className="security-item">

            <span>
              OTP Expiry
            </span>

            <strong>
              5 Minutes
            </strong>

          </div>


          <div className="security-item">

            <span>
              Maximum OTP Attempts
            </span>

            <strong>
              5
            </strong>

          </div>


          <div className="security-item">

            <span>
              Password Protection
            </span>

            <strong>
              ✓ Enabled
            </strong>

          </div>


        </div>



        <div className="security-tips">

          <h3>
            Security Tips
          </h3>


          <ul>

            <li>
              Never share your OTP with anyone.
            </li>


            <li>
              Use a strong and unique password.
            </li>


            <li>
              Verify email change requests carefully.
            </li>


            <li>
              Logout from unknown devices.
            </li>


            <li>
              Keep your email account secure.
            </li>

          </ul>


        </div>
                <div className="security-section">

          <h3>
             Change Password
          </h3>


          {passwordCompleted ? (

            <div className="security-success">

              <h3>
                🎉 Password changed successfully
              </h3>


              <p>
                Your password has been updated securely.
              </p>


              <p>
                ✓ OTP verification completed
              </p>


            </div>


          ) : (

            <>


              {passwordStep === 1 && (

                <>

                <h4>
  Step 1 of 3
</h4>


<h5>
  Request password change verification
</h5>


<p>
  We will send a secure OTP to your registered email address.
</p>


<button
  className="button primary"
  onClick={sendPasswordOtp}
>
  Send Password OTP
</button>

                </>

              )}




              {passwordStep === 2 && (

                <>

                  <h4>
                    Step 2 of 3
                  </h4>


                  <input
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) =>
                      setOtp(
                        e.target.value,
                      )
                    }
                  />


                  <button
                    onClick={verifyPasswordOtp}
                  >
                    Verify OTP
                  </button>

                </>

              )}




              {passwordStep === 3 && (

                <>

                  <h4>
                    Step 3 of 3
                  </h4>


                  <input
                    type="password"
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) =>
                      setPassword(
                        e.target.value,
                      )
                    }
                  />


                  <button
                    className="button primary"
                    onClick={changePassword}
                  >
                    Change Password
                  </button>

                </>

              )}


            </>

          )}

        </div>





        <div className="security-section">

          <h3>
            Change Admin Email

          </h3>



          {emailCompleted ? (

            <div className="security-success">

              <h3>
                🎉 Email changed successfully
              </h3>


              <p>
                Your admin email has been updated successfully.
              </p>


              <strong>
                {newEmail}
              </strong>


              <p>
                ✓ Verified
              </p>


            </div>


          ) : (

            <>


              {emailStep === 1 && (

                <>

                  <h4>
                    Step 1 of 3
                  </h4>

<h5>
  Verify current email ownership
</h5>

                <p>
   An OTP will be sent to your current email address before changing your admin email.
</p>


                  {!oldEmailOtpSent ? (

                    <button
                      className="button primary"
                      onClick={sendOldEmailOtp}
                    >
                      Send OTP To Current Email
                    </button>


                  ) : (

                    <>

                      <input
                        placeholder="Enter current email OTP"
                        value={oldEmailOtp}
                        onChange={(e) =>
                          setOldEmailOtp(
                            e.target.value,
                          )
                        }
                      />


                      <button
                        onClick={verifyOldEmailOtp}
                      >
                        Verify Current Email
                      </button>


                    </>

                  )}

                </>

              )}






              {emailStep === 2 && (

                <>

                  <h4>
                    Step 2 of 3
                  </h4>


                  <input
                    type="email"
                    placeholder="Enter new email"
                    value={newEmail}
                    onChange={(e) =>
                      setNewEmail(
                        e.target.value,
                      )
                    }
                  />



                  {!newEmailOtpSent ? (

                    <button
                      className="button primary"
                      onClick={sendNewEmailOtp}
                    >
                      Send OTP To New Email
                    </button>


                  ) : (

                    <>

                      <input
                        placeholder="Enter new email OTP"
                        value={newEmailOtp}
                        onChange={(e) =>
                          setNewEmailOtp(
                            e.target.value,
                          )
                        }
                      />


                      <button
                        onClick={verifyNewEmailOtp}
                      >
                        Verify New Email
                      </button>


                    </>

                  )}

                </>

              )}






              {emailStep === 3 && (

                <>

                  <h4>
                    Step 3 of 3
                  </h4>


                  <p>
                    Email verification completed.
                  </p>


                  <button
                    className="button primary"
                    onClick={changeEmail}
                  >
                    Update Email
                  </button>


                </>

              )}


            </>

          )}

        </div>





        <p>
          {message}
        </p>


      </section>


    </div>

  );

}
const reAuthenticateBtn = document.getElementById("enroll-reAuthentication");
reAuthenticateBtn.onclick = () => {
  const oldPassword = document.getElementById("enroll-oldPassword").value;
  const loading = document.getElementById("loading");
  loading.style.color = "green";
  const cred = firebase.auth.EmailAuthProvider.credential(
    auth.currentUser.email,
    oldPassword
  );
    loading.innerHTML = "Re-authenticating...";
    auth.currentUser
      .reauthenticateWithCredential(cred)
      .then(async () => {
        // User re-authenticated.
        window.location.href = "updatePassword.html"
      })
      .catch(async (error) => {
        if (error.code === "auth/multi-factor-auth-required") {
          // The user is enrolled in MFA, must be verified
          loading.innerHTML = "Sending a Verification Code for the MFA...";
          window.resolver = error.resolver;
          const phoneOpts = {
            multiFactorHint: resolver.hints[0],
            session: resolver.session,
          };
          const phoneAuthProvider = new firebase.auth.PhoneAuthProvider();
          window.verificationId = await phoneAuthProvider.verifyPhoneNumber(
            phoneOpts,
            recaptchaVerifier
          );
          loading.innerHTML = "";
          const verifyForm = document.getElementById("verifyCode-form");
          const loginForm = document.getElementById("changePassword-form");
          verifyForm.style.display = "block";
          loginForm.style.display = "none";
          alert("SMS Text Sent!");
        } else {
          loading.innerHTML = "";
          alert(error);
        }
      });
};

// Verify MFA User Login
const verify_MFA_Login = async (code) => {
  const loading = document.getElementById("loading");
  document.body.style.cursor = "wait";
  try {
    loading.innerHTML = "Verifying Code...";
    const cred = new firebase.auth.PhoneAuthProvider.credential(
      window.verificationId,
      code
    );
    loading.innerHTML = "Resolving Sign in...";
    const multiFactorAssertion =
      firebase.auth.PhoneMultiFactorGenerator.assertion(cred);
     await window.resolver.resolveSignIn(
      multiFactorAssertion
    );
    window.location.href = "updatePassword.html";
  } catch (error) {
    document.body.style.cursor = "default";
    loading.innerHTML = "";
    alert(error);
  }
};

const verifyForm = document.getElementById("verifyCode-form");
verifyForm.style.display = "none";
//  Verify MFA
const verifyLoginBtn = document.getElementById("login-verify");
verifyLoginBtn.onclick = async (e) => {
  const timeInitial = new Date().getTime();
  e.preventDefault();
  const code = document.getElementById("login-code").value.trim();
  verify_MFA_Login(code);
};



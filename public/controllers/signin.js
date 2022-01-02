const verifyForm = document.getElementById("verifyCode");
verifyForm.style.display = "none";

// Sign In Function
const signIn = async (email, password) => {
  const loading = document.getElementById("loading");
  loading.style.color = "green";
  loading.innerHTML = "Signing In...";
  document.body.style.cursor = "wait";
  try {
    await auth.signInWithEmailAndPassword(email, password);
    
    loading.innerHTML = "Done.";
    document.body.style.cursor = "default";
    window.location.href = "index.html";
    alert("User Signed In Successfully");
  } catch (error) {
    if (error.code === "auth/multi-factor-auth-required") {
      // The user is enrolled in MFA, must be verified
      loading.innerHTML = "Sending a Verification Code for the MFA...";
      window.resolver = error.resolver;
      const phoneOpts = {
        multiFactorHint: resolver.hints[0],
        session: resolver.session,
      };
      const phoneAuthProvider = new firebase.auth.PhoneAuthProvider();
      const verificationId = await phoneAuthProvider.verifyPhoneNumber(
        phoneOpts,
        recaptchaVerifier
      );
      loading.innerHTML = "";
      localStorage.setItem("verificationId", verificationId);
      const verifyForm = document.getElementById("verifyCode");
      const loginForm = document.getElementById("login-form");
      verifyForm.style.display = "block";
      loginForm.style.display = "none";
      document.body.style.cursor = "default";
      alert("SMS Text Sent!");
    } else {
      loading.innerHTML = "";
      document.body.style.cursor = "default";
      alert(error);
    }
  }
};
// Verify MFA User Login
const verify_MFA_Login = async (code) => {
  const loading = document.getElementById("loading");
  try {
    document.body.style.cursor = "wait";
    loading.innerHTML = "Verifying Code...";
    const verificationId = localStorage.getItem("verificationId");
    const cred = new firebase.auth.PhoneAuthProvider.credential(
      verificationId,
      code
    );
    loading.innerHTML = "Resolving Sign in...";
    const multiFactorAssertion =
      firebase.auth.PhoneMultiFactorGenerator.assertion(cred);
    const credential = await window.resolver.resolveSignIn(
      multiFactorAssertion
    );
    document.body.style.cursor = "default";
    loading.innerHTML = "Done.";
    window.location.href = "index.html";
    alert("Successfully Logged in!");
  } catch (error) {
    document.body.style.cursor = "default";
    loading.innerHTML = "";
    alert(error);
  }
};

//  Login with MFA
const loginBtn = document.getElementById("login-button");
loginBtn.onclick = async (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;
  signIn(email, password);
};
//  Verify MFA
const verifyLoginBtn = document.getElementById("login-verify");
verifyLoginBtn.onclick = async (e) => {
  e.preventDefault();
  const code = document.getElementById("login-code").value.trim();
  verify_MFA_Login(code);
};

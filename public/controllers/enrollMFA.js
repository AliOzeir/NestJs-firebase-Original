// Mfa Enrollment Function
const MFA_Enroll = async (phoneNumber) => {
  const loading = document.getElementById("loading");
  loading.style.color = "green";
  try {
    document.body.style.cursor = "wait";
    loading.innerHTML = `Sending Verification Code to ${phoneNumber}...`;
    const user = auth.currentUser;
    const session = await user.multiFactor.getSession();
    const phoneOpts = {
      phoneNumber,
      session,
    };
    const phoneAuthProvider = new firebase.auth.PhoneAuthProvider();
    const verificationId = await phoneAuthProvider.verifyPhoneNumber(
      phoneOpts,
      recaptchaVerifier
    );
    document.body.style.cursor = "default";

    loading.innerHTML = "";
    localStorage.setItem("verificationId", verificationId);
    window.location.href = "verifyEnroll.html";
    alert("Sms text sent!");
  } catch (error) {
    document.body.style.cursor = "default";
    loading.innerHTML = "";
    alert(error);
  }
};
// Step 2 - Enroll Second Factor
const enrollBtn = document.getElementById("enroll-button");
enrollBtn.onclick = async (e) => {
  e.preventDefault();
  const phoneNumber = document.getElementById("enroll-phone").value.trim();
  MFA_Enroll(phoneNumber);
};

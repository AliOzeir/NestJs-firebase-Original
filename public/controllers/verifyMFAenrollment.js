// Verify MFA Enrollment
const verify_MFA_Enrollment = async (code) => {
  const loading = document.getElementById("loading");
  loading.style.color = "green";
  try {
    document.body.style.cursor = "wait";
    loading.innerHTML = `Verifying Code...`;
    const verificationId = localStorage.getItem("verificationId");
    const cred = new firebase.auth.PhoneAuthProvider.credential(
      verificationId,
      code
    );
    loading.innerHTML = "Resolving Sign in...";
    const multiFactorAssertion =
      firebase.auth.PhoneMultiFactorGenerator.assertion(cred);

    const user = auth.currentUser;
    await user.multiFactor.enroll(multiFactorAssertion, "phone number");
    document.body.style.cursor = "default";
    loading.innerHTML = "Done...";

    window.location.href = "index.html";
    alert("Successfully Enrolled in MFA");
  } catch (error) {
    document.body.style.cursor = "default";
    loading.innerHTML = "";
    alert(error);
    console.log(error);
  }
};

// Step 3 - Verify Code
const verifyEnrollmentBtn = document.getElementById("enroll-verify");
verifyEnrollmentBtn.onclick = async (e) => {
  e.preventDefault();
  const code = document.getElementById("enroll-code").value.trim();
  verify_MFA_Enrollment(code);
};

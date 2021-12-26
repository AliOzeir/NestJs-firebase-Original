const changePassBtn = document.getElementById("enroll-changePassword");
changePassBtn.onclick = () => {
  const timeInitial = new Date().getTime();
  const oldPassword = document.getElementById("enroll-oldPassword").value;
  const newPassword = document.getElementById("enroll-newPassword").value;
  const confirmPassword = document.getElementById(
    "enroll-confirmPassword"
  ).value;
  const loading = document.getElementById("loading");
  loading.style.color = "green";
  const cred = firebase.auth.EmailAuthProvider.credential(
    auth.currentUser.email,
    oldPassword
  );
  if (newPassword !== confirmPassword) {
    alert("Passwords don't match");
  } else {
    loading.innerHTML = "Re-authenticating...";
    auth.currentUser
      .reauthenticateWithCredential(cred)
      .then(async () => {
        // User re-authenticated.
        const authDone = new Date().getTime();
        const authtimetaken = (authDone - timeInitial) / 1000;
        await allProcess(newPassword, authDone, timeInitial);
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
  }
};

// Verify MFA User Login
const verify_MFA_Login = async (code, timeInitial) => {
  const loading = document.getElementById("loading");
  document.body.style.cursor = "wait";
  try {
    loading.innerHTML = "Verifying Code...";
    const newPassword = document.getElementById("enroll-newPassword").value;
    const cred = new firebase.auth.PhoneAuthProvider.credential(
      window.verificationId,
      code
    );
    loading.innerHTML = "Resolving Sign in...";
    const multiFactorAssertion =
      firebase.auth.PhoneMultiFactorGenerator.assertion(cred);
    const credential = await window.resolver.resolveSignIn(
      multiFactorAssertion
    );
    const authDone = new Date().getTime();
    const authtimetaken = (authDone - timeInitial) / 1000;
    await allProcess(newPassword, authDone, timeInitial);
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
  verify_MFA_Login(code, timeInitial);
};

const hashFunction = async (password) => {
  const token = await auth.currentUser.getIdToken();
  const response = await axios({
    method: "post",
    url: "https://us-central1-itxi-train.cloudfunctions.net/app/security/hashPassword",
    headers: { Authorization: `Bearer ${token}` },
    data: {
      password: password,
    },
  });
  const hashPassword = response.data.hash;
  return hashPassword;
};

const checkPasswords = async (encryptedPass, newPassword) => {
  const token = await auth.currentUser.getIdToken();
  const response = await axios({
    method: "post",
    url: "https://us-central1-itxi-train.cloudfunctions.net/app/security/checkPasswords",
    headers: { Authorization: `Bearer ${token}` },
    data: {
      password: newPassword,
      EncryptedPassword: encryptedPass,
    },
  });
  return response.data.status;
};

const allProcess = async (newPassword, authDone, timeInitial) => {
  const loading = document.getElementById("loading");
  loading.style.color = "green";
  loading.innerHTML = "Getting Data from Firestore...";
  document.body.style.cursor = "wait";
  const user = await auth.currentUser;
  var passwords = await gettingHashedPasswords(user);
  var isMatched = false;
  if(passwords){
    const statusPromises = [];
    for (const i in passwords) {
      const status = checkPasswords(passwords[i], newPassword);
      statusPromises.push(status);
    }
    loading.innerHTML = "Checking Previous Passwords...";
    const statusArray = await Promise.all(statusPromises);
    for (let i = 0; i < statusArray.length; i++) {
      if (statusArray[i] === 202) isMatched = true;
    }
  }
    if (isMatched) {
      loading.innerHTML = "";
      document.body.style.cursor = "default";
      const timeFinal = new Date().getTime();
      alert("You can't set the same password twice!");
      if (user.multiFactor.enrolledFactors[0] !== undefined) {
        window.location.href = "updatePassword.html";
      }
    } else {
      loading.innerHTML = "Updating Password...";
      auth.currentUser
        .updatePassword(newPassword)
        .then(async () => {
          // Update successful.
          const hashPassword = await hashFunction(newPassword);
          const promises = [];
          const settingNewPass = setNewPassword(hashPassword);
          promises.push(settingNewPass);
          const settingPasswordDate = setLastChangedDate();
          promises.push(settingPasswordDate);
          await Promise.all(promises);
          document.body.style.cursor = "default";
          loading.innerHTML = "Done!";
          const timeFinal = new Date().getTime();
          // console.log("TimeFinal = ", timeFinal - timeInitial);
          window.location.href = "index.html";
          alert("Changed Password Successfully!");
        })
        .catch((error) => {
          // An error ocurred
          document.body.style.cursor = "default";
          alert(error);
        });
    }
};

const setNewPassword = async (hashPassword) => {
  const token = await auth.currentUser.getIdToken();
  const user = await auth.currentUser;
  const response = await axios({
    method: "post",
    url: "https://us-central1-itxi-train.cloudfunctions.net/app/security/setNewPassword",
    headers: { Authorization: `Bearer ${token}` },
    data: {
      uid: user.uid,
      hashPassword,
    },
  });
  if (response.status === 500) {
    alert("Error:", response.data.error);
  }
};

const setLastChangedDate = async () => {
  const token = await auth.currentUser.getIdToken();
  const response = await axios({
    method: "post",
    url: "https://us-central1-itxi-train.cloudfunctions.net/app/security/addChangingPasswordDate",
    headers: { Authorization: `Bearer ${token}` },
  });
};

const gettingHashedPasswords = async (user) => {
  const token = await auth.currentUser.getIdToken();
  const response = await axios({
    method: "post",
    url: "https://us-central1-itxi-train.cloudfunctions.net/app/security/getHashedPasswords",
    headers: { Authorization: `Bearer ${token}` },
    data: {
      uid: user.uid,
    },
  });
  if (response.status === 500) {
    alert("Error: ", response.data.error);
  }
  if(response.data.status === 200){
    const passwords = response.data.passwords;
    return passwords
  }
  return false;
}
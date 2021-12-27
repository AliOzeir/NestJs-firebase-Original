// Sign Up and Verify Email
const signupBtn = document.getElementById("signup-button");
signupBtn.onclick = async (e) => {
  e.preventDefault();
  document.body.style.cursor = "wait";
  const timeInitial = new Date().getTime();
  const email = document.getElementById("signup-email").value.trim();
  const password = document.getElementById("signup-password").value;
  const loading = document.getElementById("loading");
  loading.innerHTML = "Creating New Account...";
  loading.style.color = "green";
  loading.style.marginBottom = "1rem";
  try {
    const credential = await auth.createUserWithEmailAndPassword(
      email,
      password
    );
    console.log(1, credential);
    const hashPassword = await hashFunction(password);
    console.log(2, hashPassword);
    loading.innerHTML = "Saving Password...";
    let promises = [];
    const settingLastChangedPasswordDate = setLastChangedDate();
    promises.push(settingLastChangedPasswordDate);
    const settingNewPassword = setNewPassword(hashPassword, credential.user);
    promises.push(settingNewPassword);
    loading.innerHTML = "Sending Email Verification Link...";
    const sendingEmail = credential.user.sendEmailVerification();
    promises.push(sendingEmail);
    await Promise.all(promises);
    const timeFinal = new Date().getTime();
    const timeTaken = (timeFinal - timeInitial) / 1000;
    document.body.style.cursor = "default";
    loading.innerHTML = "Done.";
    alert("An Email Verification link has been sent. Please Check your email!");
    window.location.href = "index.html";
  } catch (error) {
    document.body.style.cursor = "default";
    loading.innerHTML = "";
    alert(error);
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

const setNewPassword = async (hashPassword, user) => {
  const token = await auth.currentUser.getIdToken();
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

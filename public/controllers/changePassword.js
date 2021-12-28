const changePassBtn = document.getElementById("enroll-changePassword");
changePassBtn.onclick =async  () => {
  const newPassword = document.getElementById("enroll-newPassword").value;
  const confirmPassword = document.getElementById(
    "enroll-confirmPassword"
  ).value;
  const loading = document.getElementById("loading");
  loading.style.color = "green";
  if (newPassword !== confirmPassword) {
    alert("Passwords don't match");
  } else {
        await allProcess(newPassword);
  }
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

const allProcess = async (newPassword) => {
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
      if (statusArray[i] === 204) isMatched = true;
    }
  }
    if (isMatched) {
      loading.innerHTML = "";
      document.body.style.cursor = "default";
      alert("You can't set the same password twice!");
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
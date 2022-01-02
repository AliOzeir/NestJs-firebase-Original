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

const allProcess = async (newPassword) => {
  const loading = document.getElementById("loading");
  loading.style.color = "green";
  loading.innerHTML = "Getting Data from Firestore...";
  document.body.style.cursor = "wait";
  var status = await checkPreviousPasswords(newPassword)
    if (status !== 200) {
      loading.innerHTML = "";
      document.body.style.cursor = "default";
      alert("You can't set the same password twice!");
    } else {
      loading.innerHTML = "Updating Password...";
      auth.currentUser
        .updatePassword(newPassword)
        .then(async () => {
          await setPasswordInDB(newPassword);
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

const setPasswordInDB = async (password) => {
  const token = await auth.currentUser.getIdToken();
  const response = await axios({
    method: "post",
    url: "https://us-central1-itxi-train.cloudfunctions.net/admin/setPasswordInDB",
    headers: { Authorization: `Bearer ${token}` },
    data: {
      password,
    },
  });
  if (response.status === 500) {
    alert("Error:", response.data.error);
  }
};

const checkPreviousPasswords = async (password) => {
  const token = await auth.currentUser.getIdToken();
  const response = await axios({
    method: "post",
    url: "https://us-central1-itxi-train.cloudfunctions.net/admin/checkPreviousPasswords",
    headers: { Authorization: `Bearer ${token}` },
    data: {
      password,
    },
  });
  return response.status;
};
const auth = firebase.auth();

// Listen to User's Auth State
auth.onAuthStateChanged(async (user) => {
  const userEl = document.getElementById("user");
  const verifyEmailBtn = document.getElementById("verifyemail");
  verifyEmailBtn.disabled = true;

  const unerollBtn = document.getElementById("unenroll");
  const enrollBtn = document.getElementById("enroll");
  const signin = document.getElementById("signin");
  const signup = document.getElementById("signup");
  const changePasswordBtn = document.getElementById("changePassword");
  if (user) {
    userEl.innerHTML = `<span class="loggedInUser">${user.email}</span> is Currently Logging In. `;
    signin.style.display = "none";
    signup.style.display = "none";
    changePasswordBtn.style.display = "block";
    if (user.multiFactor.enrolledFactors[0] !== undefined) {
      unerollBtn.style.display = "block";
    } else if (
      user.multiFactor.enrolledFactors[0] === undefined &&
      user.emailVerified === true
    ) {
      enrollBtn.style.display = "block";
    }
    if (user.emailVerified !== true) {
      verifyEmailBtn.style.display = "block";
    }
    const IdTokenInfo = await user.getIdTokenResult(true);
    const lastChangedPassword = IdTokenInfo.claims.lastChangedPassword;
    const isExpired = passwordExpired(lastChangedPassword);
    if (isExpired) {
      alert(
        "Your Password Has Been Expired, You need to change it immediately!"
      );
      window.location.href = "updatePassword.html";
    }
  } else {
    const signoutBtn = document.getElementById("signout");
    userEl.innerHTML = "No User is Currently Logging In";
    changePasswordBtn.style.display = "none";
    signoutBtn.style.display = "none";
    enrollBtn.style.display = "none";
    unerollBtn.style.display = "none";
    verifyEmailBtn.style.display = "none";
    signin.style.display = "block";
    signup.style.display = "block";
  }
});

//  Sign Out
const signOutBtn = document.getElementById("signout");
signOutBtn.onclick = () => {
  try {
    if (auth.currentUser) {
      auth.signOut();
      alert("User has Signed Out");
    } else {
      alert("No Available User");
    }
  } catch (error) {
    alert(error);
  }
};

// UnEnroll MFA
const unEnroll_MFA = () => {
  try {
    var options = firebase.auth().currentUser.multiFactor.enrolledFactors;
    // Present user the option to unenroll.
    return firebase
      .auth()
      .currentUser.multiFactor.unenroll(options[0])
      .then(function () {
        window.location.reload();
        alert("MFA UnEnrolled Successfully");
      })
      .catch(function (error) {
        console.log("Something Went Wrong!", error);
      });
  } catch (error) {
    alert(error);
  }
};

//  UnEnroll MFA
const unEnrollBtn = document.getElementById("unenroll");
unEnrollBtn.onclick = async () => {
  unEnroll_MFA();
};

// Verify Email
const verifyEmailBtn = document.getElementById("verifyemail");
verifyEmailBtn.onclick = async () => {
  try {
    if (auth.currentUser) {
      if (auth.currentUser.emailVerified === false) {
        await auth.currentUser.sendEmailVerification();
        alert("Check Your Email");
      } else {
        alert("Your email is already verified :)");
        window.location.href = "index.html";
      }
    } else {
      alert("No Available User");
    }
  } catch (error) {
    alert(error);
  }
};

const passwordExpired = (lastChangedDate) => {
  const isExpired =
    Date.parse(lastChangedDate) < Date.now() - 90 * 24 * 60 * 60 * 1000;
  if (isExpired) {
    console.log("Password has been expired");
    return true;
  } else {
    return false;
  }
};
